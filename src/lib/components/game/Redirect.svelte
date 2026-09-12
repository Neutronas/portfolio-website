<script lang="ts">
	import { onMount } from 'svelte';
	import { base } from '$app/paths';

	/** Old standalone pages now live as panels on the home page. */
	let { to, label }: { to: string; label: string } = $props();
	const target = $derived(`${base}/#${to}`);

	onMount(() => location.replace(target));
</script>

<svelte:head>
	<title>{label} — Lukas Ružauskas</title>
	<!-- Static hosting has no server redirects: meta refresh 0 is treated as a permanent redirect. -->
	<meta http-equiv="refresh" content="0; url={target}" />
	<link rel="canonical" href="https://ruzauskas.lt/" />
	<meta name="robots" content="noindex, follow" />
</svelte:head>

<main id="main" style="padding: 2rem; font-family: system-ui">
	<p>{label} moved to <a href={target}>ruzauskas.lt/#{to}</a>.</p>
</main>
