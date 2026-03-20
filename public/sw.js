// Service Worker for OxCal PWA
const CACHE_NAME = 'oxcal-v1.0.1';
const RUNTIME_CACHE = 'oxcal-runtime';

// Detect if running in production (bundled assets) or development
const isProduction = self.location.hostname !== 'localhost' && 
                     self.location.hostname !== '127.0.0.1';

// Files to cache for offline functionality
// Different file paths for dev vs production
const STATIC_CACHE_URLS = isProduction ? [
  // Production files (after build)
  '/',
  '/index.html',
  '/terms.json',
  '/manifest.json',
  // Icons that should exist
  '/icons/android/android-launchericon-192-192.png',
  '/icons/android/android-launchericon-512-512.png',
  // Note: Bundled JS/CSS files have hashes in names, so we'll cache them dynamically
] : [
  // Development files
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
  '/src/js/themeManager.js',
  '/src/js/pwa.js',
  '/public/terms.json',
  '/public/manifest.json',
  '/public/icons/android/android-launchericon-192-192.png',
  '/public/icons/android/android-launchericon-512-512.png'
];

// Install event - cache all static resources
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching static resources');
        // Try to cache each URL individually to avoid complete failure
        return Promise.allSettled(
          STATIC_CACHE_URLS.map(url => 
            cache.add(url).catch(err => {
              console.warn(`[Service Worker] Failed to cache ${url}:`, err);
              return null;
            })
          )
        );
      })
      .then(() => {
        console.log('[Service Worker] Installation complete');
        // Force activation of new service worker
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Installation failed:', error);
        // Still skip waiting even if some caching failed
        return self.skipWaiting();
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
              // Delete old cache versions but preserve runtime cache
              return cacheName.startsWith('oxcal-') && cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
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
  
  // Skip cross-origin requests (except for CDN resources like jszip)
  if (url.origin !== location.origin && !url.hostname.includes('cdnjs.cloudflare.com')) {
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
            
            // Determine if this resource should be cached
            const shouldCache = 
              // Cache production assets (JS, CSS with hash in filename)
              url.pathname.includes('/assets/') ||
              // Cache images and icons
              url.pathname.includes('/icons/') ||
              url.pathname.endsWith('.png') ||
              url.pathname.endsWith('.svg') ||
              // Cache data files
              url.pathname.endsWith('.json') ||
              // Cache HTML pages
              url.pathname.endsWith('.html') ||
              url.pathname === '/';
            
            if (shouldCache) {
              // Clone the response because it can only be used once
              const responseToCache = response.clone();
              
              // Cache the fetched response for future use
              caches.open(RUNTIME_CACHE)
                .then(cache => {
                  cache.put(request, responseToCache);
                })
                .catch(err => {
                  console.warn('[Service Worker] Failed to cache response:', err);
                });
            }
            
            return response;
          })
          .catch(error => {
            console.error('[Service Worker] Fetch failed:', error);
            // Return offline page if available
            if (request.destination === 'document') {
              return caches.match('/index.html');
            }
            // For other resources, try to find any cached version
            if (url.pathname.includes('/assets/')) {
              // For assets, try to match any cached asset of same type
              return caches.match(request, { ignoreSearch: true });
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