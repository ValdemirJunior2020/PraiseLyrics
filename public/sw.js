// Network-first navigation fallback. Never return HTML for scripts, CSS, images or API calls.
const CACHE = 'praise-lyrics-shell-v2';
const START = '/';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(START)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('praise-lyrics-shell-') && key !== CACHE).map((key) => caches.delete(key)))),
      self.clients.claim(),
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode !== 'navigate') return;
  event.respondWith(
    fetch(request).catch(async () => {
      const cache = await caches.open(CACHE);
      return (await cache.match(START)) || Response.error();
    })
  );
});
