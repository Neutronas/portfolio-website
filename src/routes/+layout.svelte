<script lang="ts">
	import '@fontsource-variable/fraunces';
	import '@fontsource-variable/inter';
	import '../app.css';
	import PathNav from '$lib/components/PathNav.svelte';

	let { children } = $props();
</script>

<a href="#main" class="skip-link">Skip to content</a>
<PathNav />
{@render children()}

<style>
	:global(main) {
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
