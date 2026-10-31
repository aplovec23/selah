// Lets the web version open with no internet: the app's own files are kept in a cache.
// Bible downloads always go to the network (they are saved with each day inside the app).
const VERSION = "selah-v4";
const FILES = [
  "./", "./index.html", "./app.css", "./manifest.webmanifest", "./data/books.json",
  "./vendor/html2canvas-pro.min.js",
  "./js/store.js", "./js/sources.js", "./js/bible.js", "./js/stickers.js", "./js/backgrounds.js", "./js/ui.js",
  "./js/calendar.js", "./js/art.js", "./js/side.js", "./js/day.js", "./js/app.js",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || e.request.method !== "GET") return; // Bible services: straight to the network
  // app files: use the network when online (so updates arrive), fall back to the cache offline
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok) caches.open(VERSION).then((c) => c.put(e.request, res.clone()));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("./index.html")))
  );
});
