const CACHE_NAME = 'msq-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './assets/icons/icon-128.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
