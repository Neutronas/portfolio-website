<script lang="ts">
	import contacts from '$lib/data/contacts.json';
	import ScrollHint from './ui/ScrollHint.svelte';
	import PhotoPlaceholder from './ui/PhotoPlaceholder.svelte';
</script>

<section class="hero">
	<div class="ornament" aria-hidden="true">
		<span class="ornament-line"></span>
		<span class="ornament-dot"></span>
		<span class="ornament-line"></span>
	</div>

	<div class="portrait">
		<PhotoPlaceholder
			src="/img/lukas.jpg"
			alt="Portrait of {contacts.name}"
			aspect="1 / 1"
			icon="portrait"
		/>
	</div>

	<p class="eyebrow">A portfolio in three paths</p>

	<h1 class="name">
		Hi, I'm <span class="highlight">{contacts.name}</span>.
	</h1>

	<p class="tagline">{contacts.tagline}.</p>

	<nav class="social-links" aria-label="Social links">
		{#each contacts.links as link}
			<a href={link.href} target="_blank" rel="noopener" class="social-link">{link.label}</a>
		{/each}
	</nav>

	<div class="scroll-cue">
		<ScrollHint />
	</div>
</section>

<style>
	.hero {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-6);
		padding: var(--space-12) var(--space-6);
		text-align: center;
		background:
			radial-gradient(
				ellipse 90% 55% at 50% 0%,
				rgba(111, 199, 221, 0.12) 0%,
				transparent 60%
			),
			radial-gradient(
				ellipse 70% 40% at 50% 100%,
				rgba(212, 182, 120, 0.05) 0%,
				transparent 70%
			);
	}
	.ornament {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		color: var(--accent-bronze);
		opacity: 0.7;
	}
	.ornament-line {
		width: 48px;
		height: 1px;
		background: currentColor;
	}
	.ornament-dot {
		width: 6px;
		height: 6px;
		background: currentColor;
		border-radius: 50%;
	}
	.eyebrow {
		font-family: var(--font-body);
		font-size: var(--step--1);
		color: var(--ink-mute);
		letter-spacing: 0.3em;
		text-transform: uppercase;
		margin: 0;
	}
	.name {
		font-family: var(--font-display);
		font-weight: 400;
		font-size: var(--step-5);
		line-height: 1.05;
		letter-spacing: -0.02em;
		margin: 0;
		max-width: 16ch;
	}
	.highlight {
		font-style: italic;
		color: var(--ink-deep);
		background-image: linear-gradient(var(--accent-bronze), var(--accent-bronze));
		background-repeat: no-repeat;
		background-position: 0 95%;
		background-size: 100% 4px;
		padding-bottom: 0.05em;
	}
	.tagline {
		font-family: var(--font-body);
		font-size: var(--step-1);
		color: var(--ink-soft);
		margin: 0;
		max-width: 38ch;
	}
	.portrait {
		width: min(180px, 40vw);
		border-radius: 50%;
		overflow: hidden;
	}
	.portrait :global(.placeholder) {
		border-radius: 50%;
	}
	.portrait :global(.photo) {
		border-radius: 50%;
	}
	.social-links {
		display: flex;
		align-items: center;
		gap: var(--space-8);
	}
	.social-link {
		font-family: var(--font-body);
		font-size: var(--step--3);
		letter-spacing: 0.28em;
		text-transform: uppercase;
		color: var(--ink-mute);
		background-image: none;
		transition: color var(--dur-med) var(--ease-out);
	}
	.social-link:hover {
		color: var(--accent-bronze);
	}
	.scroll-cue {
		margin-top: var(--space-12);
	}
	@media (max-width: 640px) {
		.hero {
			gap: var(--space-4);
			padding: var(--space-8) var(--space-4);
		}
		.scroll-cue {
			margin-top: var(--space-8);
		}
	}
</style>
