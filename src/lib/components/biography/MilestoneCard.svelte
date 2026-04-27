<script lang="ts">
	import MapSnapshot from './MapSnapshot.svelte';
	import PhotoPlaceholder from '../ui/PhotoPlaceholder.svelte';

	type Milestone = {
		id: string;
		year: number;
		title: string;
		body?: string;
		map?: { lat: number; lng: number; zoom?: number; label: string } | null;
		image?: { src: string; alt: string } | null;
	};

	let { milestone, index }: { milestone: Milestone; index: number } = $props();
</script>

<article class="milestone" data-index={index}>
	<div class="year-rail" aria-hidden="true">
		<span class="year-dot"></span>
		<span class="year-line"></span>
	</div>
	<div class="content">
		<span class="year">{milestone.year}</span>
		<h3 class="title">{milestone.title}</h3>
		{#if milestone.body}
			<p class="body">{milestone.body}</p>
		{/if}
		{#if milestone.image}
			<div class="media-slot">
				<PhotoPlaceholder
					src={milestone.image.src}
					alt={milestone.image.alt}
					aspect="16 / 10"
				/>
			</div>
		{:else if milestone.map}
			<div class="media-slot">
				<MapSnapshot
					lat={milestone.map.lat}
					lng={milestone.map.lng}
					zoom={milestone.map.zoom ?? 11}
					label={milestone.map.label}
				/>
			</div>
		{/if}
	</div>
</article>

<style>
	.milestone {
		flex: 0 0 auto;
		width: min(86vw, 420px);
		height: 560px;
		display: flex;
		flex-direction: column;
		gap: var(--space-4);
		background: var(--bg-paper);
		border: 1px solid var(--line-hair);
		border-radius: var(--radius-lg);
		padding: var(--space-8);
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.05),
			0 12px 32px -16px rgba(0, 0, 0, 0.08);
		position: relative;
		overflow: hidden;
	}
	.milestone::before,
	.milestone::after {
		content: '';
		position: absolute;
		width: 12px;
		height: 12px;
		border: 1px solid var(--accent-cyan);
		opacity: 0.55;
		pointer-events: none;
	}
	.milestone::before {
		top: 10px;
		left: 10px;
		border-right: none;
		border-bottom: none;
	}
	.milestone::after {
		bottom: 10px;
		right: 10px;
		border-left: none;
		border-top: none;
	}
	.content {
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		flex: 1;
		min-height: 0;
	}
	.media-slot {
		margin-top: auto;
	}
	.year-rail {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		color: var(--accent-bronze);
	}
	.year-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--accent-cyan);
		box-shadow: 0 0 0 4px rgba(111, 199, 221, 0.18);
	}
	.year-line {
		flex: 1;
		height: 1px;
		background: linear-gradient(90deg, currentColor, transparent);
		opacity: 0.4;
	}
	.year {
		font-family: var(--font-mono, ui-monospace);
		font-size: var(--step-0);
		letter-spacing: 0.2em;
		color: var(--ink-mute);
	}
	.title {
		font-family: var(--font-display);
		font-weight: 400;
		font-size: var(--step-3);
		margin: 0;
		line-height: 1.15;
		letter-spacing: -0.015em;
	}
	.body {
		font-family: var(--font-body);
		font-size: var(--step-0);
		color: var(--ink-soft);
		margin: 0;
		max-width: 44ch;
	}
	@media (max-width: 819px) {
		.milestone {
			width: 100%;
			height: auto;
			min-height: 0;
			padding: var(--space-6);
		}
	}
</style>
