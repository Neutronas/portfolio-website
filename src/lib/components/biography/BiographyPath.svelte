<script lang="ts">
	import { onMount } from 'svelte';
	import biography from '$lib/data/biography.json';
	import { loadGsap, prefersReducedMotion } from '$lib/utils/gsap';
	import MilestoneCard from './MilestoneCard.svelte';
	import Reveal from '../ui/Reveal.svelte';
	import MetalDivider from '../ui/MetalDivider.svelte';
	import WhatsNext from '../ending/WhatsNext.svelte';
	import ScrollHint from '../ui/ScrollHint.svelte';

	let pinEl: HTMLDivElement | null = $state(null);
	let trackEl: HTMLDivElement | null = $state(null);

	onMount(() => {
		window.scrollTo(0, 0);
		if (!pinEl || !trackEl) return;
		const mq = window.matchMedia('(min-width: 820px)');
		if (prefersReducedMotion() || !mq.matches) return;

		let cleanup: () => void = () => {};
		(async () => {
			const gsap = await loadGsap();
			const { ScrollTrigger } = await import('gsap/ScrollTrigger');

			if (!trackEl || !pinEl) return;
			const getScroll = () => {
				if (!trackEl) return 0;
				return trackEl.scrollWidth - window.innerWidth;
			};

			const tween = gsap.to(trackEl, {
				x: () => -getScroll(),
				ease: 'none',
				scrollTrigger: {
					trigger: pinEl,
					pin: true,
					scrub: 0.8,
					anticipatePin: 1,
					end: () => `+=${getScroll()}`,
					invalidateOnRefresh: true
				}
			});

			cleanup = () => {
				tween.scrollTrigger?.kill();
				tween.kill();
				ScrollTrigger.getAll().forEach((s) => s.kill());
			};
		})();

		return () => cleanup();
	});
</script>

<section class="bio-path">
	<header class="intro">
		<Reveal>
			<p class="eyebrow">Biography</p>
			<h2>Time travel, horizontally.</h2>
			<p class="lede">
				Scroll — the years move. Each card is a small chapter: a town, a hobby, a game played
				too many hours, a family.
			</p>
			<div class="hint"><ScrollHint label="Keep scrolling" /></div>
		</Reveal>
	</header>

	<div class="pin" bind:this={pinEl}>
		<div class="track" bind:this={trackEl}>
			{#each biography.milestones as m, i (m.id)}
				<MilestoneCard milestone={m} index={i} />
			{/each}
			<div class="end-spacer" aria-hidden="true">
				<span class="arrow">→</span>
				<span>The story continues…</span>
			</div>
		</div>
	</div>

	<MetalDivider />

	<WhatsNext path="biography" />
</section>

<style>
	.bio-path {
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
		max-width: 56ch;
		margin: 0;
	}
	.hint {
		margin-top: var(--space-8);
	}
	.pin {
		height: 100vh;
		display: flex;
		align-items: center;
		overflow: hidden;
		background:
			radial-gradient(
				ellipse 60% 50% at 50% 50%,
				rgba(111, 199, 221, 0.07) 0%,
				transparent 70%
			);
	}
	.track {
		display: flex;
		align-items: center;
		gap: var(--space-8);
		padding: 0 12vw;
		will-change: transform;
	}
	.end-spacer {
		flex: 0 0 auto;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-3);
		padding: 0 var(--space-12);
		color: var(--ink-mute);
		font-family: var(--font-body);
		font-size: var(--step--1);
		letter-spacing: 0.22em;
		text-transform: uppercase;
	}
	.arrow {
		font-size: var(--step-4);
		color: var(--accent-bronze);
		font-family: var(--font-display);
	}

	@media (max-width: 819px) {
		.pin {
			height: auto;
			overflow: visible;
			padding: var(--space-8) 0;
		}
		.track {
			flex-direction: column;
			align-items: stretch;
			gap: var(--space-5);
			padding: 0 var(--space-4);
			transform: none !important;
		}
		.end-spacer {
			padding: var(--space-6) 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.pin {
			height: auto;
			overflow: visible;
			padding: var(--space-8) 0;
		}
		.track {
			flex-direction: column;
			align-items: stretch;
			gap: var(--space-5);
			padding: 0 var(--space-4);
			transform: none !important;
		}
	}
</style>
