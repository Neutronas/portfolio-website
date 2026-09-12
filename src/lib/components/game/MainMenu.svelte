<script lang="ts">
	import type { ItemId, MenuItem } from '$lib/game/content';

	let {
		items,
		selected,
		active,
		visible,
		onselect,
		onactivate,
		links = $bindable([])
	}: {
		items: MenuItem[];
		selected: ItemId | null;
		active: string | null;
		visible: boolean;
		onselect: (id: ItemId) => void;
		onactivate: (id: ItemId) => void;
		links?: HTMLAnchorElement[];
	} = $props();
</script>

<nav class="menu" class:visible aria-label="Main menu">
	<ul>
		{#each items as item, i (item.id)}
			<li style="--i: {i}">
				<a
					bind:this={links[i]}
					href={item.href}
					class:selected={selected === item.id}
					class:active={active === item.id}
					aria-current={active === item.id ? 'page' : undefined}
					target={item.external ? '_blank' : undefined}
					rel={item.external ? 'noopener me' : undefined}
					onpointerenter={() => onselect(item.id)}
					onfocus={() => onselect(item.id)}
					onclick={(e) => {
						if (!item.external) e.preventDefault();
						onactivate(item.id);
					}}
				>
					<span class="idx">{String(i + 1).padStart(2, '0')}</span>
					<span class="label">{item.label}</span>
					{#if item.external}<span class="ext" aria-label="(opens in new tab)">↗</span>{/if}
				</a>
			</li>
		{/each}
	</ul>
</nav>

<style>
	.menu {
		position: fixed;
		left: clamp(20px, 4.5vw, 72px);
		bottom: clamp(56px, 9vh, 96px);
		z-index: 5;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	li {
		opacity: 0;
		transform: translateX(-24px);
		transition:
			opacity 500ms var(--ease-out),
			transform 600ms var(--ease-out);
		transition-delay: calc(var(--i) * 60ms + 150ms);
	}
	.visible li {
		opacity: 1;
		transform: none;
	}
	a {
		position: relative;
		display: flex;
		align-items: baseline;
		gap: 0.9em;
		padding: 0.28em 1.6em 0.28em 0.9em;
		font-family: var(--font-game);
		font-weight: 600;
		font-size: clamp(1.15rem, 0.9rem + 1.1vw, 1.85rem);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		line-height: 1.15;
		color: rgba(226, 232, 240, 0.58);
		background: none;
		transition:
			color 160ms ease,
			transform 260ms var(--ease-out),
			text-shadow 200ms ease;
	}
	/* Selection band + marker, like a console menu */
	a::before {
		content: '';
		position: absolute;
		inset: 0;
		background: linear-gradient(90deg, rgba(111, 199, 221, 0.2), rgba(111, 199, 221, 0.06) 55%, transparent);
		clip-path: polygon(0 0, 100% 0, calc(100% - 14px) 100%, 0 100%);
		opacity: 0;
		transform: scaleX(0.6);
		transform-origin: left;
		transition:
			opacity 200ms ease,
			transform 300ms var(--ease-out);
	}
	a::after {
		content: '';
		position: absolute;
		left: 0;
		top: 18%;
		bottom: 18%;
		width: 3px;
		background: var(--accent-cyan);
		box-shadow: 0 0 12px var(--accent-cyan);
		opacity: 0;
		transition: opacity 160ms ease;
	}
	a.selected {
		color: #fff;
		transform: translateX(12px);
		text-shadow: 0 0 18px rgba(111, 199, 221, 0.55);
	}
	a.selected::before {
		opacity: 1;
		transform: none;
	}
	a.selected::after,
	a.active::after {
		opacity: 1;
	}
	a.active {
		color: #fff;
	}
	a.active::after {
		background: var(--accent-gold);
		box-shadow: 0 0 12px var(--accent-gold);
	}
	a:focus-visible {
		outline: none;
	}
	a:focus-visible .label {
		text-decoration: underline;
		text-decoration-color: var(--accent-cyan);
		text-underline-offset: 0.25em;
	}
	.idx,
	.label,
	.ext {
		position: relative;
	}
	.idx {
		font-size: 0.5em;
		letter-spacing: 0.12em;
		color: var(--accent-gold);
		opacity: 0.8;
		transform: translateY(-0.35em);
	}
	.ext {
		font-size: 0.6em;
		color: var(--accent-cyan);
		opacity: 0.7;
	}
	@media (prefers-reduced-motion: reduce) {
		li,
		a,
		a::before {
			transition: none;
		}
	}
</style>
