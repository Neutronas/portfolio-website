import * as THREE from 'three';
import contacts from '$lib/data/contacts.json';

export interface Preview {
	index: string;
	title: string;
	lines: string[];
	hint: string;
}

const W = 1024;
const H = 576;
const MONO = "'JetBrains Mono', ui-monospace, 'DejaVu Sans Mono', Menlo, Consolas, monospace";
const DISPLAY = "'Oxanium Variable', 'Oxanium', 'Inter Variable', system-ui, sans-serif";
const BODY = "'Inter Variable', 'Inter', system-ui, sans-serif";

function makeCanvas(w = W, h = H) {
	const canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext('2d')!;
	const texture = new THREE.CanvasTexture(canvas);
	texture.colorSpace = THREE.SRGBColorSpace;
	texture.anisotropy = 4;
	return { canvas, ctx, texture };
}

/** Faint CRT-ish scanlines, drawn once and stamped over every frame. */
function scanlines(): HTMLCanvasElement {
	const c = document.createElement('canvas');
	c.width = W;
	c.height = H;
	const g = c.getContext('2d')!;
	g.fillStyle = 'rgba(0,0,0,0.13)';
	for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
	const v = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.65);
	v.addColorStop(0, 'rgba(0,0,0,0)');
	v.addColorStop(1, 'rgba(0,0,0,0.45)');
	g.fillStyle = v;
	g.fillRect(0, 0, W, H);
	return c;
}

// ---------------------------------------------------------------------------
// Left monitor: code editor that types itself
// ---------------------------------------------------------------------------

const CODE = [
	'// portfolio.ts',
	'import { coffee } from "./kitchen";',
	'',
	'export const lukas = {',
	`  name: "${contacts.name}",`,
	'  based: "Kaunas, Lithuania",',
	'  roles: ["Systems Analyst", "Product Owner",',
	'          "AI Product Engineer"],',
	'  company: "Dassault Systèmes",',
	'  since: 2018,',
	'  knowsAbout: ["MBSE", "SysML v2", "CATIA Magic"],',
	'  shipping: ["Burnmark", "ScanKaunas"],',
	'  coffee: Infinity,',
	'};',
	'',
	'while (lukas.coffee > 0) {',
	'  lukas.build(nextIdea());',
	'}'
];

const KEYWORDS = /^(import|from|export|const|while|return|new|let)$/;
const PALETTE = {
	text: '#c9d1d9',
	comment: '#5c6773',
	string: '#a5d6a7',
	keyword: '#ff7b9c',
	number: '#f2c46d',
	prop: '#7cc7e0',
	punct: '#8b949e',
	fn: '#d2a8ff'
};

type Seg = [string, string];

function tokenize(line: string): Seg[] {
	if (line.trimStart().startsWith('//')) return [[line, PALETTE.comment]];
	const out: Seg[] = [];
	const re = /("[^"]*")|(\b\d+\b|\bInfinity\b)|([A-Za-z_]\w*)(?=\s*:)|([A-Za-z_]\w*)(?=\()|([A-Za-z_]\w*)|(\s+)|(.)/g;
	let m: RegExpExecArray | null;
	while ((m = re.exec(line))) {
		const [tok, str, num, prop, fn, word] = m;
		if (str) out.push([tok, PALETTE.string]);
		else if (num) out.push([tok, PALETTE.number]);
		else if (prop) out.push([tok, PALETTE.prop]);
		else if (fn) out.push([tok, PALETTE.fn]);
		else if (word) out.push([tok, KEYWORDS.test(tok) ? PALETTE.keyword : PALETTE.text]);
		else if (tok.trim() === '') out.push([tok, PALETTE.text]);
		else out.push([tok, PALETTE.punct]);
	}
	return out;
}

const TOKENS = CODE.map(tokenize);
const TOTAL = CODE.reduce((n, l) => n + l.length + 1, 0);

export class CodeScreen {
	readonly texture: THREE.CanvasTexture;
	private ctx: CanvasRenderingContext2D;
	private lines = scanlines();
	private typed = 0;
	private acc = 0;
	private hold = 0.8;
	private blinkOn = true;
	private blinkAcc = 0;
	private dirty = true;
	onKey: (() => void) | null = null;

	constructor(private reducedMotion = false) {
		const { ctx, texture } = makeCanvas();
		this.ctx = ctx;
		this.texture = texture;
		// Start mid-file so the screen is never blank on arrival.
		this.typed = reducedMotion ? TOTAL : Math.floor(TOTAL * 0.45);
	}

	update(dt: number) {
		this.blinkAcc += dt;
		if (this.blinkAcc > 0.5) {
			this.blinkAcc = 0;
			this.blinkOn = !this.blinkOn;
			this.dirty = true;
		}
		if (!this.reducedMotion) {
			if (this.hold > 0) {
				this.hold -= dt;
			} else if (this.typed >= TOTAL) {
				this.typed = 0;
				this.hold = 0.6;
				this.dirty = true;
			} else {
				this.acc += dt * (16 + Math.random() * 22);
				while (this.acc >= 1 && this.typed < TOTAL) {
					this.acc -= 1;
					this.typed++;
					this.dirty = true;
					this.onKey?.();
					// Natural pauses: end of line, and occasionally "thinking".
					if (this.charAt(this.typed - 1) === '\n') this.hold = 0.15 + Math.random() * 0.35;
					else if (Math.random() < 0.012) this.hold = 0.5 + Math.random() * 0.9;
					if (this.hold > 0) break;
				}
				if (this.typed >= TOTAL) this.hold = 4;
			}
		}
		if (this.dirty) {
			this.draw();
			this.dirty = false;
		}
	}

	private charAt(i: number) {
		let n = i;
		for (const l of CODE) {
			if (n < l.length) return l[n];
			if (n === l.length) return '\n';
			n -= l.length + 1;
		}
		return '';
	}

	private draw() {
		const g = this.ctx;
		g.fillStyle = '#0d1117';
		g.fillRect(0, 0, W, H);

		// Title bar + tabs
		g.fillStyle = '#161b22';
		g.fillRect(0, 0, W, 40);
		for (const [i, c] of ['#ff5f57', '#febc2e', '#28c840'].entries()) {
			g.fillStyle = c;
			g.beginPath();
			g.arc(22 + i * 20, 20, 6, 0, Math.PI * 2);
			g.fill();
		}
		g.fillStyle = '#0d1117';
		g.fillRect(96, 6, 170, 34);
		g.fillStyle = '#6fc7dd';
		g.fillRect(96, 6, 170, 2);
		g.font = `18px ${MONO}`;
		g.textBaseline = 'middle';
		g.fillStyle = '#e6edf3';
		g.fillText('portfolio.ts', 116, 24);
		g.fillStyle = '#6e7681';
		g.fillText('coffee.ts', 290, 24);

		// Code
		const top = 66;
		const lh = 31;
		const maxLines = Math.floor((H - top - 34) / lh);
		let remaining = this.typed;
		let cursorLine = 0;
		let cursorCol = 0;
		const visible: { segs: Seg[]; count: number }[] = [];
		for (let i = 0; i < CODE.length; i++) {
			if (remaining < 0) break;
			const count = Math.min(CODE[i].length, remaining);
			visible.push({ segs: TOKENS[i], count });
			cursorLine = i;
			cursorCol = count;
			remaining -= CODE[i].length + 1;
		}
		const first = Math.max(0, visible.length - maxLines);
		g.font = `23px ${MONO}`;
		const cw = g.measureText('M').width;
		for (let i = first; i < visible.length; i++) {
			const y = top + (i - first) * lh;
			if (i === cursorLine) {
				g.fillStyle = '#1c2230';
				g.fillRect(0, y - lh / 2, W, lh);
			}
			g.fillStyle = i === cursorLine ? '#c9d1d9' : '#3d4452';
			g.textAlign = 'right';
			g.fillText(String(i + 1), 56, y);
			g.textAlign = 'left';
			let x = 78;
			let left = visible[i].count;
			for (const [text, color] of visible[i].segs) {
				if (left <= 0) break;
				const part = text.slice(0, left);
				g.fillStyle = color;
				g.fillText(part, x, y);
				x += part.length * cw;
				left -= text.length;
			}
		}
		if (this.blinkOn) {
			g.fillStyle = '#6fc7dd';
			g.fillRect(78 + cursorCol * cw, top + (cursorLine - first) * lh - 14, 3, 28);
		}

		// Status bar
		g.fillStyle = '#1b6d85';
		g.fillRect(0, H - 30, W, 30);
		g.fillStyle = '#e8f7fb';
		g.font = `16px ${MONO}`;
		g.fillText('⎇ main', 16, H - 15);
		g.textAlign = 'right';
		g.fillText(`Ln ${cursorLine + 1}, Col ${cursorCol + 1}   TypeScript   UTF-8`, W - 16, H - 15);
		g.textAlign = 'left';

		g.drawImage(this.lines, 0, 0);
		this.texture.needsUpdate = true;
	}
}

// ---------------------------------------------------------------------------
// Right monitor: previews whatever the menu (or the cursor) has selected
// ---------------------------------------------------------------------------

export class InfoScreen {
	readonly texture: THREE.CanvasTexture;
	private ctx: CanvasRenderingContext2D;
	private lines = scanlines();
	private preview: Preview | null = null;
	private glitch = 0;
	private blinkOn = true;
	private blinkAcc = 0;
	private minute = -1;
	private dirty = true;

	constructor() {
		const { ctx, texture } = makeCanvas();
		this.ctx = ctx;
		this.texture = texture;
	}

	set(preview: Preview | null) {
		if (preview?.title === this.preview?.title) return;
		this.preview = preview;
		this.glitch = 0.28;
		this.dirty = true;
	}

	refresh() {
		this.dirty = true;
	}

	update(dt: number) {
		this.blinkAcc += dt;
		if (this.blinkAcc > 0.55) {
			this.blinkAcc = 0;
			this.blinkOn = !this.blinkOn;
			this.dirty = true;
		}
		const m = new Date().getMinutes();
		if (m !== this.minute) {
			this.minute = m;
			this.dirty = true;
		}
		if (this.glitch > 0) {
			this.glitch = Math.max(0, this.glitch - dt);
			this.dirty = true;
		}
		if (this.dirty) {
			this.draw();
			this.dirty = false;
		}
	}

	private draw() {
		const g = this.ctx;
		const bg = g.createLinearGradient(0, 0, W, H);
		bg.addColorStop(0, '#0a111c');
		bg.addColorStop(1, '#0c1826');
		g.fillStyle = bg;
		g.fillRect(0, 0, W, H);

		// Grid
		g.strokeStyle = 'rgba(111,199,221,0.06)';
		g.lineWidth = 1;
		for (let x = 0; x < W; x += 48) {
			g.beginPath();
			g.moveTo(x + 0.5, 0);
			g.lineTo(x + 0.5, H);
			g.stroke();
		}
		for (let y = 0; y < H; y += 48) {
			g.beginPath();
			g.moveTo(0, y + 0.5);
			g.lineTo(W, y + 0.5);
			g.stroke();
		}

		// Header
		g.textBaseline = 'middle';
		g.font = `600 18px ${DISPLAY}`;
		g.fillStyle = '#6fc7dd';
		g.fillText('LR://PORTFOLIO', 40, 40);
		const now = new Date();
		g.textAlign = 'right';
		g.fillStyle = '#7d8ea3';
		g.fillText(
			`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}  KAUNAS`,
			W - 40,
			40
		);
		g.textAlign = 'left';
		g.fillStyle = 'rgba(111,199,221,0.25)';
		g.fillRect(40, 62, W - 80, 1);

		const p = this.preview;
		if (!p) {
			g.font = `500 26px ${MONO}`;
			g.fillStyle = '#7d8ea3';
			g.fillText('> whoami', 40, 118);
			g.font = `700 74px ${DISPLAY}`;
			g.fillStyle = '#eef3f8';
			g.fillText(contacts.name.toUpperCase(), 36, 196);
			g.font = `500 31px ${BODY}`;
			g.fillStyle = '#b4c2d0';
			const roles = contacts.tagline.replace(' & ', ', ').split(', ');
			roles.forEach((w, i) => g.fillText(w.charAt(0).toUpperCase() + w.slice(1), 40, 270 + i * 46));
			g.font = `500 26px ${MONO}`;
			g.fillStyle = '#6fc7dd';
			g.fillText('> select a menu item' + (this.blinkOn ? '_' : ''), 40, H - 56);
		} else {
			g.font = `600 26px ${DISPLAY}`;
			g.fillStyle = '#d4b678';
			g.fillText(p.index, 40, 112);
			g.font = `700 88px ${DISPLAY}`;
			g.fillStyle = '#eef3f8';
			g.fillText(p.title.toUpperCase(), 36, 180);
			g.font = `500 31px ${BODY}`;
			p.lines.slice(0, 5).forEach((line, i) => {
				const y = 266 + i * 50;
				g.fillStyle = '#6fc7dd';
				g.fillRect(40, y - 5, 10, 10);
				g.fillStyle = '#d3dde7';
				g.fillText(fit(g, line, W - 120), 68, y);
			});
			g.font = `700 26px ${DISPLAY}`;
			g.fillStyle = this.blinkOn ? '#6fc7dd' : 'rgba(111,199,221,0.55)';
			g.fillText(p.hint, 40, H - 50);
		}

		if (this.glitch > 0) glitchSlices(g, this.glitch / 0.28);
		g.drawImage(this.lines, 0, 0);
		this.texture.needsUpdate = true;
	}
}

function fit(g: CanvasRenderingContext2D, text: string, max: number) {
	if (g.measureText(text).width <= max) return text;
	let t = text;
	while (t.length > 1 && g.measureText(t + '…').width > max) t = t.slice(0, -1);
	return t + '…';
}

function glitchSlices(g: CanvasRenderingContext2D, k: number) {
	for (let i = 0; i < 7; i++) {
		const y = Math.floor(Math.random() * H);
		const h = 6 + Math.floor(Math.random() * 30);
		const dx = Math.round((Math.random() - 0.5) * 80 * k);
		g.drawImage(g.canvas, 0, y, W, h, dx, y, W, h);
	}
	g.fillStyle = `rgba(111,199,221,${0.12 * k})`;
	g.fillRect(0, 0, W, H);
}

// ---------------------------------------------------------------------------
// Static textures
// ---------------------------------------------------------------------------

export function woodTexture(): THREE.CanvasTexture {
	const w = 1024;
	const h = 512;
	const { ctx: g, texture } = makeCanvas(w, h);
	g.fillStyle = '#4a3122';
	g.fillRect(0, 0, w, h);
	// Long grain streaks with slow waviness
	for (let i = 0; i < 450; i++) {
		const y0 = Math.random() * h;
		const amp = 2 + Math.random() * 7;
		const freq = 0.002 + Math.random() * 0.006;
		const phase = Math.random() * 10;
		const light = Math.random() < 0.5;
		g.strokeStyle = light
			? `rgba(140,98,66,${0.05 + Math.random() * 0.12})`
			: `rgba(28,17,10,${0.06 + Math.random() * 0.16})`;
		g.lineWidth = 0.4 + Math.random() * 1.3;
		g.beginPath();
		for (let x = 0; x <= w; x += 32) {
			const y = y0 + Math.sin(x * freq + phase) * amp;
			if (x === 0) g.moveTo(x, y);
			else g.lineTo(x, y);
		}
		g.stroke();
	}
	texture.anisotropy = 8;
	return texture;
}

export function paperTexture(name: string): THREE.CanvasTexture {
	const w = 512;
	const h = 724;
	const { ctx: g, texture } = makeCanvas(w, h);
	g.fillStyle = '#eeeae2';
	g.fillRect(0, 0, w, h);
	g.fillStyle = '#1a2940';
	g.font = `700 34px ${DISPLAY}`;
	g.textBaseline = 'top';
	g.fillText(name.toUpperCase(), 44, 48);
	g.fillStyle = '#1b6d85';
	g.font = `600 18px ${DISPLAY}`;
	g.fillText('RESUME', 44, 96);
	g.fillStyle = '#6fc7dd';
	g.fillRect(44, 128, 424, 3);
	let y = 158;
	for (let s = 0; s < 4; s++) {
		g.fillStyle = '#1a2940';
		g.fillRect(44, y, 120 + Math.random() * 60, 12);
		y += 30;
		for (let l = 0; l < 4 + (s % 2); l++) {
			g.fillStyle = '#9aa5b4';
			g.fillRect(44, y, 300 + Math.random() * 120, 7);
			y += 18;
		}
		y += 22;
	}
	return texture;
}

export function softSprite(): THREE.CanvasTexture {
	const { ctx: g, texture } = makeCanvas(64, 64);
	const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
	r.addColorStop(0, 'rgba(255,255,255,1)');
	r.addColorStop(0.4, 'rgba(255,255,255,0.35)');
	r.addColorStop(1, 'rgba(255,255,255,0)');
	g.fillStyle = r;
	g.fillRect(0, 0, 64, 64);
	return texture;
}
