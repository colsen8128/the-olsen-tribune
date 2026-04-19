# The Olsen Tribune

A professional business news website covering Financial Markets, Technology, Healthcare, Politics, and Analysis. Publishes new AI-written articles daily and updates market tickers automatically every morning at 8 AM ET.

**Live site:** [colsen8128.netlify.app](https://colsen8128.netlify.app) *(update this once your custom domain is set)*

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
│   └── styles.css              # All site styles (desktop + tablet + mobile)
│
├── scripts/
│   ├── daily-update.js         # Daily automation script (articles + tickers)
│   ├── package.json            # Node.js dependencies
│   ├── .env                    # Your API keys (never committed to git)
│   ├── .env.example            # Template — copy to .env and fill in keys
│   ├── run-daily.sh            # Shell wrapper called by the scheduler
│   └── com.olsentribune.daily.plist  # macOS launchd scheduler (8 AM ET daily)
│
├── netlify.toml                # Netlify deployment config + security headers
├── .gitignore                  # Excludes .env and node_modules from git
└── README.md                   # This file
```

---

## How the Site Works

The site is entirely static — no server, no database. All article content lives in `assets/articles.js` as a JavaScript object. When a page loads, the browser runs JavaScript that reads from that object and renders the content dynamically.

- **Homepage** reads the 3 most recent articles per category and renders them into section containers
- **Sub-pages** filter articles by category and paginate at 10 per page
- **Archive** lets you search and filter all articles
- **Article reader** is a hash-based overlay (`index.html#slug`) — navigating to `index.html#fed-rate-cuts` opens that article

---

## Adding Articles Manually

Open `assets/articles.js` and add a new entry inside the `ARTICLES` object. Every article follows this structure:

```js
'your-article-slug': {
  slug:     'your-article-slug',
  category: 'Financial Markets',   // must match exactly: Financial Markets,
                                    // Technology, Healthcare, Politics, Analysis
  date:     'April 19, 2026',
  readTime: '5 min read',
  author:   'By Chris Olsen',
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

After saving, commit and push to GitHub — Netlify redeploys automatically.

---

## Daily Automation

Every morning at 8 AM ET the `scripts/daily-update.js` script runs automatically and:

1. Fetches today's top headlines from **NewsAPI** (covers Bloomberg, NYT, Reuters, WSJ)
2. Sends them to **Claude** (Anthropic API), which writes 2 original articles per category (10 total)
3. Appends the new articles to `assets/articles.js`
4. Fetches previous-day closing prices from **Yahoo Finance** for all 14 market symbols
5. Updates the ticker bar in every HTML file
6. Commits and pushes to GitHub so Netlify redeploys the site

### First-Time Setup

**1. Install dependencies**
```bash
cd ~/Desktop/the-olsen-tribune/scripts
npm install
```

**2. Add API keys**
```bash
cp .env.example .env
# Open .env and paste in your NewsAPI and Anthropic API keys
```

| Key | Where to get it | Cost |
|-----|----------------|------|
| `NEWS_API_KEY` | newsapi.org/register | Free (100 req/day) |
| `ANTHROPIC_API_KEY` | console.anthropic.com | ~$0.10–$0.30/day |

**3. Install the scheduler**
```bash
cp com.olsentribune.daily.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.olsentribune.daily.plist
```

**4. Test it immediately**
```bash
launchctl start com.olsentribune.daily
tail -f /tmp/olsen-tribune-daily.log
```

**To uninstall the scheduler:**
```bash
launchctl unload ~/Library/LaunchAgents/com.olsentribune.daily.plist
```

---

## Deployment

The site is hosted on **Netlify** connected to this GitHub repository. Every `git push` to `main` triggers an automatic redeploy (usually within 30 seconds).

**Manual deploy steps:**
```bash
git add -A
git commit -m "Your message"
git push
```

Security headers (CSP, HSTS, X-Frame-Options, etc.) are configured in `netlify.toml` and applied by Netlify's CDN on every response.

---

## Categories

| Category | Sub-page | NewsAPI Feed |
|----------|----------|-------------|
| Financial Markets | financial-markets.html | business |
| Technology | technology.html | technology |
| Healthcare | healthcare.html | health |
| Politics | politics.html | general |
| Analysis | analysis.html | business |

---

## Log Files

When the daily script runs, output is written to:
- `/tmp/olsen-tribune-daily.log` — progress and results
- `/tmp/olsen-tribune-daily.err` — errors and warnings
