# Copilot / AI Agent Instructions for this repository

Purpose
- Provide concise, actionable guidance so an AI coding agent can be immediately productive.

Big picture
- This repository is a minimal static site: see [index.html](index.html). There is no build system, package.json, or framework present.
- Primary artifact: `index.html` (single-page). New assets (CSS, images, JS) are expected to be added as sibling files or in a top-level `assets/` folder.

Developer workflows (how to run / preview)
- Quick preview (macOS): `open index.html` — opens the file in the default browser.
- Local static server (recommended for JS/CORS/History testing):
  - Python 3: `python3 -m http.server 8000` then visit http://localhost:8000
  - Node: `npx serve .` if `npm` is available.
- No test runner is configured. If tests are added, they will be documented in this file.

Project-specific conventions and patterns
- Single-file layout: treat `index.html` as the canonical entrypoint. Small changes (visual, copy, markup) should be made directly in that file.
- Assets: prefer a top-level `assets/` directory for images, styles, and scripts. Keep references in `index.html` relative and path-consistent.
- No build step: do not introduce a build system without adding clear scripts to `package.json` and updating these instructions.

Integration points & external dependencies
- There are no declared external dependencies. If you add external libraries, add a `package.json` and include install/run instructions here.
- If integrating third-party APIs, include credentials only via a secure secrets mechanism (do not commit secrets to repo).

When editing as an AI agent
- Make minimal, focused changes and explain each change in a PR description.
- For markup edits, show diffs in the PR and include a one-line test instruction (e.g., "Open http://localhost:8000 and verify header text").
- If adding JS/CSS files, update `index.html` with relative links and add a brief usage note in this file.

Examples (common tasks)
- Add a new stylesheet `assets/site.css` and link it in `index.html`:
  1. Create `assets/site.css`.
  2. Add `<link rel="stylesheet" href="assets/site.css">` inside the `<head>` of [index.html](index.html).

- Add a tiny dev script (optional):
  1. Create `package.json` with a `start` script: `"start": "serve . -l 8000"`.
  2. Document the script here and in README.

If you find other agent guidance files
- Merge their concise actionable points here (preserve examples/commands). Remove duplicated or outdated instructions.

Questions or missing context
- Ask the repository owner which browsers to prioritize, whether to add a CI/build system, and where to place long-term docs (README vs docs/).

— End of file
