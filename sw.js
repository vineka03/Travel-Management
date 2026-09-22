// Progressive Web App Service Worker
// Travel Management System PWA v1.0.0

const CACHE_NAME = 'travel-pwa-v1';
const DATA_CACHE_NAME = 'travel-pwa-data-v1';

// Core App Shell assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/waffel.html',
  '/cake.html',
  '/offline.html',
  '/manifest.json',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.png'
];

// Service Worker Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[PWA SW] Pre-caching core application shell');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[PWA SW] Pre-cache non-fatal warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Service Worker Activate (Purge outdated caches and claim clients)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME && name !== DATA_CACHE_NAME) {
            console.log('[PWA SW] Deleting obsolete cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Service Worker Fetch Handling
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-HTTP/HTTPS and cross-origin analytics if any
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 1. API Calls Handling (/api/*)
  if (url.pathname.startsWith('/api/')) {
    // For GET API requests: Network-First with fallback to cached data
    if (request.method === 'GET') {
      event.respondWith(
        fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const copy = response.clone();
              caches.open(DATA_CACHE_NAME).then((cache) => {
                cache.put(request, copy);
              });
            }
            return response;
          })
          .catch(async () => {
            const cachedResponse = await caches.match(request);
            if (cachedResponse) {
              return cachedResponse;
            }
            return new Response(
              JSON.stringify({
                offline: true,
                message: 'You are currently offline. Please check your network connection.'
              }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          })
      );
      return;
    }

    // For POST/PUT/DELETE: Network-only with friendly offline error response
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            offline: true,
            error: 'Network connection unavailable. Changes cannot be saved while offline.'
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // 2. Navigation Requests (HTML pages): Network-First, fallback to Cache, then /offline.html
  if (request.mode === 'navigate' || (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, copy);
            });
          }
          return response;
        })
        .catch(async () => {
          // Attempt to return cached HTML
          const cached = await caches.match(request);
          if (cached) return cached;

          // Attempt root index
          const rootCached = await caches.match('/');
          if (rootCached) return rootCached;

          // Fallback to offline fallback page
          const offlinePage = await caches.match('/offline.html');
          if (offlinePage) return offlinePage;

          return new Response('<h1>Offline</h1><p>Application is currently offline.</p>', {
            headers: { 'Content-Type': 'text/html' }
          });
        })
    );
    return;
  }

  // 3. Static Assets (Images, Icons, SVG, CSS, JS): Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, copy);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
