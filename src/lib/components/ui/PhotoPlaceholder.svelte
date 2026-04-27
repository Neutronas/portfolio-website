<script lang="ts">
	let {
		src = '',
		alt = '',
		aspect = '3 / 4',
		icon = 'photo'
	}: {
		src?: string;
		alt?: string;
		aspect?: string;
		icon?: 'portrait' | 'photo';
	} = $props();

	const hasImage = $derived(src.length > 0);
</script>

{#if hasImage}
	<img {src} {alt} class="photo" style="aspect-ratio: {aspect}" />
{:else}
	<div class="placeholder" style="aspect-ratio: {aspect}" role="img" aria-label={alt || 'Photo placeholder'}>
		{#if icon === 'portrait'}
			<svg viewBox="0 0 80 100" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
				<circle cx="40" cy="32" r="14" />
				<path d="M12 88 C12 62 28 52 40 52 C52 52 68 62 68 88" />
			</svg>
		{:else}
			<svg viewBox="0 0 80 60" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
				<rect x="4" y="4" width="72" height="52" rx="4" />
				<circle cx="24" cy="22" r="6" />
				<path d="M4 42 L24 28 L44 42 L60 30 L76 42" />
			</svg>
		{/if}
		<span class="label">{alt || 'Add photo'}</span>
	</div>
{/if}

<style>
	.photo {
		width: 100%;
		object-fit: cover;
		border-radius: var(--radius-md);
		border: 1px solid var(--line-hair);
	}

	.placeholder {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		border-radius: var(--radius-md);
		border: 2px dashed var(--line-strong);
		background: var(--bg-night);
		color: var(--ink-mute);
		padding: var(--space-4);
		transition: border-color var(--dur-med) var(--ease-out);
	}

	.placeholder svg {
		width: 48px;
		opacity: 0.5;
	}

	.label {
		font-family: var(--font-body);
		font-size: var(--step--1);
		letter-spacing: 0.16em;
		text-transform: uppercase;
		text-align: center;
		opacity: 0.7;
	}
</style>
