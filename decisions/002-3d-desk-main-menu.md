# 002 — Home page as a 3D desk scene with a game-style main menu

**Decision**: The home page is a full-screen three.js scene (desk, two monitors, keyboard,
mouse, lamp, PC tower, photo frame, resume papers, a coffee mug with eyes), built entirely
from primitives in code (`src/lib/scene/`). A game main menu sits bottom-left; menu items open
in-page panels via SvelteKit shallow routing (`pushState('#career', { panel })`), external
items (Resume, GitHub, LinkedIn) open in a new tab. Scene objects are clickable shortcuts to
the same items, and the right monitor previews the selected item.

**Why**:
- Procedural models: no asset pipeline, no licensing, tiny download, every part can react
  to the cursor (monitor pivots, eye balls, lamp head, keys).
- Menu and panels are real DOM, prerendered: search engines, keyboard and screen readers get
  all content; the canvas is `aria-hidden` decoration. three.js is lazy-loaded so it never
  blocks first paint; without WebGL the menu still works over a flat backdrop.
- Vanilla three.js instead of Threlte: one imperative class is easier to tune for this
  kind of scene and keeps dependencies minimal.
- Adapter fallback changed from `index.html` to `404.html` — the old value overwrote the
  prerendered home page with an empty SPA shell (bad for SEO, existing bug on production).

**Alternatives rejected**:
- Downloaded GLTF models — heavier, licensing, harder to animate individual parts.
- Panels as separate routes — breaks the "never leave the menu" game feel.
- Threlte — nicer Svelte integration, but an extra layer for a single scene.

**Date**: 2026-09-12
