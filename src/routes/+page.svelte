<script lang="ts">
	import '@fontsource-variable/oxanium';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { pushState, replaceState } from '$app/navigation';
	import contacts from '$lib/data/contacts.json';
	import Scene from '$lib/components/game/Scene.svelte';
	import MainMenu from '$lib/components/game/MainMenu.svelte';
	import Panel from '$lib/components/game/Panel.svelte';
	import CareerLog from '$lib/components/game/CareerLog.svelte';
	import ProjectGrid from '$lib/components/game/ProjectGrid.svelte';
	import BioTimeline from '$lib/components/game/BioTimeline.svelte';
	import ContactCard from '$lib/components/game/ContactCard.svelte';
	import { menuItems, previews, isPanel, type ItemId, type PanelId } from '$lib/game/content';

	let selected: ItemId | null = $state(null);
	let hover3d: ItemId | null = $state(null);
	let deepLink: PanelId | null = $state(null);
	let ready = $state(false);
	let flat = $state(false);
	let links: HTMLAnchorElement[] = $state([]);
	let tip = $state({ x: 0, y: 0 });

	const openId: PanelId | null = $derived((page.state.panel as PanelId | undefined) ?? deepLink);
	const preview = $derived(selected ? previews[selected] : null);
	const [first, ...rest] = contacts.name.split(' ');
	const last = rest.join(' ');
	const itemOf = (id: string) => menuItems.find((m) => m.id === id);
	const indexOf = (id: string) => String(menuItems.findIndex((m) => m.id === id) + 1).padStart(2, '0');

	onMount(() => {
		const h = location.hash.slice(1);
		if (isPanel(h)) deepLink = selected = h;
		// Never hang on the loader if the scene is slow to start.
		const t = setTimeout(() => (ready = true), 6000);
		return () => clearTimeout(t);
	});

	function openPanel(id: PanelId) {
		if (openId === id) return;
		deepLink = null;
		if (page.state.panel) replaceState(`#${id}`, { panel: id });
		else pushState(`#${id}`, { panel: id });
	}

	function closePanel() {
		const was = openId;
		if (!was) return;
		if (page.state.panel) history.back();
		else {
			deepLink = null;
			replaceState(location.pathname + location.search, {});
		}
		const i = menuItems.findIndex((m) => m.id === was);
		links[i]?.focus({ preventScroll: true });
	}

	function activate(id: ItemId) {
		selected = id;
		if (isPanel(id)) openPanel(id);
	}

	/** Clicks on 3D objects: panels open in place, external links in a new tab. */
	function activateFromScene(id: string) {
		const item = itemOf(id);
		if (!item) return;
		selected = item.id;
		if (item.external) window.open(item.href, '_blank', 'noopener');
		else if (isPanel(item.id)) openPanel(item.id);
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
		if (e.key === 'Escape' && openId) {
			e.preventDefault();
			closePanel();
			return;
		}
		if ((e.target as HTMLElement | null)?.closest?.('.panel')) return;
		if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
			e.preventDefault();
			const n = menuItems.length;
			const cur = selected ? menuItems.findIndex((m) => m.id === selected) : -1;
			const step = e.key === 'ArrowDown' ? 1 : -1;
			const next = cur < 0 ? (step > 0 ? 0 : n - 1) : (cur + step + n) % n;
			links[next]?.focus();
		} else if (e.key === 'Enter' && selected) {
			const t = e.target as HTMLElement | null;
			if (t?.closest('a, button')) return; // native activation already happens
			e.preventDefault();
			links[menuItems.findIndex((m) => m.id === selected)]?.click();
		}
	}
</script>

<svelte:head>
	<title>Lukas Ružauskas - Software Developer, Systems Analyst & AI Product Engineer</title>
	<meta
		name="description"
		content="Portfolio of Lukas Ružauskas (Lukas Ruzauskas) - software developer, systems analyst and AI product engineer based in Kaunas, Lithuania."
	/>
	<meta
		name="keywords"
		content="Lukas Ruzauskas, Lukas Ružauskas, Ruzauskas, Ružauskas, software developer, systems analyst, AI product engineer, Lithuania, Kaunas, portfolio"
	/>
	<meta name="theme-color" content="#08090c" />
	<link rel="canonical" href="https://ruzauskas.lt/" />
</svelte:head>

<svelte:window
	{onkeydown}
	onpointermove={(e) => (tip = { x: e.clientX, y: e.clientY })}
/>

<main id="main" class="game" class:flat class:panel-open={!!openId} tabindex="-1">
	<Scene
		{selected}
		{preview}
		panelOpen={!!openId}
		onhover={(id) => {
			hover3d = (id as ItemId) ?? null;
			if (id) selected = id as ItemId;
		}}
		onselect={activateFromScene}
		onready={(ok) => {
			flat = !ok;
			ready = true;
		}}
	/>

	<div class="shade" aria-hidden="true"></div>
	<div class="grain" aria-hidden="true"></div>

	<header class="brand" class:visible={ready}>
		<p class="eyebrow">Portfolio <span aria-hidden="true">//</span> Kaunas, LT</p>
		<h1><span class="first">{first}</span> <span class="last">{last}</span></h1>
		<p class="tagline">{contacts.tagline}</p>
	</header>

	<MainMenu
		items={menuItems}
		{selected}
		active={openId}
		visible={ready}
		bind:links
		onselect={(id) => (selected = id)}
		onactivate={activate}
	/>

	<footer class="hints" class:visible={ready} aria-hidden="true">
		<span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
		<span><kbd>Enter</kbd> Select</span>
		<span><kbd>Esc</kbd> Back</span>
	</footer>

	{#if hover3d && !openId}
		<div class="tip" style="left: {tip.x}px; top: {tip.y}px" aria-hidden="true">
			<span>{itemOf(hover3d)?.label}</span>
			{#if itemOf(hover3d)?.external}↗{:else}↵{/if}
		</div>
	{/if}

	<Panel id="career" index={indexOf('career')} title="Career" subtitle="Quest log — current first" open={openId === 'career'} onclose={closePanel}>
		<CareerLog />
	</Panel>
	<Panel id="projects" index={indexOf('projects')} title="Projects" subtitle="Things I built, ran or shipped" open={openId === 'projects'} onclose={closePanel}>
		<ProjectGrid />
	</Panel>
	<Panel id="biography" index={indexOf('biography')} title="Biography" subtitle="The story so far" open={openId === 'biography'} onclose={closePanel}>
		<BioTimeline />
	</Panel>
	<Panel id="contact" index={indexOf('contact')} title="Contact" open={openId === 'contact'} onclose={closePanel}>
		<ContactCard />
	</Panel>

	<div class="loader" class:done={ready} aria-hidden="true">
		<p class="loading">Loading</p>
		<div class="bar"><span></span></div>
		<p class="loader-tip">Tip: the mug is watching you.</p>
	</div>
</main>

<style>
	:global(html:has(.game)),
	:global(body:has(.game)) {
		background: #08090c;
		overflow: hidden;
		overscroll-behavior: none;
	}
	.game {
		--font-game: 'Oxanium Variable', 'Oxanium', var(--font-body);
		position: fixed;
		inset: 0;
		overflow: hidden;
		color: #e6ebf1;
		background: radial-gradient(ellipse at 60% 40%, #141a24, #08090c 70%);
		outline: none;
	}
	.game :global(a) {
		background-image: none;
		color: inherit;
	}
	.game :global(p) {
		max-width: none;
	}

	/* Legibility + mood overlays */
	.shade {
		position: fixed;
		inset: 0;
		pointer-events: none;
		background:
			radial-gradient(ellipse 60% 70% at 0% 100%, rgba(5, 6, 9, 0.85), transparent 70%),
			radial-gradient(ellipse 50% 40% at 0% 0%, rgba(5, 6, 9, 0.7), transparent 70%),
			radial-gradient(ellipse 120% 90% at 50% 50%, transparent 55%, rgba(0, 0, 0, 0.55));
		transition: background-color 400ms ease;
	}
	.panel-open .shade {
		background-color: rgba(4, 5, 8, 0.35);
	}
	.grain {
		position: fixed;
		inset: -50%;
		pointer-events: none;
		opacity: 0.07;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
		mix-blend-mode: overlay;
	}

	.brand {
		position: fixed;
		top: clamp(20px, 5vh, 56px);
		left: clamp(20px, 4.5vw, 72px);
		z-index: 4;
		max-width: min(560px, calc(100vw - 40px));
		opacity: 0;
		transform: translateY(-10px);
		transition:
			opacity 700ms ease,
			transform 800ms var(--ease-out);
		pointer-events: none;
	}
	.brand.visible {
		opacity: 1;
		transform: none;
	}
	.eyebrow {
		margin: 0 0 0.6rem;
		font-family: var(--font-game);
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: 0.32em;
		text-transform: uppercase;
		color: var(--accent-cyan);
	}
	.eyebrow span {
		color: rgba(255, 255, 255, 0.3);
	}
	h1 {
		margin: 0;
		font-family: var(--font-game);
		font-weight: 800;
		font-size: clamp(2.1rem, 1.4rem + 3.2vw, 4.4rem);
		line-height: 0.95;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: #fff;
		text-shadow: 0 2px 30px rgba(0, 0, 0, 0.6);
	}
	h1 .last {
		display: block;
		color: transparent;
		-webkit-text-stroke: 1.5px rgba(255, 255, 255, 0.9);
	}
	.tagline {
		margin: 0.9rem 0 0;
		font-size: clamp(0.85rem, 0.8rem + 0.25vw, 1rem);
		letter-spacing: 0.02em;
		color: #9aa8b8;
	}

	.hints {
		position: fixed;
		right: clamp(20px, 3vw, 48px);
		bottom: clamp(18px, 4vh, 36px);
		z-index: 4;
		display: flex;
		gap: 1.4rem;
		font-family: var(--font-game);
		font-size: 0.72rem;
		font-weight: 600;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: rgba(220, 228, 238, 0.55);
		opacity: 0;
		transition: opacity 600ms ease 900ms;
	}
	.hints.visible {
		opacity: 1;
	}
	.panel-open .hints {
		opacity: 0;
		transition-delay: 0s;
	}
	kbd {
		display: inline-block;
		min-width: 1.6em;
		margin-right: 0.3em;
		padding: 0.12em 0.4em;
		font-family: inherit;
		font-size: 0.95em;
		text-align: center;
		color: #fff;
		border: 1px solid rgba(255, 255, 255, 0.28);
		border-bottom-width: 2px;
		border-radius: 3px;
	}

	.tip {
		position: fixed;
		z-index: 7;
		transform: translate(16px, 14px);
		padding: 0.3rem 0.6rem;
		font-family: var(--font-game);
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: #0b0e14;
		background: var(--accent-cyan);
		pointer-events: none;
		clip-path: polygon(0 0, 100% 0, 100% 100%, 8px 100%, 0 calc(100% - 8px));
	}
	.tip span {
		margin-right: 0.4em;
	}

	.loader {
		position: fixed;
		inset: 0;
		z-index: 20;
		display: grid;
		place-content: center;
		justify-items: center;
		gap: 0.9rem;
		background: #07080b;
		transition:
			opacity 700ms ease,
			visibility 0s linear 700ms;
	}
	.loader.done {
		opacity: 0;
		visibility: hidden;
	}
	.loading {
		margin: 0;
		font-family: var(--font-game);
		font-weight: 700;
		font-size: 0.9rem;
		letter-spacing: 0.5em;
		text-transform: uppercase;
		color: #fff;
	}
	.bar {
		width: 180px;
		height: 2px;
		background: rgba(255, 255, 255, 0.1);
		overflow: hidden;
	}
	.bar span {
		display: block;
		width: 40%;
		height: 100%;
		background: var(--accent-cyan);
		box-shadow: 0 0 10px var(--accent-cyan);
		animation: load 1.1s ease-in-out infinite;
	}
	@keyframes load {
		from {
			transform: translateX(-100%);
		}
		to {
			transform: translateX(250%);
		}
	}
	.loader-tip {
		margin: 0.6rem 0 0;
		font-size: 0.8rem;
		color: #6c7a8b;
	}

	@media (hover: none), (max-width: 760px) {
		.hints {
			display: none;
		}
	}
	@media (max-width: 760px) and (orientation: portrait) {
		.brand {
			top: 18px;
		}
		.eyebrow {
			font-size: 0.68rem;
			margin-bottom: 0.4rem;
		}
		.tagline {
			margin-top: 0.5rem;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.bar span {
			animation: none;
			width: 100%;
		}
	}
</style>
