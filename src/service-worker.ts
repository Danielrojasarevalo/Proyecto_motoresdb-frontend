/// <reference lib="webworker" />

const CACHE_NAME = 'villamar-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/VillaMarLogo.png',
  '/favicon.ico'
];

// Instalación del Service Worker
addEventListener('install', (event: any) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(urlsToCache);
      await (self as any).skipWaiting();
    })()
  );
});

// Activación del Service Worker
addEventListener('activate', (event: any) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
      await (self as any).clients.claim();
    })()
  );
});

// Estrategia de caché: Network First, fallback a Cache
addEventListener('fetch', (event: any) => {
  // No cachear solicitudes de Google Analytics ni otras de terceros
  if (
    event.request.url.includes('google') ||
    event.request.url.includes('analytics')
  ) {
    return;
  }

  // Para solicitudes GET, usar estrategia Network First
  if (event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request)
        .then((response: Response) => {
          // No cachear respuestas no-OK
          if (!response || response.status !== 200 || response.type === 'error') {
            return response;
          }

          // Clonar la respuesta
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) {
            return cached;
          }
          // Retornar página offline si existe
          return caches.match('/index.html') || new Response('Sin conexión');
        })
    );
  }
});

