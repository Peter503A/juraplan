/* ============================================================
   JuraPlan – Lokale Datenhaltung (IndexedDB)
   Alles bleibt auf dem Gerät. Kein Server, kein Internet nötig.
   ============================================================ */
(function () {
  "use strict";

  const DB_NAME = "juraplan";
  const DB_VERSION = 1;
  const STORES = ["entries", "modules", "notes", "meta"];
  // entries: Lernblöcke / Termine
  // modules: Module & Projekte
  // notes:   Wochennotizen & Tagesnotizen (key = "week:<iso>" | "day:<iso>" | "carry:<iso>")
  // meta:    Einstellungen / Ziele (key = frei)

  let _db = null;

  function open() {
    return new Promise((resolve, reject) => {
      if (_db) return resolve(_db);
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        STORES.forEach((name) => {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name, { keyPath: "id" });
          }
        });
      };
      req.onsuccess = () => {
        _db = req.result;
        resolve(_db);
      };
      req.onerror = () => reject(req.error);
    });
  }

  function tx(store, mode) {
    return open().then((db) => db.transaction(store, mode).objectStore(store));
  }

  function getAll(store) {
    return tx(store, "readonly").then(
      (os) =>
        new Promise((resolve, reject) => {
          const r = os.getAll();
          r.onsuccess = () => resolve(r.result || []);
          r.onerror = () => reject(r.error);
        })
    );
  }

  function get(store, id) {
    return tx(store, "readonly").then(
      (os) =>
        new Promise((resolve, reject) => {
          const r = os.get(id);
          r.onsuccess = () => resolve(r.result || null);
          r.onerror = () => reject(r.error);
        })
    );
  }

  function put(store, obj) {
    return tx(store, "readwrite").then(
      (os) =>
        new Promise((resolve, reject) => {
          const r = os.put(obj);
          r.onsuccess = () => resolve(obj);
          r.onerror = () => reject(r.error);
        })
    );
  }

  function del(store, id) {
    return tx(store, "readwrite").then(
      (os) =>
        new Promise((resolve, reject) => {
          const r = os.delete(id);
          r.onsuccess = () => resolve();
          r.onerror = () => reject(r.error);
        })
    );
  }

  function clear(store) {
    return tx(store, "readwrite").then(
      (os) =>
        new Promise((resolve, reject) => {
          const r = os.clear();
          r.onsuccess = () => resolve();
          r.onerror = () => reject(r.error);
        })
    );
  }

  window.DB = { open, getAll, get, put, del, clear, STORES };
})();
