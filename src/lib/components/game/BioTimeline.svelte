<script lang="ts">
	import { base } from '$app/paths';
	import { milestones } from '$lib/game/content';
</script>

<ol class="chapters">
	{#each milestones as m, i (m.id)}
		<li class="chapter" class:has-img={!!m.image}>
			<div class="text">
				<p class="num">Chapter {String(i + 1).padStart(2, '0')} · <span>{m.year}</span></p>
				<h3>{m.title}</h3>
				<p class="body">{m.body}</p>
			</div>
			{#if m.image}
				<img src="{base}{m.image.src}" alt={m.image.alt} loading="lazy" decoding="async" />
			{/if}
		</li>
	{/each}
</ol>

<style>
	.chapters {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 1.4rem;
	}
	.chapter {
		display: grid;
		gap: 1rem;
		padding-bottom: 1.4rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}
	.chapter.has-img {
		grid-template-columns: 1fr 160px;
		align-items: start;
	}
	.num {
		margin: 0;
		font-family: var(--font-game);
		font-size: 0.75rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: #7f8fa2;
	}
	.num span {
		color: var(--accent-gold);
		font-weight: 700;
	}
	h3 {
		margin: 0.35rem 0 0;
		font-family: var(--font-body);
		font-size: 1.08rem;
		font-weight: 600;
		letter-spacing: 0;
		color: #fff;
	}
	.body {
		margin: 0.4rem 0 0;
		font-size: 0.92rem;
		line-height: 1.55;
		color: #a8b3c0;
	}
	img {
		width: 100%;
		aspect-ratio: 4 / 3;
		object-fit: cover;
		border: 1px solid rgba(255, 255, 255, 0.1);
		filter: saturate(0.9);
	}
	@media (max-width: 520px) {
		.chapter.has-img {
			grid-template-columns: 1fr;
		}
		img {
			max-width: 260px;
		}
	}
</style>
