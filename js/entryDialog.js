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
          type: "block", // block | appointment
          moduleId: Store.state.activeModule || null,
          date: (defaults && defaults.date) || U.toISODate(new Date()),
          start: (defaults && defaults.start) || "09:00",
          end: (defaults && defaults.end) || "10:00",
          note: "",
          color: null, // individuelle Farbe; null = Modulfarbe erben
          priority: "normal", // normal | important | urgent
          status: "open", // open | done | partial | missing
          actualHours: 0,
          actualMinutes: 0,
          missingNote: "",
          carryOver: false,
        };

    // Backwards: actualMin -> hours/minutes
    if (e.actualMin != null && e.actualHours == null) {
      e.actualHours = Math.floor(e.actualMin / 60);
      e.actualMinutes = e.actualMin % 60;
    }
    e.actualHours = e.actualHours || 0;
    e.actualMinutes = e.actualMinutes || 0;

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

    // Typ – große, visuell unterscheidbare Auswahlkarten
    const typeCards = el("div", { class: "type-cards" });
    const typeOptions = [
      {
        v: "block", icon: Icons.book, label: "Lernblock",
        desc: "Zählt zur Lernzeit",
      },
      {
        v: "appointment", icon: Icons.calendar, label: "Termin",
        desc: "Z. B. Vorlesung, Prüfung",
      },
    ];
    typeOptions.forEach((o) => {
      const card = el("button", {
        class: "type-card type-" + o.v + (e.type === o.v ? " active" : ""),
        "data-type": o.v,
        onclick: () => {
          e.type = o.v;
          typeCards.querySelectorAll(".type-card").forEach((c) => c.classList.remove("active"));
          card.classList.add("active");
          // Platzhalter des Titelfelds anpassen
          titleInput.setAttribute("placeholder",
            o.v === "appointment" ? "z. B. Vorlesung Zivilrecht" : "z. B. Schuldrecht AT – Fall 3");
        },
      }, [
        el("span", { class: "tc-icon" }, [o.icon(20)]),
        el("span", { class: "tc-text" }, [
          el("span", { class: "tc-label" }, [o.label]),
          el("span", { class: "tc-desc" }, [o.desc]),
        ]),
        el("span", { class: "tc-check" }, [Icons.check(14)]),
      ]);
      typeCards.appendChild(card);
    });
    body.appendChild(field("Typ", typeCards));

    // Titel
    const titleInput = el("input", { type: "text", value: e.title,
      placeholder: e.type === "appointment" ? "z. B. Vorlesung Zivilrecht" : "z. B. Schuldrecht AT – Fall 3",
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

    // Zeit
    body.appendChild(
      el("div", { class: "field-row" }, [
        field("Von", el("input", { type: "time", value: e.start, step: "300",
          onchange: (ev) => { e.start = ev.target.value; } })),
        field("Bis", el("input", { type: "time", value: e.end, step: "300",
          onchange: (ev) => { e.end = ev.target.value; } })),
      ])
    );

    // Priorität
    body.appendChild(
      field("Priorität", segmented(
        [
          { v: "normal", label: "Normal" },
          { v: "important", label: "Wichtig", icon: Icons.star, prio: "important" },
          { v: "urgent", label: "Dringend", icon: Icons.alert, prio: "urgent" },
        ],
        e.priority,
        (v) => (e.priority = v),
        "prio-seg"
      ))
    );

    // Notiz
    body.appendChild(
      field("Notiz", el("textarea", {
        placeholder: "Gedanken, Teilaufgaben, offene Fragen …",
        oninput: (ev) => (e.note = ev.target.value),
      }, [e.note || ""]), "Pro Eintrag kannst du hier frei notieren.")
    );

    // Status
    const statusWrap = el("div", { class: "conditional show" });
    body.appendChild(
      field("Status", segmented(
        [
          { v: "open", label: "Offen", icon: Icons.circleDashed },
          { v: "done", label: "Erledigt", icon: Icons.check, status: "done" },
          { v: "partial", label: "Teilweise", icon: Icons.flag, status: "partial" },
          { v: "missing", label: "Fehlt", icon: Icons.x, status: "missing" },
        ],
        e.status,
        (v) => { e.status = v; refreshConditional(); },
        "status-seg"
      ))
    );

    // Bedingte Felder: Ist-Zeit + Was fehlt + Carry-over
    const cond = el("div", { style: { display: "flex", flexDirection: "column", gap: "16px" } });
    body.appendChild(cond);

    function refreshConditional() {
      U.clear(cond);
      if (e.status === "done" || e.status === "partial") {
        const hrs = el("input", { type: "number", min: "0", max: "24", value: e.actualHours,
          oninput: (ev) => (e.actualHours = parseInt(ev.target.value, 10) || 0) });
        const mins = el("input", { type: "number", min: "0", max: "59", step: "5", value: e.actualMinutes,
          oninput: (ev) => (e.actualMinutes = parseInt(ev.target.value, 10) || 0) });
        cond.appendChild(
          field("Tatsächlich gelernt",
            el("div", { class: "field-row" }, [
              el("div", { style: { display: "flex", alignItems: "center", gap: "6px" } },
                [hrs, el("span", { class: "muted tiny" }, ["Std."])]),
              el("div", { style: { display: "flex", alignItems: "center", gap: "6px" } },
                [mins, el("span", { class: "muted tiny" }, ["Min."])]),
            ]),
            "Trägt die Lernzeit in den Wochenrückblick ein.")
        );
      }
      if (e.status === "partial" || e.status === "missing") {
        cond.appendChild(
          field(e.status === "missing" ? "Was fehlt komplett?" : "Was fehlt noch?",
            el("textarea", {
              placeholder: "z. B. Klausurteil B offen, nochmal wiederholen …",
              oninput: (ev) => (e.missingNote = ev.target.value),
            }, [e.missingNote || ""]))
        );
        const carry = el("label", {
          style: { display: "flex", alignItems: "center", gap: "8px", fontSize: "13.5px",
            fontWeight: "500", cursor: "pointer" },
        }, [
          el("input", { type: "checkbox", checked: e.carryOver ? "checked" : null,
            onchange: (ev) => (e.carryOver = ev.target.checked) }),
          "In nächste Woche mitnehmen",
        ]);
        cond.appendChild(el("div", { class: "field" }, [carry]));
      }
    }
    refreshConditional();

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
    e.actualMin = (e.actualHours || 0) * 60 + (e.actualMinutes || 0);
    if (e.status !== "partial" && e.status !== "missing") {
      e.missingNote = "";
      e.carryOver = false;
    }
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

  function segmented(options, current, onPick, extraClass) {
    const seg = el("div", { class: "seg " + (extraClass || "") });
    options.forEach((o) => {
      const btn = el("button", {
        class: o.v === current ? "active" : "",
        "data-prio": o.prio || null,
        "data-status": o.status || null,
        onclick: () => {
          seg.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          onPick(o.v);
        },
      }, [o.icon ? o.icon(15) : null, o.label].filter(Boolean));
      seg.appendChild(btn);
    });
    return seg;
  }

  window.EntryDialog = { open, close };
})();
