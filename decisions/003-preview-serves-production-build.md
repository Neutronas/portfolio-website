# 003 — dev.ruzauskas.lt serves a production build, not the Vite dev server

**Decision**: `scripts/preview-server.mjs` (systemd user unit `ruzauskas-preview.service`, port 9070)
builds the site with `vite build` into `.preview-builds/<timestamp>`, atomically swaps the
`.preview` symlink, serves it, rebuilds on any change under `src/`, `static/` or config, and
pushes a reload to open tabs over Server-Sent Events. HTML is `no-cache`; `/_app/immutable/*`
is cached for a year (Cloudflare adds Brotli).

**Why**: The Vite dev server shipped ~113 unbundled, unminified requests (2 MB) through
Cloudflare on every load, and its dependency re-optimization once left a browser with a
half-swapped cached bundle (blank page). A production build is ~30 requests / ~470 KB cold,
~0 KB warm, and is exactly what ruzauskas.lt will serve. Rebuild takes ~7 s.

**Alternatives rejected**:
- Keep Vite dev + no-store caching — still slow, still dev-mode code.
- `vite build --watch` — SvelteKit prerender/adapter steps are not reliable in watch mode,
  and it writes into the served folder mid-build.
- `vite preview` — no rebuild / reload.

**Date**: 2026-09-12
