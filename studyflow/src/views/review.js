/* ===================================================================
   Wochen-/Monatsrückblick: Soll vs. Ist, Lernzeit je Modul,
   offene Punkte übertragen, Notizen
   =================================================================== */
import { el, clear } from "../dom.js";
import { getState, setNote, setWeekGoal, setMonthGoal, upsertEntry } from "../store.js";
import {
  startOfWeek, endOfWeek, addDays, addMonths, toDateKey, fromDateKey, weekKey, monthKey,
  fmtRange, MONTHS, fmtHours, fmtDuration, textOn, esc,
} from "../utils.js";
import { catalogById } from "../modules.js";

const rv = { period: "woche", cursor: new Date() };
let host = null;

function periodRange() {
  if (rv.period === "woche") {
    const s = startOfWeek(rv.cursor);
    return { start: s, end: addDays(s, 6) };
  }
  const s = new Date(rv.cursor.getFullYear(), rv.cursor.getMonth(), 1);
  const e = new Date(rv.cursor.getFullYear(), rv.cursor.getMonth() + 1, 0);
  return { start: s, end: e };
}

function entriesInRange() {
  const { start, end } = periodRange();
  const sk = toDateKey(start), ek = toDateKey(end);
  return getState().entries.filter((e) => e.date >= sk && e.date <= ek);
}

function doneMin(e) { return (e.doneH || 0) * 60 + (e.doneM || 0); }
function plannedMin(e) {
  const [fh, fm] = (e.from || "0:0").split(":").map(Number);
  const [th, tm] = (e.to || "0:0").split(":").map(Number);
  const d = (th * 60 + tm) - (fh * 60 + fm);
  return d > 0 ? d : 0;
}

export function render(container) {
  host = container;
  clear(container);
  const d = getState();

  container.appendChild(el(".main-eyebrow", { text: "Dein Rückblick. Soll gegen Ist." }));
  container.appendChild(el(".page-head", {}, [
    el("h1", { text: rv.period === "woche" ? "Wochenrückblick" : "Monatsrückblick" }),
    el(".date-badge", { html: `<span class="avatar">${esc(d.settings.initials || "OM")}</span>` }),
  ]));

  // Perioden-Umschalter + Navigation
  const { start, end } = periodRange();
  const label = rv.period === "woche"
    ? `${fmtRange(start, end)} ${start.getFullYear()}`
    : `${MONTHS[rv.cursor.getMonth()]} ${rv.cursor.getFullYear()}`;

  container.appendChild(el(".cal-toolbar", {}, [
    el(".review-period-switch", {}, [
      el(`button${rv.period === "woche" ? ".sel" : ""}`, { text: "Woche", onclick: () => { rv.period = "woche"; render(host); } }),
      el(`button${rv.period === "monat" ? ".sel" : ""}`, { text: "Monat", onclick: () => { rv.period = "monat"; render(host); } }),
    ]),
    el(".cal-nav", {}, [
      el("button.btn.btn-sm.btn-icon", { html: "‹", onclick: () => { rv.cursor = rv.period === "woche" ? addDays(rv.cursor, -7) : addMonths(rv.cursor, -1); render(host); } }),
      el("button.btn.btn-sm.btn-icon", { html: "›", onclick: () => { rv.cursor = rv.period === "woche" ? addDays(rv.cursor, 7) : addMonths(rv.cursor, 1); render(host); } }),
    ]),
    el(".cal-range", { text: label }),
    el("button.btn.btn-sm", { text: "Heute", style: { marginLeft: "auto" }, onclick: () => { rv.cursor = new Date(); render(host); } }),
  ]));

  const entries = entriesInRange();
  const lern = entries.filter((e) => e.kind === "lernblock");
  const totalDone = lern.reduce((s, e) => s + doneMin(e), 0);
  const totalPlanned = lern.reduce((s, e) => s + plannedMin(e), 0);
  const withTime = lern.filter((e) => doneMin(e) > 0);
  const avg = withTime.length ? Math.round(totalDone / withTime.length) : 0;

  // Soll-Pensum
  const pKey = rv.period === "woche" ? weekKey(rv.cursor) : monthKey(rv.cursor);
  const goalStore = rv.period === "woche" ? d.weekGoals : d.monthGoals;
  const sollH = goalStore[pKey] ?? (rv.period === "woche" ? d.settings.weeklyGoalHours : d.settings.weeklyGoalHours * 4);

  // Stat-Karten
  container.appendChild(el(".stat-grid", {}, [
    statCard("Gelernt (Ist)", `${fmtHours(totalDone)}`, "h"),
    statCard("Soll-Pensum", `${sollH}`, "h"),
    statCard("Lernblöcke mit Zeit", `${withTime.length}`, ""),
  ]));

  // Soll/Ist-Balken
  const istH = totalDone / 60;
  const pct = sollH > 0 ? Math.min(100, Math.round((istH / sollH) * 100)) : 0;
  container.appendChild(el(".card", { style: { marginBottom: "16px" } }, [
    el(".card-title", { text: "Soll vs. Ist" }),
    el(".card-sub", { text: `Du hast ${fmtHours(totalDone)} h von ${sollH} h erreicht (${pct} %). Geplant waren ${fmtHours(totalPlanned)} h in Lernblöcken.` }),
    el(".progress", { style: { marginTop: "12px" } }, [el("span", { style: { width: pct + "%", background: pct >= 100 ? "#16a34a" : undefined } })]),
    el("div", { style: { marginTop: "12px", display: "flex", gap: "10px", alignItems: "center" } }, [
      el("span", { style: { fontSize: "13px" }, text: "Soll-Pensum anpassen:" }),
      el("input.input", { type: "number", min: "0", value: sollH, style: { width: "90px" }, onchange: (e) => {
        const v = +e.target.value || 0;
        if (rv.period === "woche") setWeekGoal(pKey, v); else setMonthGoal(pKey, v);
        render(host);
      } }),
      el("span", { style: { fontSize: "13px", color: "#6b7280" }, text: "Std." }),
    ]),
  ]));

  // Lernzeit je Modul + Offene Punkte
  container.appendChild(el(".grid-2", { style: { marginBottom: "16px" } }, [
    renderModuleTime(lern),
    renderOpenPoints(lern),
  ]));

  // Notiz + Einträge
  const noteKey = rv.period === "woche" ? `week-${pKey}` : `month-${pKey}`;
  container.appendChild(el(".grid-2", {}, [
    renderNote(noteKey, d.notes[noteKey] || ""),
    renderEntries(entries),
  ]));

  // Durchschnitt-Hinweis
  if (withTime.length) {
    container.appendChild(el("div", { style: { fontSize: "13px", color: "#9aa0ac", marginTop: "12px" }, text: `Ø pro Lernblock mit Zeit: ${fmtDuration(avg)}.` }));
  }
}

function statCard(label, value, unit) {
  return el(".stat-card", {}, [
    el(".label", { text: label }),
    el(".value", { html: `${esc(value)} ${unit ? `<small>${esc(unit)}</small>` : ""}` }),
  ]);
}

function renderModuleTime(lern) {
  const map = {}; // moduleId -> min
  lern.forEach((e) => {
    const key = e.moduleId || "__none";
    map[key] = (map[key] || 0) + doneMin(e);
  });
  const entries = Object.entries(map).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, v]) => v));

  const card = el(".card", {}, [el(".card-title", { text: "Lernzeit nach Modul" })]);
  if (!entries.length) {
    card.appendChild(el(".card-sub", { text: "Noch keine gelernte Zeit in diesem Zeitraum eingetragen. Trage im Kalender bei einem Lernblock die tatsächlich gelernte Zeit ein." }));
    return card;
  }
  entries.forEach(([id, min]) => {
    const m = id === "__none" ? { name: "Ohne Modul" } : catalogById(id);
    const color = id === "__none" ? "#9aa0ac" : (getState().selectedModules[id]?.color || "#7c6ff0");
    card.appendChild(el(".module-time-bar", {}, [
      el(".dot", { style: { background: color } }),
      el(".mtb-name", { text: m.name || id, title: m.name }),
      el(".mtb-track", {}, [el("span", { style: { width: (min / max) * 100 + "%", background: color } })]),
      el(".mtb-val", { text: fmtHours(min) + " h" }),
    ]));
  });
  return card;
}

function renderOpenPoints(lern) {
  const open = lern.filter((e) => (e.openPoints && e.openPoints.trim()) || e.carryOver);
  const card = el(".card", {}, [
    el(".card-title", { text: "Offen & mitnehmen" }),
    el(".card-sub", { text: "Offene Punkte aus Lernblöcken. Übertrage sie in die nächste Woche." }),
  ]);
  if (!open.length) {
    card.appendChild(el(".empty-mini", { text: "Hier ist gerade nichts offen. 🎉" }));
    return card;
  }
  open.forEach((e) => {
    const m = e.moduleId ? catalogById(e.moduleId) : null;
    card.appendChild(el(".open-item", {}, [
      el("div", {}, [
        el("div", { text: e.openPoints || "(zum Mitnehmen markiert)" }),
        el(".oi-ctx", { text: `${e.title || "Lernblock"}${m ? " · " + m.name : ""} · ${e.date}` }),
      ]),
      el("button.btn.btn-sm", { text: "→ nächste Woche", onclick: () => carryToNextWeek(e) }),
    ]));
  });
  return card;
}

function carryToNextWeek(e) {
  // kopiere offenen Punkt als neuen Lernblock 7 Tage später
  const d = fromDateKey(e.date);
  const next = addDays(d, 7);
  upsertEntry({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    kind: "lernblock",
    title: `↪ ${e.title || "Mitgenommen"}`,
    moduleId: e.moduleId || "",
    date: toDateKey(next),
    color: e.color || "auto",
    from: e.from || "10:00",
    to: e.to || "11:00",
    priority: "wichtig",
    learnType: e.learnType || "Wiederholen",
    note: e.openPoints ? `Übertragen: ${e.openPoints}` : "",
    doneH: 0, doneM: 0,
    openPoints: "",
    carryOver: false,
  });
  // Ursprung entmarkieren
  upsertEntry({ ...e, carryOver: false, openPoints: "" });
  render(host);
}

function renderNote(key, value) {
  const card = el(".card", {}, [
    el(".card-title", { text: rv.period === "woche" ? "Wochennotiz" : "Monatsnotiz" }),
    el(".card-sub", { text: "Gedanken, offene Fragen oder Dinge, die du mitnehmen möchtest." }),
  ]);
  const ta = el("textarea.textarea", { style: { marginTop: "10px", minHeight: "90px" }, placeholder: "Notiz schreiben …", onchange: (e) => setNote(key, e.target.value) }, value);
  card.appendChild(ta);
  return card;
}

function renderEntries(entries) {
  const card = el(".card", {}, [el(".card-title", { text: "Einträge in diesem Zeitraum" })]);
  if (!entries.length) {
    card.appendChild(el(".card-sub", { text: "Noch keine Einträge. Lege im Kalender deinen ersten Lernblock an." }));
    return card;
  }
  entries.sort((a, b) => (a.date + a.from).localeCompare(b.date + b.from));
  entries.forEach((e) => {
    const m = e.moduleId ? catalogById(e.moduleId) : null;
    const color = e.color && e.color !== "auto" ? e.color : (m && getState().selectedModules[e.moduleId]?.color) || (e.kind === "termin" ? "#2f80d6" : "#7c6ff0");
    const dm = doneMin(e);
    card.appendChild(el(".entry-row", {}, [
      el(".e-bar", { style: { background: color } }),
      el(".e-main", {}, [
        el(".e-title", { text: (e.kind === "termin" ? "📅 " : "") + (e.title || "(ohne Titel)") }),
        el(".e-meta", { text: `${e.date} · ${e.from}–${e.to}${m ? " · " + m.name : ""}${e.kind === "lernblock" && e.learnType ? " · " + e.learnType : ""}` }),
      ]),
      el(".e-time", { text: e.kind === "lernblock" ? (dm ? fmtDuration(dm) + " gelernt" : "–") : "Termin" }),
    ]));
  });
  return card;
}
