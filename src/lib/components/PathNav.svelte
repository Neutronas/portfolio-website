<script lang="ts">
	import { appState, resetPath } from '$lib/stores/path.svelte';

	const labels: Record<string, string> = {
		careers: 'Careers',
		biography: 'Biography',
		projects: 'Projects'
	};
</script>

{#if appState.path}
	<nav class="path-nav" aria-label="Path navigation">
		<button class="back" onclick={resetPath}>
			<svg viewBox="0 0 16 10" class="arrow">
				<path
					d="M15 5 H2 M6 1 L2 5 L6 9"
					fill="none"
					stroke="currentColor"
					stroke-width="1.25"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
			<span>Paths</span>
		</button>
		<span class="crumb">
			<span class="crumb-label">You are on</span>
			<span class="crumb-path">{labels[appState.path]}</span>
		</span>
	</nav>
{/if}

<style>
	.path-nav {
		position: fixed;
		top: var(--space-4);
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: var(--space-4);
		padding: 0.5rem 0.75rem 0.5rem 0.5rem;
		background: color-mix(in oklab, var(--bg-paper) 92%, transparent);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border: 1px solid var(--line-hair);
		border-radius: 999px;
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.06),
			0 8px 24px -12px rgba(0, 0, 0, 0.1);
		z-index: 50;
		font-family: var(--font-body);
		font-size: var(--step--1);
	}
	.back {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.35rem 0.85rem;
		border-radius: 999px;
		border: 1px solid transparent;
		background: transparent;
		color: var(--ink-deep);
		cursor: pointer;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		font-weight: 500;
	}
	.back:hover {
		border-color: var(--accent-bronze);
		color: var(--accent-bronze);
	}
	.arrow {
		width: 14px;
		height: 8px;
		transition: transform var(--dur-med) var(--ease-out);
	}
	.back:hover .arrow {
		transform: translateX(-2px);
	}
	.crumb {
		display: inline-flex;
		align-items: baseline;
		gap: 0.5rem;
		padding-right: 0.25rem;
		color: var(--ink-mute);
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}
	.crumb-label {
		font-size: 0.7rem;
	}
	.crumb-path {
		color: var(--ink-deep);
		font-weight: 500;
	}
	@media (max-width: 520px) {
		.crumb-label {
			display: none;
		}
	}
</style>
