import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	// three.js is one lazy-loaded chunk (~600 kB); it never blocks first paint.
	build: { chunkSizeWarningLimit: 800 },
	// Pre-bundle three.js at dev-server start. Otherwise it is discovered on first page load,
	// Vite re-optimizes mid-request and a browser can cache a half-swapped set of chunks.
	optimizeDeps: {
		include: [
			'three',
			'three/examples/jsm/postprocessing/EffectComposer.js',
			'three/examples/jsm/postprocessing/RenderPass.js',
			'three/examples/jsm/postprocessing/UnrealBloomPass.js',
			'three/examples/jsm/postprocessing/OutputPass.js',
			'three/examples/jsm/environments/RoomEnvironment.js',
			'three/examples/jsm/lights/RectAreaLightUniformsLib.js',
			'three/examples/jsm/geometries/RoundedBoxGeometry.js'
		]
	},
	server: {
		// Live preview of work-in-progress branches, proxied by nginx.
		allowedHosts: ['dev.ruzauskas.lt']
	}
});
