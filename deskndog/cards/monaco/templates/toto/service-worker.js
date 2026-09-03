// service-worker.js — toto · offline shell cache (PWA)
// relative paths so it works at any base: github pages subpath, ozhunga, or root.

const CACHE = 'toto-v4';
const SHELL = [
  './',
  './index.html',
  './models.js',
  './chat.js',
  './settings.js',
  './icons/home.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
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
  // only same-origin GET — model API calls are cross-origin and pass straight through
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      const fresh = fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
      return cached || fresh;
    })
  );
});
