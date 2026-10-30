/* ============================================================
   JuraPlan – Module & Projekte
   ============================================================ */
(function () {
  "use strict";
  const { el } = U;

  function render() {
    const s = Store.state;
    const wrap = el("div", { class: "main-content" });
    wrap.appendChild(Components.header("Module & Projekte"));

    const scroll = el("div", { class: "view-scroll" });

    scroll.appendChild(
      el("div", { class: "section-intro" }, [
        el("p", {}, ["Ordne deine Lernblöcke zu. Fortschritt und Zeitziele sind freiwillig."]),
        el("button", { class: "primary", style: { padding: "10px 16px" },
          onclick: () => openModuleDialog() }, [Icons.plus(18), " Modul hinzufügen"]),
      ])
    );

    if (s.modules.length === 0) {
      scroll.appendChild(
        el("div", { class: "empty-card" }, [
          el("div", { class: "ec-icon" }, [Icons.book(42)]),
          el("h3", {}, ["Deine Themen. Deine Struktur."]),
          el("p", {}, [
            "Zum Beispiel Zivilrecht, Schuldrecht AT oder ein eigenes Projekt. Du kannst den Kalender auch ohne Module nutzen.",
          ]),
          el("button", { class: "primary", style: { padding: "11px 20px" },
            onclick: () => openModuleDialog() }, ["Erstes Modul anlegen"]),
        ])
      );
    } else {
      const grid = el("div", { class: "module-grid" });
      s.modules.forEach((m) => grid.appendChild(moduleCard(m)));
      scroll.appendChild(grid);
    }

    wrap.appendChild(scroll);
    return wrap;
  }

  function moduleCard(m) {
    const entries = Store.state.entries.filter((e) => e.moduleId === m.id);
    const blocks = entries.filter((e) => e.type === "block");
    const done = blocks.filter((e) => e.status === "done").length;
    const actualMin = blocks.reduce((sum, e) => sum + Store.actualMin(e), 0);
    const goalMin = m.goalMin || 0;
    const goalPct = goalMin ? Math.min(100, (actualMin / goalMin) * 100) : 0;

    const card = el("div", { class: "module-card" });
    card.appendChild(
      el("div", { class: "mc-top" }, [
        el("span", { class: "mc-dot", style: { background: m.color } }),
        el("span", { class: "mc-name" }, [m.name]),
        el("div", { class: "mc-actions" }, [
          el("button", { class: "icon-button", "aria-label": "Bearbeiten",
            onclick: () => openModuleDialog(m) }, [Icons.edit(15)]),
          el("button", { class: "icon-button", "aria-label": "Löschen",
            onclick: async () => {
              if (confirm(`Modul „${m.name}“ löschen? Die Einträge bleiben erhalten (ohne Modul).`)) {
                await Store.deleteModule(m.id);
                U.toast("Modul gelöscht");
              }
            } }, [Icons.trash(15)]),
        ]),
      ])
    );

    card.appendChild(
      el("div", { class: "mc-stats" }, [
        stat(String(entries.length), "Einträge"),
        stat(`${done}/${blocks.length}`, "Lernblöcke erledigt"),
        stat(U.fmtHours(actualMin), "gelernt"),
      ])
    );

    if (goalMin) {
      card.appendChild(
        el("div", {}, [
          el("div", { class: "rail-stat", style: { fontSize: "12px", marginBottom: "6px" } }, [
            el("span", { class: "muted" }, ["Ziel: " + U.fmtHours(goalMin)]),
            el("span", { style: { fontWeight: "600" } }, [Math.round(goalPct) + " %"]),
          ]),
          el("div", { class: "mc-bar" },
            [el("div", { style: { width: goalPct + "%", background: m.color } })]),
        ])
      );
    } else {
      card.appendChild(
        el("button", { class: "rc-note-link", style: { fontSize: "12.5px" },
          onclick: () => openModuleDialog(m) }, ["+ Zeitziel festlegen"])
      );
    }
    return card;
  }

  function stat(num, label) {
    return el("div", { class: "module-stat" }, [
      el("div", { class: "ms-num" }, [num]),
      el("div", { class: "ms-label" }, [label]),
    ]);
  }

  function openModuleDialog(mod) {
    const isNew = !mod;
    const m = mod ? Object.assign({}, mod) : {
      id: null, name: "", color: Store.DEFAULT_COLORS[Store.state.modules.length % Store.DEFAULT_COLORS.length],
      goalHours: 0,
    };
    if (m.goalMin != null && m.goalHours == null) m.goalHours = Math.round((m.goalMin / 60) * 10) / 10;
    m.goalHours = m.goalHours || 0;

    const root = document.getElementById("modal-root");
    U.clear(root);
    const backdrop = el("div", { class: "modal-backdrop",
      onclick: (ev) => { if (ev.target === backdrop) root.innerHTML = ""; } });
    const modal = el("div", { class: "modal", style: { maxWidth: "440px" } });

    modal.appendChild(
      el("div", { class: "modal-head" }, [
        el("h2", {}, [isNew ? "Neues Modul" : "Modul bearbeiten"]),
        el("button", { class: "modal-close", onclick: () => (root.innerHTML = "") }, [Icons.x(18)]),
      ])
    );

    const nameInput = el("input", { type: "text", value: m.name,
      placeholder: "z. B. Zivilrecht", oninput: (ev) => (m.name = ev.target.value) });

    const colorPick = el("div", { class: "color-pick" });
    Store.DEFAULT_COLORS.forEach((c) => {
      const b = el("button", {
        class: c === m.color ? "active" : "",
        style: { background: c },
        "aria-label": "Farbe",
        onclick: () => {
          m.color = c;
          colorPick.querySelectorAll("button").forEach((x) => x.classList.remove("active"));
          b.classList.add("active");
        },
      });
      colorPick.appendChild(b);
    });

    const goalInput = el("input", { type: "number", min: "0", step: "1", value: m.goalHours,
      placeholder: "0", oninput: (ev) => (m.goalHours = parseFloat(ev.target.value) || 0) });

    const body = el("div", { class: "modal-body" }, [
      el("div", { class: "field" }, [el("label", {}, ["Name"]), nameInput]),
      el("div", { class: "field" }, [el("label", {}, ["Farbe"]), colorPick]),
      el("div", { class: "field" }, [
        el("label", {}, ["Zeitziel (Stunden)",
          el("span", { class: "hint", style: { marginLeft: "8px" } }, ["optional"])]),
        goalInput,
      ]),
    ]);
    modal.appendChild(body);

    const foot = el("div", { class: "modal-foot" });
    if (!isNew) {
      foot.appendChild(
        el("button", { class: "btn-danger", onclick: async () => {
          if (confirm(`Modul „${m.name}“ löschen?`)) {
            await Store.deleteModule(m.id);
            root.innerHTML = "";
            U.toast("Modul gelöscht");
          }
        } }, [Icons.trash(15), "Löschen"])
      );
    }
    foot.appendChild(
      el("div", { class: "foot-right" }, [
        el("button", { class: "btn-ghost", onclick: () => (root.innerHTML = "") }, ["Abbrechen"]),
        el("button", { class: "primary", style: { padding: "10px 18px" },
          onclick: async () => {
            if (!m.name || !m.name.trim()) { U.toast("Bitte einen Namen eingeben"); return; }
            m.name = m.name.trim();
            m.goalMin = Math.round((m.goalHours || 0) * 60);
            await Store.saveModule(m);
            root.innerHTML = "";
            U.toast(isNew ? "Modul angelegt" : "Gespeichert");
          } }, ["Speichern"]),
      ])
    );
    modal.appendChild(foot);

    backdrop.appendChild(modal);
    root.appendChild(backdrop);
    setTimeout(() => nameInput.focus(), 50);
  }

  window.ModulesView = { render, openModuleDialog };
})();
