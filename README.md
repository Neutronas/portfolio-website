# Lukas Ruzauskas — Portfolio Website

Personal portfolio site live at [ruzauskas.lt](https://ruzauskas.lt). A scroll-driven single-page experience split into three interactive paths: **Careers**, **Biography**, and **Projects**.

Built with SvelteKit + Svelte 5 (runes), GSAP scroll animations, and Leaflet maps. Deployed automatically to GitHub Pages on every push to `main`.

---

## Editing content

All copy lives in JSON files under [`src/lib/data/`](./src/lib/data/) — no code changes needed.

| File | What's in it |
|---|---|
| `contacts.json` | Name, tagline, email, social links |
| `careers.json` | Git-graph branches + commits (jobs, degrees, certs) |
| `biography.json` | Ordered life milestones, optional map coords per entry |
| `projects.json` | Chronological list of projects with tags + links |

### Adding a career entry

```jsonc
{
  "id": "unique-slug",
  "branch": "work",          // school | study | work | academia
  "from": "2024-03",
  "to": "2025-11",           // null = ongoing
  "title": "Company — Role",
  "summary": "Optional one-liner."
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
  // Omit "map" if no location.
}
```

### Adding a project

```jsonc
{
  "id": "unique-slug",
  "year": 2024,
  "title": "Project name",
  "tags": ["tag", "tag"],
  "summary": "One or two sentences.",
  "links": [{ "label": "GitHub", "href": "https://..." }]
}
```

### Styling

Design tokens (colors, type scale, spacing) are CSS custom properties in [`src/app.css`](./src/app.css). The bronze accent (`--accent-bronze`) runs across all three paths.

---

## Development

Requirements: **Node 20+**, **npm 10+**

```bash
npm install
npm run dev        # http://localhost:5173
npm run check      # TypeScript + Svelte type-check
npm run build      # static output → build/
npm run preview    # serve build/ locally
```

---

## Deployment

Pushes to `main` automatically build and deploy to GitHub Pages via the workflow in [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml). The live URL is [ruzauskas.lt](https://ruzauskas.lt).

### Custom domain

The `static/CNAME` file points GitHub Pages to `ruzauskas.lt`. DNS setup required at your registrar:

| Type | Name | Value |
|---|---|---|
| `A` | `@` | `185.199.108.153` |
| `A` | `@` | `185.199.109.153` |
| `A` | `@` | `185.199.110.153` |
| `A` | `@` | `185.199.111.153` |
| `CNAME` | `www` | `neutronas.github.io` |

### Social preview

Drop a 1200×630 JPG into `static/og.jpg` — already referenced by `<meta property="og:image">`.

---

## Stack

- **SvelteKit 2** + **Svelte 5** (runes) + `@sveltejs/adapter-static`
- **GSAP 3** + ScrollTrigger — lazy-loaded per path
- **Leaflet 1.9** + CartoDB Positron tiles — lazy-loaded near viewport
- `@fontsource-variable/fraunces` (display) + `@fontsource-variable/inter` (body)
- TypeScript, fully prerendered to static HTML

## Architecture

```
src/
├── routes/
│   ├── +layout.svelte        fonts, skip-link shell
│   ├── +layout.ts            prerender = true
│   └── +page.svelte          single page; path driven by appState
└── lib/
    ├── data/*.json            all editable content
    ├── components/
    │   ├── Hero.svelte
    │   ├── PathSelector.svelte
    │   ├── PathNav.svelte
    │   ├── careers/           GitGraph SVG + CareersPath
    │   ├── biography/         GSAP pin + horizontal scrub + Leaflet maps
    │   ├── projects/          snap-scroll carousel
    │   ├── ending/            WhatsNext ("?" + email + replay)
    │   └── ui/                Reveal, ScrollHint, MetalDivider
    ├── stores/path.svelte.ts  runes state + URL-hash sync
    └── utils/                 lazy GSAP + lazy Leaflet loaders
```

### Accessibility

- `prefers-reduced-motion` removes scroll animations; content still flows.
- Biography horizontal scroll collapses to vertical stack below 820 px.
- Careers graph switches to vertical card list on mobile.
- Arrow keys navigate the Projects carousel. Skip-to-content link + bronze focus rings throughout.
