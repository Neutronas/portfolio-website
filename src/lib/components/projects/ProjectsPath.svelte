<script lang="ts">
	import { onMount } from 'svelte';
	import projects from '$lib/data/projects.json';
	import ProjectCard from './ProjectCard.svelte';
	import Reveal from '../ui/Reveal.svelte';
	import MetalDivider from '../ui/MetalDivider.svelte';
	import WhatsNext from '../ending/WhatsNext.svelte';

	const orderedProjects = [...projects.projects].sort((a, b) => b.year - a.year);
	const total = orderedProjects.length;

	let railEl: HTMLDivElement | null = $state(null);
	let current = $state(0);

	function scrollToIndex(i: number) {
		if (!railEl) return;
		const clamped = Math.max(0, Math.min(total - 1, i));
		const child = railEl.children[clamped] as HTMLElement | undefined;
		if (!child) return;
		const offset =
			child.offsetLeft - (railEl.clientWidth - child.clientWidth) / 2;
		railEl.scrollTo({ left: offset, behavior: 'smooth' });
	}

	function next() {
		scrollToIndex(current + 1);
	}
	function prev() {
		scrollToIndex(current - 1);
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === 'ArrowRight') {
			next();
			e.preventDefault();
		} else if (e.key === 'ArrowLeft') {
			prev();
			e.preventDefault();
		}
	}

	onMount(() => {
		if (!railEl) return;

		const update = () => {
			if (!railEl) return;
			const center = railEl.scrollLeft + railEl.clientWidth / 2;
			let closest = 0;
			let best = Infinity;
			for (let i = 0; i < railEl.children.length; i++) {
				const child = railEl.children[i] as HTMLElement;
				const childCenter = child.offsetLeft + child.clientWidth / 2;
				const d = Math.abs(childCenter - center);
				if (d < best) {
					best = d;
					closest = i;
				}
			}
			current = closest;
		};

		railEl.addEventListener('scroll', update, { passive: true });
		update();
		return () => railEl?.removeEventListener('scroll', update);
	});
</script>

<svelte:window onkeydown={onKey} />

<section class="projects-path">
	<header class="intro">
		<Reveal>
			<p class="eyebrow">Projects</p>
			<h2>Everything worth remembering.</h2>
			<p class="lede">
				From a teenager's gaming servers to AI-powered SaaS — scroll, swipe, or use the arrow
				keys to walk through them.
			</p>
		</Reveal>
	</header>

	<div class="carousel">
		<div class="rail" bind:this={railEl}>
			{#each orderedProjects as p, i (p.id)}
				<ProjectCard project={p} index={i} {total} />
			{/each}
		</div>

		<div class="controls" aria-label="Carousel controls">
			<button class="ctrl" onclick={prev} disabled={current === 0} aria-label="Previous project">
				<svg viewBox="0 0 16 10">
					<path
						d="M15 5 H2 M6 1 L2 5 L6 9"
						fill="none"
						stroke="currentColor"
						stroke-width="1.25"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>

			<div class="progress" aria-hidden="true">
				{#each orderedProjects as _, i}
					<button
						class="dot"
						class:active={i === current}
						onclick={() => scrollToIndex(i)}
						aria-label="Go to project {i + 1}"
					></button>
				{/each}
			</div>

			<button
				class="ctrl"
				onclick={next}
				disabled={current === total - 1}
				aria-label="Next project"
			>
				<svg viewBox="0 0 16 10">
					<path
						d="M1 5 H14 M10 1 L14 5 L10 9"
						fill="none"
						stroke="currentColor"
						stroke-width="1.25"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
		</div>
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
		margin: 0 auto var(--space-16);
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
	.carousel {
		display: flex;
		flex-direction: column;
		gap: var(--space-8);
		padding-bottom: var(--space-8);
	}
	.rail {
		display: flex;
		gap: var(--space-6);
		padding: 0 max(var(--space-6), calc((100vw - 560px) / 2));
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		scroll-padding: 0 max(var(--space-6), calc((100vw - 560px) / 2));
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
	}
	.rail::-webkit-scrollbar {
		display: none;
	}
	.controls {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-4);
		padding: 0 var(--space-6);
	}
	.ctrl {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		border: 1px solid var(--line-hair);
		background: var(--bg-paper);
		color: var(--ink-deep);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		transition:
			border-color var(--dur-med) var(--ease-out),
			color var(--dur-med) var(--ease-out),
			opacity var(--dur-med) var(--ease-out);
	}
	.ctrl svg {
		width: 16px;
		height: 10px;
	}
	.ctrl:hover:not(:disabled) {
		border-color: var(--accent-bronze);
		color: var(--accent-bronze);
	}
	.ctrl:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}
	.progress {
		display: inline-flex;
		gap: 0.4rem;
		align-items: center;
	}
	.dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		border: 0;
		padding: 0;
		background: var(--line-hair);
		cursor: pointer;
		transition:
			background var(--dur-fast) var(--ease-out),
			transform var(--dur-fast) var(--ease-out);
	}
	.dot.active {
		background: var(--accent-bronze);
		transform: scale(1.35);
	}
	@media (max-width: 640px) {
		.rail {
			padding: 0 var(--space-4);
			scroll-padding: 0 var(--space-4);
		}
	}
</style>
