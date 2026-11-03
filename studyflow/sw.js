/* ============================================================
   StudyFlow – Service Worker (Offline-Fähigkeit + Auto-Update)
   Strategie: "network-first" für die App-Dateien.
   -> Beim Öffnen wird immer zuerst die NEUESTE Version aus dem
      Netz geholt; der Cache dient nur als Offline-Fallback.
   Die Nutzerdaten liegen in localStorage (nicht hier im Cache).
   ============================================================ */
const CACHE = "studyflow-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.webmanifest",
  "./data/moduleCatalog.js",
  "./src/main.js",
  "./src/app.js",
  "./src/store.js",
  "./src/modules.js",
  "./src/entryModal.js",
  "./src/utils.js",
  "./src/dom.js",
  "./src/views/calendar.js",
  "./src/views/modules.js",
  "./src/views/review.js",
  "./src/views/settings.js",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

// Installieren: App-Dateien in den (neuen) Cache legen und sofort übernehmen
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS).catch(() => {})) // einzelne Fehlschläge nicht blockieren
      .then(() => self.skipWaiting())
  );
});

// Aktivieren: alle alten Caches löschen und sofort die Kontrolle übernehmen
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
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
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) => cached || caches.match("./index.html"))
      )
  );
});
