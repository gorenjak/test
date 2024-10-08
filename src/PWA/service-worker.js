const staticCacheName = 'SmartCart-cache-v3';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(staticCacheName).then(cache => {
      return cache.addAll([
        '/',
        'assets/SmartCart.png',
        'assets/SmartCart-192.png',
        'assets/SmartCart-152.png',
        'profile-styles.css',
        'style-log-reg.css',
        'styles.css',
      ]);
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

self.addEventListener('push', event => {
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body
    })
  );
});