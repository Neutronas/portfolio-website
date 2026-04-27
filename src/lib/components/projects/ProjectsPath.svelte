<script lang="ts">
	import projects from '$lib/data/projects.json';
	import ProjectCard from './ProjectCard.svelte';
	import Reveal from '../ui/Reveal.svelte';
	import MetalDivider from '../ui/MetalDivider.svelte';
	import WhatsNext from '../ending/WhatsNext.svelte';

	const orderedProjects = [...projects.projects].sort((a, b) => b.year - a.year);
	const total = orderedProjects.length;
</script>

<section class="projects-path">
	<header class="intro">
		<Reveal>
			<p class="eyebrow">Projects</p>
			<h2>Everything worth remembering.</h2>
			<p class="lede">
				From a teenager's gaming servers to AI-powered SaaS.
			</p>
		</Reveal>
	</header>

	<div class="grid">
		{#each orderedProjects as p, i (p.id)}
			<ProjectCard project={p} index={i} {total} />
		{/each}
	</div>

	<MetalDivider />

	<WhatsNext path="projects" />
</section>

<style>
	.projects-path {
		padding-top: var(--space-24);
	}
	.intro {
		max-width: 760px;
		margin: 0 auto var(--space-12);
		padding: 0 var(--space-6);
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}
	.eyebrow {
		font-family: var(--font-body);
		font-size: var(--step--1);
		color: var(--ink-mute);
		letter-spacing: 0.3em;
		text-transform: uppercase;
		margin: 0 0 var(--space-3);
	}
	h2 {
		font-family: var(--font-display);
		font-weight: 400;
		font-size: var(--step-4);
		margin: 0 0 var(--space-4);
		letter-spacing: -0.02em;
	}
	.lede {
		font-family: var(--font-body);
		font-size: var(--step-1);
		color: var(--ink-soft);
		max-width: 58ch;
		margin: 0;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-6);
		padding: 0 var(--space-6);
		max-width: 1280px;
		margin: 0 auto var(--space-8);
	}
	@media (max-width: 900px) {
		.grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}
	@media (max-width: 560px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
