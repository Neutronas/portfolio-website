<script lang="ts">
	import { projects } from '$lib/game/content';
</script>

<ul class="grid">
	{#each projects as p (p.id)}
		<li class="card">
			<div class="top">
				<span class="year">{p.year}</span>
				<ul class="tags" aria-label="Tags">
					{#each p.tags as tag}<li>{tag}</li>{/each}
				</ul>
			</div>
			<h3>{p.title}</h3>
			<p>{p.summary}</p>
			{#if p.links.length}
				<div class="links">
					{#each p.links as l}
						<a href={l.href} target="_blank" rel="noopener">{l.label} ↗</a>
					{/each}
				</div>
			{/if}
		</li>
	{/each}
</ul>

<style>
	.grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 250px), 1fr));
		gap: 0.75rem;
	}
	.card {
		display: flex;
		flex-direction: column;
		padding: 1rem 1.05rem 1.05rem;
		background: rgba(255, 255, 255, 0.025);
		border: 1px solid rgba(255, 255, 255, 0.08);
		clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%);
		transition:
			border-color 160ms ease,
			background 160ms ease;
	}
	.card:hover {
		border-color: rgba(111, 199, 221, 0.45);
		background: rgba(111, 199, 221, 0.05);
	}
	.top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}
	.year {
		font-family: var(--font-game);
		font-weight: 700;
		font-size: 0.95rem;
		letter-spacing: 0.1em;
		color: var(--accent-gold);
	}
	.tags {
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: 0.3rem;
		margin: 0;
		padding: 0;
	}
	.tags li {
		font-size: 0.68rem;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: #7f8fa2;
	}
	h3 {
		margin: 0.55rem 0 0;
		font-family: var(--font-body);
		font-size: 1.05rem;
		font-weight: 600;
		letter-spacing: 0;
		color: #fff;
	}
	p {
		margin: 0.4rem 0 0;
		font-size: 0.88rem;
		line-height: 1.5;
		color: #a8b3c0;
	}
	.links {
		display: flex;
		gap: 0.9rem;
		margin-top: auto;
		padding-top: 0.7rem;
	}
	a {
		font-family: var(--font-game);
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--accent-cyan);
	}
	a:hover {
		color: #fff;
	}
</style>
