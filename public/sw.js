// Service Worker cleanup script
// Immediately claims, skips waiting, deletes all cached assets, and unregisters itself
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => {
      return self.registration.unregister();
    }).then(() => {
      return self.clients.matchAll({ type: "window" });
    }).then((clients) => {
      clients.forEach((client) => {
        client.navigate(client.url);
      });
    })
  );
});

// Bypass cache completely for all network requests
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
