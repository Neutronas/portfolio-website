<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		children,
		delay = 0,
		threshold = 0.2,
		once = true
	}: {
		children: Snippet;
		delay?: number;
		threshold?: number;
		once?: boolean;
	} = $props();

	let el: HTMLDivElement | null = $state(null);
	let visible = $state(false);

	$effect(() => {
		if (!el) return;
		const io = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						visible = true;
						if (once) io.disconnect();
					} else if (!once) {
						visible = false;
					}
				}
			},
			{ threshold }
		);
		io.observe(el);
		return () => io.disconnect();
	});
</script>

<div bind:this={el} class="reveal" class:visible style="--delay: {delay}ms">
	{@render children()}
</div>

<style>
	.reveal {
		opacity: 0;
		transform: translateY(12px);
		transition:
			opacity 600ms var(--ease-out),
			transform 600ms var(--ease-out);
		transition-delay: var(--delay, 0ms);
		will-change: opacity, transform;
	}
	.reveal.visible {
		opacity: 1;
		transform: translateY(0);
	}
	@media (prefers-reduced-motion: reduce) {
		.reveal {
			opacity: 1;
			transform: none;
			transition: none;
		}
	}
</style>
