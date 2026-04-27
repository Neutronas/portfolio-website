# ruzauskas2

A premium, scroll-driven personal site for Lukas Ruzauskas. Three paths — Careers, Biography, Projects — each rendered as a distinct interactive experience, all from a single static page.

---

## Editing content (no code required)

All copy lives in JSON files under [`src/lib/data/`](./src/lib/data/). Edit the file, save, and the page updates. Commit when happy.

| File | What's in it |
|---|---|
| `contacts.json` | Name, tagline, email, social links |
| `careers.json` | Git-graph branches + commits (jobs, degrees, certs) |
| `biography.json` | Ordered life milestones, optional map coords per entry |
| `projects.json` | Chronological list of projects with tags + links |

### Adding a career commit

```jsonc
{
  "id": "unique-slug",
  "branch": "work", // one of: school | study | work | academia
  "from": "2024-03",
  "to": "2025-11",  // or null if ongoing
  "title": "Company — Role",
  "summary": "Optional one-liner explaining the work."
}
```

### Adding a biography milestone

```jsonc
{
  "id": "unique-slug",
  "year": 2024,
  "title": "What happened",
  "body": "Short paragraph.",
  "map": { "lat": 54.898, "lng": 23.904, "zoom": 11, "label": "Kaunas" }
  // Omit "map" (or set to null) if this milestone has no location.
}
```

### Adding a project

```jsonc
{
  "id": "unique-slug",
  "year": 2024,
  "title": "Project name",
  "tags": ["tag", "tag"],
  "summary": "One or two sentences about what it is.",
  "links": [
    { "label": "GitHub", "href": "https://..." }
  ]
}
```

### Branding

Colors, type scale and spacing are CSS custom properties in [`src/app.css`](./src/app.css). The single accent (`--accent-bronze`) shows up across every path.

---

## Development

```bash
npm install
npm run dev          # http://localhost:5173
npm run check        # TypeScript + Svelte type-check
npm run build        # static output in build/
npm run preview      # serve build/ locally
```

Requirements: Node 20+, npm 10+.

---

## Deployment

`npm run build` produces a plain static `build/` folder. It works on any static host:

- **Netlify** — drag `build/` onto [Netlify Drop](https://app.netlify.com/drop), or point Netlify at this repo (build command `npm run build`, publish directory `build`).
- **Vercel** — connect the repo; Vercel detects SvelteKit automatically.
- **Cloudflare Pages** — build command `npm run build`, output directory `build`.
- **GitHub Pages** — push `build/` to the `gh-pages` branch, or use an Action.

A single-page app fallback (`index.html`) is included so hash-based deep links (`#careers`, `#biography`, `#projects`) work from a cold load on any host.

### Social preview image

Optional. Drop a 1200×630 JPG into `static/og.jpg` — it's already referenced from `<meta property="og:image">`. Without it, the build just warns (not errors).

---

## Architecture at a glance

```
src/
├── routes/
│   ├── +layout.svelte     Fonts, skip-link shell
│   ├── +layout.ts         prerender = true; ssr = true
│   └── +page.svelte       Single page; picks path from appState
├── lib/
│   ├── data/*.json        All editable content
│   ├── components/
│   │   ├── Hero.svelte
│   │   ├── PathSelector.svelte
│   │   ├── PathNav.svelte
│   │   ├── careers/
│   │   │   ├── CareersPath.svelte
│   │   │   └── GitGraph.svelte   Custom SVG
│   │   ├── biography/
│   │   │   ├── BiographyPath.svelte   GSAP pin + horizontal scrub
│   │   │   ├── MilestoneCard.svelte
│   │   │   └── MapSnapshot.svelte     Lazy Leaflet
│   │   ├── projects/
│   │   │   ├── ProjectsPath.svelte    Snap-scroll carousel
│   │   │   └── ProjectCard.svelte
│   │   ├── ending/
│   │   │   └── WhatsNext.svelte       "?" + email + replay
│   │   └── ui/            Reveal, ScrollHint, MetalDivider
│   ├── stores/
│   │   └── path.svelte.ts  Runes state + URL-hash sync
│   └── utils/
│       ├── gsap.ts         Lazy GSAP + ScrollTrigger
│       └── leaflet.ts      Lazy Leaflet + CartoDB tiles
└── app.css                 Design tokens (Ivory & Ink)
```

### Stack

- SvelteKit 2 + Svelte 5 (runes) + `@sveltejs/adapter-static`
- GSAP 3 + ScrollTrigger (dynamically imported per-path)
- Leaflet 1.9 + CartoDB Positron tiles (dynamically imported when a map card is near viewport)
- `@fontsource-variable/fraunces` (display) + `@fontsource-variable/inter` (body) — self-hosted
- TypeScript, prerendered to static HTML

### Motion & accessibility

- `prefers-reduced-motion: reduce` removes scroll-scrubbed animations; content flows normally.
- Desktop Biography uses pinned horizontal scroll; below 820px it collapses to a vertical stack.
- Careers graph renders as SVG on desktop, as a vertical card list on mobile.
- Keyboard: arrow keys advance/rewind the Projects carousel. Skip-to-content link at top. Bronze focus rings.
