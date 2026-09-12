import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	// three.js is one lazy-loaded chunk (~600 kB); it never blocks first paint.
	build: { chunkSizeWarningLimit: 800 },
	server: {
		// Live preview of work-in-progress branches, proxied by nginx.
		allowedHosts: ['dev.ruzauskas.lt']
	}
});
