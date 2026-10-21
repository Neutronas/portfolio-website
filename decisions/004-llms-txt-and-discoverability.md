# 004 — llms.txt generated from site data

**Decision:** Serve `/llms.txt` as a prerendered SvelteKit endpoint built from `contacts.json`, `careers.json` and `projects.json`; link it from `<head>` and the sitemap; add `neutronas.eu` to Person `sameAs`.

**Why:** Make the profile easy for AI assistants and crawlers to read without running the 3D scene's JavaScript, and keep it in sync with the page automatically.

**Alternatives rejected:** Hand-written `static/llms.txt` (drifts from the page data). An "open to relocation" line (would publicly signal a job search while employed).

**Date:** 2026-10-21
