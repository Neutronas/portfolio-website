<script lang="ts">
	let { width = '480px' }: { width?: string } = $props();
</script>

<hr class="metal" style="--hr-width: {width}" aria-hidden="true" />

<style>
	.metal {
		border: 0;
		height: 1px;
		background: linear-gradient(
			90deg,
			transparent 0%,
			var(--accent-cyan) 30%,
			var(--accent-gold) 50%,
			var(--accent-cyan) 70%,
			transparent 100%
		);
		margin: var(--space-8) auto;
		width: min(100%, var(--hr-width, 480px));
		opacity: 0.7;
	}
</style>
