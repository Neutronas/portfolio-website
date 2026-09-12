# Redesign plan — 3D desk "main menu" (branch `redesign`)

Preview: https://dev.ruzauskas.lt (live Vite dev server of whatever branch is checked out).

## Concept
Full-screen night-time 3D scene: desk, two monitors, keyboard, mouse, lamp, PC tower,
photo frame, resume papers, coffee mug with cartoon eyes. Game main-menu UI bottom-left
(title + menu list + key hints). Menu items open in-page panels (hash routes `#career`,
`#projects`, `#biography`, `#contact`); GitHub / LinkedIn / Resume open externally.

Mouse reactions: monitors turn slightly toward cursor, mug eyes track cursor + blink,
lamp head (and its spotlight) follows cursor over the desk, desk mouse mirrors real
mouse, keyboard keys press while the left monitor "types" code, camera parallax.
Scene objects are clickable and map to menu items; selected item previews on right monitor.

## Architecture
- `src/lib/scene/` — vanilla three.js (lazy-loaded): `DeskScene.ts` (renderer, loop,
  input, camera fit), `models.ts` (procedural models), `screens.ts` (canvas textures).
- `src/lib/components/game/` — `MainMenu`, `Panel`, panel contents, `Loader`.
- Content stays in `src/lib/data/*.json` (single source).
- Menu + panels are real DOM (prerendered → SEO, keyboard, screen readers). Canvas is decoration.

## Steps
- [x] 1. Branch + dev preview + noindex
- [x] 2. Deps: three, @types/three, Oxanium font
- [x] 3. Scene: models + lighting + camera fit (screenshot check)
- [x] 4. Mouse reactions (monitors, eyes, lamp, mouse, parallax, keys)
- [x] 5. Screens: code typing (left), menu preview (right)
- [x] 6. Menu UI + keyboard navigation + hover/click object mapping
- [x] 7. Panels: career, projects, biography, contact
- [x] 8. Mobile / reduced motion / no-WebGL fallback / perf (adaptive DPR, bloom off)
- [x] 9. `npm run check` + `npm run build` clean, commit

Object ↔ menu mapping: left monitor = Projects, right monitor = Career, mug = Contact,
PC tower = GitHub, photo frame = Biography, papers = Resume.

## Open / next ideas
- Old routes `/careers`, `/biography`, `/projects` still exist (old light design) — delete or redirect once happy.
- Old home components (`Hero`, `PathSelector`) now unused.
- Optional: UI sounds (hover blip), more props (plant, headphones), OG image of the scene.

## Screenshot check (headless, WebGL via SwiftShader)
`node <scratch>/shot.mjs http://127.0.0.1:9070/ out.png 1440 900 [mx,my] [key:ArrowDown,wait:500]`
uses Playwright from `/home/neutronas/twc-brochure/node_modules`.
