// vrlo prost SW za GitHub Pages
const CACHE_NAME = 'gliko-v1';
const ASSETS = [
  '/', './index.html', './style.css', './app.js',
  './manifest.json', './icon-192.png', './icon-512.png'
];

self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)));
});
self.addEventListener('activate', (e)=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=> k===CACHE_NAME?null:caches.delete(k)))));
});
self.addEventListener('fetch', (e)=>{
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request))
  );
});
