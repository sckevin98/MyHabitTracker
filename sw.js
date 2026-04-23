// MyHabits service worker — offline-first cache
// Bump CACHE_VERSION to force clients to pick up new files.
const CACHE_VERSION = 'v1';
const CACHE_NAME = `myhabits-${CACHE_VERSION}`;

// Same-origin assets to pre-cache on install.
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './icon-maskable.svg',
  './android-frame.jsx',
  './store.jsx',
  './ui.jsx',
  './today.jsx',
  './habit-editor.jsx',
  './habit-detail.jsx',
  './widgets.jsx',
  './stats-settings.jsx',
  './tweaks-panel.jsx',
  './app.jsx',
];

// CDN assets used by the page. Cached opportunistically on first fetch.
const CDN_HOSTS = ['unpkg.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isCdn = CDN_HOSTS.includes(url.hostname);
  if (!sameOrigin && !isCdn) return;

  // Cache-first for everything we manage. Fall back to network,
  // then populate the cache so subsequent loads work offline.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        // Only cache successful, basic/cors responses.
        if (res && (res.status === 200 || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => cached); // offline + not cached -> undefined
    })
  );
});
