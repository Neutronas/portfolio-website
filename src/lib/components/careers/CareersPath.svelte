<script lang="ts">
	import GitGraph from './GitGraph.svelte';
	import Reveal from '../ui/Reveal.svelte';
	import WhatsNext from '../ending/WhatsNext.svelte';
	import MetalDivider from '../ui/MetalDivider.svelte';
</script>

<section class="careers-path" id="careers-content">
	<header class="intro">
		<Reveal>
			<p class="eyebrow">Careers</p>
			<h2>The branching timeline.</h2>
		</Reveal>
	</header>

	<GitGraph />

	<MetalDivider />

	<WhatsNext path="careers" />
</section>

<style>
	.careers-path {
		padding-top: var(--space-24);
	}
	.intro {
		max-width: 1280px;
		margin: 0 auto var(--space-6);
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
		color: var(--ink-soft);
		max-width: 58ch;
		margin: 0;
	}
	em {
		font-style: italic;
		color: var(--ink-deep);
	}
</style>
