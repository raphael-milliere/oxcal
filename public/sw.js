// Service Worker for OxCal PWA
const CACHE_NAME = 'oxcal-v1.0.0';
const RUNTIME_CACHE = 'oxcal-runtime';

// Files to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/src/css/base.css',
  '/src/css/layout.css',
  '/src/css/components.css',
  '/src/css/themes.css',
  '/src/js/app.js',
  '/src/js/components/index.js',
  '/src/js/components/calendar.js',
  '/src/js/data/termService.js',
  '/src/js/data/dateUtils.js',
  '/src/js/search/index.js',
  '/src/js/search/searchEngine.js',
  '/src/js/search/queryParser.js',
  '/src/js/search/suggestions.js',
  '/public/terms.json',
  '/public/manifest.json'
];

// Install event - cache all static resources
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching static resources');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        // Force activation of new service worker
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              // Delete old cache versions
              return cacheName.startsWith('oxcal-') && cacheName !== CACHE_NAME;
            })
            .map(cacheName => {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activation complete');
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache when possible
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Return cached version
          return cachedResponse;
        }
        
        // Clone the request because it can only be used once
        const fetchRequest = request.clone();
        
        // Make network request and cache the response
        return fetch(fetchRequest)
          .then(response => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response because it can only be used once
            const responseToCache = response.clone();
            
            // Cache the fetched response for future use
            caches.open(RUNTIME_CACHE)
              .then(cache => {
                cache.put(request, responseToCache);
              });
            
            return response;
          })
          .catch(error => {
            console.error('[Service Worker] Fetch failed:', error);
            // Return offline page if available
            if (request.destination === 'document') {
              return caches.match('/index.html');
            }
            throw error;
          });
      })
  );
});

// Message event - handle updates
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[Service Worker] Skip waiting received');
    self.skipWaiting();
  }
});

// Background sync for future enhancement
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    console.log('[Service Worker] Background sync triggered');
    // Future: sync any offline changes
  }
});