/* ===================================================================
   App-Shell: Sidebar, Navigation, Routing, Export/Import
   =================================================================== */
import { el, clear, toast, confirmDialog, openModal, closeModal } from "./dom.js";
import { getState, subscribe, exportJSON, importJSON, resetAll } from "./store.js";
import { MONTHS, esc } from "./utils.js";
import { selectedModulesDetailed, totalEctsProgress } from "./modules.js";
import { openEntryModal } from "./entryModal.js";
import * as calendarView from "./views/calendar.js";
import * as modulesView from "./views/modules.js";
import * as reviewView from "./views/review.js";
import * as settingsView from "./views/settings.js";

const ROUTES = {
  kalender: { label: "Kalender", icon: "📅", render: calendarView.render },
  module: { label: "Module & Projekte", icon: "📖", render: modulesView.render },
  rueckblick: { label: "Rückblick", icon: "📊", render: reviewView.render },
  alltag: { label: "Alltag & Lernfenster", icon: "⚙️", render: settingsView.render },
};

let current = "kalender";
let sidebarOpen = false;

function navigate(route) {
  current = route;
  sidebarOpen = false;
  renderAll();
}
window.__navigate = (r) => navigate(r === "rueckblick" ? "rueckblick" : r);

/* ---------- Sidebar ---------- */
function renderSidebar() {
  const d = getState();
  const mods = selectedModulesDetailed();
  const prog = totalEctsProgress();

  const nav = el(".nav", {}, Object.entries(ROUTES).map(([key, r]) =>
    el(`button.nav-item${current === key ? ".active" : ""}`, { onclick: () => navigate(key) }, [
      el("span.ico", { text: r.icon }), el("span", { text: r.label }),
    ])));

  // Meine Module Liste
  const moduleList = el("div");
  moduleList.appendChild(el(".nav-section-label", {}, [
    el("span", { text: "MEINE MODULE" }),
    el("button", { html: "+", title: "Modul hinzufügen", onclick: () => navigate("module") }),
  ]));

  const totalMinByMod = {};
  d.entries.filter((e) => e.kind === "lernblock").forEach((e) => {
    const k = e.moduleId || "__none";
    totalMinByMod[k] = (totalMinByMod[k] || 0) + (e.doneH || 0) * 60 + (e.doneM || 0);
  });

  moduleList.appendChild(el("button.module-pill", { onclick: () => navigate("module") }, [
    el(".dot", { style: { background: "#7c6ff0" } }),
    el("span.name", { text: "Alle Einträge" }),
    el("span.count", { text: String(d.entries.length) }),
  ]));

  if (mods.length) {
    mods.slice(0, 12).forEach((m) => {
      moduleList.appendChild(el("button.module-pill", { onclick: () => navigate("module"), title: m.name }, [
        el(".dot", { style: { background: m.user.color || "#7c6ff0" } }),
        el("span.name", { text: m.name }),
        el("span.count", { text: String(d.entries.filter((e) => e.moduleId === m.id).length) }),
      ]));
    });
    if (mods.length > 12) moduleList.appendChild(el(".sidebar-hint", { text: `+${mods.length - 12} weitere in „Module & Projekte“` }));
  } else {
    moduleList.appendChild(el(".sidebar-hint", { text: "Lege Module an, wenn du deine Lernblöcke zuordnen möchtest." }));
  }

  // Fortschritts-Mini
  const progressMini = el("div", { style: { padding: "12px 11px 4px" } }, [
    el("div", { style: { fontSize: "11px", fontWeight: "700", letterSpacing: ".6px", color: "#9aa0ac", marginBottom: "6px" }, text: "STUDIENFORTSCHRITT" }),
    el(".progress", {}, [el("span", { style: { width: (prog.earned / prog.total * 100) + "%" } })]),
    el("div", { style: { fontSize: "12px", color: "#6b7280", marginTop: "6px" }, text: `${prog.earned} / ${prog.total} ECTS bestanden · ${prog.planned} ECTS geplant` }),
  ]);

  return el(`.sidebar${sidebarOpen ? ".open" : ""}`, {}, [
    el(".brand", {}, [
      el(".brand-logo", { text: "✦" }),
      el(".brand-text", {}, [
        el("strong", { html: `Study<span class="accent">Flow</span>` }),
        el("span", { text: "Online Marketing & E-Commerce" }),
      ]),
    ]),
    el("button.btn-new", { onclick: () => openEntryModal() }, [el("span", { text: "+" }), el("span", { text: "Neuer Eintrag" })]),
    nav,
    moduleList,
    progressMini,
    el(".sidebar-footer", {}, [
      el(".save-status", {}, [el("span", { text: "✓" }), el("span", { text: "Lokal gespeichert" })]),
      installButton(),
      el("button.footer-link", { html: "⬇ Daten exportieren", onclick: () => { exportJSON(); toast("Daten als JSON exportiert."); } }),
      el("button.footer-link", { html: "⬆ Daten importieren", onclick: triggerImport }),
      el("button.footer-link", { html: "↺ Zurücksetzen", onclick: () => confirmDialog("Alle lokalen Daten löschen und neu starten? Exportiere vorher, falls du sichern möchtest.", () => { resetAll(); toast("Zurückgesetzt."); }, { danger: true, yesLabel: "Alles löschen" }) }),
    ]),
  ]);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  try {
    if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) return true;
    if (window.navigator && window.navigator.standalone === true) return true;
  } catch (_) {}
  return false;
}

function installButton() {
  // Bereits als App installiert / gestartet -> Hinweis statt Button
  if (isStandalone()) {
    return el(".save-status", { style: { color: "#7c6ff0" } }, [el("span", { text: "✦" }), el("span", { text: "Als App gestartet" })]);
  }
  const canInstall = typeof window !== "undefined" && !!window.__deferredInstallPrompt;
  return el("button.footer-link", {
    html: "⬇ Als App installieren",
    style: canInstall ? { color: "#7c6ff0", fontWeight: "600" } : {},
    onclick: async () => {
      const dp = window.__deferredInstallPrompt;
      if (dp) {
        dp.prompt();
        try { await dp.userChoice; } catch (_) {}
        window.__deferredInstallPrompt = null;
        renderAll();
      } else {
        showInstallHelp();
      }
    },
  });
}

function showInstallHelp() {
  openInstallModal();
}

function openInstallModal() {
  const row = (title, steps) => el("div", { style: { marginBottom: "14px" } }, [
    el("div", { style: { fontWeight: "700", marginBottom: "4px" }, text: title }),
    el("div", { style: { fontSize: "13.5px", color: "#6b7280", lineHeight: "1.55" }, html: steps }),
  ]);
  openModal(el("div", {}, [
    el(".modal-head", {}, [el("h2", { text: "StudyFlow als App installieren" }), el("button.close", { html: "&times;", onclick: closeModal })]),
    el(".modal-body", {}, [
      row("💻 Chrome / Edge (PC & Mac)", 'Klicke rechts in der Adressleiste auf das <b>Installieren-Symbol</b> (Monitor mit Pfeil) und wähle „Installieren". StudyFlow öffnet sich danach in einem eigenen Fenster.'),
      row("🧭 Safari (Mac)", "Menü <b>Ablage → Zum Dock hinzufügen</b>."),
      row("📱 iPhone / iPad (Safari)", "Tippe auf <b>Teilen</b> (Quadrat mit Pfeil) → <b>Zum Home-Bildschirm</b>."),
      row("🤖 Android (Chrome)", 'Tippe auf das <b>Menü ⋮</b> → <b>App installieren</b> bzw. „Zum Startbildschirm hinzufügen".'),
      el("div", { style: { fontSize: "12.5px", color: "#9aa0ac", marginTop: "6px" }, text: "Hinweis: Das Installieren klappt am besten, wenn du StudyFlow über einen lokalen Server (Start-Skript) oder eine Webadresse öffnest – nicht per Doppelklick als einzelne Datei." }),
    ]),
    el(".modal-foot", {}, [el("button.btn.btn-primary", { text: "Verstanden", onclick: closeModal })]),
  ]));
}

function triggerImport() {
  const inp = el("input", { type: "file", accept: "application/json,.json", style: { display: "none" } });
  inp.addEventListener("change", () => {
    const f = inp.files[0];
    if (!f) return;
    importJSON(f).then(() => toast("Daten importiert.")).catch((e) => toast("Import fehlgeschlagen: " + e.message));
  });
  document.body.appendChild(inp);
  inp.click();
  setTimeout(() => inp.remove(), 1000);
}

/* ---------- Render ---------- */
let root = null;

function renderAll() {
  clear(root);

  // Mobile Topbar
  const topbar = el(".mobile-topbar", {}, [
    el("button.menu-btn", { html: "☰", onclick: () => { sidebarOpen = !sidebarOpen; renderAll(); } }),
    el("strong", { html: `Study<span style="color:#7c6ff0">Flow</span>` }),
    el("button.btn.btn-sm.btn-primary", { text: "+ Eintrag", style: { marginLeft: "auto" }, onclick: () => openEntryModal() }),
  ]);

  const scrim = el(`.scrim${sidebarOpen ? ".show" : ""}`, { onclick: () => { sidebarOpen = false; renderAll(); } });

  const main = el(".main");
  ROUTES[current].render(main);

  const layout = el(".layout", {}, [renderSidebar(), el("div", { style: { overflow: "hidden", display: "flex", flexDirection: "column" } }, [topbar, main])]);

  root.appendChild(layout);
  root.appendChild(scrim);
}

export function mount(container) {
  root = container;
  renderAll();
  // Bei State-Änderung Sidebar + aktuelle View neu zeichnen
  subscribe(() => renderAll());
  // PWA: wenn ein Installations-Angebot verfügbar wird, Sidebar aktualisieren
  if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    window.addEventListener("sf-installable", () => renderAll());
    window.addEventListener("sf-installed", () => { toast("StudyFlow wurde als App installiert. 🎉"); renderAll(); });
  }
}
