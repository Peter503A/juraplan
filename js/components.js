/* ============================================================
   JuraPlan – Gemeinsame Komponenten (Sidebar, Header)
   ============================================================ */
(function () {
  "use strict";
  const { el } = U;

  function sidebar() {
    const s = Store.state;
    const sb = el("aside", { class: "sidebar" });

    // Brand
    sb.appendChild(
      el("a", { class: "brand", href: "#", "aria-label": "JuraPlan Startseite",
        onclick: (e) => { e.preventDefault(); Store.setView("calendar"); } },
      [
        el("span", { class: "brand-mark" }, [Icons.scale(23)]),
        el("span", { class: "brand-text" }, [
          el("b", {}, ["Jura", el("span", { class: "accent" }, ["Plan"])]),
          el("small", {}, ["Raum für deinen Lernalltag."]),
        ]),
      ])
    );

    // Neuer Eintrag
    sb.appendChild(
      el("button", { class: "primary new-entry",
        onclick: () => EntryDialog.open() },
        [Icons.plus(18), " Neuer Eintrag"])
    );

    // Navigation
    const nav = el("nav", { class: "main-nav", "aria-label": "Hauptnavigation" });
    const navItems = [
      { id: "calendar", label: "Kalender", icon: Icons.calendar },
      { id: "modules", label: "Module & Projekte", icon: Icons.book },
      { id: "review", label: "Wochenrückblick", icon: Icons.chart },
    ];
    navItems.forEach((it) => {
      nav.appendChild(
        el("button", {
          class: s.view === it.id ? "active" : "",
          onclick: () => { Store.setView(it.id); closeMobileSidebar(); },
        }, [it.icon(19), it.label])
      );
    });
    sb.appendChild(nav);

    // Meine Module
    const section = el("div", { class: "side-section" });
    section.appendChild(
      el("div", { class: "side-title" }, [
        "MEINE MODULE",
        el("button", { class: "icon-button", "aria-label": "Modul hinzufügen",
          onclick: () => ModulesView.openModuleDialog() }, [Icons.plus(16)]),
      ])
    );

    const allCount = Store.state.entries.length;
    section.appendChild(
      el("button", {
        class: "filter-row" + (s.activeModule === null ? " chosen" : ""),
        onclick: () => Store.setActiveModule(null),
      }, [
        el("span", { class: "filter-dot", style: { background: "#7465cf" } }),
        "Alle Einträge",
        el("span", {}, [String(allCount)]),
      ])
    );

    s.modules.forEach((m) => {
      const count = s.entries.filter((e) => e.moduleId === m.id).length;
      section.appendChild(
        el("button", {
          class: "filter-row" + (s.activeModule === m.id ? " chosen" : ""),
          onclick: () => Store.setActiveModule(m.id),
        }, [
          el("span", { class: "filter-dot", style: { background: m.color } }),
          el("span", { style: { flex: "1", textAlign: "left" } }, [m.name]),
          el("span", {}, [String(count)]),
        ])
      );
    });

    if (s.modules.length === 0) {
      section.appendChild(
        el("p", { class: "muted tiny", style: { padding: "0 4px", lineHeight: "1.5" } },
          ["Lege Module an, wenn du deine Lernblöcke zuordnen möchtest."])
      );
    }
    sb.appendChild(section);

    // Bottom
    const bottom = el("div", { class: "sidebar-bottom" });
    bottom.appendChild(
      el("div", { class: "save-state saved", role: "status" },
        [Icons.checkCircle(16), "Lokal gespeichert"])
    );
    // Installations-Button nur zeigen, wenn die App NICHT bereits installiert läuft
    const standalone = window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    if (!standalone) {
      const installBtn = el("button", { class: "install-btn show", id: "install-btn",
        onclick: () => App.promptInstall() }, [Icons.download(15), "Als App installieren"]);
      bottom.appendChild(installBtn);
    }
    bottom.appendChild(
      el("button", { class: "text-button", onclick: () => App.exportFile() },
        [Icons.download(15), " Daten exportieren"])
    );
    bottom.appendChild(
      el("button", { class: "text-button", onclick: () => App.importFile() },
        [Icons.upload(15), " Daten importieren"])
    );
    sb.appendChild(bottom);

    return sb;
  }

  function header(title) {
    const d = new Date();
    const h = el("header", { class: "main-header" });

    const left = el("div", { style: { display: "flex", alignItems: "center", gap: "10px" } });
    left.appendChild(
      el("button", { class: "menu-toggle", "aria-label": "Menü",
        onclick: openMobileSidebar }, [Icons.menu(20)])
    );
    left.appendChild(
      el("div", {}, [
        el("div", { class: "eyebrow" }, ["DEIN LERNALLTAG. IN DEINEM TEMPO."]),
        el("h1", {}, [title]),
      ])
    );
    h.appendChild(left);

    h.appendChild(
      el("div", { class: "header-actions" }, [
        el("span", { class: "today-date" }, [U.fmtTodayLabel(d)]),
        el("button", { class: "mobile-add primary", onclick: () => EntryDialog.open() },
          [Icons.plus(18), "Eintrag"]),
        el("span", { class: "user-dot", "aria-label": "Persönlicher Bereich" }, ["JP"]),
      ])
    );
    return h;
  }

  function openMobileSidebar() {
    document.querySelector(".sidebar")?.classList.add("open");
    document.querySelector(".sidebar-overlay")?.classList.add("show");
  }
  function closeMobileSidebar() {
    document.querySelector(".sidebar")?.classList.remove("open");
    document.querySelector(".sidebar-overlay")?.classList.remove("show");
  }

  window.Components = { sidebar, header, openMobileSidebar, closeMobileSidebar };
})();
