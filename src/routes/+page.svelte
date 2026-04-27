<script lang="ts">
	import { onMount } from 'svelte';
	import contacts from '$lib/data/contacts.json';
	import Hero from '$lib/components/Hero.svelte';
	import PathSelector from '$lib/components/PathSelector.svelte';
	import PathNav from '$lib/components/PathNav.svelte';
	import CareersPath from '$lib/components/careers/CareersPath.svelte';
	import BiographyPath from '$lib/components/biography/BiographyPath.svelte';
	import ProjectsPath from '$lib/components/projects/ProjectsPath.svelte';
	import {
		appState,
		hydrateFromHash,
		attachHashListener
	} from '$lib/stores/path.svelte';

	onMount(() => {
		hydrateFromHash();
		const detach = attachHashListener();
		return detach;
	});
</script>

<script module lang="ts">
	const titles = {
		null: 'a life in three paths',
		careers: 'Careers — the branching timeline',
		biography: 'Biography — time travel',
		projects: 'Projects — everything worth remembering'
	} as const;
</script>

<svelte:head>
	<title>{contacts.name} — {titles[appState.path ?? 'null']}</title>
	<meta
		name="description"
		content="{contacts.name} — {contacts.tagline}. A scroll-driven portfolio told as careers, biography and projects."
	/>
</svelte:head>

<a href="#main" class="skip-link">Skip to content</a>
<PathNav />

<main id="main" tabindex="-1">
	{#if appState.path === null}
		<Hero />
		<PathSelector />
	{:else if appState.path === 'careers'}
		<CareersPath />
	{:else if appState.path === 'biography'}
		<BiographyPath />
	{:else if appState.path === 'projects'}
		<ProjectsPath />
	{/if}
</main>

<style>
	main {
		min-height: 100dvh;
	}
	.skip-link {
		position: absolute;
		top: -40px;
		left: 8px;
		padding: 0.5rem 0.85rem;
		background: var(--bg-paper);
		border: 1px solid var(--accent-bronze);
		border-radius: var(--radius-sm);
		color: var(--ink-deep);
		background-image: none;
		font-family: var(--font-body);
		font-size: var(--step--1);
		letter-spacing: 0.16em;
		text-transform: uppercase;
		z-index: 100;
		transition: top var(--dur-fast) var(--ease-out);
	}
	.skip-link:focus {
		top: 8px;
	}
</style>
