/* ============================================================
   JuraPlan – Eintrags-Dialog (Lernblock / Termin anlegen & bearbeiten)
   ============================================================ */
(function () {
  "use strict";
  const { el } = U;

  // defaults: {date, start, end}
  function open(entry, defaults) {
    const isNew = !entry;
    const e = entry
      ? JSON.parse(JSON.stringify(entry))
      : {
          id: null,
          title: "",
          moduleId: Store.state.activeModule || null,
          date: (defaults && defaults.date) || U.toISODate(new Date()),
          start: (defaults && defaults.start) || "09:00",
          end: (defaults && defaults.end) || "10:00",
          note: "",
          color: null, // individuelle Farbe; null = Modulfarbe erben
          missingNote: "",
          carryOver: false,
        };

    const root = document.getElementById("modal-root");
    U.clear(root);

    const backdrop = el("div", { class: "modal-backdrop",
      onclick: (ev) => { if (ev.target === backdrop) close(); } });
    const modal = el("div", { class: "modal", role: "dialog", "aria-modal": "true" });

    // Head
    modal.appendChild(
      el("div", { class: "modal-head" }, [
        el("h2", {}, [isNew ? "Neuer Eintrag" : "Eintrag bearbeiten"]),
        el("button", { class: "modal-close", "aria-label": "Schließen", onclick: close },
          [Icons.x(18)]),
      ])
    );

    const body = el("div", { class: "modal-body" });

    // Titel
    const titleInput = el("input", { type: "text", value: e.title,
      placeholder: "z. B. Schuldrecht AT – Fall 3",
      oninput: (ev) => (e.title = ev.target.value) });
    body.appendChild(field("Titel", titleInput));

    // Modul
    const sel = el("select", { onchange: (ev) => (e.moduleId = ev.target.value || null) });
    sel.appendChild(el("option", { value: "" }, ["Ohne Modul"]));
    Store.state.modules.forEach((m) => {
      const opt = el("option", { value: m.id }, [m.name]);
      if (m.id === e.moduleId) opt.selected = true;
      sel.appendChild(opt);
    });
    const modRow = el("div", { class: "field-row" }, [
      field("Modul", sel),
      field("Datum", el("input", { type: "date", value: e.date,
        onchange: (ev) => (e.date = ev.target.value) })),
    ]);
    body.appendChild(modRow);

    // Farbe des Eintrags (individuell, überschreibt die Modulfarbe)
    const colorPick = el("div", { class: "color-pick entry-color-pick" });

    // "Auto" = keine eigene Farbe -> erbt Modulfarbe
    const autoBtn = el("button", {
      class: "color-auto" + (!e.color ? " active" : ""),
      "aria-label": "Automatisch (Modulfarbe)",
      title: "Automatisch – nutzt die Modulfarbe",
      onclick: () => {
        e.color = null;
        setActiveColor(colorPick, null);
      },
    }, [Icons.layers(15)]);
    colorPick.appendChild(autoBtn);

    Store.DEFAULT_COLORS.forEach((c) => {
      const b = el("button", {
        class: e.color === c ? "active" : "",
        style: { background: c },
        "aria-label": "Farbe " + c,
        onclick: () => {
          e.color = c;
          setActiveColor(colorPick, c);
        },
      });
      colorPick.appendChild(b);
    });
    body.appendChild(field("Farbe", colorPick,
      "Standard: Modulfarbe. Wähle eine eigene Farbe, um den Eintrag abzuheben."));

    // Zeit (Von–Bis) + live berechnete gelernte Dauer
    const durationHint = el("span", { class: "hint", style: { marginLeft: "8px" } }, [""]);
    function updateDuration() {
      const mins = U.timeToMin(e.end) - U.timeToMin(e.start);
      durationHint.textContent = mins > 0 ? "= " + U.fmtDuration(mins) + " gelernt" : "";
    }
    const vonLabel = el("div", { class: "field" }, [
      el("label", {}, ["Von", durationHint]),
      el("input", { type: "time", value: e.start, step: "300",
        onchange: (ev) => { e.start = ev.target.value; updateDuration(); } }),
    ]);
    body.appendChild(
      el("div", { class: "field-row" }, [
        vonLabel,
        field("Bis", el("input", { type: "time", value: e.end, step: "300",
          onchange: (ev) => { e.end = ev.target.value; updateDuration(); } })),
      ])
    );
    updateDuration();

    // Notiz
    body.appendChild(
      field("Notiz", el("textarea", {
        placeholder: "Gedanken, Teilaufgaben, offene Fragen …",
        oninput: (ev) => (e.note = ev.target.value),
      }, [e.note || ""]), "Pro Eintrag kannst du hier frei notieren.")
    );

    // Offene Punkte (optional): Was fehlt noch + in nächste Woche mitnehmen
    body.appendChild(
      field("Offene Punkte",
        el("textarea", {
          placeholder: "Optional: Was fehlt noch oder willst du wiederholen? …",
          oninput: (ev) => (e.missingNote = ev.target.value),
        }, [e.missingNote || ""]),
        "optional")
    );
    const carry = el("label", {
      style: { display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px",
        fontWeight: "500", cursor: "pointer" },
    }, [
      el("input", { type: "checkbox", checked: e.carryOver ? "checked" : null,
        onchange: (ev) => (e.carryOver = ev.target.checked) }),
      "In nächste Woche mitnehmen",
    ]);
    body.appendChild(el("div", { class: "field" }, [carry]));

    modal.appendChild(body);

    // Footer
    const foot = el("div", { class: "modal-foot" });
    if (!isNew) {
      foot.appendChild(
        el("button", { class: "btn-danger", onclick: async () => {
          if (confirm("Diesen Eintrag wirklich löschen?")) {
            await Store.deleteEntry(e.id);
            U.toast("Eintrag gelöscht");
            close();
          }
        } }, [Icons.trash(15), "Löschen"])
      );
    }
    foot.appendChild(
      el("div", { class: "foot-right" }, [
        el("button", { class: "btn-ghost", onclick: close }, ["Abbrechen"]),
        el("button", { class: "primary", style: { padding: "10px 18px" },
          onclick: () => save(e, isNew) }, ["Speichern"]),
      ])
    );
    modal.appendChild(foot);

    backdrop.appendChild(modal);
    root.appendChild(backdrop);
    setTimeout(() => titleInput.focus(), 50);

    document.addEventListener("keydown", escClose);
  }

  function escClose(ev) { if (ev.key === "Escape") close(); }

  async function save(e, isNew) {
    if (!e.title || !e.title.trim()) {
      U.toast("Bitte einen Titel eingeben");
      return;
    }
    if (U.timeToMin(e.end) <= U.timeToMin(e.start)) {
      U.toast("Endzeit muss nach der Startzeit liegen");
      return;
    }
    e.title = e.title.trim();
    // Alte Felder migrieren (gibt es nicht mehr): gelernte Zeit = Dauer Von–Bis, kein Typ/Status/Priorität
    delete e.status;
    delete e.type;
    delete e.priority;
    delete e.actualMin;
    delete e.actualHours;
    delete e.actualMinutes;
    await Store.saveEntry(e);
    U.toast(isNew ? "Eintrag angelegt" : "Gespeichert");
    close();
  }

  function close() {
    const root = document.getElementById("modal-root");
    U.clear(root);
    document.removeEventListener("keydown", escClose);
  }

  // ---- UI-Helfer ----
  function field(label, control, hint) {
    const f = el("div", { class: "field" });
    const lab = el("label", {}, [label]);
    if (hint) lab.appendChild(el("span", { class: "hint", style: { marginLeft: "8px" } }, [hint]));
    f.appendChild(lab);
    f.appendChild(control);
    return f;
  }

  function setActiveColor(container, color) {
    container.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
    if (color === null) {
      const auto = container.querySelector(".color-auto");
      if (auto) auto.classList.add("active");
    } else {
      container.querySelectorAll("button").forEach((b) => {
        if (b.style.background && rgbEquals(b.style.background, color)) b.classList.add("active");
      });
    }
  }
  // Vergleich hilfsweise über gesetzten Style (Browser normalisiert hex -> rgb)
  function rgbEquals(styleBg, hex) {
    const probe = document.createElement("span");
    probe.style.background = hex;
    return probe.style.background === styleBg || styleBg.toLowerCase() === hex.toLowerCase();
  }

  window.EntryDialog = { open, close };
})();
