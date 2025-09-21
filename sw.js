const CACHE_NAME = 'controlfin-cache-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './bundle.js',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://rsms.me/inter/inter.css',
  'https://www.transparenttextures.com/patterns/stardust.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache and caching core assets');
      return cache.addAll(CORE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
      return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
        // Try to find the response in the cache.
        const cachedResponse = await cache.match(event.request);
        
        // Always try to fetch from the network. This is a network-first strategy.
        const fetchPromise = fetch(event.request).then(networkResponse => {
            // If the fetch is successful, update the cache.
            if (networkResponse && networkResponse.status === 200) {
                cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
        }).catch(() => {
            // If the network fails, and there is a cached response, return it.
            if (cachedResponse) {
                return cachedResponse;
            }
            // If the network fails and there is no cached response, the request will fail.
        });

        // Return the network response if it's available, otherwise the cached response.
        return fetchPromise || cachedResponse;
    })
  );
});