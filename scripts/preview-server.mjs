// Preview server for dev.ruzauskas.lt.
//
// Serves a real production build (same output GitHub Pages gets), rebuilds it whenever
// sources change, and tells open browser tabs to reload when a new build is live.
// Builds go to .preview-builds/<timestamp>; `.preview` is a symlink swapped atomically,
// so visitors never hit a half-written build.
//
//   node scripts/preview-server.mjs          (PORT=9070 by default)

import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { createReadStream, existsSync, readdirSync, renameSync, rmSync, statSync, symlinkSync, watch } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const PORT = Number(process.env.PORT ?? 9070);
const CURRENT = join(ROOT, '.preview');
const BUILDS = join(ROOT, '.preview-builds');
const WATCH = ['src', 'static', 'svelte.config.js', 'vite.config.ts', 'package.json'];

const TYPES = {
	'.html': 'text/html; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.mjs': 'text/javascript; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.webp': 'image/webp',
	'.woff2': 'font/woff2',
	'.pdf': 'application/pdf',
	'.txt': 'text/plain; charset=utf-8',
	'.xml': 'application/xml; charset=utf-8'
};

// Injected into HTML responses only (never part of the real build).
const CLIENT = `<script>(()=>{const b=document.createElement('div');b.style.cssText='position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:99999;padding:6px 12px;font:600 11px/1.2 system-ui,sans-serif;letter-spacing:.12em;text-transform:uppercase;border-radius:3px;display:none;pointer-events:none';document.addEventListener('DOMContentLoaded',()=>document.body.append(b));const show=(t,bg,fg)=>{b.textContent=t;b.style.background=bg;b.style.color=fg;b.style.display='block'};const es=new EventSource('/__preview/events');es.addEventListener('building',()=>show('Rebuilding preview…','#6fc7dd','#0b0e14'));es.addEventListener('failed',e=>show('Build failed: '+e.data,'#e5484d','#fff'));es.addEventListener('reload',()=>location.reload());})();</script>`;

const clients = new Set();
function broadcast(event, data = '') {
	for (const res of clients) res.write(`event: ${event}\ndata: ${String(data).replace(/\n/g, ' ')}\n\n`);
}

// ------------------------------------------------------------------ build loop

let building = false;
let pending = false;

function build() {
	if (building) {
		pending = true;
		return;
	}
	building = true;
	pending = false;
	const dir = join(BUILDS, String(Date.now()));
	const started = Date.now();
	broadcast('building');
	console.log('[preview] building…');
	const child = spawn(join(ROOT, 'node_modules/.bin/vite'), ['build'], {
		cwd: ROOT,
		env: { ...process.env, BUILD_DIR: dir, SVELTEKIT_OUT_DIR: '.svelte-kit-preview' },
		stdio: ['ignore', 'pipe', 'pipe']
	});
	let log = '';
	child.stdout.on('data', (d) => (log += d));
	child.stderr.on('data', (d) => (log += d));
	child.on('close', (code) => {
		building = false;
		if (code === 0 && existsSync(join(dir, 'index.html'))) {
			const tmp = `${CURRENT}.tmp`;
			rmSync(tmp, { force: true });
			symlinkSync(dir, tmp);
			renameSync(tmp, CURRENT); // atomic swap
			prune(dir);
			console.log(`[preview] live in ${((Date.now() - started) / 1000).toFixed(1)}s`);
			broadcast('reload');
		} else {
			rmSync(dir, { recursive: true, force: true });
			const line = log.split('\n').find((l) => /error/i.test(l)) ?? `exit ${code}`;
			console.error('[preview] build failed\n' + log.slice(-4000));
			broadcast('failed', line.trim().slice(0, 200));
		}
		if (pending) build();
	});
}

function prune(keep) {
	if (!existsSync(BUILDS)) return;
	const dirs = readdirSync(BUILDS).sort();
	for (const d of dirs.slice(0, -2)) {
		const p = join(BUILDS, d);
		if (p !== keep) rmSync(p, { recursive: true, force: true });
	}
}

let timer = null;
for (const entry of WATCH) {
	const path = join(ROOT, entry);
	if (!existsSync(path)) continue;
	watch(path, { recursive: statSync(path).isDirectory() }, () => {
		clearTimeout(timer);
		timer = setTimeout(build, 400);
	});
}

// ------------------------------------------------------------------ static server

function resolveFile(urlPath) {
	const clean = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '');
	const base = join(CURRENT, clean);
	if (!base.startsWith(CURRENT)) return null;
	for (const candidate of [base, join(base, 'index.html'), `${base}.html`]) {
		try {
			if (statSync(candidate).isFile()) return candidate;
		} catch {
			// try next
		}
	}
	return null;
}

const server = createServer(async (req, res) => {
	const url = new URL(req.url ?? '/', 'http://x');

	if (url.pathname === '/__preview/events') {
		res.writeHead(200, {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-store',
			'X-Accel-Buffering': 'no',
			Connection: 'keep-alive'
		});
		res.write(': connected\n\n');
		clients.add(res);
		if (building) res.write('event: building\ndata: \n\n');
		req.on('close', () => clients.delete(res));
		return;
	}

	if (!existsSync(CURRENT)) {
		res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8', 'Retry-After': '5', 'Cache-Control': 'no-store' });
		res.end(`<!doctype html><meta http-equiv="refresh" content="5"><body style="background:#08090c;color:#ccc;font:14px system-ui;display:grid;place-items:center;height:100vh;margin:0">First preview build in progress…</body>`);
		return;
	}

	let file = resolveFile(url.pathname);
	let status = 200;
	if (!file) {
		file = join(CURRENT, '404.html');
		status = 404;
	}
	const type = TYPES[extname(file)] ?? 'application/octet-stream';
	const headers = {
		'Content-Type': type,
		// Hashed assets never change; everything else must be revalidated.
		'Cache-Control': url.pathname.startsWith('/_app/immutable/') ? 'public, max-age=31536000, immutable' : 'no-cache'
	};

	if (type.startsWith('text/html')) {
		const html = (await readFile(file, 'utf8')).replace('</body>', `${CLIENT}</body>`);
		res.writeHead(status, headers);
		res.end(req.method === 'HEAD' ? undefined : html);
		return;
	}
	res.writeHead(status, { ...headers, 'Content-Length': statSync(file).size });
	if (req.method === 'HEAD') res.end();
	else createReadStream(file).pipe(res);
});

// Keep SSE connections alive through proxies (Cloudflare drops idle ones after ~100 s).
setInterval(() => {
	for (const res of clients) res.write(': ping\n\n');
}, 30000);

server.listen(PORT, '0.0.0.0', () => console.log(`[preview] http://0.0.0.0:${PORT}`));
build();
