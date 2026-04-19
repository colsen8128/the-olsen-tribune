// Set header date
document.getElementById('headerDate').textContent =
  new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

// ── Event delegation: navigation clicks ─────────────────
document.addEventListener('click', function (e) {
  const navEl = e.target.closest('[data-nav]');
  if (navEl) {
    e.preventDefault();
    navigateTo(navEl.dataset.nav);
    return;
  }
  const homeEl = e.target.closest('[data-go-home]');
  if (homeEl) {
    e.preventDefault();
    goHome();
  }
});

// ── Category config (homepage sections + sub-page URLs) ──
const CATEGORY_CONFIG = [
  { name: 'Financial Markets', url: 'financial-markets.html', id: 'home-financial-markets' },
  { name: 'Technology',        url: 'technology.html',        id: 'home-technology'        },
  { name: 'Healthcare',        url: 'healthcare.html',        id: 'home-healthcare'        },
  { name: 'Politics',          url: 'politics.html',          id: 'home-politics'          },
  { name: 'Analysis',          url: 'analysis.html',          id: 'home-analysis'          }
];

// ── Homepage category sections ───────────────────────────
function renderHomepageSections() {
  CATEGORY_CONFIG.forEach(function (cat) {
    const container = document.getElementById(cat.id);
    if (!container) return;

    // Section header
    const header = document.createElement('div');
    header.className = 'cat-section-header';
    const nameEl = document.createElement('span');
    nameEl.className = 'cat-section-name';
    nameEl.textContent = cat.name;
    const viewAll = document.createElement('a');
    viewAll.className = 'cat-section-viewall';
    viewAll.href = cat.url;
    viewAll.textContent = 'View all \u2192';
    header.appendChild(nameEl);
    header.appendChild(viewAll);
    container.appendChild(header);

    // Filter and sort 3 most recent
    const articles = Object.values(ARTICLES)
      .filter(function (a) { return a.category === cat.name; })
      .sort(function (a, b) { return new Date(b.date) - new Date(a.date); })
      .slice(0, 3);

    if (articles.length === 0) {
      const placeholder = document.createElement('p');
      placeholder.className = 'cat-placeholder';
      placeholder.textContent = 'No articles published yet in this category. Check back soon.';
      container.appendChild(placeholder);
      return;
    }

    articles.forEach(function (a) {
      const row = document.createElement('div');
      row.className = 'story-row';
      row.setAttribute('data-nav', a.slug);

      const meta = document.createElement('div');
      meta.className = 'story-meta';
      const catSpan = document.createElement('span');
      catSpan.className = 'cat';
      catSpan.textContent = a.category;
      const dateSpan = document.createElement('span');
      dateSpan.textContent = a.date;
      meta.appendChild(catSpan);
      meta.appendChild(dateSpan);

      const headline = document.createElement('div');
      headline.className = 'story-headline';
      headline.textContent = a.headline;

      const excerpt = document.createElement('div');
      excerpt.className = 'story-excerpt';
      excerpt.textContent = a.deck;

      row.appendChild(meta);
      row.appendChild(headline);
      row.appendChild(excerpt);
      container.appendChild(row);
    });
  });
}

// ── Newsletter forms ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  renderHomepageSections();

  const nlInline = document.getElementById('nl-inline-form');
  if (nlInline) {
    nlInline.addEventListener('submit', function (e) {
      e.preventDefault();
      const p = document.createElement('p');
      p.className = 'nl-success';
      p.textContent = "You're in. Welcome.";
      this.replaceWith(p);
    });
  }

  const nlBand = document.getElementById('nl-band-form');
  if (nlBand) {
    nlBand.addEventListener('submit', function (e) {
      e.preventDefault();
      const p = document.createElement('p');
      p.className = 'nl-success-band';
      p.textContent = 'Welcome aboard. Check your inbox.';
      this.replaceWith(p);
    });
  }
});

// ── Router ───────────────────────────────────────────────
let currentSlug = null;

function navigateTo(slug) {
  window.location.hash = slug;
}

function goHome() {
  window.location.hash = '';
  return false;
}

function renderArticle(slug) {
  const a = ARTICLES[slug];
  if (!a) { hideArticle(); return; }
  currentSlug = slug;

  const keys = Object.keys(ARTICLES);
  const idx  = keys.indexOf(slug);
  const prev = idx > 0             ? ARTICLES[keys[idx - 1]] : null;
  const next = idx < keys.length - 1 ? ARTICLES[keys[idx + 1]] : null;

  const wrap = document.getElementById('articleBodyWrap');
  wrap.innerHTML = '';

  // Back button
  const backBtn = document.createElement('button');
  backBtn.className = 'art-back-btn';
  backBtn.setAttribute('data-go-home', '');
  backBtn.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>';
  backBtn.appendChild(document.createTextNode(' All Stories'));
  wrap.appendChild(backBtn);

  // Kicker
  const kicker = document.createElement('div');
  kicker.className = 'art-kicker';
  kicker.textContent = a.category;
  wrap.appendChild(kicker);

  // Headline
  const headline = document.createElement('h1');
  headline.className = 'art-headline';
  headline.textContent = a.headline;
  wrap.appendChild(headline);

  // Deck
  const deck = document.createElement('div');
  deck.className = 'art-deck';
  deck.textContent = a.deck;
  wrap.appendChild(deck);

  // Byline
  const byline = document.createElement('div');
  byline.className = 'art-byline';
  const authorSpan = document.createElement('span');
  authorSpan.className = 'a-author';
  authorSpan.textContent = a.author;
  const dateSpan = document.createElement('span');
  dateSpan.className = 'a-date';
  dateSpan.textContent = a.date;
  const readSpan = document.createElement('span');
  readSpan.className = 'a-read';
  readSpan.textContent = a.readTime;
  byline.appendChild(authorSpan);
  byline.appendChild(dateSpan);
  byline.appendChild(readSpan);
  wrap.appendChild(byline);

  // Body
  const content = document.createElement('div');
  content.className = 'art-content';
  a.body.forEach(function (text) {
    const p = document.createElement('p');
    p.textContent = text;
    content.appendChild(p);
  });
  wrap.appendChild(content);

  // Rule
  const rule = document.createElement('hr');
  rule.className = 'art-rule';
  wrap.appendChild(rule);

  // Tags
  const tagsDiv = document.createElement('div');
  tagsDiv.className = 'art-tags';
  a.tags.forEach(function (t) {
    const span = document.createElement('span');
    span.className = 'art-tag';
    span.textContent = t;
    tagsDiv.appendChild(span);
  });
  wrap.appendChild(tagsDiv);

  // Prev/Next nav
  const nav = document.createElement('div');
  nav.className = 'art-nav';

  if (prev) {
    const prevLink = document.createElement('div');
    prevLink.className = 'art-nav-link';
    prevLink.setAttribute('data-nav', keys[idx - 1]);
    const prevDir = document.createElement('div');
    prevDir.className = 'art-nav-dir';
    prevDir.textContent = '\u2190 Previous';
    const prevTitle = document.createElement('div');
    prevTitle.className = 'art-nav-title';
    prevTitle.textContent = prev.headline;
    prevLink.appendChild(prevDir);
    prevLink.appendChild(prevTitle);
    nav.appendChild(prevLink);
  } else {
    nav.appendChild(document.createElement('div'));
  }

  if (next) {
    const nextLink = document.createElement('div');
    nextLink.className = 'art-nav-link';
    nextLink.setAttribute('data-nav', keys[idx + 1]);
    const nextDir = document.createElement('div');
    nextDir.className = 'art-nav-dir';
    nextDir.textContent = 'Next \u2192';
    const nextTitle = document.createElement('div');
    nextTitle.className = 'art-nav-title';
    nextTitle.textContent = next.headline;
    nextLink.appendChild(nextDir);
    nextLink.appendChild(nextTitle);
    nav.appendChild(nextLink);
  } else {
    nav.appendChild(document.createElement('div'));
  }

  wrap.appendChild(nav);

  document.body.classList.add('article-open');
  window.scrollTo(0, 0);
  document.title = a.headline + ' \u2014 The Olsen Tribune';
}

function hideArticle() {
  currentSlug = null;
  document.body.classList.remove('article-open');
  document.title = 'The Olsen Tribune \u2014 Business News & Analysis';
  window.scrollTo(0, 0);
}

function handleHash() {
  const slug = window.location.hash.replace('#', '');
  if (slug && ARTICLES[slug]) renderArticle(slug);
  else hideArticle();
}

window.addEventListener('hashchange', handleHash);
window.addEventListener('DOMContentLoaded', handleHash);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(function () {});
}
