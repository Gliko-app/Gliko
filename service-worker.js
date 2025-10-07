self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  event.waitUntil(
    caches.open('cache-v1').then((cache) => {
      return cache.addAll([
        '/Gliko/',  // Home page, root of the app
        '/Gliko/index.html',  // Glavna stranica
        '/Gliko/css/style.css',  // CSS fajl
      ]);
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
});

self.addEventListener('fetch', (event) => {
  console.log('Fetching:', event.request.url);
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('push', function(event) {
  const options = {
    body: event.data.text(),
    icon: '/Gliko/images/icon.png',  // Koristi ispravnu putanju
    badge: '/Gliko/images/badge.png'  // Koristi ispravnu putanju
  };

  event.waitUntil(
    self.registration.showNotification('Podsetnik za terapiju/pregled', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  // Otvoriti stranicu kada korisnik klikne na notifikaciju
  event.waitUntil(
    clients.openWindow('/Gliko/pregledi.html')  // Stranica koju želiš otvoriti
  );
});
