/* ============================================================
   JuraPlan – Zentraler Zustand (Store)
   Hält Einträge, Module, Notizen im Speicher und synchronisiert
   mit IndexedDB. Views abonnieren Änderungen via subscribe().
   ============================================================ */
(function () {
  "use strict";

  const DEFAULT_COLORS = [
    "#7465cf", "#e0a92b", "#2fa66b", "#d9544d",
    "#2f88c4", "#c45eb0", "#e07b3a", "#4a9d8e",
  ];

  const state = {
    ready: false,
    view: "calendar", // calendar | modules | review
    calView: "week", // day | week | month | year
    cursor: new Date(), // Referenzdatum der aktuellen Ansicht
    reviewCursor: new Date(),
    activeModule: null, // Modul-ID für Filter, null = alle
    prioFilter: "all", // all | important | urgent
    entries: [], // {id, title, type, moduleId, date, start, end, note, priority, status, actualMin, missingNote, carryOver, createdAt}
    modules: [], // {id, name, color, goalMin, createdAt}
    notes: {}, // id -> {id, text}
  };

  const listeners = new Set();
  function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  function emit() { listeners.forEach((fn) => fn(state)); }

  async function init() {
    const [entries, modules, notes] = await Promise.all([
      DB.getAll("entries"),
      DB.getAll("modules"),
      DB.getAll("notes"),
    ]);
    state.entries = entries;
    state.modules = modules.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    state.notes = {};
    notes.forEach((n) => (state.notes[n.id] = n));
    state.ready = true;
    emit();
  }

  // ---------- Einträge ----------
  async function saveEntry(entry) {
    const existing = state.entries.find((e) => e.id === entry.id);
    if (!entry.id) entry.id = U.uid();
    if (!entry.createdAt) entry.createdAt = Date.now();
    await DB.put("entries", entry);
    if (existing) {
      Object.assign(existing, entry);
    } else {
      state.entries.push(entry);
    }
    emit();
    return entry;
  }
  async function deleteEntry(id) {
    await DB.del("entries", id);
    state.entries = state.entries.filter((e) => e.id !== id);
    emit();
  }

  // ---------- Module ----------
  async function saveModule(mod) {
    const existing = state.modules.find((m) => m.id === mod.id);
    if (!mod.id) mod.id = U.uid();
    if (!mod.createdAt) mod.createdAt = Date.now();
    await DB.put("modules", mod);
    if (existing) Object.assign(existing, mod);
    else state.modules.push(mod);
    state.modules.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    emit();
    return mod;
  }
  async function deleteModule(id) {
    await DB.del("modules", id);
    state.modules = state.modules.filter((m) => m.id !== id);
    // Einträge dieses Moduls behalten, aber Zuordnung entfernen
    const affected = state.entries.filter((e) => e.moduleId === id);
    for (const e of affected) {
      e.moduleId = null;
      await DB.put("entries", e);
    }
    if (state.activeModule === id) state.activeModule = null;
    emit();
  }
  function moduleById(id) { return state.modules.find((m) => m.id === id) || null; }

  // ---------- Notizen ----------
  async function saveNote(id, text) {
    if (!text || !text.trim()) {
      await DB.del("notes", id);
      delete state.notes[id];
    } else {
      const note = { id, text: text.trim() };
      await DB.put("notes", note);
      state.notes[id] = note;
    }
    emit();
  }
  function getNote(id) { return state.notes[id] ? state.notes[id].text : ""; }

  // ---------- Abfragen ----------
  function entriesForDate(iso) {
    return filtered().filter((e) => e.date === iso);
  }
  function entriesInRange(startIso, endIso) {
    return filtered().filter((e) => e.date >= startIso && e.date <= endIso);
  }
  function filtered() {
    let list = state.entries;
    if (state.activeModule) list = list.filter((e) => e.moduleId === state.activeModule);
    if (state.prioFilter !== "all") list = list.filter((e) => e.priority === state.prioFilter);
    return list;
  }

  // Farbe eines Eintrags: individuelle Farbe > Modulfarbe > Standard
  function entryColor(e) {
    if (e.color) return e.color;
    const mod = moduleById(e.moduleId);
    if (mod) return mod.color;
    return "#7465cf";
  }

  // Dauer (geplant) in Minuten
  function plannedMin(e) {
    const s = U.timeToMin(e.start);
    const en = U.timeToMin(e.end);
    return Math.max(0, en - s);
  }
  // Tatsächlich gelernte Minuten (nur wenn erledigt/teilweise & Zeit eingetragen)
  function actualMin(e) {
    if (e.status === "done" || e.status === "partial") {
      return e.actualMin || 0;
    }
    return 0;
  }

  // ---------- Navigation ----------
  function setView(v) { state.view = v; emit(); }
  function setCalView(v) { state.calView = v; emit(); }
  function setCursor(d) { state.cursor = new Date(d); emit(); }
  function setReviewCursor(d) { state.reviewCursor = new Date(d); emit(); }
  function setActiveModule(id) { state.activeModule = id; emit(); }
  function setPrioFilter(p) { state.prioFilter = p; emit(); }

  // ---------- Export / Import ----------
  async function exportData() {
    const [entries, modules, notes] = await Promise.all([
      DB.getAll("entries"),
      DB.getAll("modules"),
      DB.getAll("notes"),
    ]);
    return {
      app: "JuraPlan",
      version: 1,
      exportedAt: new Date().toISOString(),
      entries,
      modules,
      notes,
    };
  }
  async function importData(data, mode) {
    // mode: "replace" | "merge"
    if (!data || data.app !== "JuraPlan") throw new Error("Keine gültige JuraPlan-Datei.");
    if (mode === "replace") {
      await Promise.all([DB.clear("entries"), DB.clear("modules"), DB.clear("notes")]);
      state.entries = [];
      state.modules = [];
      state.notes = {};
    }
    for (const m of data.modules || []) {
      await DB.put("modules", m);
    }
    for (const e of data.entries || []) {
      await DB.put("entries", e);
    }
    for (const n of data.notes || []) {
      await DB.put("notes", n);
    }
    await init();
  }

  window.Store = {
    state, subscribe,
    init, saveEntry, deleteEntry, saveModule, deleteModule, moduleById,
    saveNote, getNote,
    entriesForDate, entriesInRange, filtered, entryColor, plannedMin, actualMin,
    setView, setCalView, setCursor, setReviewCursor, setActiveModule, setPrioFilter,
    exportData, importData,
    DEFAULT_COLORS,
  };
})();
