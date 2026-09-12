<script lang="ts">
	import '@fontsource-variable/oxanium';
	import oxaniumLatin from '@fontsource-variable/oxanium/files/oxanium-latin-wght-normal.woff2?url';
	import interLatin from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url';
	import { base } from '$app/paths';
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
	import ResumeViewer from '$lib/components/game/ResumeViewer.svelte';
	import { loadPdf } from '$lib/game/pdf';
	import {
		allItems,
		indexOf,
		menuItems,
		previews,
		isPanel,
		milestones,
		resumeFile,
		type ItemId,
		type PanelId
	} from '$lib/game/content';

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
	const itemOf = (id: string) => allItems.find((m) => m.id === id);

	// ---- Search / social metadata (single source for the home page) ----
	const SITE = 'https://ruzauskas.lt/';
	const title = 'Lukas Ružauskas — AI Product Engineer & Agentic Coding';
	const description =
		'Lukas Ružauskas (Lukas Ruzauskas) — AI product engineer and software developer in Kaunas, Lithuania. Agentic coding, AI-powered tools and full-stack apps.';
	const jsonLd = JSON.stringify({
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebSite',
				'@id': `${SITE}#website`,
				url: SITE,
				name: contacts.name,
				alternateName: ['Lukas Ruzauskas', 'ruzauskas.lt'],
				inLanguage: 'en'
			},
			{
				'@type': 'ProfilePage',
				'@id': `${SITE}#profile`,
				url: SITE,
				name: title,
				description,
				isPartOf: { '@id': `${SITE}#website` },
				dateModified: '2026-09-12',
				mainEntity: { '@id': `${SITE}#person` }
			},
			{
				'@type': 'Person',
				'@id': `${SITE}#person`,
				name: contacts.name,
				alternateName: ['Lukas Ruzauskas', 'Ružauskas', 'Ruzauskas'],
				url: SITE,
				image: `${SITE}img/lukas.jpg`,
				email: `mailto:${contacts.email}`,
				jobTitle: ['AI Product Engineer', 'Software Developer', 'Systems Analyst', 'Product Owner'],
				description:
					'AI product engineer and software developer building AI-powered tools and full-stack apps with agentic coding. Product Owner / Systems Analyst for CATIA Magic at Dassault Systèmes.',
				knowsAbout: [
					'Agentic Coding',
					'AI Product Engineering',
					'AI Agents',
					'Software Development',
					'Systems Analysis',
					'Product Management',
					'MBSE',
					'SysML',
					'CATIA Magic',
					'MagicDraw'
				],
				worksFor: { '@type': 'Organization', name: 'Dassault Systèmes' },
				nationality: 'Lithuanian',
				address: { '@type': 'PostalAddress', addressLocality: 'Kaunas', addressCountry: 'LT' },
				sameAs: contacts.links.map((l) => l.href)
			}
		]
	}).replace(/</g, '\\u003c');

	// Warm up the resume viewer as soon as someone points at "Resume".
	$effect(() => {
		if (selected === 'resume') void loadPdf(`${base}/${resumeFile}`);
	});

	onMount(() => {
		const h = location.hash.slice(1);
		if (isPanel(h)) deepLink = selected = h;
		// Never keep the loading hint forever if the scene is slow to start.
		const t = setTimeout(() => (ready = true), 12000);
		return () => clearTimeout(t);
	});

	/** Once the scene is up, quietly fetch what the panels and links will need. */
	function prefetchRest() {
		const idle = window.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 300));
		idle(() => {
			for (const m of milestones) {
				if (m.image) new Image().src = `${base}${m.image.src}`;
			}
			const link = document.createElement('link');
			link.rel = 'prefetch';
			link.href = `${base}/${resumeFile}`;
			document.head.append(link);
		});
	}

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
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta
		name="keywords"
		content="Lukas Ruzauskas, Lukas Ružauskas, AI Product Engineer, Agentic Coding, software developer, systems analyst, Kaunas, Lithuania"
	/>
	<meta name="theme-color" content="#08090c" />
	<link rel="canonical" href={SITE} />
	<meta property="og:type" content="profile" />
	<meta property="og:site_name" content={contacts.name} />
	<meta property="og:url" content={SITE} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content="{SITE}img/lukas.jpg" />
	<meta property="og:locale" content="en_US" />
	<meta property="profile:first_name" content="Lukas" />
	<meta property="profile:last_name" content="Ružauskas" />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content="{SITE}img/lukas.jpg" />
	{@html `<script type="application/ld+json">${jsonLd}</script>`}
	<link rel="preload" href={oxaniumLatin} as="font" type="font/woff2" crossorigin="anonymous" />
	<link rel="preload" href={interLatin} as="font" type="font/woff2" crossorigin="anonymous" />
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
			if (ok) prefetchRest();
		}}
	/>

	<div class="shade" aria-hidden="true"></div>
	<div class="grain" aria-hidden="true"></div>

	<header class="brand">
		<p class="eyebrow">{contacts.focus} <span aria-hidden="true">//</span> Kaunas, LT</p>
		<h1><span class="first">{first}</span> <span class="last">{last}</span></h1>
		<p class="tagline">{contacts.tagline}</p>
	</header>

	<MainMenu
		items={menuItems}
		{selected}
		active={openId}
		bind:links
		onselect={(id) => (selected = id)}
		onactivate={activate}
	/>

	<footer class="hints" aria-hidden="true">
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

	<Panel id="career" index={indexOf('career')} title="Career" open={openId === 'career'} onclose={closePanel}>
		<CareerLog />
	</Panel>
	<Panel id="projects" index={indexOf('projects')} title="Projects" open={openId === 'projects'} onclose={closePanel}>
		<ProjectGrid />
	</Panel>
	<Panel id="resume" index={indexOf('resume')} title="Resume" wide open={openId === 'resume'} onclose={closePanel}>
		<ResumeViewer active={openId === 'resume'} />
	</Panel>
	<Panel id="contact" index={indexOf('contact')} title="Contact" open={openId === 'contact'} onclose={closePanel}>
		<ContactCard />
	</Panel>
	<Panel id="biography" index="Secret chapter" title="Biography" subtitle="You found the photo — here's the story so far" open={openId === 'biography'} onclose={closePanel}>
		<BioTimeline />
	</Panel>

	<div class="loader" class:done={ready} aria-hidden="true">
		<p class="loading">Loading scene</p>
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
		animation: brand-in 800ms var(--ease-out) both;
		pointer-events: none;
	}
	@keyframes brand-in {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
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
		animation: fade-in 600ms ease 700ms both;
		transition: opacity 300ms ease;
	}
	@keyframes fade-in {
		from {
			opacity: 0;
		}
	}
	.panel-open .hints {
		opacity: 0;
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

	/* Small hint over where the desk will appear; UI is usable meanwhile. */
	.loader {
		position: fixed;
		left: 50%;
		top: 50%;
		z-index: 3;
		display: grid;
		justify-items: center;
		gap: 0.7rem;
		transform: translate(10vw, -50%);
		pointer-events: none;
		animation: fade-in 400ms ease 300ms both;
		transition:
			opacity 500ms ease,
			visibility 0s linear 500ms;
	}
	.loader.done {
		opacity: 0;
		visibility: hidden;
	}
	.loading {
		margin: 0;
		font-family: var(--font-game);
		font-weight: 700;
		font-size: 0.75rem;
		letter-spacing: 0.4em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.8);
	}
	.bar {
		width: 160px;
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
		margin: 0.3rem 0 0;
		font-size: 0.75rem;
		color: #6c7a8b;
	}

	@media (hover: none), (max-width: 760px) {
		.hints {
			display: none;
		}
	}
	@media (max-width: 1000px) and (orientation: portrait) {
		.loader {
			transform: translate(-50%, -80%);
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
		.brand,
		.hints,
		.loader {
			animation: none;
		}
		.bar span {
			animation: none;
			width: 100%;
		}
	}
</style>
