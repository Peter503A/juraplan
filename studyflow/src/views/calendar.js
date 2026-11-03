/* ===================================================================
   Kalender-View: Tag / Woche / Monat / Jahr
   =================================================================== */
import { el, clear } from "../dom.js";
import { getState, setNote } from "../store.js";
import {
  WEEKDAYS_MON, MONTHS, MONTHS_SHORT, startOfWeek, addDays, addMonths,
  toDateKey, fromDateKey, isSameDay, fmtRange, fmtDayFull, weekKey, timeToMin,
  durationMin, fmtDuration, fmtHours, textOn, esc, minToTime,
} from "../utils.js";
import { catalogById } from "../modules.js";
import { openEntryModal } from "../entryModal.js";

// View-Zustand (lokal zur Kalenderseite)
const cal = {
  view: "woche",          // tag | woche | monat | jahr
  cursor: new Date(),     // Bezugsdatum
};

const DAY_START = 7;   // Stunden-Achse von 7 Uhr
const DAY_END = 21;    // bis 21 Uhr
const HOUR_PX = 48;

function entryColor(entry) {
  if (entry.color && entry.color !== "auto") return entry.color;
  if (entry.moduleId) {
    const u = getState().selectedModules[entry.moduleId];
    if (u && u.color) return u.color;
  }
  return "#7c6ff0";
}

function entriesForDay(dateKey) {
  return getState().entries
    .filter((e) => e.date === dateKey)
    .sort((a, b) => timeToMin(a.from) - timeToMin(b.from));
}

/* ---------- Woche / Tag Grid ---------- */
function renderTimeGrid(days) {
  const colCount = days.length;
  const today = new Date();

  // Kopf
  const headCols = [el(".corner")];
  days.forEach((d) => {
    const isToday = isSameDay(d, today);
    headCols.push(el(`.day-col${isToday ? ".today" : ""}`, {}, [
      el("div.dlabel", { text: WEEKDAYS_MON[(d.getDay() + 6) % 7] }),
      el("div.dnum", { text: d.getDate() }),
    ]));
  });
  const head = el(".week-head", {
    style: { gridTemplateColumns: `56px repeat(${colCount}, 1fr)` },
  }, headCols);

  // Körper
  const timeCol = el(".time-col", {});
  for (let h = DAY_START; h <= DAY_END; h++) {
    timeCol.appendChild(el(".time-slot", { text: `${String(h).padStart(2, "0")}:00` }));
  }

  const dayCols = days.map((d) => {
    const key = toDateKey(d);
    const col = el(".day-column");
    // Stunden-Zellen (Klick = neuer Eintrag zu dieser Zeit)
    for (let h = DAY_START; h <= DAY_END; h++) {
      col.appendChild(el(".hour-cell", {
        onclick: () => openEntryModal(null, { date: key, from: `${String(h).padStart(2, "0")}:00`, to: `${String(h + 1).padStart(2, "0")}:00` }),
      }));
    }
    // Events absolut positionieren
    entriesForDay(key).forEach((e) => {
      const startMin = timeToMin(e.from);
      const dur = Math.max(30, durationMin(e.from, e.to));
      const top = ((startMin - DAY_START * 60) / 60) * HOUR_PX;
      const height = (dur / 60) * HOUR_PX - 2;
      const bg = entryColor(e);
      col.appendChild(el(`.event${e.kind === "termin" ? ".is-termin" : ""}`, {
        style: { top: `${Math.max(0, top)}px`, height: `${height}px`, background: bg, color: textOn(bg) },
        onclick: (ev) => { ev.stopPropagation(); openEntryModal(e); },
        title: e.title,
      }, [
        el(".ev-title", { text: (e.priority === "dringend" ? "⚠ " : e.priority === "wichtig" ? "☆ " : "") + (e.title || "(ohne Titel)") }),
        el(".ev-time", { text: `${e.from}–${e.to}` }),
      ]));
    });
    return col;
  });

  const body = el(".week-body", {
    style: { gridTemplateColumns: `56px repeat(${colCount}, 1fr)` },
  }, [timeCol, ...dayCols]);

  return el(".week-grid-wrap", {}, [head, el(".week-scroll", {}, [body])]);
}

/* ---------- Monat ---------- */
function renderMonth() {
  const cur = cal.cursor;
  const first = new Date(cur.getFullYear(), cur.getMonth(), 1);
  const gridStart = startOfWeek(first);
  const today = new Date();

  const weekdays = el(".month-weekdays", {}, WEEKDAYS_MON.map((w) => el("div", { text: w })));
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = addDays(gridStart, i);
    const key = toDateKey(d);
    const inMonth = d.getMonth() === cur.getMonth();
    const isToday = isSameDay(d, today);
    const dayEntries = entriesForDay(key);

    const evNodes = dayEntries.slice(0, 3).map((e) => {
      const bg = entryColor(e);
      return el(".m-event", { style: { background: bg, color: textOn(bg) }, text: `${e.from} ${e.title || ""}`.trim(), onclick: (ev) => { ev.stopPropagation(); openEntryModal(e); } });
    });
    if (dayEntries.length > 3) evNodes.push(el(".m-more", { text: `+${dayEntries.length - 3} weitere` }));

    cells.push(el(`.month-cell${inMonth ? "" : ".other"}${isToday ? ".today" : ""}`, {
      onclick: () => { cal.cursor = d; cal.view = "tag"; render(host); },
    }, [el("div.mnum", { text: d.getDate() }), ...evNodes]));
  }
  return el(".month-grid", {}, [weekdays, el(".month-cells", {}, cells)]);
}

/* ---------- Jahr ---------- */
function renderYear() {
  const year = cal.cursor.getFullYear();
  const today = new Date();
  const monthsNodes = [];
  for (let m = 0; m < 12; m++) {
    const first = new Date(year, m, 1);
    const gridStart = startOfWeek(first);
    const cells = WEEKDAYS_MON.map((w) => el("span.wd", { text: w[0] }));
    for (let i = 0; i < 42; i++) {
      const d = addDays(gridStart, i);
      if (d.getMonth() !== m && i >= 35) break;
      const inMonth = d.getMonth() === m;
      if (!inMonth) { cells.push(el("span", { text: "" })); continue; }
      const key = toDateKey(d);
      const has = entriesForDay(key).length > 0;
      const isToday = isSameDay(d, today);
      cells.push(el(`span${isToday ? ".today" : has ? ".has" : ""}`, { text: d.getDate() }));
    }
    monthsNodes.push(el(".mini-month", {
      onclick: () => { cal.cursor = new Date(year, m, 1); cal.view = "monat"; render(host); },
    }, [el("h4", { text: MONTHS[m] }), el(".mini-grid", {}, cells)]));
  }
  return el(".year-grid", {}, monthsNodes);
}

/* ---------- Seitenleiste ---------- */
function renderSidebar() {
  const d = getState();
  const wk = startOfWeek(cal.cursor);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(wk, i));
  const weekEntries = d.entries.filter((e) => weekDays.some((wd) => toDateKey(wd) === e.date));
  const lernBlocks = weekEntries.filter((e) => e.kind === "lernblock");
  const totalMin = lernBlocks.reduce((s, e) => s + (e.doneH || 0) * 60 + (e.doneM || 0), 0);
  const withTime = lernBlocks.filter((e) => (e.doneH || 0) + (e.doneM || 0) > 0).length;

  const wKey = weekKey(cal.cursor);
  const weekNote = d.notes[`week-${wKey}`] || "";
  const dayNoteKey = `day-${toDateKey(cal.cursor)}`;
  const dayNote = d.notes[dayNoteKey] || "";

  return el(".cal-side", {}, [
    el(".card", {}, [
      el(".card-sub", { text: "Deine Woche" }),
      el("div", { style: { fontSize: "13px", color: "#6b7280", margin: "2px 0 6px" }, text: fmtRange(weekDays[0], weekDays[6]) }),
      el(".big-h", { html: `${fmtHours(totalMin)} <span style="font-size:16px;color:#6b7280">h</span>` }),
      el("div", { style: { fontSize: "12.5px", color: "#9aa0ac", marginBottom: "10px" }, text: "gelernt diese Woche" }),
      el(".mini-stat", {}, [el("span", { text: "Lernblöcke mit Zeit" }), el("b", { text: String(withTime) })]),
      el(".mini-stat", {}, [el("span", { text: "Einträge gesamt" }), el("b", { text: String(weekEntries.length) })]),
      el("button.link-btn", { text: "Wochenrückblick →", style: { marginTop: "8px" }, onclick: () => window.__navigate("rueckblick") }),
    ]),
    noteCard("📝 Wochennotiz", "Gedanken, offene Fragen oder Dinge, die du mitnehmen möchtest.", weekNote, (v) => setNote(`week-${wKey}`, v)),
    noteCard("📄 Tagesnotiz", fmtDayFull(cal.cursor), dayNote, (v) => setNote(dayNoteKey, v)),
  ]);
}

function noteCard(title, sub, value, onSave) {
  let editing = false;
  const wrap = el(".card");
  function paint() {
    clear(wrap);
    wrap.appendChild(el(".card-sub", { text: title, style: { fontWeight: "700", color: "#1f2430" } }));
    wrap.appendChild(el("div", { style: { fontSize: "12.5px", color: "#9aa0ac", margin: "4px 0 8px" }, text: sub }));
    if (editing) {
      const ta = el("textarea.textarea", { style: { minHeight: "70px" } }, value);
      wrap.appendChild(ta);
      wrap.appendChild(el("div", { style: { display: "flex", gap: "8px", marginTop: "8px" } }, [
        el("button.btn.btn-sm.btn-primary", { text: "Speichern", onclick: () => { value = ta.value; onSave(value); editing = false; paint(); } }),
        el("button.btn.btn-sm", { text: "Abbrechen", onclick: () => { editing = false; paint(); } }),
      ]));
    } else {
      if (value) wrap.appendChild(el("div", { style: { fontSize: "13.5px", whiteSpace: "pre-wrap", marginBottom: "6px" }, text: value }));
      wrap.appendChild(el("button.link-btn", { text: value ? "Bearbeiten" : "Notiz schreiben", onclick: () => { editing = true; paint(); } }));
    }
  }
  paint();
  return wrap;
}

/* ---------- Toolbar ---------- */
function renderToolbar() {
  const label = (() => {
    if (cal.view === "tag") return fmtDayFull(cal.cursor);
    if (cal.view === "woche") { const s = startOfWeek(cal.cursor); return `${fmtRange(s, addDays(s, 6))} ${cal.cursor.getFullYear()}`; }
    if (cal.view === "monat") return `${MONTHS[cal.cursor.getMonth()]} ${cal.cursor.getFullYear()}`;
    return `${cal.cursor.getFullYear()}`;
  })();

  function step(dir) {
    if (cal.view === "tag") cal.cursor = addDays(cal.cursor, dir);
    else if (cal.view === "woche") cal.cursor = addDays(cal.cursor, dir * 7);
    else if (cal.view === "monat") cal.cursor = addMonths(cal.cursor, dir);
    else cal.cursor = addMonths(cal.cursor, dir * 12);
    render(host);
  }

  const views = [["tag", "Tag"], ["woche", "Woche"], ["monat", "Monat"], ["jahr", "Jahr"]];
  return el(".cal-toolbar", {}, [
    el("button.btn.btn-sm", { text: "Heute", onclick: () => { cal.cursor = new Date(); render(host); } }),
    el(".cal-nav", {}, [
      el("button.btn.btn-sm.btn-icon", { html: "‹", onclick: () => step(-1) }),
      el("button.btn.btn-sm.btn-icon", { html: "›", onclick: () => step(1) }),
    ]),
    el(".cal-range", { text: label }),
    el(".view-switch", {}, views.map(([v, lbl]) =>
      el(`button${cal.view === v ? ".sel" : ""}`, { text: lbl, onclick: () => { cal.view = v; render(host); } }))),
  ]);
}

let host = null;

export function render(container) {
  host = container;
  clear(container);

  container.appendChild(el(".main-eyebrow", { text: "Dein Lernalltag. In deinem Tempo." }));
  const todayStr = `${new Date().getDate()}. ${MONTHS[new Date().getMonth()]}`;
  container.appendChild(el(".page-head", {}, [
    el("h1", { text: "Mein Kalender" }),
    el(".date-badge", { html: `${esc(todayStr)} <span class="avatar">${esc(getState().settings.initials || "OM")}</span>` }),
  ]));

  container.appendChild(renderToolbar());

  let main;
  if (cal.view === "monat") main = renderMonth();
  else if (cal.view === "jahr") main = renderYear();
  else {
    const days = cal.view === "tag" ? [cal.cursor] : Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(cal.cursor), i));
    main = renderTimeGrid(days);
  }

  if (cal.view === "jahr") {
    container.appendChild(main);
  } else {
    container.appendChild(el(".cal-layout", {}, [main, renderSidebar()]));
  }

  if ((cal.view === "woche" || cal.view === "tag")) {
    container.appendChild(el("div", {
      style: { fontSize: "13px", color: "#9aa0ac", textAlign: "center", padding: "12px" },
      text: "+ Klicke auf eine Uhrzeit, um deinen ersten Lernblock oder Termin einzutragen.",
    }));
  }
}
