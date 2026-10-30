/* ============================================================
   JuraPlan – Service Worker (Offline-Fähigkeit + Auto-Update)
   Strategie: "network-first" für die App-Dateien.
   -> Beim Öffnen wird immer zuerst die NEUESTE Version aus dem
      Netz geholt; der Cache dient nur als Offline-Fallback.
   Die Nutzerdaten liegen in IndexedDB (nicht hier im Cache).
   ============================================================ */
const CACHE = "juraplan-v2";
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

// Installieren: App-Dateien in den (neuen) Cache legen und sofort übernehmen
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Aktivieren: alle alten Caches löschen und sofort die Kontrolle übernehmen
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Dem Hauptskript erlauben, ein Update sofort zu erzwingen
self.addEventListener("message", (e) => {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
});

// Netzwerk zuerst (für App-Dateien), Cache als Fallback
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // nur eigene Dateien

  e.respondWith(
    fetch(req)
      .then((res) => {
        // frische Antwort in den Cache spiegeln (für Offline)
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        // offline: aus dem Cache bedienen; Navigation -> index.html
        caches.match(req).then((cached) => cached || caches.match("./index.html"))
      )
  );
});
