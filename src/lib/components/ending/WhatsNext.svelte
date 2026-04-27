<script lang="ts">
	import contacts from '$lib/data/contacts.json';
	import type { Path } from '$lib/stores/path.svelte';
	import Reveal from '../ui/Reveal.svelte';

	let { path = 'careers' }: { path?: Path } = $props();

	const others: { id: Path; label: string }[] = (
		[
			{ id: 'careers', label: 'Careers' },
			{ id: 'biography', label: 'Biography' },
			{ id: 'projects', label: 'Projects' }
		] as const
	).filter((o) => o.id !== path);
</script>

<section class="whats-next" aria-label="What's next">
	<Reveal>
		<div class="question-node" aria-hidden="true">
			<svg viewBox="0 0 120 120">
				<circle
					cx="60"
					cy="60"
					r="46"
					fill="var(--bg-paper)"
					stroke="var(--accent-bronze)"
					stroke-width="1.5"
					stroke-dasharray="3 4"
				/>
				<text
					x="60"
					y="78"
					text-anchor="middle"
					font-family="var(--font-display)"
					font-size="56"
					fill="var(--ink-deep)"
				>
					?
				</text>
			</svg>
		</div>
	</Reveal>

	<Reveal delay={120}>
		<h2 class="question">What's next?</h2>
	</Reveal>

	<Reveal delay={200}>
		<p class="lede">
			The next version of {contacts.name} might just depend on you.<br />
			If something here sparked an idea — or a role, a project, a conversation — get in touch.
		</p>
	</Reveal>

	<Reveal delay={280}>
		<a class="email" href="mailto:{contacts.email}">
			<span>{contacts.email}</span>
			<svg viewBox="0 0 16 10" class="arrow" aria-hidden="true">
				<path
					d="M1 5 H14 M10 1 L14 5 L10 9"
					fill="none"
					stroke="currentColor"
					stroke-width="1.25"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</a>
	</Reveal>

	<Reveal delay={360}>
		<div class="socials">
			{#each contacts.links as link}
				<a href={link.href} rel="me noopener" target="_blank">{link.label}</a>
			{/each}
		</div>
	</Reveal>

	<Reveal delay={440}>
		<div class="rewind">
			<p class="rewind-label">Or take another path</p>
			<div class="rewind-buttons">
				{#each others as o (o.id)}
					<a href="/{o.id}/" class="path-link">{o.label}</a>
				{/each}
				<a href="/" class="path-link restart">Back to start</a>
			</div>
		</div>
	</Reveal>
</section>

<style>
	.whats-next {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-4);
		padding: var(--space-24) var(--space-6) var(--space-24);
		text-align: center;
		max-width: 720px;
		margin: 0 auto;
	}
	.question-node {
		width: 120px;
		height: 120px;
		margin-bottom: var(--space-4);
	}
	.question {
		font-family: var(--font-display);
		font-weight: 400;
		font-size: var(--step-4);
		margin: 0;
		letter-spacing: -0.02em;
	}
	.lede {
		font-family: var(--font-body);
		font-size: var(--step-1);
		color: var(--ink-soft);
		max-width: 54ch;
		margin: 0;
	}
	.email {
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		margin-top: var(--space-6);
		padding: 0.85rem 1.25rem;
		border: 1px solid var(--line-hair);
		border-radius: 999px;
		background: var(--bg-paper);
		color: var(--ink-deep);
		font-family: var(--font-body);
		font-size: var(--step-0);
		background-image: none;
		transition:
			border-color var(--dur-med) var(--ease-out),
			transform var(--dur-med) var(--ease-out);
	}
	.email:hover {
		border-color: var(--accent-bronze);
		transform: translateY(-2px);
	}
	.email .arrow {
		width: 16px;
		height: 10px;
		color: var(--accent-bronze);
	}
	.socials {
		display: flex;
		gap: var(--space-4);
		margin-top: var(--space-2);
		font-family: var(--font-body);
		font-size: var(--step--1);
		letter-spacing: 0.18em;
		text-transform: uppercase;
	}
	.socials a {
		color: var(--ink-mute);
	}
	.socials a:hover {
		color: var(--accent-bronze);
	}
	.rewind {
		margin-top: var(--space-12);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-3);
	}
	.rewind-label {
		font-family: var(--font-body);
		font-size: var(--step--1);
		color: var(--ink-mute);
		letter-spacing: 0.3em;
		text-transform: uppercase;
		margin: 0;
	}
	.rewind-buttons {
		display: flex;
		gap: var(--space-3);
		flex-wrap: wrap;
		justify-content: center;
	}
	.path-link {
		font-family: var(--font-body);
		font-size: var(--step--1);
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--ink-deep);
		background-image: none;
		padding: 0.4rem 0.9rem;
		border: 1px solid var(--line-hair);
		border-radius: 999px;
		transition:
			border-color var(--dur-med) var(--ease-out),
			color var(--dur-med) var(--ease-out);
	}
	.path-link:hover {
		border-color: var(--accent-bronze);
		color: var(--accent-bronze);
	}
	.restart {
		color: var(--ink-mute);
		border-color: transparent;
	}
	.restart:hover {
		border-color: var(--line-hair);
		color: var(--ink-mute);
	}
</style>
