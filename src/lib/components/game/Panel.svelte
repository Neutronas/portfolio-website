<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		id,
		index,
		title,
		subtitle,
		open,
		onclose,
		children
	}: {
		id: string;
		index: string;
		title: string;
		subtitle?: string;
		open: boolean;
		onclose: () => void;
		children: Snippet;
	} = $props();

	let heading: HTMLHeadingElement;
	let body: HTMLDivElement;

	$effect(() => {
		if (open) {
			body.scrollTop = 0;
			heading.focus({ preventScroll: true });
		}
	});
</script>

<section class="panel" class:open {id} aria-labelledby="{id}-title" inert={!open}>
	<header>
		<div class="heading">
			<span class="idx">{index}</span>
			<h2 id="{id}-title" bind:this={heading} tabindex="-1">{title}</h2>
			{#if subtitle}<p class="sub">{subtitle}</p>{/if}
		</div>
		<button class="back" type="button" onclick={onclose}>
			<kbd>Esc</kbd><span>Back</span>
		</button>
	</header>
	<div class="body" bind:this={body}>
		{@render children()}
	</div>
</section>

<style>
	.panel {
		position: fixed;
		top: clamp(16px, 4vh, 40px);
		right: clamp(16px, 3vw, 48px);
		bottom: clamp(16px, 4vh, 40px);
		width: min(640px, calc(100vw - 32px));
		z-index: 6;
		display: flex;
		flex-direction: column;
		background: linear-gradient(160deg, rgba(14, 18, 26, 0.9), rgba(8, 10, 15, 0.94));
		border: 1px solid rgba(111, 199, 221, 0.22);
		box-shadow:
			0 30px 80px -20px rgba(0, 0, 0, 0.8),
			inset 0 1px 0 rgba(255, 255, 255, 0.04);
		backdrop-filter: blur(10px);
		clip-path: polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 22px 100%, 0 calc(100% - 22px));
		color: #d7dee7;
		opacity: 0;
		visibility: hidden;
		transform: translateX(32px);
		transition:
			opacity 260ms ease,
			transform 420ms var(--ease-out),
			visibility 0s linear 420ms;
	}
	.panel.open {
		opacity: 1;
		visibility: visible;
		transform: none;
		transition:
			opacity 260ms ease,
			transform 420ms var(--ease-out),
			visibility 0s;
	}
	header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		padding: 1.6rem 1.75rem 1.1rem;
		border-bottom: 1px solid rgba(111, 199, 221, 0.14);
	}
	.idx {
		font-family: var(--font-game);
		font-size: 0.8rem;
		letter-spacing: 0.2em;
		color: var(--accent-gold);
	}
	h2 {
		margin: 0.1rem 0 0;
		font-family: var(--font-game);
		font-weight: 700;
		font-size: clamp(1.8rem, 1.4rem + 1.5vw, 2.6rem);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #fff;
		outline: none;
	}
	.sub {
		margin: 0.35rem 0 0;
		font-size: 0.9rem;
		color: #8494a7;
	}
	.back {
		flex: none;
		display: inline-flex;
		align-items: center;
		gap: 0.55rem;
		padding: 0.45rem 0.8rem;
		font-family: var(--font-game);
		font-size: 0.8rem;
		font-weight: 600;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: #c7d2de;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 3px;
		cursor: pointer;
	}
	.back:hover {
		color: #fff;
		border-color: var(--accent-cyan);
		box-shadow: 0 0 0 3px rgba(111, 199, 221, 0.18);
	}
	kbd {
		font-family: inherit;
		font-size: 0.7rem;
		padding: 0.1rem 0.35rem;
		border: 1px solid rgba(255, 255, 255, 0.25);
		border-radius: 3px;
		color: #fff;
	}
	.body {
		flex: 1;
		overflow-y: auto;
		overscroll-behavior: contain;
		padding: 1.25rem 1.75rem 2rem;
		scrollbar-width: thin;
		scrollbar-color: rgba(111, 199, 221, 0.35) transparent;
	}
	@media (max-width: 640px) {
		.panel {
			inset: 0;
			width: auto;
			clip-path: none;
			border: 0;
		}
		header {
			padding: 1.1rem 1.1rem 0.9rem;
		}
		.body {
			padding: 1rem 1.1rem 2rem;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.panel,
		.panel.open {
			transform: none;
		}
	}
</style>
