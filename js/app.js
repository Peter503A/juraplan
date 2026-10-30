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
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const btn = document.getElementById("install-btn");
    if (btn) btn.classList.add("show");
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    const btn = document.getElementById("install-btn");
    if (btn) btn.classList.remove("show");
  });
  async function promptInstall() {
    if (!deferredPrompt) {
      U.toast("Installation über das Browser-Menü möglich");
      return;
    }
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
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
    // Jetzt-Linie minütlich aktualisieren, wenn Kalender/Tag/Woche
    setInterval(() => {
      const s = Store.state;
      if (s.view === "calendar" && (s.calView === "day" || s.calView === "week")) mount();
    }, 60000);
  }

  window.App = { exportFile, importFile, promptInstall };
  document.addEventListener("DOMContentLoaded", start);
})();
