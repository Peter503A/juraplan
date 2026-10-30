/* ============================================================
   JuraPlan – Service Worker (Offline-Fähigkeit)
   Cached die App-Dateien, damit alles ohne Internet läuft.
   Die Nutzerdaten liegen in IndexedDB (nicht hier im Cache).
   ============================================================ */
const CACHE = "juraplan-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.webmanifest",
  "./js/db.js",
  "./js/state.js",
  "./js/utils.js",
  "./js/icons.js",
  "./js/components.js",
  "./js/views/calendar.js",
  "./js/views/modules.js",
  "./js/views/review.js",
  "./js/entryDialog.js",
  "./js/app.js",
  "./icons/icon.svg",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
          return res;
        })
        .catch(() => cached);
    })
  );
});
