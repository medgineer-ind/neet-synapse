const CACHE_NAME = 'neet-synapse-cache-v3';
const urlsToCache = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './maskable-icon.png',
  './index.tsx',
  './App.tsx',
  './types.ts',
  './data/syllabus.ts',
  './hooks/useLocalStorage.ts',
  './lib/utils.ts',
  './components/Planner.tsx',
  './components/Dashboard.tsx',
  './components/TestPlanner.tsx',
  './components/Timeline.tsx',
  './components/LiveBackground.tsx',
  './components/SettingsModal.tsx',
  './components/AboutModal.tsx',
  './components/NotificationBanner.tsx',
  './components/ui/Icons.tsx',
  './components/ui/StyledComponents.tsx'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          response => {
            // Check if we received a valid response
            // Don't cache non-GET requests or chrome-extension URLs.
            if (!response || response.status !== 200 || (response.type !== 'basic' && response.type !== 'cors') || event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
              return response;
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
