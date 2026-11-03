/* ============================================================
   JuraPlan – Kalenderansicht (Tag / Woche / Monat / Jahr)
   ============================================================ */
(function () {
  "use strict";
  const { el } = U;

  const DAY_START = 6; // Raster ab 06:00
  const DAY_END = 23; // bis 23:00
  const HOUR_H = 56; // px pro Stunde (= .hour-cell Höhe)

  function render() {
    const s = Store.state;
    const wrap = el("div", { class: "main-content" });
    wrap.appendChild(Components.header("Mein Kalender"));
    wrap.appendChild(toolbar());
    wrap.appendChild(calBody());
    return wrap;
  }

  function toolbar() {
    const s = Store.state;
    const tb = el("div", { class: "cal-toolbar" });

    tb.appendChild(el("button", { class: "btn-light",
      onclick: () => Store.setCursor(new Date()) }, ["Heute"]));

    tb.appendChild(
      el("div", { class: "nav-arrows" }, [
        el("button", { "aria-label": "Zurück", onclick: () => nav(-1) }, [Icons.chevronLeft(18)]),
        el("button", { "aria-label": "Weiter", onclick: () => nav(1) }, [Icons.chevronRight(18)]),
      ])
    );

    tb.appendChild(el("div", { class: "cal-range" }, [rangeLabel(), Icons.calendar(16)]));

    const switcher = el("div", { class: "view-switch" });
    [
      { v: "day", label: "Tag" },
      { v: "week", label: "Woche" },
      { v: "month", label: "Monat" },
      { v: "year", label: "Jahr" },
    ].forEach((o) => {
      switcher.appendChild(
        el("button", { class: s.calView === o.v ? "active" : "",
          onclick: () => Store.setCalView(o.v) }, [o.label])
      );
    });
    tb.appendChild(switcher);
    return tb;
  }

  function nav(dir) {
    const s = Store.state;
    const c = s.cursor;
    if (s.calView === "day") Store.setCursor(U.addDays(c, dir));
    else if (s.calView === "week") Store.setCursor(U.addWeeks(c, dir));
    else if (s.calView === "month") Store.setCursor(U.addMonths(c, dir));
    else Store.setCursor(new Date(c.getFullYear() + dir, c.getMonth(), 1));
  }

  function rangeLabel() {
    const s = Store.state;
    const c = s.cursor;
    if (s.calView === "day") return el("span", {}, [U.fmtDayLong(c)]);
    if (s.calView === "week") {
      const st = U.startOfWeek(c), en = U.endOfWeek(c);
      return el("span", {}, [U.fmtRangeShort(st, en)]);
    }
    if (s.calView === "month") return el("span", {}, [U.fmtMonthYear(c)]);
    return el("span", {}, [String(c.getFullYear())]);
  }

  function calBody() {
    const s = Store.state;
    const body = el("div", { class: "cal-body" });
    const gridWrap = el("div", { class: "cal-grid-wrap" });

    if (s.calView === "day") gridWrap.appendChild(timeGrid([s.cursor]));
    else if (s.calView === "week") gridWrap.appendChild(timeGrid(weekDays(s.cursor)));
    else if (s.calView === "month") gridWrap.appendChild(monthGrid(s.cursor));
    else gridWrap.appendChild(yearGrid(s.cursor));

    body.appendChild(gridWrap);
    body.appendChild(rail());
    return body;
  }

  function weekDays(c) {
    const st = U.startOfWeek(c);
    return Array.from({ length: 7 }, (_, i) => U.addDays(st, i));
  }

  // ---------- Tag/Woche: Zeitraster ----------
  function timeGrid(days) {
    const container = el("div", {
      class: "cal-grid-wrap",
      style: { border: "none", boxShadow: "none", borderRadius: "0", flex: "1",
        display: "flex", flexDirection: "column", overflow: "hidden" },
    });
    container.style.setProperty("--day-count", days.length);

    // Kopf
    const head = el("div", { class: "week-head" });
    head.style.setProperty("--day-count", days.length);
    head.appendChild(el("div", { class: "corner" }, ["Uhr"]));
    days.forEach((d) => {
      const isToday = U.isToday(d);
      head.appendChild(
        el("div", { class: "day-col-head" + (isToday ? " is-today" : "") }, [
          el("div", { class: "dow" }, [U.DOW_SHORT[(d.getDay() + 6) % 7]]),
          el("div", { class: "dom" }, [String(d.getDate())]),
        ])
      );
    });
    container.appendChild(head);

    // Scrollbereich mit Raster
    const scroll = el("div", { class: "week-scroll" });
    const grid = el("div", { class: "week-grid" });
    grid.style.setProperty("--day-count", days.length);

    // Uhrzeitspalte
    const hourCol = el("div", {});
    for (let h = DAY_START; h <= DAY_END; h++) {
      hourCol.appendChild(el("div", { class: "hour-label" }, [`${String(h).padStart(2, "0")}:00`]));
    }
    grid.appendChild(hourCol);

    // Tagesspalten
    days.forEach((d) => {
      const iso = U.toISODate(d);
      const col = el("div", { class: "day-col" });

      for (let h = DAY_START; h <= DAY_END; h++) {
        col.appendChild(
          el("div", { class: "hour-cell",
            onclick: () => EntryDialog.open(null, {
              date: iso,
              start: `${String(h).padStart(2, "0")}:00`,
              end: `${String(Math.min(h + 1, 23)).padStart(2, "0")}:00`,
            }) })
        );
      }

      // Events dieses Tages
      const evs = Store.entriesForDate(iso).filter((e) => e.start && e.end);
      layoutEvents(evs).forEach(({ e, left, width }) => {
        col.appendChild(eventBlock(e, left, width));
      });

      // Jetzt-Linie
      if (U.isToday(d)) {
        const now = new Date();
        const nowMin = now.getHours() * 60 + now.getMinutes();
        if (nowMin >= DAY_START * 60 && nowMin <= (DAY_END + 1) * 60) {
          const top = ((nowMin - DAY_START * 60) / 60) * HOUR_H;
          col.appendChild(el("div", { class: "now-line", style: { top: top + "px" } }));
        }
      }
      grid.appendChild(col);
    });

    scroll.appendChild(grid);
    container.appendChild(scroll);

    container.appendChild(
      el("div", { class: "empty-hint" }, [
        Icons.plus(16),
        "Klicke auf eine Uhrzeit, um deine gelernte Zeit einzutragen.",
      ])
    );

    // Auf 8 Uhr scrollen
    setTimeout(() => { scroll.scrollTop = (8 - DAY_START) * HOUR_H - 10; }, 0);
    return container;
  }

  // Überlappende Events nebeneinander legen
  function layoutEvents(evs) {
    const sorted = evs.slice().sort((a, b) => U.timeToMin(a.start) - U.timeToMin(b.start));
    const result = [];
    const columns = []; // Endzeit je Spalte
    sorted.forEach((e) => {
      const start = U.timeToMin(e.start);
      let colIdx = columns.findIndex((end) => end <= start);
      if (colIdx === -1) { colIdx = columns.length; columns.push(0); }
      columns[colIdx] = U.timeToMin(e.end);
      result.push({ e, colIdx });
    });
    const total = Math.max(1, columns.length);
    return result.map(({ e, colIdx }) => ({
      e,
      left: (colIdx / total) * 100,
      width: (1 / total) * 100,
    }));
  }

  function eventBlock(e, leftPct, widthPct) {
    const startMin = U.timeToMin(e.start);
    const endMin = U.timeToMin(e.end);
    const top = ((startMin - DAY_START * 60) / 60) * HOUR_H;
    const height = Math.max(22, ((endMin - startMin) / 60) * HOUR_H - 2);
    const color = Store.entryColor(e);
    const learned = Store.actualMin(e);
    const block = el("div", {
      class: "event is-block",
      style: {
        top: top + "px",
        height: height + "px",
        left: `calc(${leftPct}% + 3px)`,
        width: `calc(${widthPct}% - 6px)`,
        borderLeftColor: color,
        background: hexToSoft(color),
      },
      onclick: (ev) => { ev.stopPropagation(); EntryDialog.open(e); },
    });

    const title = el("div", { class: "ev-title" });
    title.appendChild(el("span", {}, [e.title]));
    block.appendChild(title);

    if (height > 34) {
      block.appendChild(el("div", { class: "ev-time" },
        [`${e.start}–${e.end}`]));
    }
    // Gelernte Zeit als Badge
    if (height > 52 && learned > 0) {
      block.appendChild(el("div", { class: "ev-badges" },
        [el("span", { class: "mini-badge ok" }, [U.fmtDuration(learned) + " gelernt"])]));
    }
    return block;
  }

  // ---------- Monat ----------
  function monthGrid(c) {
    const container = el("div", { class: "month-grid" });
    const head = el("div", { class: "month-dow-head" });
    U.DOW_SHORT.forEach((d) => head.appendChild(el("div", {}, [d])));
    container.appendChild(head);

    const weeks = el("div", { class: "month-weeks" });
    const first = U.startOfMonth(c);
    const gridStart = U.startOfWeek(first);

    for (let w = 0; w < 6; w++) {
      const weekStart = U.addDays(gridStart, w * 7);
      if (w === 5 && weekStart.getMonth() !== c.getMonth() &&
          U.addDays(gridStart, 4 * 7).getMonth() !== c.getMonth()) {
        // keine 6. Woche nötig
      }
      const week = el("div", { class: "month-week" });
      for (let i = 0; i < 7; i++) {
        const d = U.addDays(weekStart, i);
        const iso = U.toISODate(d);
        const other = d.getMonth() !== c.getMonth();
        const cell = el("div", {
          class: "month-cell" + (other ? " other-month" : "") + (U.isToday(d) ? " is-today" : ""),
          onclick: () => EntryDialog.open(null, { date: iso, start: "09:00", end: "10:00" }),
        });
        cell.appendChild(el("div", { class: "mc-date" }, [String(d.getDate())]));

        const evs = Store.entriesForDate(iso)
          .sort((a, b) => U.timeToMin(a.start) - U.timeToMin(b.start));
        evs.slice(0, 3).forEach((e) => {
          const color = Store.entryColor(e);
          const ev = el("div", {
            class: "mc-event is-block",
            style: {
              borderLeftColor: color,
              background: hexToSoft(color),
            },
            onclick: (evt) => { evt.stopPropagation(); EntryDialog.open(e); },
          }, [
            el("span", {}, [e.title]),
          ]);
          cell.appendChild(ev);
        });
        if (evs.length > 3) {
          cell.appendChild(el("div", { class: "mc-more" }, [`+ ${evs.length - 3} weitere`]));
        }
        week.appendChild(cell);
      }
      weeks.appendChild(week);
    }
    container.appendChild(weeks);
    return container;
  }

  // ---------- Jahr ----------
  function yearGrid(c) {
    const year = c.getFullYear();
    const grid = el("div", { class: "year-grid" });
    for (let m = 0; m < 12; m++) {
      const monthDate = new Date(year, m, 1);
      const card = el("div", { class: "year-month",
        onclick: () => { Store.state.cursor = monthDate; Store.setCalView("month"); } });
      card.appendChild(el("h4", {}, [U.MONTHS[m]]));

      const ym = el("div", { class: "ym-grid" });
      U.DOW_SHORT.forEach((d) => ym.appendChild(el("div", { class: "ym-dow" }, [d[0]])));

      const gridStart = U.startOfWeek(monthDate);
      for (let i = 0; i < 42; i++) {
        const d = U.addDays(gridStart, i);
        if (d.getMonth() !== m && d > monthDate && i > 27 &&
            U.addDays(gridStart, i - 7).getMonth() !== m) continue;
        const iso = U.toISODate(d);
        const hasEv = Store.entriesForDate(iso).length > 0;
        const cls = "ym-day" +
          (d.getMonth() !== m ? " other" : "") +
          (U.isToday(d) ? " today" : "") +
          (hasEv ? " has-ev" : "");
        ym.appendChild(el("div", { class: cls }, [String(d.getDate())]));
      }
      card.appendChild(ym);
      grid.appendChild(card);
    }
    return grid;
  }

  // ---------- Rechte Leiste ----------
  function rail() {
    const s = Store.state;
    const r = el("div", { class: "cal-rail" });

    const st = U.startOfWeek(s.cursor), en = U.endOfWeek(s.cursor);
    const weekEntries = Store.entriesInRange(U.toISODate(st), U.toISODate(en));
    const actualMin = weekEntries.reduce((sum, e) => sum + Store.actualMin(e), 0);

    // Deine Woche
    const card1 = el("div", { class: "rail-card" });
    card1.appendChild(el("div", { class: "rc-eyebrow" }, ["DEINE WOCHE"]));
    card1.appendChild(el("div", { class: "rc-range" }, [U.fmtRangeNoYear(st, en)]));
    card1.appendChild(el("div", { class: "rail-big" }, [U.fmtHours(actualMin)]));
    card1.appendChild(el("div", { class: "rail-big-label" }, ["gelernt diese Woche"]));

    card1.appendChild(
      el("div", { class: "rail-stats" }, [
        statRow("Lerneinträge", `${weekEntries.length}`),
      ])
    );
    card1.appendChild(
      el("button", { class: "rail-link", onclick: () => {
        Store.setReviewCursor(s.cursor);
        Store.setView("review");
      } }, ["Wochenrückblick", Icons.arrowRight(15)])
    );
    r.appendChild(card1);

    // Wochennotiz
    const wk = U.weekKey(s.cursor);
    const noteId = "week:" + wk;
    const noteText = Store.getNote(noteId);
    const card2 = el("div", { class: "rail-card" });
    card2.appendChild(
      el("div", { class: "rc-head" }, [
        el("div", { class: "rc-title" }, [Icons.note(16), "Wochennotiz"]),
        el("button", { class: "icon-button", "aria-label": "Notiz bearbeiten",
          onclick: () => editNote(noteId, "Wochennotiz") }, [Icons.edit(15)]),
      ])
    );
    if (noteText) {
      card2.appendChild(el("div", { class: "rc-note-text" }, [noteText]));
    } else {
      card2.appendChild(el("div", { class: "rc-note-placeholder" },
        ["Gedanken, offene Fragen oder Dinge, die du mitnehmen möchtest."]));
      card2.appendChild(el("button", { class: "rc-note-link",
        onclick: () => editNote(noteId, "Wochennotiz") }, ["Notiz schreiben"]));
    }
    r.appendChild(card2);

    // Tagesnotiz (für den Fokustag = cursor bei Tag/Woche)
    const focusDay = s.calView === "day" ? s.cursor : new Date();
    const dayNoteId = "day:" + U.toISODate(focusDay);
    const dayNote = Store.getNote(dayNoteId);
    const card3 = el("div", { class: "rail-card" });
    card3.appendChild(
      el("div", { class: "rc-head" }, [
        el("div", { class: "rc-title" }, [Icons.notePlus(16), "Tagesnotiz"]),
        el("button", { class: "icon-button", "aria-label": "Tagesnotiz bearbeiten",
          onclick: () => editNote(dayNoteId, "Tagesnotiz – " + U.fmtDayLong(focusDay)) },
          [Icons.edit(15)]),
      ])
    );
    card3.appendChild(el("div", { class: "rc-note-placeholder tiny" },
      [U.fmtDayLong(focusDay)]));
    if (dayNote) {
      card3.appendChild(el("div", { class: "rc-note-text", style: { marginTop: "8px" } }, [dayNote]));
    } else {
      card3.appendChild(el("button", { class: "rc-note-link",
        onclick: () => editNote(dayNoteId, "Tagesnotiz – " + U.fmtDayLong(focusDay)) },
        ["Notiz für den Tag"]));
    }
    r.appendChild(card3);

    return r;
  }

  function statRow(label, val) {
    return el("div", { class: "rail-stat" }, [
      el("span", {}, [label]),
      el("span", {}, [val]),
    ]);
  }

  function editNote(noteId, title) {
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
    const ta = el("textarea", {
      style: { minHeight: "160px" },
      placeholder: "Schreib, was dir wichtig ist …",
    }, [Store.getNote(noteId)]);
    modal.appendChild(el("div", { class: "modal-body" }, [el("div", { class: "field" }, [ta])]));
    modal.appendChild(
      el("div", { class: "modal-foot" }, [
        el("div", { class: "foot-right" }, [
          el("button", { class: "btn-ghost", onclick: () => (root.innerHTML = "") }, ["Abbrechen"]),
          el("button", { class: "primary", style: { padding: "10px 18px" },
            onclick: async () => {
              await Store.saveNote(noteId, ta.value);
              root.innerHTML = "";
              U.toast("Notiz gespeichert");
            } }, ["Speichern"]),
        ]),
      ])
    );
    backdrop.appendChild(modal);
    root.appendChild(backdrop);
    setTimeout(() => ta.focus(), 50);
  }

  // Helfer: Hex -> sehr helle Variante (Hintergrund)
  function hexToSoft(hex, alpha) {
    const h = hex.replace("#", "");
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha != null ? alpha : 0.14})`;
  }

  window.CalendarView = { render, hexToSoft };
})();
