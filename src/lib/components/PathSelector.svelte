<script lang="ts">
	import type { Path } from '$lib/stores/path.svelte';
	import Reveal from './ui/Reveal.svelte';

	type Option = {
		id: Path;
		label: string;
		kicker: string;
		description: string;
		glyph: string;
	};

	const options: Option[] = [
		{
			id: 'careers',
			label: 'Careers',
			kicker: 'the git graph',
			description:
				'A branching timeline of jobs and studies - some running in parallel, some merging back in.',
			glyph: 'careers'
		},
		{
			id: 'biography',
			label: 'Biography',
			kicker: 'time travel',
			description:
				'A horizontal trip through the milestones - towns, hobbies, the eSports years, family.',
			glyph: 'biography'
		},
		{
			id: 'projects',
			label: 'Projects',
			kicker: 'the work',
			description:
				'Every project worth remembering - from gaming servers to AI-powered SaaS.',
			glyph: 'projects'
		}
	];
</script>

<section class="path-selector" id="paths">
	<Reveal>
		<header class="heading">
			<p class="eyebrow">Choose a path</p>
			<h2>Three ways in. Pick any.</h2>
			<p class="lede">
				Every path ends with the same question - but answers it differently. You can come back and
				pick another whenever you like.
			</p>
		</header>
	</Reveal>

	<div class="cards">
		{#each options as opt, i (opt.id)}
			<Reveal delay={120 + i * 100}>
				<a
					href="/{opt.id}/"
					class="card"
					aria-label="Choose the {opt.label} path"
				>
					<span class="glyph" aria-hidden="true">
						{#if opt.glyph === 'careers'}
							<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.25">
								<circle cx="12" cy="12" r="3" />
								<circle cx="12" cy="36" r="3" />
								<circle cx="36" cy="24" r="3" />
								<path d="M12 15 V33" />
								<path d="M12 18 Q24 24 33 24" />
								<path d="M12 30 Q24 24 33 24" />
							</svg>
						{:else if opt.glyph === 'biography'}
							<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.25">
								<path d="M4 24 H44" />
								<circle cx="10" cy="24" r="2.5" />
								<circle cx="24" cy="24" r="2.5" />
								<circle cx="38" cy="24" r="2.5" />
								<path d="M10 18 V14" />
								<path d="M24 30 V34" />
								<path d="M38 18 V14" />
							</svg>
						{:else}
							<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.25">
								<rect x="6" y="10" width="14" height="14" rx="1.5" />
								<rect x="28" y="10" width="14" height="14" rx="1.5" />
								<rect x="6" y="28" width="14" height="14" rx="1.5" />
								<rect x="28" y="28" width="14" height="14" rx="1.5" />
							</svg>
						{/if}
					</span>
					<span class="kicker">{opt.kicker}</span>
					<span class="label">{opt.label}</span>
					<span class="description">{opt.description}</span>
					<span class="cta" aria-hidden="true">
						Enter
						<svg viewBox="0 0 16 10" class="arrow">
							<path
								d="M1 5 H14 M10 1 L14 5 L10 9"
								fill="none"
								stroke="currentColor"
								stroke-width="1.25"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</span>
				</a>
			</Reveal>
		{/each}
	</div>
</section>

<style>
	.path-selector {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: var(--space-16) var(--space-6);
		max-width: 1200px;
		margin: 0 auto;
		gap: var(--space-12);
	}
	.heading {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-3);
	}
	.eyebrow {
		font-family: var(--font-body);
		font-size: var(--step--1);
		color: var(--ink-mute);
		letter-spacing: 0.3em;
		text-transform: uppercase;
		margin: 0;
	}
	h2 {
		font-family: var(--font-display);
		font-weight: 400;
		font-size: var(--step-4);
		margin: 0;
		max-width: 18ch;
	}
	.lede {
		font-family: var(--font-body);
		color: var(--ink-soft);
		max-width: 46ch;
		margin: 0;
	}
	.cards {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-6);
	}
	.card {
		text-align: left;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		padding: var(--space-8);
		background: var(--bg-paper);
		background-image: none;
		border: 1px solid var(--line-hair);
		border-radius: var(--radius-lg);
		color: var(--ink-deep);
		cursor: pointer;
		text-decoration: none;
		transition:
			transform var(--dur-med) var(--ease-out),
			border-color var(--dur-med) var(--ease-out),
			box-shadow var(--dur-med) var(--ease-out);
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.05),
			0 12px 32px -16px rgba(0, 0, 0, 0.08);
		position: relative;
		overflow: hidden;
	}
	.card::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, rgba(111, 199, 221, 0.06), transparent 40%);
		pointer-events: none;
		opacity: 0;
		transition: opacity var(--dur-med) var(--ease-out);
	}
	.card:hover {
		transform: translateY(-4px);
		border-color: var(--accent-cyan);
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.06),
			0 20px 44px -16px rgba(0, 0, 0, 0.12),
			0 0 0 1px var(--accent-cyan-glow);
	}
	.card:hover::before {
		opacity: 1;
	}
	.card:hover .arrow {
		transform: translateX(4px);
	}
	.glyph {
		width: 56px;
		height: 56px;
		color: var(--accent-bronze);
		margin-bottom: var(--space-2);
	}
	.glyph :global(svg) {
		width: 100%;
		height: 100%;
	}
	.kicker {
		font-family: var(--font-body);
		font-size: var(--step--1);
		color: var(--ink-mute);
		letter-spacing: 0.22em;
		text-transform: uppercase;
	}
	.label {
		font-family: var(--font-display);
		font-weight: 400;
		font-size: var(--step-3);
		line-height: 1.1;
		letter-spacing: -0.01em;
	}
	.description {
		font-family: var(--font-body);
		color: var(--ink-soft);
		font-size: var(--step-0);
	}
	.cta {
		margin-top: var(--space-4);
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		font-family: var(--font-body);
		font-size: var(--step--1);
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--accent-bronze);
	}
	.arrow {
		width: 16px;
		height: 10px;
		transition: transform var(--dur-med) var(--ease-out);
	}
	@media (max-width: 900px) {
		.cards {
			grid-template-columns: 1fr;
		}
		.path-selector {
			padding: var(--space-12) var(--space-4);
			gap: var(--space-8);
		}
	}
</style>
