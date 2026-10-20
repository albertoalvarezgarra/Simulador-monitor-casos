const CACHE_NAME = 'philips-dfm100-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './student.html',
  './instructor.html',
  './split-demo.html',
  './css/philips-theme.css',
  './css/instructor.css',
  './js/ecg-engine.js',
  './js/audio-synth.js',
  './js/scenarios-data.js',
  './js/qrcode.min.js',
  './js/peer-connection.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request).catch(() => {
        return cachedResponse;
      });
    })
  );
});
