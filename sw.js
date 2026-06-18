// Service Worker — AlbionTools v7 (FORZAR RECARGA)
const CACHE = 'albion-v7';

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './items-db.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => {
      console.log('✅ Service Worker instalado - versión', CACHE);
      return c.addAll(PRECACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      // Eliminar todas las cachés antiguas
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE) {
            console.log('🗑️ Eliminando caché antigua:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker activado - versión', CACHE);
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // NUNCA cachear las llamadas a la API
  if (url.includes('albion-online-data.com') || 
      url.includes('allorigins') || 
      url.includes('render.albiononline.com')) {
    e.respondWith(
      fetch(e.request).catch(() => {
        return new Response('[]', { 
          headers: { 'Content-Type': 'application/json' } 
        });
      })
    );
    return;
  }

  // items-db.json: Primero red, luego caché (para actualizaciones)
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

  // App shell: Primero caché, luego red
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});