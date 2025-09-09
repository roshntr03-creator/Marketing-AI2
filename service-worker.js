// FIX: Add the webworker library reference to provide correct Service Worker types (e.g., ServiceWorkerGlobalScope, FetchEvent) and resolve type errors.
/// <reference lib="webworker" />

// This makes TypeScript recognize the service worker globals.

const CACHE_NAME = 'marketing-ai-cache-v1';
// These are the core files that make up the "app shell".
const APP_SHELL_URLS = [
  '/',
  '/index.html',
];
// The JS/CSS files from CDNs are also part of the app shell.
const CDN_URLS = [
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css",
  "https://cdn.tailwindcss.com"
];

// Combine all URLs to cache during installation.
const URLS_TO_CACHE = [...APP_SHELL_URLS, ...CDN_URLS];


self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache and caching app shell');
        // Use addAll to fetch and cache all specified URLs.
        // If any request fails, the entire install step will fail.
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

self.addEventListener('activate', (event) => {
  // This event fires after the service worker has been installed and is ready to take control.
  // It's a good place to clean up old, unused caches.
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Delete the cache if it's not in our whitelist.
            console.log(`Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
    // We'll use a "cache first" strategy for navigation and app shell requests.
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // If we have a match in the cache, return it.
                if (cachedResponse) {
                    return cachedResponse;
                }

                // If it's not in the cache, fetch it from the network.
                return fetch(event.request).then(
                    (networkResponse) => {
                        // Clone the response because it can only be read once.
                        const responseToCache = networkResponse.clone();
                        
                        // Don't cache API calls to Supabase or Gemini to avoid stale data.
                        const isApiCall = event.request.url.includes('supabase.co') || event.request.url.includes('googleapis.com');
                        
                        // We should only cache successful GET requests.
                        if (event.request.method === 'GET' && !isApiCall) {
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseToCache);
                                });
                        }
                        
                        return networkResponse;
                    }
                ).catch(error => {
                    // This is where you might return a custom offline page
                    // if the fetch fails and the item wasn't in the cache.
                    console.error('Fetch failed; returning offline fallback if available.', error);
                    throw error;
                });
            })
    );
});