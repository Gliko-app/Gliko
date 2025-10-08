const CACHE_NAME = 'gliko-cache-v1';
const urlsToCache = [
  '/Gliko/',                // Home page
  '/Gliko/index.html',      // Glavni HTML
  '/Gliko/css/style.css',   // CSS fajl
  '/Gliko/app.js',          // JavaScript fajl za globalnu funkcionalnost
  '/Gliko/images/icon-192.png',  // Ikona
  '/Gliko/images/icon-512.png',  // Ikona
  '/Gliko/manifest.json',   // Manifest fajl
  '/Gliko/trends.html',     // Strana Trends
  '/Gliko/food.html',       // Strana Food
  '/Gliko/therapy.html',    // Strana Therapy
  '/Gliko/trends.js',       // JavaScript za Trends
  '/Gliko/food.js',         // JavaScript za Food
  '/Gliko/therapy.js'       // JavaScript za Therapy
];

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

// Push notifikacije
self.addEventListener('push', function(event) {
  const options = {
    body: event.data.text(),
    icon: '/Gliko/images/icon-192.png',  // Koristi ispravnu putanju
    badge: '/Gliko/images/icon-512.png'  // Koristi ispravnu putanju
  };

  event.waitUntil(
    self.registration.showNotification('Podsetnik za terapiju/pregled', options)
  );
});

// Klik na notifikaciju
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  // Otvoriti stranicu kada korisnik klikne na notifikaciju
  event.waitUntil(
    clients.openWindow('/Gliko/pregledi.html')  // Stranica koju želiš otvoriti
  );
});

