const CACHE = 'olsen-tribune-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/financial-markets.html',
  '/technology.html',
  '/healthcare.html',
  '/politics.html',
  '/analysis.html',
  '/archive.html',
  '/assets/styles.css',
  '/assets/scripts.js',
  '/assets/subpage.js',
  '/assets/theme.js',
  '/assets/archive.js',
  '/assets/icon.svg',
  '/manifest.json',
  '/feed.xml',
  '/assets/article-index.js',
  '/assets/articles/financial-markets.js',
  '/assets/articles/technology.js',
  '/assets/articles/healthcare.js',
  '/assets/articles/politics.js',
  '/assets/articles/analysis.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Article files: network-first so new articles appear immediately after daily update
  if (url.pathname.includes('/assets/articles/') || url.pathname.endsWith('article-index.js')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Everything else: cache-first for fast loads
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
