<script lang="ts">
	import { careerEntries, range } from '$lib/game/content';

	type Filter = 'all' | 'work' | 'education';
	let filter: Filter = $state('all');
	const filters: { id: Filter; label: string }[] = [
		{ id: 'all', label: 'All' },
		{ id: 'work', label: 'Work' },
		{ id: 'education', label: 'Education' }
	];
	const shown = $derived(careerEntries.filter((e) => filter === 'all' || e.branch === filter));
	const split = (t: string) => {
		const [head, ...rest] = t.split(' - ');
		return { head, role: rest.join(' - ') };
	};
</script>

<div class="tabs" role="group" aria-label="Filter">
	{#each filters as f (f.id)}
		<button type="button" class:on={filter === f.id} aria-pressed={filter === f.id} onclick={() => (filter = f.id)}>
			{f.label}
		</button>
	{/each}
</div>

<ol class="log">
	{#each shown as e (e.id)}
		{@const t = split(e.title)}
		<li class="entry" class:edu={e.branch === 'education'} class:now={e.to === null}>
			<div class="meta">
				<span class="when">{range(e)}</span>
				<span class="kind">{e.branch === 'work' ? 'Work' : 'Education'}</span>
				{#if e.to === null}<span class="current">Current</span>{/if}
			</div>
			<h3>{t.head}</h3>
			{#if t.role}<p class="role">{t.role}</p>{/if}
			<p class="summary">{e.summary}</p>
			{#if e.tooltip?.details?.length}
				<details>
					<summary>Details</summary>
					<ul>
						{#each e.tooltip.details as d}<li>{d}</li>{/each}
					</ul>
				</details>
			{/if}
			{#if 'tech' in (e.tooltip ?? {}) && e.tooltip?.tech?.length}
				<ul class="chips" aria-label="Technologies">
					{#each e.tooltip.tech as tech}<li>{tech}</li>{/each}
				</ul>
			{/if}
		</li>
	{/each}
</ol>

<style>
	.tabs {
		display: flex;
		gap: 0.4rem;
		margin-bottom: 1.25rem;
	}
	.tabs button {
		font-family: var(--font-game);
		font-size: 0.78rem;
		font-weight: 600;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		padding: 0.4rem 0.85rem;
		color: #8e9cad;
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 2px;
		cursor: pointer;
	}
	.tabs button:hover {
		color: #fff;
		box-shadow: none;
	}
	.tabs button.on {
		color: #0b0e14;
		background: var(--accent-cyan);
		border-color: var(--accent-cyan);
	}
	.log {
		list-style: none;
		margin: 0;
		padding: 0 0 0 1.1rem;
		border-left: 1px solid rgba(111, 199, 221, 0.2);
	}
	.entry {
		position: relative;
		padding: 0 0 1.6rem 0.4rem;
	}
	.entry::before {
		content: '';
		position: absolute;
		left: calc(-1.1rem - 5px);
		top: 0.35rem;
		width: 9px;
		height: 9px;
		background: #0b0e14;
		border: 2px solid var(--accent-cyan);
		transform: rotate(45deg);
	}
	.entry.edu::before {
		border-color: var(--accent-gold);
	}
	.entry.now::before {
		background: var(--accent-cyan);
		box-shadow: 0 0 10px var(--accent-cyan);
	}
	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6rem;
		font-family: var(--font-game);
		font-size: 0.78rem;
		letter-spacing: 0.14em;
		text-transform: uppercase;
	}
	.when {
		color: #e6edf4;
		font-weight: 600;
	}
	.kind {
		color: var(--accent-cyan);
	}
	.edu .kind {
		color: var(--accent-gold);
	}
	.current {
		padding: 0.05rem 0.45rem;
		color: #0b0e14;
		background: var(--accent-cyan);
		border-radius: 2px;
		font-weight: 700;
	}
	h3 {
		margin: 0.45rem 0 0;
		font-family: var(--font-body);
		font-size: 1.12rem;
		font-weight: 600;
		letter-spacing: 0;
		color: #fff;
	}
	.role {
		margin: 0.1rem 0 0;
		color: #a9c9d6;
		font-size: 0.95rem;
	}
	.summary {
		margin: 0.5rem 0 0;
		color: #aab5c2;
		font-size: 0.93rem;
		line-height: 1.55;
	}
	details {
		margin-top: 0.5rem;
		font-size: 0.9rem;
		color: #aab5c2;
	}
	summary {
		cursor: pointer;
		font-family: var(--font-game);
		font-size: 0.74rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: #8e9cad;
	}
	summary:hover {
		color: #fff;
	}
	details ul {
		margin: 0.5rem 0 0;
		padding-left: 1.1rem;
	}
	details li {
		margin: 0.2rem 0;
	}
	.chips {
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin: 0.65rem 0 0;
		padding: 0;
	}
	.chips li {
		font-size: 0.74rem;
		padding: 0.15rem 0.5rem;
		color: #b9c6d3;
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 2px;
	}
</style>
