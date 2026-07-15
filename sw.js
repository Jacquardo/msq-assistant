// On change le nom du cache pour forcer la mise à jour chez tous les utilisateurs
const CACHE_NAME = 'msq-cache-v2';

const urlsToCache = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './assets/icons/icon-128.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', event => {
  // Force l'installation immédiate du nouveau Service Worker
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', event => {
  // Supprime les anciens caches qui bloquent les scripts
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Prend le contrôle de la page immédiatement
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(
    // Essaye d'aller sur le réseau d'abord (pour avoir la dernière version)
    fetch(event.request).catch(() => {
      // Si on est hors-ligne, on prend dans le cache
      return caches.match(event.request);
    })
  );
});
