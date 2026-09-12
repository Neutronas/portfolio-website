import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
	DESK_Y,
	buildDesk,
	buildDust,
	buildFrame,
	buildKeyboard,
	buildLamp,
	buildMonitor,
	buildMouse,
	buildMug,
	buildNeon,
	buildPapers,
	buildRoom,
	buildTower
} from './models';
import { CodeScreen, InfoScreen, paperTexture, softSprite, woodTexture, type Preview } from './screens';

export type { Preview };

export interface DeskSceneOptions {
	canvas: HTMLCanvasElement;
	name: string;
	photoUrl: string;
	reducedMotion: boolean;
	onHover: (id: string | null) => void;
	onSelect: (id: string) => void;
	onReady: () => void;
}

interface Target {
	id: string;
	obj: THREE.Object3D;
	hl: number;
	baseScale: number;
}

const clamp = THREE.MathUtils.clamp;
/** Frame-rate independent exponential smoothing. */
const damp = (a: number, b: number, rate: number, dt: number) => THREE.MathUtils.damp(a, b, rate, dt);

export class DeskScene {
	private renderer: THREE.WebGLRenderer;
	private composer: EffectComposer;
	private bloom: UnrealBloomPass;
	private scene = new THREE.Scene();
	private camera = new THREE.PerspectiveCamera(34, 1, 0.05, 30);
	private raycaster = new THREE.Raycaster();
	private clock = new THREE.Clock();
	private raf = 0;
	private frames = 0;
	private slowFrames = 0;
	private ready = false;
	private disposed = false;

	// Input
	private pointer = new THREE.Vector2();
	private smooth = new THREE.Vector2();
	private lastMove = -10;
	private overCanvas = false;
	private moved = false;
	private downAt: { x: number; y: number } | null = null;

	// Camera framing
	private camTarget = new THREE.Vector3(0.02, 0.97, -0.08);
	private camDir = new THREE.Vector3(0.1, 0.36, 1).normalize();
	private dist = 2.4;
	private menuShift = 0.13;
	private panelShift = -0.2;
	private vShift = 0;
	private panelT = 0;
	private panelOpen = false;
	private width = 1;
	private height = 1;

	// Scene objects
	private monitors: { pivot: THREE.Group; baseYaw: number; yaw: number; pitch: number }[] = [];
	private mug!: ReturnType<typeof buildMug>;
	private lamp!: ReturnType<typeof buildLamp>;
	private keyboard!: ReturnType<typeof buildKeyboard>;
	private tower!: ReturnType<typeof buildTower>;
	private dust!: ReturnType<typeof buildDust>;
	private deskMouse!: THREE.Group;
	private code: CodeScreen;
	private info: InfoScreen;
	private lampAim = new THREE.Vector3(-0.35, DESK_Y, 0.05);
	private lampTarget = new THREE.Object3D();
	private look = new THREE.Vector3(0, 1, 0.75);
	private targets: Target[] = [];
	private hoverId: string | null = null;
	private selectedId: string | null = null;
	private blink = { next: 2.5, t: -1, double: false };
	private hop = 0;
	private moodT = 0;

	private readonly lookPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.75);
	private readonly deskPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -DESK_Y);
	private readonly tmp = new THREE.Vector3();
	private readonly tmp2 = new THREE.Vector3();
	private resizeObs: ResizeObserver;

	constructor(private opts: DeskSceneOptions) {
		const { canvas } = opts;
		this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
		this.renderer.toneMapping = THREE.NeutralToneMapping;
		this.renderer.toneMappingExposure = 1.0;
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFShadowMap;

		const bg = new THREE.Color('#08090c');
		this.scene.background = bg;
		this.scene.fog = new THREE.Fog(bg, 3.2, 7.5);
		const pmrem = new THREE.PMREMGenerator(this.renderer);
		this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
		this.scene.environmentIntensity = 0.22;
		pmrem.dispose();

		this.code = new CodeScreen(opts.reducedMotion);
		this.info = new InfoScreen();
		this.build();

		this.composer = new EffectComposer(this.renderer);
		this.composer.addPass(new RenderPass(this.scene, this.camera));
		this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.55, 0.6, 0.86);
		this.composer.addPass(this.bloom);
		this.composer.addPass(new OutputPass());

		this.resizeObs = new ResizeObserver(() => this.resize());
		this.resizeObs.observe(canvas);
		this.resize();

		window.addEventListener('pointermove', this.onPointerMove, { passive: true });
		window.addEventListener('pointerdown', this.onPointerDown, { passive: true });
		window.addEventListener('pointerup', this.onPointerUp);
		document.addEventListener('pointerleave', this.onPointerLeave);
		void this.start();
	}

	/**
	 * Compile every shader before the first frame. With KHR_parallel_shader_compile this
	 * happens off the main thread, so the page stays responsive instead of freezing on
	 * the first render (slow on ANGLE/Metal in particular).
	 */
	private async start() {
		try {
			await this.renderer.compileAsync(this.scene, this.camera);
		} catch {
			// Fall back to compiling on first render.
		}
		if (this.disposed) return;
		this.clock.getDelta();
		this.raf = requestAnimationFrame(this.loop);
	}

	// ------------------------------------------------------------------ public

	setPreview(p: Preview | null) {
		this.info.set(p);
	}

	setSelected(id: string | null) {
		this.selectedId = id;
	}

	setPanelOpen(open: boolean) {
		this.panelOpen = open;
	}

	/** Little hop from the mug — used when "contact" is picked. */
	poke() {
		if (!this.opts.reducedMotion) this.hop = 1;
	}

	dispose() {
		this.disposed = true;
		cancelAnimationFrame(this.raf);
		this.resizeObs.disconnect();
		window.removeEventListener('pointermove', this.onPointerMove);
		window.removeEventListener('pointerdown', this.onPointerDown);
		window.removeEventListener('pointerup', this.onPointerUp);
		document.removeEventListener('pointerleave', this.onPointerLeave);
		this.scene.traverse((o) => {
			const m = o as THREE.Mesh;
			m.geometry?.dispose();
			const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
			for (const mat of mats) {
				for (const v of Object.values(mat)) if (v instanceof THREE.Texture) v.dispose();
				mat.dispose();
			}
		});
		this.scene.environment?.dispose();
		this.composer.dispose();
		this.renderer.dispose();
	}

	// ------------------------------------------------------------------ build

	private build() {
		const s = this.scene;
		const soft = softSprite();

		s.add(buildRoom());
		s.add(buildDesk(woodTexture()));

		// Lights: cool ambient + moonlight fill, warm lamp key, cyan bias light
		s.add(new THREE.HemisphereLight('#8fb2ff', '#1a120c', 0.45));
		const moon = new THREE.DirectionalLight('#9db8ff', 0.5);
		moon.position.set(-2.2, 2.6, 2.4);
		s.add(moon);
		const bias = new THREE.PointLight('#58c4e0', 1.4, 1.6, 1.6);
		bias.position.set(0, DESK_Y + 0.28, -0.5);
		// Screen glow spilling onto keyboard and desk (cheap stand-in for area lights)
		const spill = new THREE.PointLight('#8fd3ee', 0.9, 1.1, 1.6);
		spill.position.set(0, DESK_Y + 0.3, 0.02);
		s.add(bias, spill);

		// Monitors, turned slightly inward
		const screens = [this.code.texture, this.info.texture];
		[
			{ x: -0.335, yaw: 0.2, id: 'projects' },
			{ x: 0.335, yaw: -0.2, id: 'career' }
		].forEach((m, i) => {
			const mon = buildMonitor(screens[i]);
			mon.root.position.set(m.x, DESK_Y, -0.17);
			mon.root.rotation.y = m.yaw;
			s.add(mon.root);
			this.monitors.push({ pivot: mon.pivot, baseYaw: m.yaw, yaw: 0, pitch: 0 });
			this.addTarget(m.id, mon.pivot);
		});

		this.keyboard = buildKeyboard();
		this.keyboard.group.position.set(-0.02, DESK_Y + 0.004, 0.1);
		s.add(this.keyboard.group);
		this.code.onKey = () => this.keyboard.pressRandom();

		this.deskMouse = buildMouse();
		this.deskMouse.position.set(0.36, DESK_Y + 0.019, 0.13);
		s.add(this.deskMouse);

		this.mug = buildMug(soft);
		this.mug.root.position.set(-0.43, DESK_Y + 0.004, 0.15);
		this.mug.root.rotation.y = 0.15;
		s.add(this.mug.root);
		this.addTarget('contact', this.mug.root);

		this.lamp = buildLamp();
		this.lamp.root.position.set(-0.88, DESK_Y, -0.1);
		this.lamp.root.rotation.y = 0.1;
		s.add(this.lamp.root, this.lampTarget);
		this.lamp.light.target = this.lampTarget;

		this.tower = buildTower();
		this.tower.group.position.set(0.8, DESK_Y, -0.14);
		this.tower.group.rotation.y = -0.12;
		s.add(this.tower.group);
		this.addTarget('github', this.tower.group);

		const photo = new THREE.TextureLoader().load(this.opts.photoUrl);
		photo.colorSpace = THREE.SRGBColorSpace;
		const frame = buildFrame(photo);
		frame.position.set(-0.64, DESK_Y, -0.08);
		frame.rotation.y = 0.4;
		s.add(frame);
		this.addTarget('biography', frame);

		const papers = buildPapers(paperTexture(this.opts.name));
		papers.position.set(0.6, DESK_Y + 0.004, 0.2);
		papers.rotation.y = -0.32;
		s.add(papers);
		this.addTarget('resume', papers);

		const neon = buildNeon();
		neon.position.set(0, 1.6, -0.6);
		s.add(neon);

		this.dust = buildDust(soft);
		s.add(this.dust.points);
	}

	private addTarget(id: string, obj: THREE.Object3D) {
		obj.traverse((o) => (o.userData.target = id));
		this.targets.push({ id, obj, hl: 0, baseScale: obj.scale.x });
	}

	// ------------------------------------------------------------------ input

	private onPointerMove = (e: PointerEvent) => {
		this.pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
		this.lastMove = this.clock.elapsedTime;
		this.overCanvas = e.target === this.opts.canvas;
		this.moved = true;
	};

	private onPointerDown = (e: PointerEvent) => {
		if (e.target !== this.opts.canvas) return;
		this.onPointerMove(e);
		this.downAt = { x: e.clientX, y: e.clientY };
		// Touch has no hover: resolve what is under the finger right away.
		this.updateHover();
	};

	private onPointerUp = (e: PointerEvent) => {
		if (!this.downAt || e.target !== this.opts.canvas) return;
		const d = Math.hypot(e.clientX - this.downAt.x, e.clientY - this.downAt.y);
		this.downAt = null;
		if (d < 8 && this.hoverId) {
			if (this.hoverId === 'contact') this.poke();
			this.opts.onSelect(this.hoverId);
		}
	};

	private onPointerLeave = () => {
		this.overCanvas = false;
		this.moved = true;
	};

	// ------------------------------------------------------------------ layout

	private resize() {
		const w = window.innerWidth;
		const h = window.innerHeight;
		if (w === this.width && h === this.height) return;
		this.width = w;
		this.height = h;
		this.renderer.setSize(w, h, false);
		this.composer.setSize(w, h);
		this.composer.setPixelRatio(this.renderer.getPixelRatio());

		const aspect = w / h;
		this.camera.aspect = aspect;
		const vHalf = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2));
		const wide = aspect >= 1.15;
		// Fit the interesting part of the desk into the area the menu does not cover.
		// Portrait: phones crop to monitors + mug, tablets show more of the desk.
		const p = clamp((aspect - 0.46) / 0.3, 0, 1);
		const halfW = wide ? 1.0 : 0.6 + 0.14 * p;
		const usable = wide ? 0.74 : 1;
		const distW = halfW / (vHalf * aspect * usable);
		const distH = (wide ? 0.44 : 0.36) / vHalf;
		this.dist = clamp(Math.max(distW, distH), 1.5, 4.6);
		this.menuShift = wide ? 0.12 : 0;
		this.panelShift = wide ? -0.08 : 0;
		this.vShift = wide ? 0 : 0.16 - 0.07 * p;
	}

	// ------------------------------------------------------------------ frame

	private loop = () => {
		this.raf = requestAnimationFrame(this.loop);
		const dt = Math.min(this.clock.getDelta(), 0.05);
		const t = this.clock.elapsedTime;
		this.update(dt, t);
		if (this.bloom.enabled) this.composer.render(dt);
		else this.renderer.render(this.scene, this.camera);

		if (!this.ready && ++this.frames > 2) {
			this.ready = true;
			this.frames = 0;
			this.opts.onReady();
		} else if (this.ready && this.frames < 150) {
			// Adaptive quality: if the first seconds run slow, drop bloom and resolution.
			this.frames++;
			if (dt > 1 / 38) this.slowFrames++;
			if (this.frames === 150 && this.slowFrames > 75) this.lowerQuality();
		}
	};

	private lowerQuality() {
		this.bloom.enabled = false;
		this.renderer.setPixelRatio(1);
		this.renderer.setSize(this.width, this.height, false);
		this.lamp.light.shadow.mapSize.set(512, 512);
		this.lamp.light.shadow.map?.dispose();
		this.lamp.light.shadow.map = null;
	}

	private update(dt: number, t: number) {
		const rm = this.opts.reducedMotion;

		// Pointer target: real cursor, or a slow idle drift when nobody is moving it.
		const idle = clamp((t - this.lastMove - 5) / 2, 0, 1);
		const ix = Math.sin(t * 0.37) * 0.45;
		const iy = Math.sin(t * 0.53) * 0.25 - 0.1;
		const px = THREE.MathUtils.lerp(this.pointer.x, ix, idle);
		const py = THREE.MathUtils.lerp(this.pointer.y, iy, idle);
		this.smooth.x = damp(this.smooth.x, px, 5, dt);
		this.smooth.y = damp(this.smooth.y, py, 5, dt);
		const sp = this.smooth;

		// Camera base pose (no parallax) — used to turn the cursor into 3D targets.
		this.panelT = damp(this.panelT, this.panelOpen ? 1 : 0, 4, dt);
		const shift = THREE.MathUtils.lerp(this.menuShift, this.panelShift, this.panelT);
		const cam = this.camera;
		cam.setViewOffset(this.width, this.height, -shift * this.width, this.vShift * this.height, this.width, this.height);
		cam.position.copy(this.camTarget).addScaledVector(this.camDir, this.dist);
		cam.lookAt(this.camTarget);
		cam.updateMatrixWorld();

		this.raycaster.setFromCamera(sp, cam);
		const ray = this.raycaster.ray;
		if (ray.intersectPlane(this.lookPlane, this.tmp)) this.look.copy(this.tmp);
		if (ray.intersectPlane(this.deskPlane, this.tmp)) {
			this.tmp.x = clamp(this.tmp.x, -0.95, 0.95);
			this.tmp.z = clamp(this.tmp.z, -0.38, 0.4);
			// Keep the lamp's reach sensible: blend with a resting spot.
			this.tmp2.set(-0.35, DESK_Y, 0.05).lerp(this.tmp, 0.7);
			this.lampAim.lerp(this.tmp2, 1 - Math.exp(-dt * 4));
		}

		// Parallax
		if (!rm) {
			const right = this.tmp.set(1, 0, 0);
			cam.position.addScaledVector(right, sp.x * 0.05);
			cam.position.y += sp.y * 0.035;
			cam.lookAt(this.camTarget);
			cam.updateMatrixWorld();
		}

		if (this.moved) {
			this.moved = false;
			this.updateHover();
		}

		// Monitors lean toward the cursor
		for (const m of this.monitors) {
			m.pivot.getWorldPosition(this.tmp);
			const dx = this.look.x - this.tmp.x;
			const dy = this.look.y - this.tmp.y;
			const dz = this.look.z - this.tmp.z;
			const k = rm ? 0.12 : 0.3;
			const yaw = clamp((Math.atan2(dx, dz) - m.baseYaw) * k, -0.22, 0.22);
			const pitch = clamp(-Math.atan2(dy, Math.hypot(dx, dz)) * k, -0.12, 0.12);
			m.yaw = damp(m.yaw, yaw, 4, dt);
			m.pitch = damp(m.pitch, pitch, 4, dt);
			m.pivot.rotation.set(m.pitch, m.yaw, 0, 'YXZ');
		}

		this.updateMug(dt, t);

		// Lamp head + spotlight follow the cursor across the desk
		this.lampTarget.position.copy(this.lampAim);
		this.lampTarget.updateMatrixWorld();
		this.lamp.head.lookAt(this.lampAim);

		// Desk mouse mirrors the real one
		this.deskMouse.position.x = 0.36 + sp.x * 0.06;
		this.deskMouse.position.z = 0.13 - sp.y * 0.045;
		this.deskMouse.rotation.y = -sp.x * 0.15;

		// Highlight: scale up what the menu or cursor points at
		for (const tg of this.targets) {
			const on = tg.id === this.hoverId || tg.id === this.selectedId;
			tg.hl = damp(tg.hl, on ? 1 : 0, 10, dt);
			tg.obj.scale.setScalar(tg.baseScale * (1 + 0.04 * tg.hl));
		}

		this.keyboard.update(dt);
		this.tower.update(t, rm ? dt * 0.2 : dt);
		if (!rm) this.dust.update(t);
		this.code.update(dt);
		this.info.update(dt);
	}

	private updateHover() {
		let id: string | null = null;
		if (this.overCanvas) {
			this.raycaster.setFromCamera(this.pointer, this.camera);
			const hit = this.raycaster.intersectObjects(
				this.targets.map((t) => t.obj),
				true
			)[0];
			id = (hit?.object.userData.target as string) ?? null;
		}
		if (id !== this.hoverId) {
			this.hoverId = id;
			this.opts.canvas.style.cursor = id ? 'pointer' : '';
			if (id === 'contact' && !this.opts.reducedMotion && this.hop <= 0) this.hop = 0.6;
			this.opts.onHover(id);
		}
	}

	private updateMug(dt: number, t: number) {
		const mug = this.mug;
		const mood = this.hoverId === 'contact' || this.selectedId === 'contact';
		this.moodT = damp(this.moodT, mood ? 1 : 0, 8, dt);

		// Eyes track the cursor (clamped so pupils never roll into the mug)
		for (const e of mug.eyes) {
			e.socket.getWorldPosition(this.tmp);
			this.tmp2.set(
				clamp(this.look.x, this.tmp.x - 0.5, this.tmp.x + 0.5),
				clamp(this.look.y, this.tmp.y - 0.35, this.tmp.y + 0.35),
				this.look.z
			);
			e.ball.lookAt(this.tmp2);
		}

		// Blinking, sometimes twice
		const b = this.blink;
		b.next -= dt;
		if (b.next <= 0 && b.t < 0) {
			b.t = 0;
			b.double = Math.random() < 0.25;
		}
		let lid = 1;
		if (b.t >= 0) {
			b.t += dt / 0.16;
			lid = 1 - 0.92 * Math.sin(Math.min(b.t, 1) * Math.PI);
			if (b.t >= 1) {
				b.t = -1;
				if (b.double) {
					b.double = false;
					b.next = 0.12;
				} else {
					b.next = 2 + Math.random() * 4;
				}
			}
		}
		const wide = 1 + 0.12 * this.moodT;
		for (const e of mug.eyes) e.socket.scale.set(wide, lid * wide, wide);

		mug.brows.forEach((br, i) => {
			br.position.y = 0.0875 + 0.005 * this.moodT;
			br.rotation.z = (i === 0 ? 0.12 : -0.12) * (1 - 1.6 * this.moodT);
		});
		mug.mouth.scale.set(1 + 0.3 * this.moodT, 1 + 0.9 * this.moodT, 1);

		// Hop with squash & stretch
		if (this.hop > 0) {
			this.hop = Math.max(0, this.hop - dt * 1.8);
			const p = 1 - this.hop;
			const y = Math.max(0, Math.sin(p * Math.PI)) * 0.035 * Math.min(1, this.hop * 3);
			mug.bounce.position.y = y;
			const sq = 1 + Math.sin(p * Math.PI * 2) * 0.08 * this.hop;
			mug.bounce.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
		} else {
			mug.bounce.position.y = 0;
			mug.bounce.scale.setScalar(1);
		}

		// Steam
		for (const s of mug.steam) {
			const p = (t * 0.22 + (s.userData.phase as number)) % 1;
			s.position.set(Math.sin(t * 1.3 + p * 6) * 0.014 * p, mug.height + p * 0.24, Math.cos(t + p * 4) * 0.01 * p);
			const size = 0.03 + p * 0.08;
			s.scale.set(size, size, size);
			(s.material as THREE.SpriteMaterial).opacity = Math.sin(p * Math.PI) * 0.12;
		}
	}
}
