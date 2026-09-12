<script lang="ts">
	import { untrack } from 'svelte';
	import { base } from '$app/paths';
	import { resumeFile } from '$lib/game/content';
	import { loadPdf, loadPdfJs } from '$lib/game/pdf';

	let { active }: { active: boolean } = $props();

	const url = `${base}/${resumeFile}`;
	let host: HTMLDivElement;
	let status: 'idle' | 'loading' | 'ready' | 'error' = $state('idle');
	let renderedWidth = 0;
	let run = 0;

	async function render() {
		const width = Math.floor(host.clientWidth);
		if (!width || width === renderedWidth) return;
		const id = ++run;
		if (status !== 'ready') status = 'loading';
		try {
			const [pdfjs, pdf] = await Promise.all([loadPdfJs(), loadPdf(url)]);
			const pages: HTMLElement[] = [];
			for (let n = 1; n <= pdf.numPages; n++) {
				const page = await pdf.getPage(n);
				const scale = width / page.getViewport({ scale: 1 }).width;
				const viewport = page.getViewport({ scale });
				// Extra resolution so text stays sharp on phones and when pinch-zooming.
				const px = Math.min(3, window.devicePixelRatio * (width < 600 ? 2 : 1.25));

				const sheet = document.createElement('div');
				sheet.className = 'sheet';
				sheet.style.width = `${viewport.width}px`;
				sheet.style.height = `${viewport.height}px`;
				sheet.style.setProperty('--total-scale-factor', String(scale));

				const canvas = document.createElement('canvas');
				canvas.width = Math.floor(viewport.width * px);
				canvas.height = Math.floor(viewport.height * px);
				await page.render({ canvas, viewport, transform: [px, 0, 0, px, 0, 0] }).promise;
				sheet.append(canvas);

				// Selectable text (copy the email, search with Ctrl+F)
				const text = document.createElement('div');
				text.className = 'textLayer';
				sheet.append(text);
				await new pdfjs.TextLayer({ textContentSource: page.streamTextContent(), container: text, viewport }).render();

				// Clickable links from the PDF (email, GitHub, LinkedIn, website)
				for (const a of await page.getAnnotations()) {
					if (a.subtype !== 'Link' || !a.url) continue;
					const [x1, y1] = viewport.convertToViewportPoint(a.rect[0], a.rect[1]);
					const [x2, y2] = viewport.convertToViewportPoint(a.rect[2], a.rect[3]);
					const link = document.createElement('a');
					link.className = 'pdf-link';
					link.href = a.url;
					link.target = '_blank';
					link.rel = 'noopener';
					link.setAttribute('aria-label', a.url);
					Object.assign(link.style, {
						left: `${Math.min(x1, x2)}px`,
						top: `${Math.min(y1, y2)}px`,
						width: `${Math.abs(x2 - x1)}px`,
						height: `${Math.abs(y2 - y1)}px`
					});
					sheet.append(link);
				}
				pages.push(sheet);
			}
			if (id !== run) return; // a newer render (resize) took over
			host.replaceChildren(...pages);
			renderedWidth = width;
			status = 'ready';
		} catch (err) {
			console.warn('Resume preview failed', err);
			if (id === run) status = 'error';
		}
	}

	// Render on first open; re-render when the panel width changes.
	$effect(() => {
		if (!active) return;
		// untrack: render() reads `status`; without this a failure would re-run the effect forever.
		untrack(() => void render());
		let t: ReturnType<typeof setTimeout>;
		const ro = new ResizeObserver(() => {
			clearTimeout(t);
			t = setTimeout(render, 150);
		});
		ro.observe(host);
		return () => {
			ro.disconnect();
			clearTimeout(t);
		};
	});
</script>

<div class="actions">
	<a class="btn primary" href={url} download={resumeFile}>
		<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5v9m0 0L4.5 7M8 10.5 11.5 7M2 12.5v2h12v-2" /></svg>
		Download PDF
	</a>
	<a class="btn" href={url} target="_blank" rel="noopener">Open in new tab ↗</a>
</div>

<div class="viewer" class:ready={status === 'ready'}>
	<div class="pages" bind:this={host}></div>
	{#if status !== 'ready'}
		<div class="placeholder" aria-live="polite">
			{#if status === 'error'}
				<p>Preview unavailable. <a href={url} download={resumeFile}>Download the PDF</a> instead.</p>
			{:else}
				<span class="spinner" aria-hidden="true"></span>
				<p>Loading resume…</p>
			{/if}
		</div>
	{/if}
</div>

<style>
	.actions {
		position: sticky;
		top: -1.25rem;
		z-index: 2;
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		margin: -1.25rem -1.75rem 1rem;
		padding: 1rem 1.75rem 0.9rem;
		background: linear-gradient(rgba(10, 13, 19, 0.97) 80%, rgba(10, 13, 19, 0));
	}
	.btn {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.6rem 1rem;
		font-family: var(--font-game);
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: #d7e0ea;
		border: 1px solid rgba(255, 255, 255, 0.16);
		border-radius: 2px;
		transition:
			background 150ms ease,
			color 150ms ease,
			border-color 150ms ease;
	}
	.btn:hover {
		color: #fff;
		border-color: var(--accent-cyan);
	}
	.btn.primary {
		color: #0b0e14;
		background: var(--accent-cyan);
		border-color: var(--accent-cyan);
		box-shadow: 0 0 18px rgba(111, 199, 221, 0.35);
	}
	.btn.primary:hover {
		background: #a4dfef;
		color: #0b0e14;
	}
	svg {
		width: 15px;
		height: 15px;
		fill: none;
		stroke: currentColor;
		stroke-width: 1.8;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.viewer {
		position: relative;
		min-height: 200px;
	}
	.pages {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		opacity: 0;
		transition: opacity 300ms ease;
	}
	.ready .pages {
		opacity: 1;
	}
	/* Before the first render: an A4-shaped sheet so nothing jumps */
	.placeholder {
		position: absolute;
		inset: 0 0 auto;
		aspect-ratio: 595 / 842;
		display: grid;
		place-content: center;
		justify-items: center;
		gap: 0.8rem;
		background: #eeeae2;
		color: #4d5b6b;
		font-size: 0.9rem;
	}
	.placeholder p {
		margin: 0;
		color: inherit;
	}
	.spinner {
		width: 26px;
		height: 26px;
		border: 2px solid rgba(27, 109, 133, 0.25);
		border-top-color: #1b6d85;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	.pages :global(.sheet) {
		position: relative;
		background: #fff;
		box-shadow: 0 20px 50px -20px rgba(0, 0, 0, 0.9);
	}
	.pages :global(.sheet canvas) {
		display: block;
		width: 100%;
		height: 100%;
	}
	.pages :global(.pdf-link) {
		position: absolute;
		z-index: 2;
		border-radius: 2px;
	}
	.pages :global(.pdf-link:hover) {
		background: rgba(111, 199, 221, 0.25);
	}
	/* Minimal pdf.js text layer: invisible text positioned over the canvas */
	.pages :global(.textLayer) {
		position: absolute;
		inset: 0;
		overflow: clip;
		line-height: 1;
		text-align: initial;
		transform-origin: 0 0;
		z-index: 1;
		--min-font-size: 1;
		--text-scale-factor: calc(var(--total-scale-factor) * var(--min-font-size));
		--min-font-size-inv: calc(1 / var(--min-font-size));
	}
	.pages :global(.textLayer :is(span, br)) {
		color: transparent;
		position: absolute;
		white-space: pre;
		cursor: text;
		transform-origin: 0% 0%;
		user-select: text;
	}
	.pages :global(.textLayer > :not(.markedContent)),
	.pages :global(.textLayer .markedContent span:not(.markedContent)) {
		--font-height: 0;
		font-size: calc(var(--text-scale-factor) * var(--font-height));
		--scale-x: 1;
		--rotate: 0deg;
		transform: rotate(var(--rotate)) scaleX(var(--scale-x)) scale(var(--min-font-size-inv));
	}
	.pages :global(.textLayer .markedContent) {
		display: contents;
	}
	.pages :global(.textLayer ::selection) {
		background: rgba(27, 109, 133, 0.3);
	}
	@media (max-width: 640px) {
		.actions {
			margin: -1rem -1.1rem 0.9rem;
			padding: 0.8rem 1.1rem;
			top: -1rem;
		}
	}
</style>
