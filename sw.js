const CACHE = 'albion-fish-v2';
const PRECACHE = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;
  // API y recursos externos — siempre red, sin cachear
  if (url.includes('albion-online-data.com') || url.includes('corsproxy') ||
      url.includes('allorigins') || url.includes('thingproxy') ||
      url.includes('render.albiononline.com')) {
    e.respondWith(fetch(e.request).catch(() =>
      new Response('[]', { headers: { 'Content-Type': 'application/json' } })
    ));
    return;
  }
  // Archivos propios — cache first
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res && res.status === 200) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    }))
  );
});
