<script lang="ts">
	import { onMount } from 'svelte';
	import careers from '$lib/data/careers.json';
	import { loadGsap, prefersReducedMotion } from '$lib/utils/gsap';

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

	const width = 2400;
	const height = 680;
	const padLeft = 160;
	const padRight = 160;
	const padTop = 50;
	const padBottom = 110;
	const chartW = width - padLeft - padRight;
	const chartH = height - padTop - padBottom;

	// Reversed X: newest (maxDate) on the LEFT, oldest (minDate) on the RIGHT.
	const xForDate = (d: Date) => padLeft + ((+maxDate - +d) / span) * chartW;

	const laneCount = careers.branches.length;
	const laneSlot = chartH / laneCount;
	const laneBaseY = (idx: number) => padTop + laneSlot * (idx + 0.5);
	const subLaneGap = 46;

	const timelineY = height - padBottom;
	const nowX = xForDate(now);

	const years: number[] = [];
	for (let y = minDate.getFullYear(); y < maxDate.getFullYear(); y++) years.push(y);

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
	};

	// Sort by start date ascending so sub-lane assignment is deterministic.
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
		const capsW = Math.max(Math.abs(xFrom - xTo), 14);
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
			isOngoing: c.to === null
		};
	});

	// Mobile list: newest first.
	const commitsDesc = [...commitsWithGeom].sort(
		(a, b) => +toDate(b.from) - +toDate(a.from)
	);

	const formatRange = (from: string, to: string | null) => {
		const f = toDate(from);
		const t = to ? toDate(to) : null;
		const fmt = (d: Date) =>
			d.toLocaleString('en-GB', { month: 'short', year: 'numeric' });
		return `${fmt(f)} — ${t ? fmt(t) : 'present'}`;
	};

	let pinEl: HTMLDivElement | null = $state(null);
	let trackEl: HTMLDivElement | null = $state(null);
	let sectionEl: HTMLDivElement | null = $state(null);
	let active = $state(false);

	// Hover tooltip state
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

		if (!pinEl || !trackEl) return () => io.disconnect();
		const mq = window.matchMedia('(min-width: 820px)');
		if (prefersReducedMotion() || !mq.matches) return () => io.disconnect();

		let cleanup: () => void = () => io.disconnect();
		(async () => {
			const gsap = await loadGsap();
			const { ScrollTrigger } = await import('gsap/ScrollTrigger');

			if (!trackEl || !pinEl) return;
			const getScroll = () => {
				if (!trackEl) return 0;
				return Math.max(0, trackEl.scrollWidth - window.innerWidth);
			};

			const tween = gsap.to(trackEl, {
				x: () => -getScroll(),
				ease: 'none',
				scrollTrigger: {
					trigger: pinEl,
					pin: true,
					scrub: 0.8,
					anticipatePin: 1,
					end: () => `+=${getScroll()}`,
					invalidateOnRefresh: true
				}
			});

			cleanup = () => {
				tween.scrollTrigger?.kill();
				tween.kill();
				ScrollTrigger.getAll().forEach((s) => s.kill());
				io.disconnect();
			};
		})();

		return () => cleanup();
	});
</script>

<div class="graph-wrap" bind:this={sectionEl} class:active>
	<div class="pin" bind:this={pinEl}>
		<div class="track" bind:this={trackEl}>
			<svg
				class="graph-svg"
				viewBox="0 0 {width} {height}"
				preserveAspectRatio="xMidYMid meet"
				aria-label="Careers timeline"
				role="img"
			>
				<defs>
					<pattern id="lane-rail" x="0" y="0" width="8" height="1" patternUnits="userSpaceOnUse">
						<rect width="4" height="1" fill="var(--line-hair)" />
					</pattern>
				</defs>

				<!-- Lanes -->
				{#each careers.branches as b, i (b.id)}
					<text
						x={padLeft - 20}
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

				<!-- Time axis (reversed: new on left, old on right) -->
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
						y1={timelineY - 4}
						y2={timelineY + 4}
						stroke="var(--ink-mute)"
						opacity="0.5"
					/>
					<text x={x} y={timelineY + 26} class="year-label" text-anchor="middle">{y}</text>
				{/each}

				<!-- "Now" marker (leftmost side) -->
				<line
					x1={nowX}
					x2={nowX}
					y1={padTop - 10}
					y2={timelineY}
					stroke="var(--accent-bronze)"
					stroke-dasharray="4 4"
					opacity="0.45"
				/>
				<text
					x={nowX}
					y={padTop - 18}
					class="now-label"
					text-anchor="middle"
					fill="var(--accent-bronze)"
				>
					now
				</text>

				<!-- Commits -->
				{#each commitsWithGeom as c (c.id)}
					{@const isHovered = hoveredId === c.id}
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
						aria-label="{c.title} · {formatRange(c.from, c.to)}"
					>
						<!-- Connector from capsule down to time axis -->
						<path
							d="M {c.xFrom} {c.y} C {c.xFrom} {(c.y + timelineY) / 2}, {c.xFrom} {timelineY - 16}, {c.xFrom} {timelineY}"
							fill="none"
							stroke={c.color}
							stroke-width="1"
							opacity={isHovered ? 0.55 : 0.28}
							stroke-dasharray="3 3"
						/>
						<!-- Capsule -->
						<rect
							x={c.capsX}
							y={c.y - 7}
							width={c.capsW}
							height={14}
							rx={7}
							fill={c.color}
							opacity={isHovered ? 1 : 0.92}
						/>
						<!-- Start node (from) -->
						<circle
							cx={c.xFrom}
							cy={c.y}
							r={isHovered ? 7 : 5.5}
							fill="var(--bg-paper)"
							stroke={c.color}
							stroke-width="1.75"
						/>
						<!-- End node / ongoing arrow (to), pointing LEFT toward future -->
						{#if c.isOngoing}
							<polygon
								points="{c.xTo - 8},{c.y} {c.xTo + 4},{c.y - 6} {c.xTo + 4},{c.y + 6}"
								fill={c.color}
							/>
						{:else}
							<circle cx={c.xTo} cy={c.y} r={isHovered ? 6 : 4.5} fill={c.color} />
						{/if}
						<!-- Title — centered above the capsule -->
						<text
							x={c.capsX + c.capsW / 2}
							y={c.y - 14}
							class="commit-title"
							fill={isHovered ? c.color : 'var(--ink-deep)'}
							text-anchor="middle"
						>
							{c.title}{c.isOngoing ? ' (current)' : ''}
						</text>
					</g>
				{/each}
			</svg>
		</div>
	</div>

	<!-- Tooltip overlay (desktop, fixed-position) -->
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

	<!-- Mobile fallback: vertical cards, newest first. -->
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
	.pin {
		height: 100vh;
		display: flex;
		align-items: center;
		overflow: hidden;
		background:
			radial-gradient(
				ellipse 60% 50% at 50% 50%,
				rgba(111, 199, 221, 0.08) 0%,
				transparent 70%
			);
	}
	.track {
		display: flex;
		align-items: center;
		padding: 0 6vw;
		will-change: transform;
	}
	.graph-svg {
		flex: 0 0 auto;
		display: block;
		width: 2400px;
		height: 680px;
		background: var(--bg-paper);
		border-radius: var(--radius-lg);
		border: 1px solid var(--line-hair);
		padding: var(--space-5);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 8px 24px -12px rgba(0, 0, 0, 0.08);
	}
	.lane-label {
		font-family: var(--font-body);
		font-size: 14px;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		font-weight: 500;
	}
	.year-label {
		font-family: var(--font-mono, ui-monospace);
		font-size: 13px;
		fill: var(--ink-mute);
	}
	.now-label {
		font-family: var(--font-body);
		font-size: 12px;
		letter-spacing: 0.24em;
		text-transform: uppercase;
		font-weight: 500;
	}
	.commit-title {
		font-family: var(--font-body);
		font-size: 13px;
		font-weight: 500;
		pointer-events: none;
		white-space: nowrap;
		transition: fill 180ms ease;
	}

	/* Commit hover: glow via CSS custom property set inline */
	.commit {
		cursor: pointer;
		transition: filter 200ms ease;
	}
	.commit.is-hovered {
		filter: drop-shadow(0 0 10px var(--c)) drop-shadow(0 0 4px var(--c));
	}

	/* Tooltip */
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

	/* Mobile list */
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
		.pin {
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
		.pin {
			height: auto;
			overflow: visible;
			padding: var(--space-8) 0;
		}
		.track {
			transform: none !important;
			padding: 0 var(--space-6);
			overflow-x: auto;
		}
		.commit {
			transition: none;
		}
		.commit-tooltip {
			animation: none;
		}
	}
</style>
