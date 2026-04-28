# The Olsen Tribune

A one-person newsletter on the business of pharmacy benefit managers.

**Live site:** [colsen8128.github.io/the-olsen-tribune](https://colsen8128.github.io/the-olsen-tribune)

---

## What this is

Each issue takes a single story breaking in the PBM space (FTC actions, Medicaid Best Price, formulary politics, manufacturer rebate flows, GLP-1 utilization, white bagging, 340B, the Big Three vs. the cost-plus upstarts) and sets out plainly what changes and what doesn't. Five-minute read. Primary sources. One author.

The site is intentionally simple: static HTML, one shared stylesheet, no build step, no framework, no database.

---

## Structure

```
the-olsen-tribune/
│
├── index.html          # Homepage (latest issue + subscribe + about preview)
├── article.html        # Issue No. 1 — "What the FTC actually locked in"
├── about.html          # About page (mission, methodology, contact)
├── archive.html        # Chronological list of all issues
│
├── assets/
│   ├── styles.css      # The single shared stylesheet for the entire site
│   ├── theme.js        # Light / dark mode toggle (runs in <head> to avoid flash)
│   └── icon.svg        # Favicon / app icon
│
├── manifest.json       # PWA manifest (installable on mobile/desktop)
├── feed.xml            # RSS feed
├── netlify.toml        # Netlify deployment config and security headers
├── .gitignore
└── README.md           # This file

research/               # Notes and source material used to write each issue.
                        # Not linked from the public site.
```

---

## How to publish a new issue

The site is fully static. Each issue is a self-contained HTML file that links back to the shared stylesheet, header, and nav. Adding an issue is three steps:

1. **Write the issue** as a new HTML file (e.g. `issue-2-medicaid-best-price.html`). Easiest way is to duplicate `article.html`, change the headline / deck / body, and update the meta tags and `<title>`.
2. **Update `archive.html`** by copying the template comment block already in the page and filling in the new issue number, date, topic, headline, deck, and href.
3. **Update `index.html`** by replacing the hero issue card with the new issue's details. If you want to surface a list of recent issues on the homepage, uncomment the placeholder block already in the file.

Then `git push`. GitHub Pages redeploys within a minute.

---

## Local preview

The site is plain static HTML. To preview locally:

```bash
# Python 3 (built in on macOS)
python3 -m http.server 8000

# or, with Node
npx serve .
```

Then open [http://localhost:8000](http://localhost:8000).

Or just double-click `index.html` to open it in the browser. Most things will work, though the email-signup `<form>` and a couple of relative paths render slightly more correctly when served over HTTP.

---

## Deployment

The site is hosted on **GitHub Pages** served directly from the `main` branch. Every `git push` triggers an automatic redeploy within ~1 minute.

```bash
git add -A
git commit -m "Issue No. N — short description"
git push
```

`netlify.toml` is included as an alternative deployment target. Connect this repo at [app.netlify.com](https://app.netlify.com) and Netlify will publish the same files with stricter security headers (HSTS, CSP, etc.) baked in.

---

## Subscribe form

The subscribe forms on `index.html`, `about.html`, `archive.html`, and `article.html` currently use a small inline JS handler that swaps the form for a thank-you message on submit. This is a placeholder. To wire up a real list, replace the `<form>` action with the endpoint from your newsletter platform (Substack, Beehiiv, Buttondown, ConvertKit, etc.) and remove the JS handler.

---

## Style and methodology

See [about.html](about.html) for the methodology statement that ships with the public site.
