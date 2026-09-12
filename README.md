# Lukas Ružauskas — ruzauskas.lt

Personal site: a full-screen 3D desk scene (three.js) with a game-style main menu.
Menu items open in-page panels; everything is prerendered so search engines and
screen readers get all content without WebGL.

## Editing content

All copy lives in JSON under [`src/lib/data/`](./src/lib/data/):

| File | What's in it |
|---|---|
| `contacts.json` | Name, tagline, focus line, email, social links |
| `careers.json` | Jobs and education (Career panel, right-monitor preview) |
| `projects.json` | Projects with tags and links (Projects panel) |
| `biography.json` | Life milestones + photos (Biography panel — easter egg via the desk photo) |

Resume: replace `static/Lukas_Ruzauskas.pdf` (shown in the Resume panel via pdf.js, with download).
Search metadata (title, description, Open Graph, JSON-LD) is in `src/routes/+page.svelte`.

## Structure

```
src/
├── routes/
│   ├── +page.svelte              home: scene + menu + panels + SEO head
│   └── careers|biography|projects/  redirects to /#career etc. (old URLs)
└── lib/
    ├── scene/                    three.js scene, procedural models, monitor screens
    ├── components/game/          MainMenu, Panel, panel contents, ResumeViewer, Scene
    ├── game/                     menu items, previews, pdf.js loader
    └── data/*.json               content
scripts/preview-server.mjs        dev.ruzauskas.lt preview (prod build + auto-rebuild + live reload)
```

Desk objects are clickable: left monitor = Projects, right monitor = Career,
mug = Contact, papers = Resume, photo frame = Biography, PC tower = GitHub.

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm run check      # type-check
npm run build      # static output -> build/
```

Pushes to `main` deploy to GitHub Pages ([`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml)).
Work-in-progress branches are previewed at https://dev.ruzauskas.lt (noindex).

## Stack

SvelteKit 2 + Svelte 5 (runes), `@sveltejs/adapter-static`, three.js, pdf.js,
Oxanium + Inter variable fonts.
