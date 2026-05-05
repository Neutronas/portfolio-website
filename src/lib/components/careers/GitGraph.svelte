<script lang="ts">
	import { onMount } from 'svelte';
	import careers from '$lib/data/careers.json';

	type Commit = (typeof careers.commits)[number];
	type Branch = (typeof careers.branches)[number];

	function toDate(ym: string | null): Date {
		if (!ym) return new Date();
		const [y, m] = ym.split('-').map(Number);
		return new Date(y, m - 1, 1);
	}

	const now = new Date();
	const allDates = careers.commits.flatMap((c) => [toDate(c.from), toDate(c.to)]);
	const rawMin = new Date(Math.min(...allDates.map((d) => +d)));
	const rawMax = new Date(Math.max(...allDates.map((d) => +d), +now));
	const minDate = new Date(rawMin.getFullYear(), 0, 1);
	const maxDate = new Date(rawMax.getFullYear() + 1, 0, 1);
	const span = +maxDate - +minDate;

	const width = 1400;
	const height = 600;
	const padLeft = 90;
	const padRight = 40;
	const padTop = 35;
	const padBottom = 60;
	const chartW = width - padLeft - padRight;
	const chartH = height - padTop - padBottom;

	const capsuleH = 36;
	const subLaneGap = 50;
	const capFontSize = 11;
	const capCharW = capFontSize * 0.52;
	const minTextWidth = 60;

	function darkenColor(hex: string): string {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		return `rgb(${Math.round(r * 0.6)}, ${Math.round(g * 0.6)}, ${Math.round(b * 0.6)})`;
	}

	const xForDate = (d: Date) => padLeft + ((+maxDate - +d) / span) * chartW;

	const laneCount = careers.branches.length;
	const laneSlot = chartH / laneCount;
	const laneBaseY = (idx: number) => padTop + laneSlot * (idx + 0.5);

	const timelineY = height - padBottom;
	const nowX = xForDate(now);

	const years: number[] = [];
	for (let y = minDate.getFullYear(); y < maxDate.getFullYear(); y++) years.push(y);

	function wrapText(text: string, maxW: number): string[] {
		if (maxW < minTextWidth) return [];
		const maxChars = Math.floor((maxW - 14) / capCharW);
		const words = text.split(' ');
		const lines: string[] = [];
		let line = '';
		for (const w of words) {
			const test = line ? line + ' ' + w : w;
			if (test.length > maxChars && line) {
				lines.push(line);
				line = w;
			} else {
				line = test;
			}
		}
		if (line) lines.push(line);
		const maxLines = Math.floor((capsuleH - 6) / (capFontSize * 1.3));
		return lines.slice(0, maxLines);
	}

	type CommitGeom = Commit & {
		xFrom: number;
		xTo: number;
		capsX: number;
		capsW: number;
		y: number;
		color: string;
		branchIdx: number;
		branchLabel: string;
		subLane: number;
		isOngoing: boolean;
		lines: string[];
	};

	const rawCommits = careers.commits
		.map((c) => ({
			c,
			from: +toDate(c.from),
			to: +toDate(c.to)
		}))
		.sort((a, b) => a.from - b.from);

	const subLaneMap: Record<string, Array<Array<{ from: number; to: number }>>> = {};
	const withSubLane: Array<{ c: Commit; from: number; to: number; subLane: number }> = [];
	for (const item of rawCommits) {
		const key = item.c.branch;
		if (!subLaneMap[key]) subLaneMap[key] = [];
		const lanes = subLaneMap[key];
		let placed = -1;
		for (let i = 0; i < lanes.length; i++) {
			const conflict = lanes[i].some(
				(x) => Math.max(item.from, x.from) < Math.min(item.to, x.to)
			);
			if (!conflict) {
				lanes[i].push({ from: item.from, to: item.to });
				placed = i;
				break;
			}
		}
		if (placed === -1) {
			lanes.push([{ from: item.from, to: item.to }]);
			placed = lanes.length - 1;
		}
		withSubLane.push({ ...item, subLane: placed });
	}

	const commitsWithGeom: CommitGeom[] = withSubLane.map((item) => {
		const c = item.c;
		const branchIdx = careers.branches.findIndex((b) => b.id === c.branch);
		const branch: Branch = careers.branches[branchIdx];
		const xFrom = xForDate(toDate(c.from));
		const xTo = xForDate(toDate(c.to));
		const capsX = Math.min(xFrom, xTo);
		const capsW = Math.max(Math.abs(xFrom - xTo), 8);
		const fullTitle = c.title + (c.to === null ? ' (current)' : '');
		return {
			...c,
			xFrom,
			xTo,
			capsX,
			capsW,
			y: laneBaseY(branchIdx) + item.subLane * subLaneGap,
			color: branch.color,
			branchIdx,
			branchLabel: branch.label,
			subLane: item.subLane,
			isOngoing: c.to === null,
			lines: wrapText(fullTitle, capsW)
		};
	});

	const commitsDesc = [...commitsWithGeom].sort(
		(a, b) => +toDate(b.from) - +toDate(a.from)
	);

	const formatRange = (from: string, to: string | null) => {
		const f = toDate(from);
		const t = to ? toDate(to) : null;
		const fmt = (d: Date) =>
			d.toLocaleString('en-GB', { month: 'short', year: 'numeric' });
		return `${fmt(f)} - ${t ? fmt(t) : 'present'}`;
	};

	let sectionEl: HTMLDivElement | null = $state(null);
	let active = $state(false);

	let hoveredId = $state<string | null>(null);
	let tooltipX = $state(0);
	let tooltipY = $state(0);

	const tooltipCommit = $derived(
		hoveredId ? commitsWithGeom.find((c) => c.id === hoveredId) ?? null : null
	);

	function onCommitEnter(id: string, e: MouseEvent) {
		hoveredId = id;
		tooltipX = e.clientX;
		tooltipY = e.clientY;
	}

	function onCommitMove(e: MouseEvent) {
		tooltipX = e.clientX;
		tooltipY = e.clientY;
	}

	function onCommitLeave() {
		hoveredId = null;
	}

	onMount(() => {
		window.scrollTo(0, 0);
		if (!sectionEl) return;
		const io = new IntersectionObserver(
			(entries) => {
				for (const e of entries) {
					if (e.isIntersecting) {
						active = true;
						io.disconnect();
					}
				}
			},
			{ threshold: 0.15 }
		);
		io.observe(sectionEl);

		return () => io.disconnect();
	});
</script>

<div class="graph-wrap" bind:this={sectionEl} class:active>
	<div class="graph-container">
		<svg
			class="graph-svg"
			viewBox="0 0 {width} {height}"
			preserveAspectRatio="xMidYMid meet"
			aria-label="Careers timeline"
			role="img"
		>
			<defs>
				<pattern id="lane-rail" x="0" y="0" width="6" height="1" patternUnits="userSpaceOnUse">
					<rect width="3" height="1" fill="var(--line-hair)" />
				</pattern>
			</defs>

			{#each careers.branches as b, i (b.id)}
				<text
					x={padLeft - 12}
					y={laneBaseY(i) + 4}
					class="lane-label"
					fill={b.color}
					text-anchor="end"
				>
					{b.label}
				</text>
				<line
					x1={padLeft}
					x2={width - padRight}
					y1={laneBaseY(i)}
					y2={laneBaseY(i)}
					stroke="url(#lane-rail)"
					stroke-width="1"
				/>
			{/each}

			<line
				x1={padLeft}
				x2={width - padRight}
				y1={timelineY}
				y2={timelineY}
				stroke="var(--ink-mute)"
				stroke-width="1"
				opacity="0.6"
			/>
			{#each years as y}
				{@const x = xForDate(new Date(y, 0, 1))}
				<line
					x1={x}
					x2={x}
					y1={timelineY - 3}
					y2={timelineY + 3}
					stroke="var(--ink-mute)"
					opacity="0.5"
				/>
				<text x={x} y={timelineY + 16} class="year-label" text-anchor="middle">{y}</text>
			{/each}

			<line
				x1={nowX}
				x2={nowX}
				y1={padTop - 6}
				y2={timelineY}
				stroke="var(--accent-bronze)"
				stroke-dasharray="3 3"
				opacity="0.45"
			/>
			<text
				x={nowX}
				y={padTop - 10}
				class="now-label"
				text-anchor="middle"
				fill="var(--accent-bronze)"
			>
				now
			</text>

			{#each commitsWithGeom as c (c.id)}
				{@const isHovered = hoveredId === c.id}
				{@const half = capsuleH / 2}
				<g
					class="commit"
					class:is-hovered={isHovered}
					data-id={c.id}
					style="--c: {c.color}"
					onmouseenter={(e) => onCommitEnter(c.id, e)}
					onmousemove={onCommitMove}
					onmouseleave={onCommitLeave}
					role="button"
					tabindex="0"
					aria-label="{c.title} - {formatRange(c.from, c.to)}"
				>
					<path
						d="M {c.xFrom} {c.y + half} L {c.xFrom} {timelineY}"
						fill="none"
						stroke={c.color}
						stroke-width="0.75"
						opacity={isHovered ? 0.55 : 0.2}
						stroke-dasharray="2 2"
					/>
					<rect
						x={c.capsX}
						y={c.y - half}
						width={c.capsW}
						height={capsuleH}
						rx={6}
						fill={darkenColor(c.color)}
						opacity={isHovered ? 1 : 0.92}
					/>
					{#if c.isOngoing}
						<circle
							cx={c.capsX + 2}
							cy={c.y}
							r={3}
							fill="var(--bg-paper)"
							opacity="0.7"
						>
							<animate attributeName="opacity" values="0.7;0.3;0.7" dur="2s" repeatCount="indefinite" />
						</circle>
					{/if}
					{#if c.lines.length > 0}
						<text
							x={c.capsX + c.capsW / 2}
							y={c.y}
							class="cap-text"
							text-anchor="middle"
							dominant-baseline="central"
							fill="#fff"
						>
							{#each c.lines as line, li}
								<tspan
									x={c.capsX + c.capsW / 2}
									dy={li === 0 ? `${-(c.lines.length - 1) * 0.65}em` : '1.3em'}
								>
									{line}
								</tspan>
							{/each}
						</text>
					{:else}
						<text
							x={c.capsX + c.capsW + 6}
							y={c.y + 3}
							class="cap-label-outside"
							fill={c.color}
						>
							{c.title}
						</text>
					{/if}
				</g>
			{/each}
		</svg>
	</div>

	{#if tooltipCommit}
		<div
			class="commit-tooltip"
			style="left: {tooltipX}px; top: {tooltipY}px; --tc: {tooltipCommit.color}"
			role="tooltip"
		>
			<p class="tt-title">{tooltipCommit.title}{tooltipCommit.isOngoing ? ' (current)' : ''}</p>
			<p class="tt-dates">{formatRange(tooltipCommit.from, tooltipCommit.to)}</p>
			{#if tooltipCommit.tooltip?.details?.length}
				<ul class="tt-details">
					{#each tooltipCommit.tooltip.details as d}
						<li>{d}</li>
					{/each}
				</ul>
			{/if}
			{#if tooltipCommit.tooltip?.tech?.length}
				<div class="tt-tech">
					{#each tooltipCommit.tooltip.tech as t}
						<span>{t}</span>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	<ul class="vertical-list" aria-label="Careers timeline (list view)">
		{#each commitsDesc as c, i (c.id)}
			<li
				class="v-commit"
				style="--branch-color: {c.color}; --order: {i}"
			>
				<header>
					<span class="v-dot"></span>
					<span class="v-branch">{c.branchLabel}</span>
					<span class="v-dates">{formatRange(c.from, c.to)}</span>
				</header>
				<h3>{c.title}{c.isOngoing ? ' (current)' : ''}</h3>
				{#if c.summary}
					<p class="v-summary">{c.summary}</p>
				{/if}
			</li>
		{/each}
	</ul>
</div>

<style>
	.graph-wrap {
		width: 100%;
	}
	.graph-container {
		padding: var(--space-4) var(--space-4);
		background:
			radial-gradient(
				ellipse 60% 50% at 50% 50%,
				rgba(111, 199, 221, 0.06) 0%,
				transparent 70%
			);
	}
	.graph-svg {
		display: block;
		width: 100%;
		height: auto;
		background: var(--bg-paper);
		border-radius: var(--radius-lg);
		border: 1px solid var(--line-hair);
		padding: var(--space-3);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 8px 24px -12px rgba(0, 0, 0, 0.08);
	}
	.lane-label {
		font-family: var(--font-body);
		font-size: 10px;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		font-weight: 500;
	}
	.year-label {
		font-family: var(--font-mono, ui-monospace);
		font-size: 8px;
		fill: var(--ink-mute);
	}
	.now-label {
		font-family: var(--font-body);
		font-size: 7px;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		font-weight: 500;
	}
	.cap-text {
		font-family: var(--font-body);
		font-size: 11px;
		font-weight: 600;
		pointer-events: none;
		line-height: 1.3;
	}
	.cap-label-outside {
		font-family: var(--font-body);
		font-size: 9px;
		font-weight: 500;
		pointer-events: none;
	}

	.commit {
		cursor: pointer;
		transition: filter 200ms ease;
	}
	.commit.is-hovered {
		filter: drop-shadow(0 0 6px var(--c)) drop-shadow(0 0 3px var(--c));
	}

	.commit-tooltip {
		position: fixed;
		z-index: 200;
		pointer-events: none;
		transform: translate(-50%, calc(-100% - 18px));
		background: var(--bg-paper, #fff);
		border: 1px solid var(--tc);
		border-radius: var(--radius-md, 8px);
		padding: 12px 16px;
		max-width: 300px;
		min-width: 220px;
		box-shadow:
			0 0 0 1px color-mix(in srgb, var(--tc) 20%, transparent),
			0 8px 24px rgba(0, 0, 0, 0.14),
			0 0 20px color-mix(in srgb, var(--tc) 12%, transparent);
		animation: tt-in 140ms ease forwards;
	}
	@keyframes tt-in {
		from { opacity: 0; transform: translate(-50%, calc(-100% - 10px)); }
		to   { opacity: 1; transform: translate(-50%, calc(-100% - 18px)); }
	}
	.tt-title {
		font-family: var(--font-body);
		font-size: 13px;
		font-weight: 600;
		color: var(--tc);
		margin: 0 0 2px;
		line-height: 1.3;
	}
	.tt-dates {
		font-family: var(--font-mono, ui-monospace);
		font-size: 11px;
		color: var(--ink-mute);
		margin: 0 0 10px;
		letter-spacing: 0.04em;
	}
	.tt-details {
		margin: 0 0 10px;
		padding-left: 14px;
		list-style: disc;
	}
	.tt-details li {
		font-family: var(--font-body);
		font-size: 12px;
		color: var(--ink-deep);
		line-height: 1.5;
		margin-bottom: 3px;
	}
	.tt-tech {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}
	.tt-tech span {
		font-family: var(--font-mono, ui-monospace);
		font-size: 10px;
		padding: 2px 7px;
		border-radius: 100px;
		background: color-mix(in srgb, var(--tc) 14%, transparent);
		color: var(--tc);
		letter-spacing: 0.04em;
	}

	.vertical-list {
		display: none;
		flex-direction: column;
		gap: var(--space-6);
		list-style: none;
		padding: var(--space-6) var(--space-6);
		margin: 0;
		max-width: 680px;
		margin-inline: auto;
	}
	.v-commit {
		background: var(--bg-paper);
		border: 1px solid var(--line-hair);
		border-left: 3px solid var(--branch-color);
		border-radius: var(--radius-md);
		padding: var(--space-3) var(--space-4);
		opacity: 0;
		transform: translateY(10px);
		transition:
			opacity 480ms var(--ease-out),
			transform 480ms var(--ease-out),
			box-shadow 220ms ease,
			border-color 220ms ease;
		transition-delay: calc(var(--order) * 60ms);
	}
	.active .v-commit {
		opacity: 1;
		transform: translateY(0);
	}
	.v-commit:hover {
		box-shadow:
			0 0 0 1px var(--branch-color),
			0 4px 16px rgba(0, 0, 0, 0.08),
			0 0 16px color-mix(in srgb, var(--branch-color) 15%, transparent);
		border-color: var(--branch-color);
	}
	.v-commit header {
		display: flex;
		align-items: center;
		gap: var(--space-3);
		font-family: var(--font-body);
		font-size: var(--step--1);
		color: var(--ink-mute);
		letter-spacing: 0.16em;
		text-transform: uppercase;
		margin-bottom: var(--space-2);
		flex-wrap: wrap;
	}
	.v-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--branch-color);
	}
	.v-branch {
		font-weight: 500;
		color: var(--branch-color);
	}
	.v-dates {
		margin-left: auto;
		font-family: var(--font-mono, ui-monospace);
		letter-spacing: 0.08em;
		text-transform: none;
	}
	.v-commit h3 {
		margin: 0 0 var(--space-2);
		font-size: var(--step-0);
	}
	.v-summary {
		margin: 0;
		font-size: var(--step--1);
		color: var(--ink-mute);
		line-height: 1.55;
	}

	@media (max-width: 819px) {
		.graph-container {
			display: none;
		}
		.vertical-list {
			display: flex;
		}
		.commit-tooltip {
			display: none;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.commit {
			transition: none;
		}
		.commit-tooltip {
			animation: none;
		}
	}
</style>
