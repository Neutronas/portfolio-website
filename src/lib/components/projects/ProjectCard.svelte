<script lang="ts">
	type Project = {
		id: string;
		year: number;
		title: string;
		tags: string[];
		summary: string;
		links: { label: string; href: string }[];
	};
	let {
		project,
		index,
		total
	}: { project: Project; index: number; total: number } = $props();
</script>

<article class="project" aria-labelledby="proj-{project.id}-title">
	<header class="meta">
		<span class="counter">
			<span class="counter-num">{String(index + 1).padStart(2, '0')}</span>
			<span class="counter-sep">/</span>
			<span class="counter-total">{String(total).padStart(2, '0')}</span>
		</span>
		<span class="year">{project.year}</span>
	</header>

	<h3 class="title" id="proj-{project.id}-title">{project.title}</h3>

	{#if project.tags.length}
		<ul class="tags" aria-label="Tags">
			{#each project.tags as tag (tag)}
				<li class="tag">{tag}</li>
			{/each}
		</ul>
	{/if}

	<p class="summary">{project.summary}</p>

	{#if project.links.length}
		<div class="links">
			{#each project.links as link (link.href)}
				<a href={link.href} rel="noopener" target="_blank">
					<span>{link.label}</span>
					<svg viewBox="0 0 12 12" class="ext" aria-hidden="true">
						<path
							d="M3 9 L9 3 M4 3 H9 V8"
							fill="none"
							stroke="currentColor"
							stroke-width="1.25"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</a>
			{/each}
		</div>
	{/if}
</article>

<style>
	.project {
		width: 100%;
		min-height: 280px;
		display: flex;
		flex-direction: column;
		gap: var(--space-3);
		background: var(--bg-paper);
		border: 1px solid var(--line-hair);
		border-radius: var(--radius-lg);
		padding: var(--space-6);
		box-shadow:
			0 1px 3px rgba(0, 0, 0, 0.05),
			0 12px 32px -16px rgba(0, 0, 0, 0.08);
		position: relative;
		overflow: hidden;
	}
	.project::before,
	.project::after {
		content: '';
		position: absolute;
		width: 12px;
		height: 12px;
		border: 1px solid var(--accent-cyan);
		opacity: 0.5;
		pointer-events: none;
	}
	.project::before {
		top: 10px;
		right: 10px;
		border-left: none;
		border-bottom: none;
	}
	.project::after {
		bottom: 10px;
		left: 10px;
		border-right: none;
		border-top: none;
	}
	.meta {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		color: var(--ink-mute);
		font-family: var(--font-mono, ui-monospace);
		font-size: var(--step--1);
		letter-spacing: 0.2em;
	}
	.counter {
		display: inline-flex;
		align-items: baseline;
		gap: 0.4rem;
	}
	.counter-num {
		color: var(--accent-bronze);
		font-weight: 600;
	}
	.counter-sep {
		opacity: 0.5;
	}
	.year {
		color: var(--ink-soft);
	}
	.title {
		font-family: var(--font-display);
		font-weight: 400;
		font-size: var(--step-2);
		margin: 0;
		line-height: 1.12;
		letter-spacing: -0.015em;
	}
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.tag {
		font-family: var(--font-body);
		font-size: var(--step--1);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--ink-soft);
		padding: 0.2rem 0.65rem;
		border: 1px solid var(--line-hair);
		border-radius: 999px;
	}
	.summary {
		font-family: var(--font-body);
		font-size: var(--step-0);
		color: var(--ink-soft);
		margin: 0;
		flex: 1;
	}
	.links {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-3);
		margin-top: auto;
	}
	.links a {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		padding: 0.5rem 0.9rem;
		border: 1px solid var(--line-hair);
		border-radius: 999px;
		font-family: var(--font-body);
		font-size: var(--step--1);
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--ink-deep);
		background-image: none;
		transition:
			border-color var(--dur-med) var(--ease-out),
			color var(--dur-med) var(--ease-out);
	}
	.links a:hover {
		border-color: var(--accent-bronze);
		color: var(--accent-bronze);
	}
	.ext {
		width: 10px;
		height: 10px;
	}
	@media (max-width: 640px) {
		.project {
			min-height: 0;
			padding: var(--space-6);
		}
	}
</style>
