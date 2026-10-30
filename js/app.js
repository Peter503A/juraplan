/* ============================================================
   JuraPlan – App-Einstieg (Router, Export/Import, PWA-Install)
   ============================================================ */
(function () {
  "use strict";
  const { el } = U;

  let deferredPrompt = null;

  function mount() {
    const root = document.getElementById("app");
    U.clear(root);

    // Mobile-Overlay für Sidebar
    const overlay = el("div", { class: "sidebar-overlay",
      onclick: () => Components.closeMobileSidebar() });
    root.appendChild(overlay);

    root.appendChild(Components.sidebar());

    const s = Store.state;
    if (!s.ready) {
      root.appendChild(loading());
      return;
    }

    let view;
    if (s.view === "modules") view = ModulesView.render();
    else if (s.view === "review") view = ReviewView.render();
    else view = CalendarView.render();
    root.appendChild(view);
  }

  function loading() {
    return el("main", { class: "main-content" }, [
      el("div", { style: { display: "grid", placeItems: "center", flex: "1", gap: "12px",
        color: "var(--text-muted)" } }, [
        Icons.calendar(28),
        el("p", {}, ["Dein Kalender wird geladen …"]),
      ]),
    ]);
  }

  // ---------- Export / Import ----------
  async function exportFile() {
    const data = await Store.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = el("a", { href: url,
      download: `juraplan-backup-${U.toISODate(new Date())}.json` });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    U.toast("Backup exportiert");
  }

  function importFile() {
    const input = el("input", { type: "file", accept: "application/json,.json",
      style: { display: "none" } });
    input.addEventListener("change", async () => {
      const file = input.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const replace = confirm(
          "Backup importieren.\n\n„OK“ = alle aktuellen Daten ersetzen\n„Abbrechen“ = mit vorhandenen Daten zusammenführen"
        );
        await Store.importData(data, replace ? "replace" : "merge");
        U.toast("Daten importiert");
      } catch (err) {
        U.toast("Import fehlgeschlagen: keine gültige Datei");
        console.error(err);
      }
    });
    document.body.appendChild(input);
    input.click();
    input.remove();
  }

  // ---------- PWA Install ----------
  function isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
  }

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const btn = document.getElementById("install-btn");
    if (btn) btn.classList.add("show");
    maybeShowBanner();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    dismissBanner(true);
    const btn = document.getElementById("install-btn");
    if (btn) btn.classList.remove("show");
    U.toast("JuraPlan ist jetzt installiert");
  });

  async function promptInstall() {
    // Chrome/Edge: nativer Dialog verfügbar
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      return;
    }
    // Sonst: plattformabhängige Anleitung zeigen
    showInstallHelp();
  }

  // Plattform erkennen für die richtige Anleitung
  function platform() {
    const ua = navigator.userAgent;
    const isIOS = /iPhone|iPad|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isSafari = /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(ua);
    const isAndroid = /Android/.test(ua);
    return { isIOS, isSafari, isAndroid };
  }

  function showInstallHelp() {
    const { isIOS, isSafari } = platform();
    const root = document.getElementById("modal-root");
    U.clear(root);
    const backdrop = el("div", { class: "modal-backdrop",
      onclick: (ev) => { if (ev.target === backdrop) root.innerHTML = ""; } });
    const modal = el("div", { class: "modal", style: { maxWidth: "440px" } });
    modal.appendChild(
      el("div", { class: "modal-head" }, [
        el("h2", {}, ["JuraPlan installieren"]),
        el("button", { class: "modal-close", onclick: () => (root.innerHTML = "") }, [Icons.x(18)]),
      ])
    );

    let steps;
    if (isIOS) {
      steps = [
        "Tippe unten in Safari auf das Teilen-Symbol (Quadrat mit Pfeil nach oben).",
        "Wähle „Zum Home-Bildschirm“.",
        "Tippe oben rechts auf „Hinzufügen“ – fertig!",
      ];
    } else if (isSafari) {
      steps = [
        "Öffne in der Safari-Menüleiste „Ablage“.",
        "Wähle „Zum Dock hinzufügen“.",
        "JuraPlan startet danach wie ein eigenes Programm.",
      ];
    } else {
      steps = [
        "Öffne das Browser-Menü (die drei Punkte oben rechts).",
        "Wähle „App installieren“ bzw. „Zu Startbildschirm/Apps hinzufügen“.",
        "Bestätige mit „Installieren“ – fertig!",
      ];
    }

    const list = el("ol", { style: { margin: "0", paddingLeft: "20px",
      display: "flex", flexDirection: "column", gap: "10px",
      fontSize: "14px", lineHeight: "1.5" } },
      steps.map((t) => el("li", {}, [t])));

    modal.appendChild(
      el("div", { class: "modal-body" }, [
        el("p", { class: "muted", style: { margin: "0", fontSize: "13.5px" } },
          ["So legst du JuraPlan als App auf dein Gerät. Deine Daten bleiben lokal gespeichert."]),
        list,
      ])
    );
    modal.appendChild(
      el("div", { class: "modal-foot" }, [
        el("div", { class: "foot-right" }, [
          el("button", { class: "primary", style: { padding: "10px 18px" },
            onclick: () => (root.innerHTML = "") }, ["Alles klar"]),
        ]),
      ])
    );
    backdrop.appendChild(modal);
    root.appendChild(backdrop);
  }

  // ---- Installations-Banner (für neue Besucher über den geteilten Link) ----
  const BANNER_KEY = "juraplan_install_dismissed";

  function maybeShowBanner() {
    if (isStandalone()) return;                       // schon als App geöffnet
    if (localStorage.getItem(BANNER_KEY) === "1") return; // bewusst weggeklickt
    if (document.getElementById("install-banner")) return;

    const banner = el("div", { class: "install-banner", id: "install-banner" }, [
      el("div", { class: "ib-icon" }, [Icons.download(18)]),
      el("div", { class: "ib-text" }, [
        el("strong", {}, ["JuraPlan als App installieren"]),
        el("span", {}, ["Schneller Zugriff, offline nutzbar – Daten bleiben auf deinem Gerät."]),
      ]),
      el("button", { class: "ib-install primary",
        onclick: () => { promptInstall(); } }, ["Installieren"]),
      el("button", { class: "ib-close", "aria-label": "Schließen",
        onclick: () => dismissBanner(true) }, [Icons.x(16)]),
    ]);
    document.body.appendChild(banner);
  }

  function dismissBanner(remember) {
    const b = document.getElementById("install-banner");
    if (b) b.remove();
    if (remember) localStorage.setItem(BANNER_KEY, "1");
  }

  // ---------- Start ----------
  async function start() {
    Store.subscribe(() => mount());
    mount(); // Ladezustand
    try {
      await Store.init();
    } catch (err) {
      console.error("DB-Fehler", err);
      U.toast("Speicher konnte nicht geladen werden");
    }
    // Installations-Banner für neue Besucher (z. B. über geteilten Link) anbieten
    setTimeout(maybeShowBanner, 1200);

    // Jetzt-Linie minütlich aktualisieren, wenn Kalender/Tag/Woche
    setInterval(() => {
      const s = Store.state;
      if (s.view === "calendar" && (s.calView === "day" || s.calView === "week")) mount();
    }, 60000);
  }

  window.App = { exportFile, importFile, promptInstall };
  document.addEventListener("DOMContentLoaded", start);
})();
