<script lang="ts">
	import contacts from '$lib/data/contacts.json';
	import { base } from '$app/paths';
	import { resumeFile } from '$lib/game/content';

	let copied = $state(false);
	async function copy() {
		try {
			await navigator.clipboard.writeText(contacts.email);
			copied = true;
			setTimeout(() => (copied = false), 1800);
		} catch {
			location.href = `mailto:${contacts.email}`;
		}
	}
</script>

<p class="lede">
	If something here sparked an idea — a role, a project, a conversation — get in touch.
</p>

<div class="email">
	<a class="mail" href="mailto:{contacts.email}">{contacts.email}</a>
	<button type="button" onclick={copy}>{copied ? 'Copied' : 'Copy'}</button>
</div>

<ul class="links">
	{#each contacts.links as l}
		<li><a href={l.href} target="_blank" rel="noopener me">{l.label} ↗</a></li>
	{/each}
	<li><a href="{base}/{resumeFile}" download={resumeFile}>Resume PDF ↓</a></li>
</ul>

<p class="where">Based in Kaunas, Lithuania.</p>

<style>
	.lede {
		margin: 0.25rem 0 1.5rem;
		font-size: 1.05rem;
		line-height: 1.6;
		color: #c3cdd8;
	}
	.email {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.1rem;
		background: rgba(111, 199, 221, 0.06);
		border: 1px solid rgba(111, 199, 221, 0.3);
	}
	.mail {
		flex: 1;
		min-width: 0;
		overflow-wrap: anywhere;
		font-family: var(--font-game);
		font-weight: 600;
		font-size: clamp(1rem, 0.85rem + 0.8vw, 1.35rem);
		letter-spacing: 0.04em;
		color: #fff;
	}
	.mail:hover {
		color: var(--accent-cyan);
	}
	button {
		font-family: var(--font-game);
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		padding: 0.4rem 0.8rem;
		color: #0b0e14;
		background: var(--accent-cyan);
		border: 0;
		border-radius: 2px;
		cursor: pointer;
	}
	button:hover {
		background: #a4dfef;
		color: #0b0e14;
		box-shadow: none;
	}
	.links {
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem 1.4rem;
		margin: 1.4rem 0 0;
		padding: 0;
	}
	.links a {
		font-family: var(--font-game);
		font-size: 0.85rem;
		font-weight: 600;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: #c7d2de;
	}
	.links a:hover {
		color: var(--accent-cyan);
	}
	.where {
		margin: 2rem 0 0;
		font-size: 0.85rem;
		color: #7f8fa2;
	}
</style>
