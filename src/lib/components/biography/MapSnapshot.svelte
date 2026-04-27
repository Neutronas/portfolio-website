<script lang="ts">
	import { onMount } from 'svelte';
	import { loadLeaflet, CARTO_POSITRON_URL, CARTO_ATTRIBUTION } from '$lib/utils/leaflet';

	let {
		lat,
		lng,
		zoom = 11,
		label
	}: { lat: number; lng: number; zoom?: number; label: string } = $props();

	let mapEl: HTMLDivElement | null = $state(null);
	let ready = $state(false);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let mapInstance: any = null;

	onMount(() => {
		if (!mapEl) return;
		const io = new IntersectionObserver(
			async (entries) => {
				for (const e of entries) {
					if (!e.isIntersecting) continue;
					io.disconnect();
					if (!mapEl) return;
					const L = await loadLeaflet();
					mapInstance = L.map(mapEl, {
						center: [lat, lng],
						zoom,
						zoomControl: false,
						attributionControl: true,
						dragging: false,
						scrollWheelZoom: false,
						doubleClickZoom: false,
						touchZoom: false,
						keyboard: false,
						boxZoom: false
					});
					L.tileLayer(CARTO_POSITRON_URL, {
						attribution: CARTO_ATTRIBUTION,
						maxZoom: 19,
						subdomains: 'abcd'
					}).addTo(mapInstance);
					L.circleMarker([lat, lng], {
						radius: 9,
						color: '#6FC7DD',
						fillColor: '#A4DFEF',
						fillOpacity: 0.9,
						weight: 2
					}).addTo(mapInstance);
					ready = true;
				}
			},
			{ rootMargin: '300px' }
		);
		io.observe(mapEl);
		return () => {
			io.disconnect();
			mapInstance?.remove?.();
			mapInstance = null;
		};
	});
</script>

<figure class="map">
	<div bind:this={mapEl} class="map-canvas" class:ready aria-label="Map of {label}"></div>
	<figcaption class="map-label">
		<span class="pin" aria-hidden="true"></span>
		{label}
	</figcaption>
</figure>

<style>
	.map {
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.map-canvas {
		width: 100%;
		aspect-ratio: 16 / 10;
		border-radius: var(--radius-md);
		border: 1px solid var(--line-hair);
		background:
			repeating-linear-gradient(
				45deg,
				var(--bg-night) 0,
				var(--bg-night) 6px,
				var(--line-hair) 6px,
				var(--line-hair) 7px
			);
		overflow: hidden;
		opacity: 0;
		transition: opacity 500ms var(--ease-out);
	}
	.map-canvas.ready {
		opacity: 1;
	}
	.map-label {
		font-family: var(--font-body);
		font-size: var(--step--1);
		color: var(--ink-mute);
		letter-spacing: 0.2em;
		text-transform: uppercase;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
	}
	.pin {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--accent-cyan);
		box-shadow: 0 0 0 3px rgba(111, 199, 221, 0.25);
	}
	:global(.leaflet-container) {
		font-family: var(--font-body) !important;
		background: var(--bg-deep) !important;
	}
	:global(.leaflet-control-attribution) {
		background: rgba(255, 255, 255, 0.85) !important;
		color: var(--ink-mute) !important;
		font-size: 10px !important;
	}
	:global(.leaflet-control-attribution a) {
		color: var(--ink-soft) !important;
	}
</style>
