# 001 — Branch preview via live dev server at dev.ruzauskas.lt

**Decision**: Work-in-progress changes live on a git branch (`redesign`). A Vite dev server (`ruzauskas-dev.service`, systemd user unit, port 9070, HMR) serves the checked-out branch, proxied by nginx at `dev.ruzauskas.lt`. When happy, merge to `main`; the GitHub Pages workflow deploys `main` to ruzauskas.lt.

**Why**: Edits show up instantly without a build step, and the preview is reachable from any device. Production is untouched because `deploy.yml` only runs on push to `main`.

**Alternatives rejected**:
- GitHub Pages preview per branch — Pages serves one site per repo; would need a second repo or workflow juggling.
- `vite preview` of a static build — needs a rebuild after every change.

**Date**: 2026-09-12
