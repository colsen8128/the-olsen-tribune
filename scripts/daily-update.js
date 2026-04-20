/**
 * daily-update.js — The Olsen Tribune
 *
 * Runs every morning at 8 AM ET to:
 *   1. Pull today's top headlines from NewsAPI (a licensed aggregator that
 *      surfaces stories from Bloomberg, NYT, Reuters, WSJ, etc.)
 *   2. Send those headlines to the Claude API, which writes 2 original,
 *      publication-quality articles per category
 *   3. Append the new articles to assets/articles.js
 *   4. Fetch previous-day closing prices from Yahoo Finance
 *   5. Rewrite the ticker bar in every HTML file with fresh prices
 *   6. Git commit + push so Netlify auto-redeploys the live site
 *
 * Requirements:
 *   - Node.js 18 or later (built-in fetch is used — no extra HTTP library needed)
 *   - Run `npm install` inside the scripts/ folder before first use
 *   - Copy .env.example to .env and fill in your API keys
 */

// ES module imports — Node 18+ supports these natively.
// "type": "module" in package.json activates ESM mode for this folder,
// which is required by yahoo-finance2 v2 (it is an ESM-only package).

// path / fs / vm — built-in Node modules
import path            from 'path';
import fs              from 'fs';
import vm              from 'vm';
// execFileSync — runs git commands without going through a shell (safer than execSync)
import { execFileSync } from 'child_process';

// dotenv — reads the .env file and loads KEY=VALUE pairs into process.env
import dotenv from 'dotenv';
dotenv.config({ path: path.join(import.meta.dirname, '.env') });

// Official Anthropic SDK — wraps the Claude REST API into simple function calls
import Anthropic from '@anthropic-ai/sdk';

// yahoo-finance2 — fetches market prices from Yahoo Finance without a paid API key.
// The default export is a class, so we instantiate it to access methods like .quote()
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance();
// Suppress the one-time survey prompt that would otherwise print to the log
yahooFinance.suppressNotices(['yahooSurvey']);


// ─────────────────────────────────────────────────────────────────────────────
//  CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

// Absolute path to the project root (the folder above scripts/).
// import.meta.dirname is the ESM equivalent of __dirname.
const ROOT = path.resolve(import.meta.dirname, '..');

// How many milliseconds to wait before giving up on a network request.
// Without this, a hung server would stall the script indefinitely.
const FETCH_TIMEOUT_MS = 15_000; // 15 seconds

// The five site categories, each mapped to the closest NewsAPI topic.
// NewsAPI supports: business, entertainment, general, health, science, technology.
// The script fetches 10 top US headlines per category as inspiration for Claude.
const CATEGORIES = [
  { name: 'Financial Markets', gNewsCategory: 'business'    },
  { name: 'Technology',        gNewsCategory: 'technology'  },
  { name: 'Healthcare',        gNewsCategory: 'health'      },
  { name: 'Politics',          gNewsCategory: 'nation'      },
  // Analysis draws from business headlines but asks Claude for a deeper angle
  { name: 'Analysis',          gNewsCategory: 'business'    },
];

// Market symbols to update in the ticker bar.
// yf     — Yahoo Finance symbol used to fetch the data
// isBond — true for the 10-Year Treasury, which displays a yield level (%) and
//          change in percentage-points rather than a price and % change
const TICKER_SYMBOLS = [
  { sym: 'S&amp;P 500', yf: '^GSPC',   isBond: false },
  { sym: 'DJIA',        yf: '^DJI',    isBond: false },
  { sym: 'NASDAQ',      yf: '^IXIC',   isBond: false },
  { sym: 'AAPL',        yf: 'AAPL',    isBond: false },
  { sym: 'MSFT',        yf: 'MSFT',    isBond: false },
  { sym: 'AMZN',        yf: 'AMZN',    isBond: false },
  { sym: 'TSLA',        yf: 'TSLA',    isBond: false },
  { sym: 'BTC',         yf: 'BTC-USD', isBond: false },
  { sym: '10Y',         yf: '^TNX',    isBond: true  },
  { sym: 'WTI',         yf: 'CL=F',    isBond: false },
  { sym: 'GOLD',        yf: 'GC=F',    isBond: false },
  { sym: 'NVDA',        yf: 'NVDA',    isBond: false },
  { sym: 'GOOGL',       yf: 'GOOGL',   isBond: false },
  { sym: 'META',        yf: 'META',    isBond: false },
];

// Every HTML file on the site that contains a ticker bar.
// The script will rewrite all of them with the same fresh prices.
const HTML_FILES = [
  'index.html',
  'financial-markets.html',
  'technology.html',
  'healthcare.html',
  'politics.html',
  'analysis.html',
  'archive.html',
];


// ─────────────────────────────────────────────────────────────────────────────
//  HELPER — fetch with a hard timeout
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wraps the built-in fetch() with an AbortController timeout.
 *
 * Without a timeout, if NewsAPI or Yahoo Finance's servers hang without
 * sending a response, Node.js will wait forever and the daily run will
 * never complete. AbortController lets us cancel the request after a set
 * number of milliseconds and throw a clear error instead.
 */
async function fetchWithTimeout(url, options = {}) {
  // AbortController is the standard web API for cancelling fetch requests.
  // Calling controller.abort() signals the fetch to stop immediately.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    // Pass the abort signal into fetch so it knows to listen for cancellation
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (err) {
    // Re-throw with a clearer message so the log is easier to read
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out after ${FETCH_TIMEOUT_MS / 1000}s: ${url}`);
    }
    throw err;
  } finally {
    // Always clear the timer — if the request succeeded we don't want the
    // timer firing later and aborting something unrelated
    clearTimeout(timer);
  }
}


// ─────────────────────────────────────────────────────────────────────────────
//  STEP 1 — Fetch headlines from NewsAPI
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calls the NewsAPI /top-headlines endpoint for a given topic and returns
 * a plain text list of "title: description" lines.
 *
 * We pass only titles and descriptions to Claude — never full article bodies —
 * so that Claude writes completely original content rather than paraphrasing
 * copyrighted text.
 */
async function fetchHeadlines(gNewsCategory) {
  // GNews free tier works from any server (unlike NewsAPI which blocks non-localhost).
  // Parameters:
  //   category — one of GNews's topic buckets
  //   lang=en  — English articles only
  //   country=us — US sources only
  //   max=10   — fetch 10 headlines (free tier allows up to 10 per request)
  const url =
    `https://gnews.io/api/v4/top-headlines` +
    `?category=${gNewsCategory}` +
    `&lang=en` +
    `&country=us` +
    `&max=10` +
    `&apikey=${process.env.GNEWS_API_KEY}`;

  const res  = await fetchWithTimeout(url);
  const data = await res.json();

  if (!data.articles) {
    throw new Error(`GNews error for "${gNewsCategory}": ${data.errors?.[0] ?? 'unknown error'}`);
  }

  return data.articles
    .filter(a => a.title && a.description)
    .map(a => `- ${a.title}: ${a.description}`)
    .join('\n');
}


// ─────────────────────────────────────────────────────────────────────────────
//  STEP 2 — Ask Claude to write 2 original articles
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Strips markdown code fences from a string.
 *
 * Despite the instruction "return ONLY the raw JSON array", Claude occasionally
 * wraps its output in ```json ... ```. JSON.parse would throw on those backticks,
 * so we remove any opening or closing fence lines before parsing.
 */
function stripCodeFences(text) {
  return text
    .replace(/^```[a-z]*\n?/i, '') // opening fence, e.g. ```json
    .replace(/\n?```$/,        '') // closing fence
    .trim();
}

/**
 * Validates that an article object from Claude has all required fields with
 * the correct types, and sanitizes the slug.
 *
 * Why validate? Claude's output is external data — just like user input or
 * an API response. If a field is missing or the wrong type, writing the
 * broken object to articles.js could corrupt the file or break the site.
 *
 * Throws if the article is structurally invalid so the caller can skip it
 * rather than silently writing garbage to disk.
 */
function validateAndSanitizeArticle(a, expectedCategory) {
  // Check that every required field exists and has the right type
  const requiredStrings = ['slug', 'headline', 'deck', 'author', 'date', 'readTime', 'pullquote'];
  for (const field of requiredStrings) {
    if (typeof a[field] !== 'string' || !a[field].trim()) {
      throw new Error(`Article is missing or has empty field: "${field}"`);
    }
  }
  if (!Array.isArray(a.body) || a.body.length < 3) {
    throw new Error(`Article body must be an array with at least 3 paragraphs`);
  }
  if (!Array.isArray(a.tags)) {
    throw new Error(`Article tags must be an array`);
  }

  // Force the category to exactly match what we requested — Claude should
  // already do this, but we enforce it to prevent any mismatch
  a.category = expectedCategory;

  // Sanitize the slug: keep only lowercase letters, numbers, and hyphens.
  // This prevents a malformed slug from breaking the JS object key syntax
  // or being used in a way that could affect file paths or URLs unexpectedly.
  a.slug = a.slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-') // replace anything unsafe with a hyphen
    .replace(/-+/g, '-')          // collapse consecutive hyphens into one
    .replace(/^-|-$/g, '');       // trim leading/trailing hyphens

  if (!a.slug) {
    throw new Error('Article slug is empty after sanitization');
  }

  // Trim all string fields so stray whitespace doesn't appear on the site
  for (const field of requiredStrings) {
    a[field] = a[field].trim();
  }
  a.body = a.body.map(p => (typeof p === 'string' ? p.trim() : '')).filter(Boolean);
  a.tags = a.tags.map(t => (typeof t === 'string' ? t.trim() : '')).filter(Boolean);

  return a;
}

/**
 * Sends today's headlines to Claude along with detailed instructions about
 * the article format. Claude returns a JSON array of 2 article objects,
 * which we parse, validate, and return.
 */
async function generateArticles(client, category, headlines) {
  // Format today's date the same way the rest of the site uses it (e.g. "April 19, 2026")
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  // A unique numeric suffix appended to slugs so that two articles written
  // on the same day can never accidentally share a slug
  const uniqueSuffix = Date.now();

  const prompt = `You are a senior financial journalist writing for The Olsen Tribune, a professional business news publication similar to the Wall Street Journal.

Based on the following real headlines from today's news, write 2 original, publication-quality articles for the "${category}" section.
Do NOT copy or closely paraphrase the headlines — use them only as inspiration. Write your own original analysis and reporting.

TODAY'S HEADLINES:
${headlines}

Return a JSON array with exactly 2 article objects. Each object must match this exact schema:
{
  "slug": "kebab-case-slug-${uniqueSuffix}",
  "category": "${category}",
  "date": "${today}",
  "readTime": "X min read",
  "author": "By The Olsen Tribune",
  "headline": "The article headline",
  "deck": "One sentence that expands on the headline and draws the reader in",
  "tags": ["Tag1", "Tag2", "Tag3"],
  "pullquote": "A compelling sentence pulled from the body or an attributed quote",
  "body": [
    "First paragraph — 150 to 200 words...",
    "Second paragraph...",
    "Third paragraph...",
    "Fourth paragraph...",
    "Fifth paragraph..."
  ]
}

Rules:
- body must have at least 5 paragraphs, each between 100 and 200 words
- slug must be lowercase, hyphens only, no special characters (e.g. "fed-holds-rates-${uniqueSuffix}")
- Return ONLY the raw JSON array — no markdown code fences, no explanation text`;

  // Send the prompt to Claude. We use the most capable model for best writing quality.
  const message = await client.messages.create({
    model:      'claude-opus-4-7',
    max_tokens: 4096,
    messages:   [{ role: 'user', content: prompt }],
  });

  // Claude's response is in message.content — an array of content blocks.
  // We grab the text from the first block, strip any accidental code fences,
  // and parse it as JSON.
  const raw      = message.content[0].text.trim();
  const cleaned  = stripCodeFences(raw);
  const articles = JSON.parse(cleaned);

  if (!Array.isArray(articles)) {
    throw new Error('Claude did not return a JSON array');
  }

  // Validate and sanitize every article before returning it.
  // If one article fails validation, skip it and log the reason rather than
  // discarding both articles or writing a broken one to disk.
  const valid = [];
  for (const a of articles) {
    try {
      valid.push(validateAndSanitizeArticle(a, category));
    } catch (err) {
      console.warn(`  ⚠ Skipping one article (failed validation): ${err.message}`);
    }
  }

  return valid;
}


// ─────────────────────────────────────────────────────────────────────────────
//  STEP 3 — Format and append new articles to assets/articles.js
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converts a single article object into the JavaScript source string
 * used inside the ARTICLES object in articles.js.
 *
 * Using JSON.stringify for every string value ensures that quotes,
 * newlines, and special characters are properly escaped automatically.
 */
function formatArticleEntry(a) {
  const lines = [];

  // Opening line: the article's slug becomes the object key
  lines.push(`  ${JSON.stringify(a.slug)}: {`);
  lines.push(`    slug: ${JSON.stringify(a.slug)},`);
  lines.push(`    category: ${JSON.stringify(a.category)},`);
  lines.push(`    date: ${JSON.stringify(a.date)},`);
  lines.push(`    readTime: ${JSON.stringify(a.readTime)},`);
  lines.push(`    author: ${JSON.stringify(a.author)},`);
  lines.push(`    headline: ${JSON.stringify(a.headline)},`);
  lines.push(`    deck: ${JSON.stringify(a.deck)},`);
  // tags is an array — JSON.stringify handles the brackets and quoting
  lines.push(`    tags: ${JSON.stringify(a.tags)},`);
  lines.push(`    pullquote: ${JSON.stringify(a.pullquote)},`);

  // body is an array of paragraph strings — write each on its own line
  lines.push(`    body: [`);
  for (const para of a.body) {
    lines.push(`      ${JSON.stringify(para)},`);
  }
  lines.push(`    ]`);

  // Closing brace — no trailing comma here. Commas between entries are added
  // by appendArticlesToFile so we never accidentally produce a double-comma
  // on subsequent runs.
  lines.push(`  }`);

  return lines.join('\n');
}

/**
 * Reads articles.js, inserts new article entries before the closing };,
 * and writes the file back atomically (write → rename, never partial overwrite).
 *
 * The ARTICLES object in articles.js ends with:
 *   }         ← closes the last article
 * };          ← closes the ARTICLES object
 *
 * We add a comma after the last article's closing brace, then insert
 * the new entries, then restore the closing };
 */
function appendArticlesToFile(articles) {
  const filePath = path.join(ROOT, 'assets', 'articles.js');
  let src = fs.readFileSync(filePath, 'utf8');

  // ── Duplicate slug check ──────────────────────────────────────────────────
  // If the script is run twice in one day, Claude may produce the same slug.
  // Writing a duplicate key to articles.js would silently overwrite the first
  // article in JavaScript (last key wins). We skip any duplicates instead.
  const deduped = articles.filter(a => {
    // The slug appears as a quoted key followed by ': {' in the file
    const alreadyExists = src.includes(`'${a.slug}':`) || src.includes(`"${a.slug}":`);
    if (alreadyExists) {
      console.warn(`  ⚠ Skipping duplicate slug: "${a.slug}"`);
    }
    return !alreadyExists;
  });

  if (deduped.length === 0) {
    console.log('  ⚠ All articles were duplicates — nothing written.');
    return;
  }

  // Join entries with ,\n\n so each article is separated from the next by a
  // comma (required JS object syntax) and a blank line (readability).
  // The comma that separates the *previous* last article from the first new
  // entry is added by the replacement below — never by formatArticleEntry itself.
  const newEntries = deduped.map(formatArticleEntry).join(',\n\n');

  // ── SECURITY FIX: use a function as the replacement, not a string ─────────
  // JavaScript's String.replace() treats special patterns in the replacement
  // string literally:
  //   $&  → inserts the matched text
  //   $'  → inserts the text after the match
  //   $`  → inserts the text before the match
  //
  // If Claude wrote a paragraph containing "$&" (e.g. "the S&P $& component"),
  // passing that text as a replacement string would silently corrupt articles.js
  // — the file would still parse as valid JS but with wrong content.
  //
  // When the replacement is a function, its return value is used as-is with
  // no special pattern substitution, making this completely safe regardless
  // of what characters the articles contain.
  const updated = src.replace(/\n\};\s*$/, () => `,\n\n${newEntries}\n\n};`);

  // ── Verify the replacement actually happened ──────────────────────────────
  // If articles.js was manually edited and no longer ends with `\n};`, the
  // regex above won't match. `updated` would equal `src` and the articles
  // would be silently lost. We detect this and throw rather than write nothing.
  if (updated === src) {
    throw new Error(
      'Could not find the closing }; in articles.js — file may have been manually edited. ' +
      'Ensure the file ends with a newline followed by };'
    );
  }

  // ── Atomic write: temp file → rename ─────────────────────────────────────
  // Writing directly to articles.js means a crash mid-write leaves a
  // partially-written, broken file. Writing to a temp file first and then
  // renaming is atomic on the same filesystem: the rename either fully
  // succeeds or leaves the original file untouched.
  const tmpPath = filePath + '.tmp';
  fs.writeFileSync(tmpPath, updated, 'utf8');
  fs.renameSync(tmpPath, filePath);

  console.log(`  ✓ Appended ${deduped.length} articles to assets/articles.js`);
}


// ─────────────────────────────────────────────────────────────────────────────
//  STEP 3b — Rebuild the hero section of index.html with the latest articles
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Escapes characters that have special meaning in HTML.
 * Used when injecting article content into the hero HTML.
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Reads articles.js, finds the 4 most recent articles across all categories,
 * and builds the hero section HTML — one lead story and three secondaries.
 *
 * Uses Node's vm module to evaluate articles.js in a sandboxed context so we
 * can access the ARTICLES object without importing it as an ES module.
 */
async function updateHero() {
  try {
    const filePath = path.join(ROOT, 'assets', 'articles.js');
    const src = fs.readFileSync(filePath, 'utf8');

    const ctx = {};
    vm.runInNewContext(src, ctx);
    const articles = Object.values(ctx.ARTICLES || {});

    if (articles.length === 0) {
      console.log('  ⚠ No articles found — skipping hero update');
      return;
    }

    // Sort all articles newest-first and take top 4
    const sorted = articles.sort((a, b) => new Date(b.date) - new Date(a.date));
    const [lead, ...secondaries] = sorted.slice(0, 4);

    const secondaryHtml = secondaries.map(a => `
          <div class="hero-secondary" data-nav="${escapeHtml(a.slug)}">
            <div class="kicker">${escapeHtml(a.category)}</div>
            <h3>${escapeHtml(a.headline)}</h3>
            <p class="excerpt">${escapeHtml(a.deck)}</p>
          </div>`).join('\n');

    const heroHtml = `  <section class="hero">
    <div class="container">
      <div class="hero-inner">

        <!-- Lead story -->
        <div class="hero-lead" data-nav="${escapeHtml(lead.slug)}">
          <div class="kicker">${escapeHtml(lead.category)} &middot; ${escapeHtml(lead.date)}</div>
          <h2>${escapeHtml(lead.headline)}</h2>
          <p class="deck">${escapeHtml(lead.deck)}</p>
          <div class="byline"><strong>${escapeHtml(lead.author)}</strong><span>${escapeHtml(lead.readTime)}</span></div>
        </div>

        <!-- Secondary stack -->
        <div class="hero-stack">
${secondaryHtml}
        </div>

      </div>
    </div>
  </section>`;

    const indexPath = path.join(ROOT, 'index.html');
    let html = fs.readFileSync(indexPath, 'utf8');

    const updated = html.replace(
      /<!-- HERO-START -->[\s\S]*?<!-- HERO-END -->/,
      () => `<!-- HERO-START -->\n${heroHtml}\n  <!-- HERO-END -->`
    );

    if (updated === html) {
      console.log('  ⚠ Hero markers not found in index.html — skipping hero update');
      return;
    }

    fs.writeFileSync(indexPath, updated, 'utf8');
    console.log('  ✓ Updated hero section in index.html');
  } catch (err) {
    console.warn('  ⚠ Hero update failed:', err.message);
  }
}


// ─────────────────────────────────────────────────────────────────────────────
//  STEP 4 — Fetch market closing prices from Yahoo Finance
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Loops through every symbol in TICKER_SYMBOLS, fetches its most recent
 * price and percentage change from Yahoo Finance, and returns a map of
 * display symbol → { displayPrice, changeStr, isUp }.
 */
async function fetchMarketData() {
  const results = {};

  for (const t of TICKER_SYMBOLS) {
    try {
      // quote() returns a rich object. The fields we care about:
      //   regularMarketPrice          — the last traded price
      //   regularMarketChangePercent  — % change from previous close (e.g. 0.24 = +0.24%)
      //   regularMarketChange         — absolute change (used for the 10Y yield)
      const q = await yahooFinance.quote(t.yf);

      // Guard against Yahoo Finance returning null/undefined for a price —
      // this can happen for thinly-traded instruments or during maintenance
      const price = q.regularMarketPrice;
      if (price == null) {
        throw new Error('regularMarketPrice is null or undefined');
      }

      if (t.isBond) {
        // For the 10-Year Treasury we show the yield level (e.g. "4.42%")
        // and the change in percentage points (e.g. "+0.04"), not a % change
        const change    = q.regularMarketChange ?? 0;
        const isUp      = change >= 0;
        const changeStr = (isUp ? '+' : '') + change.toFixed(2);
        results[t.sym] = { displayPrice: price.toFixed(2) + '%', changeStr, isUp };
      } else {
        const pct  = q.regularMarketChangePercent ?? 0;
        const isUp = pct >= 0;

        // Format the price with appropriate precision:
        // - Bitcoin and Gold (> 10,000): whole number with commas
        // - Everything else: two decimal places
        const displayPrice = price >= 10_000
          ? Math.round(price).toLocaleString('en-US')
          : price.toFixed(2);

        const changeStr = (isUp ? '+' : '') + pct.toFixed(2) + '%';
        results[t.sym] = { displayPrice, changeStr, isUp };
      }
    } catch (err) {
      // One failed symbol shouldn't stop the rest — log a warning and continue
      console.warn(`  ⚠ Could not fetch ${t.sym} (${t.yf}): ${err.message}`);
    }
  }

  return results;
}


// ─────────────────────────────────────────────────────────────────────────────
//  STEP 5 — Rewrite ticker HTML in every HTML file
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Escapes characters that have special meaning in a regular expression.
 * Needed because ticker symbols like "S&amp;P 500" contain characters
 * (& ; space) that would break a regex pattern if used literally.
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * For each HTML file, finds every ticker-item matching a known symbol and
 * replaces the price, change value, and up/down CSS class with fresh data.
 *
 * The ticker HTML looks like this (all on one line):
 *   <div class="ticker-item">
 *     <span class="ticker-sym">AAPL</span>
 *     <span class="ticker-val">256.01</span>
 *     <span class="up">+0.24%</span>
 *   </div>
 *
 * Because each symbol appears TWICE in the ticker (the strip loops for
 * continuous scrolling), the regex uses the g flag to replace both occurrences.
 */
function updateTickers(marketData) {
  for (const fileName of HTML_FILES) {
    const filePath = path.join(ROOT, fileName);
    if (!fs.existsSync(filePath)) continue;

    let html = fs.readFileSync(filePath, 'utf8');

    for (const [sym, data] of Object.entries(marketData)) {
      const upDown = data.isUp ? 'up' : 'down';

      // The regex captures 7 groups so we can surgically replace only the
      // price, the up/down class, and the change value while leaving everything
      // else — class names, tag structure — exactly as it is:
      //  g1 — opening span tags up to and including the start of the price
      //  g2 — the old price value (discarded)
      //  g3 — </span><span class=" (bridge between price and change spans)
      //  g4 — the old "up" or "down" class name (replaced with fresh direction)
      //  g5 — "> (closing of the class attribute)
      //  g6 — the old change value (discarded)
      //  g7 — </span></div> (closing tags)
      const pattern = new RegExp(
        `(<span class="ticker-sym">${escapeRegex(sym)}<\\/span><span class="ticker-val">)` +
        `([^<]*)` +
        `(<\\/span><span class=")` +
        `(up|down)` +
        `(">)` +
        `([^<]*)` +
        `(<\\/span><\\/div>)`,
        'g'
      );

      // Using a function replacement (not a string) for the same reason as in
      // appendArticlesToFile — market data values like "+0.24%" could in theory
      // start with $ and trigger special substitution patterns. A function
      // return value is always used literally, with no pattern processing.
      html = html.replace(
        pattern,
        (_match, g1, _g2, g3, _g4, g5, _g6, g7) =>
          `${g1}${data.displayPrice}${g3}${upDown}${g5}${data.changeStr}${g7}`
      );
    }

    fs.writeFileSync(filePath, html, 'utf8');
  }

  console.log(`  ✓ Updated tickers in ${HTML_FILES.length} HTML files`);
}


// ─────────────────────────────────────────────────────────────────────────────
//  STEP 5b — Generate RSS feed (feed.xml)
// ─────────────────────────────────────────────────────────────────────────────

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateFeed() {
  try {
    const filePath = path.join(ROOT, 'assets', 'articles.js');
    const src = fs.readFileSync(filePath, 'utf8');
    const ctx = {};
    vm.runInNewContext(src, ctx);

    const articles = Object.values(ctx.ARTICLES || {})
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 20);

    const baseUrl  = 'https://colsen8128.netlify.app';
    const buildDate = new Date().toUTCString();

    const items = articles.map(a => {
      const url     = `${baseUrl}/index.html#${escapeXml(a.slug)}`;
      const pubDate = new Date(a.date).toUTCString();
      return `    <item>
      <title>${escapeXml(a.headline)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(a.deck)}</description>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(a.category)}</category>
    </item>`;
    }).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>The Olsen Tribune</title>
    <link>${baseUrl}</link>
    <description>Daily business intelligence — markets, technology, healthcare, politics, and analysis.</description>
    <language>en-us</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

    fs.writeFileSync(path.join(ROOT, 'feed.xml'), xml, 'utf8');
    console.log(`  ✓ Generated RSS feed with ${articles.length} articles`);
  } catch (err) {
    console.warn('  ⚠ RSS feed generation failed:', err.message);
  }
}


// ─────────────────────────────────────────────────────────────────────────────
//  STEP 6 — Commit and push so Netlify redeploys the site
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Stages the changed files, creates a dated commit, and pushes to the
 * remote. Netlify's git integration detects the push and rebuilds the site
 * automatically — no manual deploy needed.
 */
function gitCommitAndPush(articleCount) {
  const today = new Date().toISOString().slice(0, 10); // "2026-04-19"
  const msg   = `Daily update ${today}: ${articleCount} new articles + ticker refresh`;

  // ── SECURITY FIX: execFileSync instead of execSync ────────────────────────
  // execSync("git commit -m \"" + msg + "\"") passes the command through /bin/sh.
  // That means any shell metacharacter in a variable — backtick, semicolon,
  // $(...) — would be interpreted by the shell and could run arbitrary commands.
  //
  // execFileSync bypasses the shell entirely: the first argument is the binary
  // to run and the array contains the exact arguments passed to it. No shell
  // expansion ever happens, regardless of what characters the values contain.
  execFileSync('git', ['add', 'assets/articles.js', 'feed.xml', ...HTML_FILES], { cwd: ROOT, stdio: 'inherit' });
  execFileSync('git', ['commit', '-m', msg],                        { cwd: ROOT, stdio: 'inherit' });
  execFileSync('git', ['push'],                                      { cwd: ROOT, stdio: 'inherit' });

  console.log(`  ✓ Pushed: "${msg}"`);
}


// ─────────────────────────────────────────────────────────────────────────────
//  MAIN — orchestrates all steps in order
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n=== Olsen Tribune Daily Update — ${new Date().toLocaleString()} ===\n`);

  // Check that both API keys exist before doing any work.
  // If a key is missing, print a helpful message and exit with a non-zero
  // code so the OS logs the failure.
  const required = ['GNEWS_API_KEY', 'ANTHROPIC_API_KEY'];
  for (const key of required) {
    if (!process.env[key]) {
      console.error(`\nMissing required environment variable: ${key}`);
      console.error('Copy scripts/.env.example to scripts/.env and fill in your keys.\n');
      process.exit(1);
    }
  }

  // Create the Anthropic API client once and reuse it for all article calls
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const allNewArticles = [];

  // ── Article generation (one category at a time) ───────────────────────────
  for (const cat of CATEGORIES) {
    console.log(`Generating articles for: ${cat.name}`);
    try {
      // Fetch headlines first…
      const headlines = await fetchHeadlines(cat.gNewsCategory);
      console.log(`  ✓ Fetched ${headlines.split('\n').length} headlines from NewsAPI`);

      // …then ask Claude to write 2 original articles based on them…
      const articles = await generateArticles(anthropic, cat.name, headlines);
      console.log(`  ✓ Claude wrote ${articles.length} valid articles`);

      // …then immediately write them to disk so a failure in a later category
      // doesn't lose the work already done
      appendArticlesToFile(articles);
      allNewArticles.push(...articles);

      // Brief pause between categories to stay well within API rate limits
      await new Promise(r => setTimeout(r, 1500));
    } catch (err) {
      // Log the error for this category but keep going — one failure
      // shouldn't prevent the other categories from being published
      console.error(`  ✗ Failed to generate articles for "${cat.name}":`, err.message);
    }
  }

  // ── Hero update ───────────────────────────────────────────────────────────
  console.log('\nUpdating hero section...');
  await updateHero();

  // ── Ticker update ─────────────────────────────────────────────────────────
  console.log('\nUpdating market tickers...');
  try {
    const marketData = await fetchMarketData();
    updateTickers(marketData);
  } catch (err) {
    console.error('  ✗ Ticker update failed:', err.message);
  }

  // ── RSS feed ──────────────────────────────────────────────────────────────
  console.log('\nGenerating RSS feed...');
  generateFeed();

  // ── Git push ──────────────────────────────────────────────────────────────
  if (allNewArticles.length > 0) {
    console.log('\nPushing changes to git...');
    try {
      gitCommitAndPush(allNewArticles.length);
    } catch (err) {
      console.error('  ✗ Git push failed:', err.message);
      console.error('    To push manually: git add assets/articles.js *.html && git commit -m "Daily update" && git push');
    }
  } else {
    console.log('\nNo articles were written — skipping git push.');
  }

  console.log('\n=== Done ===\n');
}

// Start the script. If anything unhandled throws, log it and exit with
// a failure code so the OS knows the run didn't complete successfully.
main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
