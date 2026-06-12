// Service Worker Automatizado para AlbionTools - Versión v4
const CACHE = 'albion-v4';

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => {
        if (k !== CACHE) {
          console.log('[SW] Purgando caché obsoleta:', k);
          return caches.delete(k);
        }
      }))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Las peticiones dirigidas a la API de Precios o Renderizador de Render-Icons saltan la caché (Network Only)
  if (url.includes('albion-online-data.com') || url.includes('corsproxy') ||
      url.includes('allorigins') || url.includes('render.albiononline.com')) {
    e.respondWith(fetch(e.request).catch(() =>
      new Response('[]', { headers: { 'Content-Type': 'application/json' } })
    ));
    return;
  }

  // index.html y rutas base estructurales: Network-First (Verifica red para actualizaciones; si falla usa la caché offline)
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

  // Recursos estáticos secundarios (Imágenes fijas, manifiesto): Cache-First
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});