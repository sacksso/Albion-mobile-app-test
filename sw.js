// Service Worker — AlbionTools v6
const CACHE = 'albion-v6';

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './items-db.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== CACHE ? caches.delete(k) : null)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Never cache live API / image-render calls; just pass through with a graceful fallback.
  if (url.includes('albion-online-data.com') || url.includes('allorigins') || url.includes('render.albiononline.com')) {
    e.respondWith(fetch(e.request).catch(() => new Response('[]', { headers: { 'Content-Type': 'application/json' } })));
    return;
  }

  // items-db.json: network first (to pick up updates) then cache.
  if (url.includes('items-db.json')) {
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // App shell: cache first.
  e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});
