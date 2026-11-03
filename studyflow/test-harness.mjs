/* Headless-Test: minimaler DOM-Shim, der ausreicht, um die App einmal
   komplett zu rendern und alle Views durchzuschalten. Fängt Laufzeitfehler. */

// ---- localStorage shim ----
const _store = {};
globalThis.localStorage = {
  getItem: (k) => (k in _store ? _store[k] : null),
  setItem: (k, v) => { _store[k] = String(v); },
  removeItem: (k) => { delete _store[k]; },
};
globalThis.structuredClone ||= (o) => JSON.parse(JSON.stringify(o));

// ---- DOM shim ----
let idc = 0;
class El {
  constructor(tag) {
    this.tagName = (tag || "div").toUpperCase();
    this.children = [];
    this.attributes = {};
    this.style = {};
    this._classes = new Set();
    this.listeners = {};
    this._text = "";
    this.value = "";
    this.checked = false;
    this.disabled = false;
    this.files = [];
    this.parentNode = null;
    this._id = ++idc;
  }
  set className(v) { this._classes = new Set(String(v).split(/\s+/).filter(Boolean)); }
  get className() { return [...this._classes].join(" "); }
  get classList() {
    const s = this._classes;
    return {
      has: (c) => s.has(c),
      add: (c) => s.add(c),
      delete: (c) => s.delete(c),
      toggle: (c, force) => { const add = force === undefined ? !s.has(c) : force; if (add) s.add(c); else s.delete(c); return add; },
    };
  }
  set id(v) { this.attributes.id = v; }
  get id() { return this.attributes.id; }
  set textContent(v) { this._text = v; this.children = []; }
  get textContent() {
    if (this._text) return this._text;
    return this.children.map((c) => (c.nodeType === 3 ? c.data : c.textContent)).join("");
  }
  set innerHTML(v) { this._html = v; this._text = String(v).replace(/<[^>]*>/g, ""); }
  get innerHTML() { return this._html || ""; }
  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k]; }
  appendChild(c) { c.parentNode = this; this.children.push(c); return c; }
  removeChild(c) { this.children = this.children.filter((x) => x !== c); }
  replaceWith(n) {
    if (!this.parentNode) return;
    const i = this.parentNode.children.indexOf(this);
    if (i >= 0) { this.parentNode.children[i] = n; n.parentNode = this.parentNode; }
  }
  remove() { if (this.parentNode) this.parentNode.removeChild(this); }
  get firstChild() { return this.children[0]; }
  addEventListener(ev, fn) { (this.listeners[ev] ||= []).push(fn); }
  removeEventListener() {}
  dispatch(ev, arg = {}) { (this.listeners[ev] || []).forEach((fn) => fn({ target: this, stopPropagation() {}, preventDefault() {}, ...arg })); }
  querySelector() { return null; }
  querySelectorAll(sel) {
    // einfache Klassen-Suche für .chip etc.
    const cls = sel.replace(/^\./, "");
    const res = [];
    const walk = (n) => { if (n.classList && n.classList.has(cls)) res.push(n); (n.children || []).forEach(walk); };
    this.children.forEach(walk);
    return res;
  }
  click() { this.dispatch("click"); }
  focus() {}
  toggle() {}
}
class TextNode { constructor(t) { this.nodeType = 3; this.data = String(t); this.textContent = String(t); } }

const bodyEl = new El("body");
globalThis.document = {
  createElement: (t) => new El(t),
  createTextNode: (t) => new TextNode(t),
  getElementById: (id) => { if (id === "app") return appEl; return null; },
  addEventListener() {}, removeEventListener() {},
  querySelector() { return null; },
  body: bodyEl,
};
const appEl = new El("div"); appEl.attributes.id = "app";
globalThis.window = globalThis;
globalThis.FileReader = class {};
globalThis.Blob = class {};
globalThis.URL = { createObjectURL: () => "blob:x", revokeObjectURL() {} };

// ---- Count helper ----
function countClass(root, cls) {
  let n = 0;
  const walk = (node) => { if (node.classList && node.classList.has(cls)) n++; (node.children || []).forEach(walk); };
  walk(root);
  return n;
}
function findText(root, substr) {
  let found = false;
  const walk = (node) => {
    if (found) return;
    const t = node.nodeType === 3 ? node.data : (node._text || "");
    if (t && t.includes(substr)) { found = true; return; }
    (node.children || []).forEach(walk);
  };
  walk(root);
  return found;
}

// ---- Run ----
const results = [];
function check(name, cond, extra = "") { results.push({ name, ok: !!cond, extra }); }

const { mount } = await import("./src/app.js");
mount(appEl);

check("App rendert Sidebar", countClass(appEl, "sidebar") === 1);
check("4 Navigationspunkte", countClass(appEl, "nav-item") === 4, "got " + countClass(appEl, "nav-item"));
check("Kalender-Standardansicht", findText(appEl, "Mein Kalender"));
check("Neuer-Eintrag-Button", countClass(appEl, "btn-new") >= 1);

// Katalog prüfen
const store = await import("./src/store.js");
const mods = await import("./src/modules.js");
check("Katalog hat Module", mods.allModules().length > 80, "n=" + mods.allModules().length);

// Eindeutige IDs (keine Dubletten im Katalog)
const ids = mods.allModules().map((m) => m.id);
check("Alle Kurscodes eindeutig", new Set(ids).size === ids.length, `${ids.length} ids, ${new Set(ids).size} unique`);

// Modul mehrfach in Gruppen, aber nur ein Eintrag
const multiGroup = mods.allModules().filter((m) => m.groups && m.groups.length > 1);
check("Module in mehreren Gruppen (ein Eintrag)", multiGroup.length > 0, "z.B. " + (multiGroup[0]?.id));

// Doppeleintrag Social Media
check("DLBMSM02-02 als möglicher Doppeleintrag markiert",
  mods.allModules().find((m) => m.id === "DLBMSM02-02")?.possibleDuplicate === true);

// Modul wählen
store.toggleModule({ id: "DLBMSM01", _defaultColor: "#7c6ff0" });
check("Modul auswählbar", !!store.getState().selectedModules["DLBMSM01"]);

// ECTS Gruppe A soll 10 sein
check("Gruppe A Soll 10 ECTS", mods.groups().A.requiredEcts === 10);
check("Gruppe D Soll 30 ECTS exklusiv", mods.groups().D.requiredEcts === 30 && mods.groups().D.exclusive === true);

// D-Pfad Exklusivität
store.setDPathChoice("praktikum");
const prakt = mods.allModules().find((m) => m.id === "DLBPOME01");
const dModule = mods.allModules().find((m) => m.dPath === "module");
check("D: Praktikum zählt bei Praktikumsweg", mods.countsTowardProgress(prakt, "praktikum") === true);
check("D: Einzelmodul zählt NICHT bei Praktikumsweg", mods.countsTowardProgress(dModule, "praktikum") === false);
store.setDPathChoice(null);

// Entry anlegen + Views rendern
const { upsertEntry } = store;
upsertEntry({ id: "t1", kind: "lernblock", title: "Test", moduleId: "DLBMSM01", date: new Date().toISOString().slice(0,10), from: "10:00", to: "11:30", doneH: 1, doneM: 30, learnType: "Lesen", priority: "normal", openPoints: "Kap. 2 wiederholen", carryOver: true, color: "auto" });

// Views einzeln rendern (Fehler würden werfen)
const cal = await import("./src/views/calendar.js");
const mv = await import("./src/views/modules.js");
const rev = await import("./src/views/review.js");
const set = await import("./src/views/settings.js");
for (const [nm, v] of [["calendar", cal], ["modules", mv], ["review", rev], ["settings", set]]) {
  try { const host = new El("div"); v.render(host); check("View rendert: " + nm, host.children.length > 0, "children=" + host.children.length); }
  catch (e) { check("View rendert: " + nm, false, e.message + "\n" + (e.stack||"").split("\n").slice(0,3).join(" | ")); }
}

// Fortschritt
const prog = mods.totalEctsProgress();
check("ECTS-Fortschritt berechnet", prog.total === 180 && typeof prog.planned === "number", JSON.stringify(prog));

// Export JSON Struktur
check("State serialisierbar (Export)", typeof JSON.stringify(store.getState()) === "string");

// ---- Report ----
let fails = 0;
for (const r of results) { if (!r.ok) fails++; console.log(`${r.ok ? "✓" : "✗ FAIL"}  ${r.name}${r.extra ? "  [" + r.extra + "]" : ""}`); }
console.log(`\n${results.length - fails}/${results.length} Checks bestanden`);
process.exit(fails ? 1 : 0);
