const CACHE_NAME = 'gliko-cache-v1';
const urlsToCache = [
  '/gliko/',              // Home page (index.html)
  '/gliko/index.html',    // Glavni HTML
  '/gliko/css/style.css', // CSS fajl
  '/gliko/js/app.js',     // JavaScript fajl
  '/gliko/images/icon.png',  // Ikona
  '/gliko/manifest.json'     // Manifest fajl
];

// Instalacija service worker-a
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Failed to cache resources:', error);
      })
  );
});

// Aktivacija service worker-a
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch događaj
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse; // Ako je u cache-u, koristi keširani sadržaj
        }
        return fetch(event.request); // Ako nije, fetchaj iz mreže
      })
      .catch(error => {
        console.error('Failed to fetch resource:', error);
      })
  );
});
