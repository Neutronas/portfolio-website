<script lang="ts">
	let { label = 'Scroll' }: { label?: string } = $props();
</script>

<div class="scroll-hint" aria-hidden="true">
	<span class="label">{label}</span>
	<span class="rail"><span class="dot"></span></span>
	<svg viewBox="0 0 14 8" class="chev" role="presentation">
		<path
			d="M1 1 L7 6 L13 1"
			fill="none"
			stroke="currentColor"
			stroke-width="1.25"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</svg>
</div>

<style>
	.scroll-hint {
		display: inline-flex;
		flex-direction: column;
		align-items: center;
		gap: 0.85rem;
		color: var(--ink-mute);
		font-family: var(--font-body);
		font-size: var(--step--1);
		letter-spacing: 0.28em;
		text-transform: uppercase;
	}
	.label {
		font-weight: 500;
	}
	.rail {
		position: relative;
		width: 1px;
		height: 52px;
		background: var(--line-hair);
		overflow: hidden;
	}
	.dot {
		position: absolute;
		top: -10px;
		left: -1.5px;
		width: 4px;
		height: 10px;
		background: var(--accent-bronze);
		border-radius: 2px;
		animation: drop 2.4s var(--ease-out) infinite;
	}
	.chev {
		width: 14px;
		height: 8px;
		animation: float 2.4s var(--ease-out) infinite;
	}
	@keyframes drop {
		0% {
			top: -10px;
			opacity: 0;
		}
		20% {
			opacity: 1;
		}
		80% {
			opacity: 1;
		}
		100% {
			top: 52px;
			opacity: 0;
		}
	}
	@keyframes float {
		0%,
		100% {
			transform: translateY(0);
			opacity: 0.5;
		}
		50% {
			transform: translateY(3px);
			opacity: 1;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.dot,
		.chev {
			animation: none;
		}
		.dot {
			top: 20px;
			opacity: 0.6;
		}
	}
</style>
