// Cambia este número cada vez que actualices la app
const CACHE = 'albion-v3';

const PRECACHE = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)));
  // Toma control inmediatamente sin esperar a que se cierren las pestañas
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => {
        // Elimina TODAS las cachés anteriores
        if (k !== CACHE) {
          console.log('[SW] Eliminando caché vieja:', k);
          return caches.delete(k);
        }
      }))
    ).then(() => self.clients.claim()) // Toma control de todas las pestañas abiertas
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // API externa — siempre red, nunca cachear
  if (url.includes('albion-online-data.com') || url.includes('corsproxy') ||
      url.includes('allorigins') || url.includes('thingproxy') ||
      url.includes('render.albiononline.com')) {
    e.respondWith(fetch(e.request).catch(() =>
      new Response('[]', { headers: { 'Content-Type': 'application/json' } })
    ));
    return;
  }

  // index.html — siempre intenta red primero para tener la versión más reciente
  if (url.endsWith('/') || url.endsWith('index.html')) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Otros archivos — cache first
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
