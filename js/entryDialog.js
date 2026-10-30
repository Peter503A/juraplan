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

    // Typ
    body.appendChild(
      field("Typ", segmented(
        [
          { v: "block", label: "Lernblock", icon: Icons.book },
          { v: "appointment", label: "Termin", icon: Icons.calendar },
        ],
        e.type,
        (v) => { e.type = v; }
      ))
    );

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
