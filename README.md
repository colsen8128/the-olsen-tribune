# The Olsen Tribune

A professional business news website covering Financial Markets, Technology, Healthcare, Politics, and Analysis. Publishes new AI-written articles daily and updates market tickers automatically every weekday morning at 8 AM ET.

**Live site:** [colsen8128.github.io/the-olsen-tribune](https://colsen8128.github.io/the-olsen-tribune)

---

## Project Structure

```
the-olsen-tribune/
│
├── index.html                  # Homepage (hero + category sections + market snapshot)
├── financial-markets.html      # Financial Markets sub-page
├── technology.html             # Technology sub-page
├── healthcare.html             # Healthcare sub-page
├── politics.html               # Politics sub-page
├── analysis.html               # Analysis sub-page
├── archive.html                # Searchable article archive
│
├── assets/
│   ├── articles.js             # All article content (single source of truth)
│   ├── scripts.js              # Homepage routing, article reader, category sections
│   ├── subpage.js              # Shared logic for the 5 category sub-pages
│   ├── archive.js              # Archive page search and filter logic
│   ├── theme.js                # Dark mode toggle (runs in <head> to prevent flash)
│   └── styles.css              # All site styles (desktop + tablet + mobile + dark mode)
│
├── scripts/
│   ├── daily-update.js         # Daily automation script (articles + tickers + RSS feed)
│   ├── package.json            # Node.js dependencies
│   ├── .env                    # Your API keys (never committed to git)
│   └── .env.example            # Template — copy to .env and fill in keys
│
├── .github/
│   └── workflows/
│       └── daily.yml           # GitHub Actions workflow — runs daily-update.js at 8 AM ET
│
├── sw.js                       # Service worker (PWA offline support + caching)
├── manifest.json               # PWA manifest (installable on mobile/desktop)
├── feed.xml                    # RSS feed (auto-generated daily, 20 most recent articles)
├── .gitignore                  # Excludes .env and node_modules from git
└── README.md                   # This file
```

---

## How the Site Works

The site is entirely static — no server, no database. All article content lives in `assets/articles.js` as a JavaScript object. When a page loads, the browser runs JavaScript that reads from that object and renders the content dynamically.

- **Homepage** shows the 4 newest articles in the hero, plus the 3 most recent per category below
- **Sub-pages** filter articles by category and paginate at 10 per page
- **Archive** lets you search and filter all articles by keyword or category
- **Article reader** is a hash-based overlay (`index.html#slug`) — navigating to `index.html#fed-rate-cuts` opens that article
- **Dark mode** follows system preference automatically, with a manual toggle in the header
- **PWA** — the site is installable on mobile and desktop and works offline via service worker

---

## Adding Articles Manually

Open `assets/articles.js` and add a new entry inside the `ARTICLES` object. Every article follows this structure:

```js
'your-article-slug': {
  slug:     'your-article-slug',
  category: 'Financial Markets',   // must match exactly: Financial Markets,
                                    // Technology, Healthcare, Politics, Analysis
  date:     'April 20, 2026',
  readTime: '5 min read',
  author:   'By The Olsen Tribune',
  headline: 'Your Article Headline',
  deck:     'One sentence that summarizes the story.',
  tags:     ['Tag One', 'Tag Two', 'Tag Three'],
  pullquote: 'A compelling quote or sentence from the article.',
  body: [
    'First paragraph text...',
    'Second paragraph text...',
    'Third paragraph text...',
  ]
},
```

After saving, commit and push to GitHub — GitHub Pages redeploys automatically within a minute.

---

## Daily Automation

Every weekday at 8 AM ET the GitHub Actions workflow runs `scripts/daily-update.js`, which:

1. Fetches today's top headlines from **RSS feeds** (BBC, TechCrunch, Ars Technica, NPR, MarketWatch) — no API key required
2. Sends them to **Claude** (Anthropic API), which writes 2 original articles per category (10 total)
3. Appends the new articles to `assets/articles.js`
4. Rebuilds the **hero section** of `index.html` with the 4 newest articles
5. Fetches live market prices from **Finnhub** for all 14 ticker symbols
6. Updates the ticker bar in every HTML file
7. Regenerates `feed.xml` with the 20 most recent articles
8. Commits and pushes to GitHub so GitHub Pages redeploys the site

You can also trigger a run manually from the [Actions tab](https://github.com/colsen8128/the-olsen-tribune/actions/workflows/daily.yml) using **Run workflow**.

### First-Time Setup

**1. Install dependencies**
```bash
cd ~/Desktop/the-olsen-tribune/scripts
npm install
```

**2. Add API keys**
```bash
cp .env.example .env
# Open .env and paste in your Anthropic and Finnhub API keys
```

| Key | Where to get it | Cost |
|-----|----------------|------|
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com) | ~$0.10–$0.30/day |
| `FINNHUB_API_KEY` | [finnhub.io](https://finnhub.io) | Free |

**3. Add secrets to GitHub Actions**

Go to your repo → Settings → Secrets and variables → Actions and add:
- `ANTHROPIC_API_KEY`
- `FINNHUB_API_KEY`

**4. Test a manual run**

Trigger the workflow from the [Actions tab](https://github.com/colsen8128/the-olsen-tribune/actions/workflows/daily.yml) and watch the logs.

---

## Deployment

The site is hosted on **GitHub Pages** served directly from the `main` branch. Every `git push` triggers an automatic redeploy within ~1 minute.

```bash
git add -A
git commit -m "Your message"
git push
```

---

## Categories

| Category | Sub-page | RSS Sources |
|----------|----------|-------------|
| Financial Markets | financial-markets.html | BBC Business, MarketWatch |
| Technology | technology.html | TechCrunch, Ars Technica |
| Healthcare | healthcare.html | BBC Health, BBC Science |
| Politics | politics.html | NPR Politics, BBC US & Canada |
| Analysis | analysis.html | BBC Business, BBC US & Canada |
