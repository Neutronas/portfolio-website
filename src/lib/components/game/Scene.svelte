<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';
	import contacts from '$lib/data/contacts.json';
	import type { DeskScene, Preview } from '$lib/scene/DeskScene';

	let {
		selected,
		preview,
		panelOpen,
		onhover,
		onselect,
		onready
	}: {
		selected: string | null;
		preview: Preview | null;
		panelOpen: boolean;
		onhover: (id: string | null) => void;
		onselect: (id: string) => void;
		onready: (ok: boolean) => void;
	} = $props();

	let canvas: HTMLCanvasElement;
	let scene: DeskScene | null = $state(null);

	onMount(() => {
		let disposed = false;
		const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
		import('$lib/scene/DeskScene')
			.then(({ DeskScene }) => {
				if (disposed) return;
				scene = new DeskScene({
					canvas,
					name: contacts.name,
					photoUrl: `${base}/img/bio/wedding.png`,
					reducedMotion,
					onHover: (id) => onhover(id),
					onSelect: (id) => onselect(id),
					onReady: () => onready(true)
				});
			})
			.catch((err) => {
				// No WebGL (or it crashed): the menu still works over a flat backdrop.
				console.warn('3D scene unavailable', err);
				onready(false);
			});
		return () => {
			disposed = true;
			scene?.dispose();
		};
	});

	$effect(() => scene?.setPreview(preview));
	$effect(() => scene?.setSelected(selected));
	$effect(() => scene?.setPanelOpen(panelOpen));
	$effect(() => {
		if (selected === 'contact') scene?.poke();
	});
</script>

<canvas bind:this={canvas} aria-hidden="true"></canvas>

<style>
	canvas {
		position: fixed;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
		touch-action: manipulation;
	}
</style>
