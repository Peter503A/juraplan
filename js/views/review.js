/* ============================================================
   JuraPlan – Wochenrückblick (Meine Woche)
   ============================================================ */
(function () {
  "use strict";
  const { el } = U;

  function render() {
    const s = Store.state;
    const wrap = el("div", { class: "main-content" });
    wrap.appendChild(Components.header("Meine Woche"));

    const scroll = el("div", { class: "view-scroll" });
    const st = U.startOfWeek(s.reviewCursor), en = U.endOfWeek(s.reviewCursor);

    // Kopfzeile mit Navigation
    scroll.appendChild(
      el("div", { class: "review-head" }, [
        el("div", { class: "review-nav" }, [
          navArrow(-1),
          el("div", { class: "rn-range" }, [U.fmtRangeNoYear(st, en)]),
          navArrow(1),
        ]),
        el("button", { class: "btn-light", onclick: () => editCarryNote(en) },
          [Icons.bookmark(15), " Nächste Woche vormerken"]),
      ])
    );

    // Daten berechnen
    const entries = Store.entriesInRange(U.toISODate(st), U.toISODate(en));
    const blocks = entries.filter((e) => e.type === "block");
    const actualMin = blocks.reduce((sum, e) => sum + Store.actualMin(e), 0);
    const plannedMin = blocks.reduce((sum, e) => sum + Store.plannedMin(e), 0);
    const done = blocks.filter((e) => e.status === "done").length;

    // Kennzahlen
    scroll.appendChild(
      el("div", { class: "stat-row" }, [
        statCard("Tatsächlich gelernt", U.fmtHours(actualMin)),
        statCard("Lernzeit geplant", U.fmtHours(plannedMin)),
        statCard("Lernblöcke erledigt", `${done}`, `/ ${blocks.length}`),
      ])
    );

    // Lernzeit nach Modul + Offen & mitnehmen
    scroll.appendChild(
      el("div", { class: "review-grid" }, [
        moduleTimePanel(blocks),
        openPanel(entries, st, en),
      ])
    );

    // Wochenziel + Wochennotiz
    scroll.appendChild(weekGoalPanel(st));

    // Einträge dieser Woche
    scroll.appendChild(weekEntriesPanel(entries, st));

    wrap.appendChild(scroll);
    return wrap;
  }

  function navArrow(dir) {
    return el("div", { class: "nav-arrows" }, [
      el("button", { "aria-label": dir < 0 ? "Vorige Woche" : "Nächste Woche",
        onclick: () => nav(dir) }, [dir < 0 ? Icons.chevronLeft(18) : Icons.chevronRight(18)]),
    ]);
  }

  function nav(dir) {
    Store.setReviewCursor(U.addWeeks(Store.state.reviewCursor, dir));
  }

  function statCard(label, value, sub) {
    return el("div", { class: "stat-card" }, [
      el("div", { class: "sc-label" }, [label]),
      el("div", { class: "sc-value" }, [value, sub ? el("small", {}, [" " + sub]) : null].filter(Boolean)),
    ]);
  }

  function moduleTimePanel(blocks) {
    const panel = el("div", { class: "panel" });
    panel.appendChild(el("h3", {}, ["Lernzeit nach Modul"]));

    // nach Modul gruppieren
    const groups = {};
    blocks.forEach((e) => {
      const key = e.moduleId || "none";
      if (!groups[key]) groups[key] = { actual: 0, planned: 0 };
      groups[key].actual += Store.actualMin(e);
      groups[key].planned += Store.plannedMin(e);
    });

    const maxActual = Math.max(1, ...Object.values(groups).map((g) => g.actual));

    const keys = Object.keys(groups);
    if (keys.length === 0) {
      panel.appendChild(el("p", { class: "muted", style: { fontSize: "13.5px" } },
        ["Noch keine Lernblöcke in dieser Woche."]));
    } else {
      keys.forEach((key) => {
        const mod = key === "none" ? null : Store.moduleById(key);
        const color = mod ? mod.color : "#b9bdc9";
        const name = mod ? mod.name : "Ohne Modul";
        const g = groups[key];
        panel.appendChild(
          el("div", { class: "mod-time-row" }, [
            el("div", { class: "mtr-top" }, [
              el("span", { class: "mtr-dot", style: { background: color } }),
              el("span", { class: "mtr-name" }, [name]),
              el("span", { class: "mtr-val" }, [U.fmtHours(g.actual)]),
            ]),
            el("div", { class: "mtr-bar" },
              [el("div", { style: { width: (g.actual / maxActual) * 100 + "%", background: color } })]),
            el("div", { class: "mtr-sub" }, [`${U.fmtHours(g.planned)} geplant`]),
          ])
        );
      });
    }

    panel.appendChild(
      el("p", { class: "panel-hint" },
        ["Die Lernzeit zählt am eingetragenen Lerndatum. Abhaken trägt keine Zeit automatisch ein – du trägst sie beim Status selbst ein."])
    );
    return panel;
  }

  function openPanel(entries, st, en) {
    const panel = el("div", { class: "panel" });
    panel.appendChild(el("h3", {}, ["Offen & mitnehmen"]));
    panel.appendChild(
      el("p", { class: "muted", style: { fontSize: "12.5px", margin: "-6px 0 14px" } },
        ["Offene Lernblöcke bis Ende dieser Woche. Verschieben übernimmt keine neue Lernzeit."])
    );

    const open = entries.filter(
      (e) => e.status === "open" || e.status === "partial" || e.status === "missing" || e.carryOver
    );

    if (open.length === 0) {
      panel.appendChild(el("p", { class: "muted", style: { fontSize: "13.5px" } },
        ["Hier ist gerade nichts offen. 🎉"]));
      return panel;
    }

    open
      .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
      .forEach((e) => {
        const item = el("div", { class: "open-item", onclick: () => EntryDialog.open(e),
          style: { cursor: "pointer" } });
        item.appendChild(el("div", { class: "oi-check" }, [
          e.status === "missing" ? Icons.x(16) :
          e.status === "partial" ? Icons.flag(16) : Icons.circleDashed(16),
        ]));
        const b = el("div", { class: "oi-body" });
        b.appendChild(el("div", { class: "oi-title" }, [e.title]));
        if (e.missingNote) {
          b.appendChild(el("div", { class: "oi-missing" }, [e.missingNote]));
        } else if (e.status === "open") {
          b.appendChild(el("div", { class: "oi-missing" }, ["Noch nicht erledigt"]));
        }
        if (e.carryOver) {
          b.appendChild(el("div", { class: "oi-carry" },
            [Icons.arrowRightCircle(13), "In nächste Woche mitnehmen"]));
        }
        item.appendChild(b);
        panel.appendChild(item);
      });

    return panel;
  }

  function weekGoalPanel(st) {
    const wk = U.weekKey(st);
    const goalId = "goal:" + wk;
    const noteId = "week:" + wk;

    const panel = el("div", { class: "panel", style: { marginBottom: "18px" } });
    panel.appendChild(
      el("div", { style: { display: "flex", gap: "24px", flexWrap: "wrap" } }, [
        el("div", { style: { flex: "1", minWidth: "220px" } }, [
          el("h3", { style: { display: "flex", alignItems: "center", gap: "8px" } },
            [Icons.target(17), "Soll-Pensum diese Woche"]),
          goalDisplay(goalId),
        ]),
        el("div", { style: { flex: "1.4", minWidth: "240px" } }, [
          el("h3", { style: { display: "flex", alignItems: "center", gap: "8px" } },
            [Icons.note(17), "Wochennotiz"]),
          noteDisplay(noteId),
        ]),
      ])
    );
    return panel;
  }

  function goalDisplay(goalId) {
    const current = Store.getNote(goalId);
    const box = el("div", {});
    if (current) {
      box.appendChild(el("div", { style: { fontSize: "22px", fontWeight: "700", margin: "6px 0" } },
        [current]));
      box.appendChild(el("button", { class: "rc-note-link", style: { fontSize: "12.5px" },
        onclick: () => editGoal(goalId) }, ["Ziel ändern"]));
    } else {
      box.appendChild(el("p", { class: "muted", style: { fontSize: "13.5px", margin: "6px 0 10px" } },
        ["Was willst du diese Woche schaffen?"]));
      box.appendChild(el("button", { class: "rc-note-link", onclick: () => editGoal(goalId) },
        ["Soll-Pensum eintragen"]));
    }
    return box;
  }

  function noteDisplay(noteId) {
    const text = Store.getNote(noteId);
    const box = el("div", {});
    if (text) {
      box.appendChild(el("div", { class: "rc-note-text", style: { margin: "6px 0 10px" } }, [text]));
      box.appendChild(el("button", { class: "rc-note-link", style: { fontSize: "12.5px" },
        onclick: () => editNote(noteId, "Wochennotiz") }, ["Notiz bearbeiten"]));
    } else {
      box.appendChild(el("p", { class: "muted", style: { fontSize: "13.5px", margin: "6px 0 10px" } },
        ["Gedanken, offene Fragen oder Dinge, die du mitnehmen möchtest."]));
      box.appendChild(el("button", { class: "rc-note-link", onclick: () => editNote(noteId, "Wochennotiz") },
        ["Notiz schreiben"]));
    }
    return box;
  }

  function weekEntriesPanel(entries, st) {
    const panel = el("div", { class: "panel" });
    panel.appendChild(el("h3", {}, ["Einträge dieser Woche"]));

    if (entries.length === 0) {
      panel.appendChild(el("p", { class: "muted", style: { fontSize: "13.5px" } },
        ["Noch keine Einträge in dieser Woche. Lege im Kalender deinen ersten Lernblock an."]));
      return panel;
    }

    const table = el("div", { class: "week-entries-table" });
    for (let i = 0; i < 7; i++) {
      const d = U.addDays(st, i);
      const iso = U.toISODate(d);
      const dayEvs = entries.filter((e) => e.date === iso)
        .sort((a, b) => U.timeToMin(a.start) - U.timeToMin(b.start));
      if (dayEvs.length === 0) continue;

      const dayBlock = el("div", { class: "wet-day" });
      dayBlock.appendChild(
        el("div", { class: "wet-day-head" }, [
          U.fmtDayLong(d),
          el("span", { class: "wet-count" }, [`${dayEvs.length} Einträge`]),
        ])
      );
      dayEvs.forEach((e) => {
        const color = Store.entryColor(e);
        const row = el("div", {
          class: "wet-row" + (e.status === "done" ? " done" : ""),
          onclick: () => EntryDialog.open(e),
        });
        row.appendChild(el("span", { class: "wet-dot", style: { background: color } }));
        row.appendChild(el("span", { class: "wet-time" }, [`${e.start}–${e.end}`]));
        const titleCell = el("span", { class: "wet-title" }, [
          e.priority === "urgent" ? Icons.alert(13) :
            e.priority === "important" ? Icons.star(13) : null,
          el("span", {}, [e.title]),
        ].filter(Boolean));
        titleCell.style.display = "flex";
        titleCell.style.alignItems = "center";
        titleCell.style.gap = "6px";
        row.appendChild(titleCell);
        if (e.status && e.status !== "open") {
          row.appendChild(statusBadge(e.status));
        }
        dayBlock.appendChild(row);
      });
      table.appendChild(dayBlock);
    }
    panel.appendChild(table);
    return panel;
  }

  function statusBadge(status) {
    if (status === "done") return el("span", { class: "mini-badge ok" }, ["Erledigt"]);
    if (status === "partial") return el("span", { class: "mini-badge partial" }, ["Teilweise"]);
    if (status === "missing") return el("span", { class: "mini-badge missing" }, ["Fehlt"]);
    return null;
  }

  // ---- Modals für Ziel / Notiz / Carry ----
  function simpleTextModal(title, initial, placeholder, onSave, multiline) {
    const root = document.getElementById("modal-root");
    U.clear(root);
    const backdrop = el("div", { class: "modal-backdrop",
      onclick: (ev) => { if (ev.target === backdrop) root.innerHTML = ""; } });
    const modal = el("div", { class: "modal", style: { maxWidth: "480px" } });
    modal.appendChild(
      el("div", { class: "modal-head" }, [
        el("h2", {}, [title]),
        el("button", { class: "modal-close", onclick: () => (root.innerHTML = "") }, [Icons.x(18)]),
      ])
    );
    const input = multiline
      ? el("textarea", { style: { minHeight: "140px" }, placeholder }, [initial || ""])
      : el("input", { type: "text", value: initial || "", placeholder });
    modal.appendChild(el("div", { class: "modal-body" }, [el("div", { class: "field" }, [input])]));
    modal.appendChild(
      el("div", { class: "modal-foot" }, [
        el("div", { class: "foot-right" }, [
          el("button", { class: "btn-ghost", onclick: () => (root.innerHTML = "") }, ["Abbrechen"]),
          el("button", { class: "primary", style: { padding: "10px 18px" },
            onclick: async () => { await onSave(input.value); root.innerHTML = ""; } }, ["Speichern"]),
        ]),
      ])
    );
    backdrop.appendChild(modal);
    root.appendChild(backdrop);
    setTimeout(() => input.focus(), 50);
  }

  function editGoal(goalId) {
    simpleTextModal("Soll-Pensum diese Woche", Store.getNote(goalId),
      "z. B. 20 h oder 5 Lernblöcke",
      async (v) => { await Store.saveNote(goalId, v); U.toast("Ziel gespeichert"); }, false);
  }
  function editNote(noteId, title) {
    simpleTextModal(title, Store.getNote(noteId), "Schreib, was dir wichtig ist …",
      async (v) => { await Store.saveNote(noteId, v); U.toast("Notiz gespeichert"); }, true);
  }
  function editCarryNote(endDate) {
    const nextWeekKey = U.weekKey(U.addDays(endDate, 1));
    const id = "carry:" + nextWeekKey;
    simpleTextModal("Für nächste Woche vormerken", Store.getNote(id),
      "Was willst du nächste Woche angehen oder mitnehmen?",
      async (v) => { await Store.saveNote(id, v); U.toast("Vermerkt für nächste Woche"); }, true);
  }

  window.ReviewView = { render };
})();
