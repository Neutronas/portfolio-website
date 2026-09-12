import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

/** Height of the desk top surface (metres). Everything on the desk sits on this. */
export const DESK_Y = 0.75;

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

export const rbox = (w: number, h: number, d: number, r = 0.006, seg = 3) =>
	new RoundedBoxGeometry(w, h, d, seg, r);

export function std(color: THREE.ColorRepresentation, opts: THREE.MeshStandardMaterialParameters = {}) {
	return new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0, ...opts });
}

export function mesh(geo: THREE.BufferGeometry, mat: THREE.Material | THREE.Material[], cast = true, receive = true) {
	const m = new THREE.Mesh(geo, mat);
	m.castShadow = cast;
	m.receiveShadow = receive;
	return m;
}

function between(a: THREE.Vector3, b: THREE.Vector3, r: number, mat: THREE.Material) {
	const m = mesh(new THREE.CylinderGeometry(r, r, a.distanceTo(b), 14), mat);
	m.position.copy(a).add(b).multiplyScalar(0.5);
	m.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize());
	return m;
}

/** Emissive-looking colour for unlit materials: values > 1 feed the bloom pass. */
function glow(hex: THREE.ColorRepresentation, k: number) {
	return new THREE.Color(hex).multiplyScalar(k);
}

// ---------------------------------------------------------------------------

export function buildRoom() {
	const g = new THREE.Group();
	const wall = mesh(new THREE.PlaneGeometry(9, 4), std('#1b1e25', { roughness: 0.92 }), false, true);
	wall.position.set(0, 2, -0.62);
	const floor = mesh(new THREE.PlaneGeometry(9, 9), std('#0e0f13', { roughness: 0.85 }), false, true);
	floor.rotation.x = -Math.PI / 2;
	// Skirting board catches a bit of light and grounds the wall.
	const skirt = mesh(rbox(9, 0.1, 0.02, 0.004), std('#15171c', { roughness: 0.7 }), false, true);
	skirt.position.set(0, 0.05, -0.61);
	g.add(wall, floor, skirt);
	return g;
}

export function buildDesk(wood: THREE.Texture) {
	const g = new THREE.Group();
	const top = mesh(rbox(2.0, 0.045, 0.82, 0.01), std('#ffffff', { map: wood, roughness: 0.48 }));
	top.position.y = DESK_Y - 0.0225;
	const steel = std('#1d2026', { metalness: 0.75, roughness: 0.38 });
	const legH = DESK_Y - 0.045;
	for (const x of [-0.93, 0.93]) {
		for (const z of [-0.34, 0.34]) {
			const leg = mesh(rbox(0.045, legH, 0.045, 0.006), steel);
			leg.position.set(x, legH / 2, z);
			g.add(leg);
		}
		const rail = mesh(rbox(0.035, 0.035, 0.68, 0.005), steel);
		rail.position.set(x, 0.12, 0);
		g.add(rail);
	}
	const back = mesh(rbox(1.82, 0.06, 0.02, 0.005), steel);
	back.position.set(0, DESK_Y - 0.08, -0.34);
	// Desk mat
	const mat = mesh(rbox(1.12, 0.004, 0.4, 0.002), std('#20242c', { roughness: 0.95 }), false, true);
	mat.position.set(0.08, DESK_Y + 0.002, 0.12);
	// LED strip along the back edge (bias lighting)
	const led = new THREE.Mesh(
		new THREE.BoxGeometry(1.5, 0.006, 0.006),
		new THREE.MeshBasicMaterial({ color: glow('#58c4e0', 2.4), toneMapped: false })
	);
	led.position.set(0, DESK_Y + 0.003, -0.4);
	g.add(top, back, mat, led);
	return g;
}

export function buildMonitor(screenTex: THREE.Texture) {
	const root = new THREE.Group();
	const dark = std('#16181d', { roughness: 0.45, metalness: 0.35 });
	const base = mesh(rbox(0.26, 0.014, 0.18, 0.006), dark);
	base.position.set(0, 0.007, -0.02);
	const neck = mesh(rbox(0.045, 0.34, 0.03, 0.008), dark);
	neck.position.set(0, 0.014 + 0.17, -0.07);
	const pivot = new THREE.Group();
	pivot.position.set(0, 0.33, -0.05);
	const body = mesh(rbox(0.64, 0.385, 0.026, 0.008), dark);
	body.position.z = 0.03;
	const hump = mesh(rbox(0.3, 0.2, 0.04, 0.02), dark);
	hump.position.z = 0.012;
	const screenMat = new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false });
	screenMat.color.setScalar(1.15);
	const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.349), screenMat);
	screen.position.set(0, 0.007, 0.03 + 0.0132);
	pivot.add(body, hump, screen);
	root.add(base, neck, pivot);
	return { root, pivot, screen };
}

export function buildKeyboard() {
	const group = new THREE.Group();
	const base = mesh(rbox(0.45, 0.02, 0.155, 0.006), std('#191c22', { metalness: 0.4, roughness: 0.4 }));
	base.position.y = 0.01;
	const under = new THREE.Mesh(
		new THREE.PlaneGeometry(0.43, 0.135),
		new THREE.MeshBasicMaterial({ color: glow('#2fa9cc', 0.45), toneMapped: false })
	);
	under.rotation.x = -Math.PI / 2;
	under.position.y = 0.0202;

	const cols = 15;
	const rows = 5;
	const pitch = 0.0272;
	const slots: THREE.Vector3[] = [];
	for (let r = 0; r < rows; r++) {
		for (let c = 0; c < cols; c++) {
			// Spacebar row: leave a gap in the middle for the long key
			if (r === rows - 1 && c >= 4 && c <= 10) continue;
			slots.push(V((c - (cols - 1) / 2) * pitch, 0.026, (r - (rows - 1) / 2) * pitch));
		}
	}
	const keyMat = std('#2a2e37', { roughness: 0.42 });
	const keys = new THREE.InstancedMesh(rbox(0.0232, 0.011, 0.0232, 0.003, 2), keyMat, slots.length);
	keys.castShadow = true;
	keys.receiveShadow = true;
	const dummy = new THREE.Object3D();
	slots.forEach((p, i) => {
		dummy.position.copy(p);
		dummy.updateMatrix();
		keys.setMatrixAt(i, dummy.matrix);
	});
	const space = mesh(rbox(pitch * 7 - 0.004, 0.011, 0.0232, 0.003, 2), keyMat);
	space.position.set(0, 0.026, (rows - 1) / 2 * pitch);
	group.add(base, under, keys, space);

	const press = new Float32Array(slots.length);
	let spaceT = 0;
	return {
		group,
		pressRandom() {
			if (Math.random() < 0.14) spaceT = 1;
			else press[Math.floor(Math.random() * slots.length)] = 1;
		},
		update(dt: number) {
			let changed = false;
			for (let i = 0; i < press.length; i++) {
				if (press[i] <= 0) continue;
				press[i] = Math.max(0, press[i] - dt * 9);
				dummy.position.copy(slots[i]);
				dummy.position.y -= 0.0045 * Math.sin(press[i] * Math.PI);
				dummy.updateMatrix();
				keys.setMatrixAt(i, dummy.matrix);
				changed = true;
			}
			if (changed) keys.instanceMatrix.needsUpdate = true;
			spaceT = Math.max(0, spaceT - dt * 8);
			space.position.y = 0.026 - 0.004 * Math.sin(spaceT * Math.PI);
		}
	};
}

export function buildMouse() {
	const g = new THREE.Group();
	const body = mesh(new THREE.SphereGeometry(1, 32, 20), std('#1a1d23', { roughness: 0.32, metalness: 0.2 }));
	body.scale.set(0.031, 0.019, 0.054);
	body.position.y = 0.004;
	const wheel = new THREE.Mesh(
		new THREE.CylinderGeometry(0.0055, 0.0055, 0.006, 16),
		new THREE.MeshBasicMaterial({ color: glow('#6fc7dd', 2), toneMapped: false })
	);
	wheel.rotation.z = Math.PI / 2;
	wheel.position.set(0, 0.021, -0.022);
	g.add(body, wheel);
	return g;
}

export function buildMug(soft: THREE.Texture) {
	const root = new THREE.Group();
	const bounce = new THREE.Group();
	root.add(bounce);

	const glaze = std('#e0663a', { roughness: 0.3 });
	const R = 0.05;
	const Hm = 0.112;
	const profile = [
		[0.0, 0.0],
		[R - 0.006, 0.0],
		[R - 0.001, 0.004],
		[R, 0.012],
		[R + 0.002, Hm - 0.004],
		[R - 0.001, Hm],
		[R - 0.006, Hm - 0.002],
		[R - 0.006, 0.014],
		[0.0, 0.014]
	].map(([x, y]) => new THREE.Vector2(x, y));
	const body = mesh(new THREE.LatheGeometry(profile, 48), glaze);
	const coffee = mesh(new THREE.CircleGeometry(R - 0.006, 32), std('#2a160b', { roughness: 0.12 }), false, true);
	coffee.rotation.x = -Math.PI / 2;
	coffee.position.y = Hm - 0.018;
	const handle = mesh(new THREE.TorusGeometry(0.027, 0.0085, 12, 32, Math.PI * 1.15), glaze);
	handle.rotation.z = -Math.PI * 0.575;
	handle.position.set(R + 0.004, 0.058, 0);
	bounce.add(body, coffee, handle);

	// Face (front = +z, towards the camera)
	const white = std('#f8f6f0', { roughness: 0.22 });
	const black = std('#0c0c0e', { roughness: 0.08 });
	const ink = std('#4a2414', { roughness: 0.5 });
	const eyes: { socket: THREE.Group; ball: THREE.Group }[] = [];
	for (const x of [-0.019, 0.019]) {
		const socket = new THREE.Group();
		socket.position.set(x, 0.068, R - 0.004);
		const ball = new THREE.Group();
		ball.add(mesh(new THREE.SphereGeometry(0.0135, 24, 16), white, true, false));
		const pupil = mesh(new THREE.SphereGeometry(0.0074, 18, 12), black, false, false);
		pupil.scale.z = 0.45;
		pupil.position.z = 0.0118;
		ball.add(pupil);
		socket.add(ball);
		const glint = new THREE.Mesh(
			new THREE.SphereGeometry(0.0022, 8, 6),
			new THREE.MeshBasicMaterial({ color: '#ffffff' })
		);
		glint.position.set(0.004, 0.0045, 0.0132);
		socket.add(glint);
		bounce.add(socket);
		eyes.push({ socket, ball });
	}
	const brows: THREE.Mesh[] = [];
	for (const x of [-0.019, 0.019]) {
		const b = mesh(rbox(0.017, 0.0034, 0.004, 0.0015, 2), ink, false, false);
		b.position.set(x, 0.0875, R + 0.0015);
		b.rotation.z = x < 0 ? 0.12 : -0.12;
		bounce.add(b);
		brows.push(b);
	}
	const mouth = mesh(new THREE.TorusGeometry(0.0085, 0.0021, 8, 20, Math.PI), ink, false, false);
	mouth.rotation.z = Math.PI;
	mouth.position.set(0, 0.045, R + 0.0016);
	bounce.add(mouth);

	const steam: THREE.Sprite[] = [];
	for (let i = 0; i < 5; i++) {
		const s = new THREE.Sprite(
			new THREE.SpriteMaterial({ map: soft, color: '#ffffff', transparent: true, opacity: 0, depthWrite: false })
		);
		s.userData.phase = i / 5;
		root.add(s);
		steam.push(s);
	}

	return { root, bounce, eyes, brows, mouth, steam, height: Hm };
}

export function buildLamp() {
	const root = new THREE.Group();
	const metal = std('#262a31', { metalness: 0.7, roughness: 0.32 });
	const brass = std('#c9a45c', { metalness: 0.85, roughness: 0.3 });
	const base = mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.022, 40), metal);
	base.position.y = 0.011;
	const p0 = V(0, 0.03, 0);
	const p1 = V(0.02, 0.42, -0.1);
	const p2 = V(0.19, 0.5, 0.1);
	const j0 = mesh(new THREE.SphereGeometry(0.016, 16, 12), brass);
	j0.position.copy(p0);
	const j1 = mesh(new THREE.SphereGeometry(0.014, 16, 12), brass);
	j1.position.copy(p1);
	const j2 = mesh(new THREE.SphereGeometry(0.013, 16, 12), brass);
	j2.position.copy(p2);
	root.add(base, j0, j1, j2, between(p0, p1, 0.0075, metal), between(p1, p2, 0.0075, metal));

	const head = new THREE.Group();
	head.position.copy(p2);
	const shadeGeo = new THREE.CylinderGeometry(0.026, 0.066, 0.11, 40, 1, true);
	shadeGeo.rotateX(-Math.PI / 2);
	shadeGeo.translate(0, 0, 0.045);
	const shade = mesh(shadeGeo, std('#2b2f36', { metalness: 0.6, roughness: 0.35, side: THREE.DoubleSide }));
	const cap = mesh(new THREE.SphereGeometry(0.027, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), metal);
	cap.rotation.x = -Math.PI / 2;
	cap.position.z = -0.01;
	const bulb = new THREE.Mesh(
		new THREE.SphereGeometry(0.02, 20, 14),
		new THREE.MeshBasicMaterial({ color: glow('#ffd8a8', 3), toneMapped: false })
	);
	bulb.position.z = 0.04;
	const light = new THREE.SpotLight('#ffc792', 5.5, 3.2, 0.62, 0.75, 1.6);
	light.position.z = 0.05;
	light.castShadow = true;
	light.shadow.mapSize.set(1024, 1024);
	light.shadow.bias = -0.0008;
	light.shadow.normalBias = 0.01;
	light.shadow.camera.near = 0.05;
	light.shadow.camera.far = 3;
	head.add(shade, cap, bulb, light);
	root.add(head);
	return { root, head, light };
}

export function buildTower() {
	const g = new THREE.Group();
	const shell = mesh(rbox(0.21, 0.46, 0.42, 0.012), std('#111318', { metalness: 0.55, roughness: 0.42 }));
	shell.position.y = 0.23;
	const face = mesh(rbox(0.19, 0.44, 0.008, 0.004), std('#0a0b0e', { roughness: 0.6 }));
	face.position.set(0, 0.23, 0.208);
	const glass = new THREE.Mesh(
		new THREE.PlaneGeometry(0.38, 0.4),
		std('#0b0e14', { metalness: 0.9, roughness: 0.06, transparent: true, opacity: 0.6 })
	);
	glass.rotation.y = -Math.PI / 2;
	glass.position.set(-0.1062, 0.23, 0);
	g.add(shell, face, glass);

	const bladeMat = std('#1b1f27', { roughness: 0.5, transparent: true, opacity: 0.85 });
	const fans: { ring: THREE.Mesh; blades: THREE.Group }[] = [];
	for (const y of [0.1, 0.23, 0.36]) {
		const ring = new THREE.Mesh(
			new THREE.TorusGeometry(0.052, 0.0045, 10, 48),
			new THREE.MeshBasicMaterial({ color: glow('#6fc7dd', 2), toneMapped: false })
		);
		ring.position.set(0, y, 0.214);
		const blades = new THREE.Group();
		blades.position.set(0, y, 0.213);
		for (let i = 0; i < 7; i++) {
			const b = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.013, 0.002), bladeMat);
			const a = (i / 7) * Math.PI * 2;
			b.position.set(Math.cos(a) * 0.026, Math.sin(a) * 0.026, 0);
			b.rotation.z = a + 0.5;
			blades.add(b);
		}
		blades.add(new THREE.Mesh(new THREE.CircleGeometry(0.014, 20), std('#0e1014')));
		g.add(ring, blades);
		fans.push({ ring, blades });
	}
	const power = new THREE.Mesh(
		new THREE.TorusGeometry(0.008, 0.0016, 8, 24),
		new THREE.MeshBasicMaterial({ color: glow('#ffffff', 1.6), toneMapped: false })
	);
	power.rotation.x = -Math.PI / 2;
	power.position.set(0.05, 0.461, 0.17);
	g.add(power);

	return {
		group: g,
		update(t: number, dt: number) {
			fans.forEach((f, i) => {
				f.blades.rotation.z -= dt * (14 + i);
				const c = (f.ring.material as THREE.MeshBasicMaterial).color;
				// Slow drift between cyan and violet
				c.setHSL(0.53 + 0.1 * Math.sin(t * 0.4 + i * 0.7), 0.7, 0.55).multiplyScalar(2);
			});
		}
	};
}

export function buildFrame(photo: THREE.Texture) {
	const g = new THREE.Group();
	const tilt = new THREE.Group();
	tilt.rotation.x = -0.2;
	const frame = mesh(rbox(0.16, 0.122, 0.012, 0.003), std('#111214', { roughness: 0.4 }));
	const pic = new THREE.Mesh(new THREE.PlaneGeometry(0.138, 0.1), std('#ffffff', { map: photo, roughness: 0.3 }));
	pic.position.z = 0.0065;
	tilt.add(frame, pic);
	tilt.position.y = 0.061;
	const stand = mesh(rbox(0.03, 0.1, 0.006, 0.002), std('#111214'));
	stand.position.set(0, 0.05, -0.03);
	stand.rotation.x = 0.35;
	g.add(tilt, stand);
	return g;
}

export function buildPapers(tex: THREE.Texture) {
	const g = new THREE.Group();
	const side = std('#e3dfd6', { roughness: 0.9 });
	for (let i = 0; i < 3; i++) {
		const top = i === 2 ? std('#ffffff', { map: tex, roughness: 0.85 }) : side;
		const sheet = mesh(new THREE.BoxGeometry(0.15, 0.0012, 0.212), [side, side, top, side, side, side]);
		sheet.position.y = 0.0008 + i * 0.0013;
		sheet.rotation.y = (i - 1) * 0.06;
		g.add(sheet);
	}
	return g;
}

export function buildNeon() {
	const g = new THREE.Group();
	const tube = new THREE.MeshBasicMaterial({ color: glow('#6fc7dd', 2.6), toneMapped: false });
	const strokes: [number, number][][] = [
		[[-0.12, 0.075], [-0.21, 0], [-0.12, -0.075]],
		[[-0.035, -0.09], [0.035, 0.09]],
		[[0.12, 0.075], [0.21, 0], [0.12, -0.075]]
	];
	for (const s of strokes) {
		for (let i = 0; i < s.length - 1; i++) {
			const a = V(s[i][0], s[i][1], 0);
			const b = V(s[i + 1][0], s[i + 1][1], 0);
			const c = new THREE.Mesh(new THREE.CylinderGeometry(0.0065, 0.0065, a.distanceTo(b), 10), tube);
			c.position.copy(a).add(b).multiplyScalar(0.5);
			c.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize());
			g.add(c);
		}
		for (const p of s) {
			const cap = new THREE.Mesh(new THREE.SphereGeometry(0.0065, 10, 8), tube);
			cap.position.set(p[0], p[1], 0);
			g.add(cap);
		}
	}
	const plate = new THREE.Mesh(
		rbox(0.52, 0.26, 0.008, 0.004),
		new THREE.MeshBasicMaterial({ color: '#10252d', transparent: true, opacity: 0.5 })
	);
	plate.position.z = -0.012;
	const light = new THREE.PointLight('#6fc7dd', 0.9, 1.6, 1.8);
	light.position.z = 0.12;
	g.add(plate, light);
	return g;
}

export function buildDust(soft: THREE.Texture, count = 160) {
	const pos = new Float32Array(count * 3);
	const seed = new Float32Array(count);
	for (let i = 0; i < count; i++) {
		pos[i * 3] = -0.95 + Math.random() * 1.3;
		pos[i * 3 + 1] = 0.78 + Math.random() * 0.62;
		pos[i * 3 + 2] = -0.35 + Math.random() * 0.75;
		seed[i] = Math.random() * 100;
	}
	const geo = new THREE.BufferGeometry();
	geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
	const base = pos.slice();
	const points = new THREE.Points(
		geo,
		new THREE.PointsMaterial({
			map: soft,
			color: '#ffd9a8',
			size: 0.006,
			transparent: true,
			opacity: 0.45,
			depthWrite: false,
			blending: THREE.AdditiveBlending
		})
	);
	return {
		points,
		update(t: number) {
			for (let i = 0; i < count; i++) {
				const s = seed[i];
				pos[i * 3] = base[i * 3] + Math.sin(t * 0.13 + s) * 0.03;
				pos[i * 3 + 1] = base[i * 3 + 1] + Math.sin(t * 0.09 + s * 1.7) * 0.04;
				pos[i * 3 + 2] = base[i * 3 + 2] + Math.cos(t * 0.11 + s) * 0.03;
			}
			geo.attributes.position.needsUpdate = true;
		}
	};
}
