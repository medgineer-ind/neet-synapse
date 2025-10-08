const CACHE_NAME = 'neetsynapse-cache-v1';
// All files from the project are listed here for caching.
// This ensures the app shell loads offline.
const urlsToCache = [
  './',
  './index.html',
  './index.tsx',
  './metadata.json',
  './App.tsx',
  './types.ts',
  './data/syllabus.ts',
  './hooks/useLocalStorage.ts',
  './lib/utils.ts',
  './components/Dashboard.tsx',
  './components/LiveBackground.tsx',
  './components/Planner.tsx',
  './components/Settings.tsx',
  './components/TestPlanner.tsx',
  './components/Timeline.tsx',
  './components/ui/Icons.tsx',
  './components/ui/StyledComponents.tsx',
];

// Install the service worker and cache all the app's content
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache)
        .catch(error => console.error('Failed to cache resources:', error));
    })
  );
});

// Intercept fetch requests and serve from cache first
self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => {
      return response || fetch(e.request);
    })
  );
});

// Clean up old caches on activation
self.addEventListener('activate', e => {
  const cacheWhitelist = [CACHE_NAME];
  e.waitUntil(
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
