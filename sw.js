// AlbionTools Service Worker v8
// Cambiar el número de versión fuerza recarga en todos los usuarios
const CACHE = 'albion-v8';

// Solo cacheamos los archivos que realmente existen
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// Instalar: pre-cachea archivos esenciales
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE))
  );
  self.skipWaiting(); // Toma control inmediatamente
});

// Activar: elimina TODAS las cachés antiguas
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(k => {
          if (k !== CACHE) {
            console.log('[SW v8] Eliminando caché vieja:', k);
            return caches.delete(k);
          }
        })
      )
    ).then(() => self.clients.claim()) // Controla todas las pestañas abiertas
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // API externa y recursos de Albion — NUNCA cachear, siempre red
  if (
    url.includes('albion-online-data.com') ||
    url.includes('gameinfo.albiononline.com') ||
    url.includes('corsproxy.io') ||
    url.includes('allorigins.win') ||
    url.includes('thingproxy.freeboard.io') ||
    url.includes('render.albiononline.com')
  ) {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response('[]', { headers: { 'Content-Type': 'application/json' } })
      )
    );
    return;
  }

  // index.html — red primero para siempre tener la versión más reciente
  if (url.endsWith('/') || url.endsWith('index.html')) {
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

  // Resto de archivos estáticos — caché primero, red como fallback
  e.respondWith(
    caches.match(e.request).then(hit => {
      if (hit) return hit;
      return fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
