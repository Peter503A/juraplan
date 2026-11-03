/* ===================================================================
   Alltag & Einstellungen: Arbeitszeit, Fitness, Ruhetag, Zieltermin
   + Vorschläge für freie Lernzeiten (belegt Ruhezeiten NICHT automatisch)
   =================================================================== */
import { el, clear, toast } from "../dom.js";
import { getState, setSettings } from "../store.js";
import {
  WEEKDAYS_LONG, WEEKDAYS_SHORT, timeToMin, minToTime, fmtDuration, fmtDE,
  startOfWeek, addDays, toDateKey, esc,
} from "../utils.js";
import { openEntryModal } from "../entryModal.js";

// Wochentage montagsbasiert für Toggles: index -> JS-getDay()
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mo..So

let host = null;

export function render(container) {
  host = container;
  clear(container);
  const s = getState().settings;

  container.appendChild(el(".main-eyebrow", { text: "Dein Alltag. Deine Lernfenster." }));
  container.appendChild(el(".page-head", {}, [
    el("h1", { text: "Alltag & Lernfenster" }),
    el(".date-badge", { html: `<span class="avatar">${esc(s.initials || "OM")}</span>` }),
  ]));
  container.appendChild(el(".page-sub", { text: "Hinterlege deinen Rhythmus. StudyFlow schlägt daraus freie Lernzeiten vor – Ruhezeiten werden nie automatisch belegt." }));

  // Studienzieltermin
  container.appendChild(el(".card", { style: { marginBottom: "16px" } }, [
    el(".card-title", { text: "🎯 Studienzieltermin" }),
    el(".card-sub", { text: "Dein angepeiltes Abschlussdatum (z. B. im August)." }),
    el("div", { style: { marginTop: "12px", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" } }, [
      el("input.input", { type: "date", value: s.targetDate || "", style: { maxWidth: "200px" }, onchange: (e) => { setSettings({ targetDate: e.target.value }); render(host); } }),
      countdownBadge(s.targetDate),
    ]),
  ]));

  // Arbeitszeit
  container.appendChild(el(".card", { style: { marginBottom: "16px" } }, [
    el(".card-title", { text: "💼 Arbeitszeit" }),
    el(".card-sub", { text: "An diesen Tagen bist du berufstätig und nicht zum Lernen verfügbar." }),
    dayToggles(s.work.days, (days) => setSettings({ work: { ...s.work, days } })),
    timeRange("Von", "Bis", s.work.from, s.work.to, (from, to) => setSettings({ work: { ...s.work, from, to } })),
  ]));

  // Lernfreie Tage
  container.appendChild(el(".card", { style: { marginBottom: "16px" } }, [
    el(".card-title", { text: "📚 Lernfreie Tage (gut zum Lernen)" }),
    el(".card-sub", { text: "Tage ohne Arbeit, die sich besonders zum Lernen eignen." }),
    dayToggles(s.freeLearnDays, (days) => setSettings({ freeLearnDays: days })),
  ]));

  // Fitnessstudio
  container.appendChild(el(".card", { style: { marginBottom: "16px" } }, [
    el(".card-title", { text: "🏋️ Fitnessstudio" }),
    el(".card-sub", { text: "Feste Zeiten, die als belegt gelten (werden nicht zum Lernen vorgeschlagen)." }),
    dayToggles(s.gym.days, (days) => setSettings({ gym: { ...s.gym, days } })),
    el("div", { style: { marginTop: "10px", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "center" } }, [
      el("div", {}, [el("label", { style: { fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "4px" }, text: "Bevorzugte Uhrzeit" }),
        el("input.input", { type: "time", value: s.gym.preferredTime, style: { width: "130px" }, onchange: (e) => setSettings({ gym: { ...s.gym, preferredTime: e.target.value } }) })]),
      el("div", {}, [el("label", { style: { fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "4px" }, text: "Dauer (Min.)" }),
        el("input.input", { type: "number", min: "30", step: "15", value: s.gym.durationMin, style: { width: "100px" }, onchange: (e) => setSettings({ gym: { ...s.gym, durationMin: +e.target.value || 75 } }) })]),
    ]),
  ]));

  // Ruhetag + Tagesfenster + Wochenziel
  container.appendChild(el(".card", { style: { marginBottom: "16px" } }, [
    el(".card-title", { text: "😌 Ruhe & Rhythmus" }),
    el("div", { style: { marginTop: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" } }, [
      el("div", {}, [el("label", { style: { fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "4px" }, text: "Ruhetag am Wochenende" }),
        el("select.select", { onchange: (e) => setSettings({ restDay: +e.target.value }) },
          [[6, "Samstag"], [0, "Sonntag"]].map(([v, l]) => el("option", { value: v, text: l, selected: s.restDay === v })))]),
      el("div", {}, [el("label", { style: { fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "4px" }, text: "Wochen-Soll (Std.)" }),
        el("input.input", { type: "number", min: "0", value: s.weeklyGoalHours, onchange: (e) => setSettings({ weeklyGoalHours: +e.target.value || 0 }) })]),
    ]),
    el("div", { style: { marginTop: "14px" } }, [
      el("label", { style: { fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "4px" }, text: "Tagesfenster für Lernvorschläge" }),
      el(".time-inline", {}, [
        el("input.input", { type: "time", value: s.wakeFrom, style: { width: "120px" }, onchange: (e) => setSettings({ wakeFrom: e.target.value }) }),
        el("span", { text: "–" }),
        el("input.input", { type: "time", value: s.wakeTo, style: { width: "120px" }, onchange: (e) => setSettings({ wakeTo: e.target.value }) }),
      ]),
    ]),
  ]));

  // Namens-Einstellung
  container.appendChild(el(".card", { style: { marginBottom: "16px" } }, [
    el(".card-title", { text: "👤 Profil" }),
    el("div", { style: { marginTop: "10px", display: "grid", gridTemplateColumns: "1fr 120px", gap: "14px" } }, [
      el("div", {}, [el("label", { style: { fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "4px" }, text: "Anzeigename" }),
        el("input.input", { value: s.studentName, onchange: (e) => setSettings({ studentName: e.target.value }) })]),
      el("div", {}, [el("label", { style: { fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "4px" }, text: "Initialen" }),
        el("input.input", { value: s.initials, maxlength: "3", onchange: (e) => { setSettings({ initials: e.target.value.toUpperCase() }); render(host); } })]),
    ]),
  ]));

  // Vorschläge für freie Lernzeiten
  container.appendChild(renderSuggestions());
}

function countdownBadge(targetDate) {
  if (!targetDate) return el("span");
  const diff = Math.ceil((new Date(targetDate) - new Date()) / 86400000);
  if (diff < 0) return el("span.badge", { text: "Zieltermin erreicht 🎓" });
  const weeks = Math.floor(diff / 7);
  return el("span.badge.badge-group", { text: `noch ${diff} Tage (≈ ${weeks} Wochen) bis ${fmtDE(targetDate)}` });
}

function dayToggles(selected, onChange) {
  const wrap = el(".day-toggles", { style: { marginTop: "10px" } });
  DAY_ORDER.forEach((jsDay) => {
    const on = selected.includes(jsDay);
    wrap.appendChild(el(`.day-toggle${on ? ".on" : ""}`, {
      text: WEEKDAYS_SHORT[jsDay],
      onclick: () => {
        const next = on ? selected.filter((x) => x !== jsDay) : [...selected, jsDay];
        onChange(next); render(host);
      },
    }));
  });
  return wrap;
}

function timeRange(l1, l2, from, to, onChange) {
  return el("div", { style: { marginTop: "12px", display: "flex", gap: "16px", alignItems: "center" } }, [
    el("div", {}, [el("label", { style: { fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "4px" }, text: l1 }),
      el("input.input", { type: "time", value: from, style: { width: "130px" }, onchange: (e) => onChange(e.target.value, to) })]),
    el("div", {}, [el("label", { style: { fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "4px" }, text: l2 }),
      el("input.input", { type: "time", value: to, style: { width: "130px" }, onchange: (e) => onChange(from, e.target.value) })]),
  ]);
}

/* ---------- Freie Lernzeiten vorschlagen ---------- */
/**
 * Logik:
 *  - Betrachte die aktuelle Woche (Mo–So).
 *  - Pro Tag: verfügbares Fenster = [wakeFrom, wakeTo].
 *  - Blockiere: Arbeitszeit (an Arbeitstagen), Fitness (Dauer rund um preferredTime),
 *    bereits eingetragene Einträge, sowie den Ruhetag komplett.
 *  - Übrige zusammenhängende Lücken ab 45 min werden als Lernvorschlag gezeigt.
 *  - Ruhezeiten (Ruhetag) werden NIE vorgeschlagen -> nicht automatisch belegt.
 */
function computeSuggestions() {
  const s = getState().settings;
  const entries = getState().entries;
  const weekStart = startOfWeek(new Date());
  const result = [];

  for (let i = 0; i < 7; i++) {
    const date = addDays(weekStart, i);
    const jsDay = date.getDay();
    const key = toDateKey(date);

    // Ruhetag -> keine Vorschläge
    if (jsDay === s.restDay) continue;

    // Verfügbares Fenster
    let windowStart = timeToMin(s.wakeFrom);
    let windowEnd = timeToMin(s.wakeTo);

    // Belegte Intervalle sammeln
    const busy = [];
    if (s.work.days.includes(jsDay)) busy.push([timeToMin(s.work.from), timeToMin(s.work.to)]);
    if (s.gym.days.includes(jsDay)) {
      const gStart = timeToMin(s.gym.preferredTime);
      busy.push([gStart, gStart + s.gym.durationMin]);
    }
    entries.filter((e) => e.date === key).forEach((e) => busy.push([timeToMin(e.from), timeToMin(e.to)]));

    // Lücken berechnen
    busy.sort((a, b) => a[0] - b[0]);
    let cursor = windowStart;
    const gaps = [];
    for (const [bs, be] of busy) {
      if (bs > cursor) gaps.push([cursor, Math.min(bs, windowEnd)]);
      cursor = Math.max(cursor, be);
      if (cursor >= windowEnd) break;
    }
    if (cursor < windowEnd) gaps.push([cursor, windowEnd]);

    gaps.filter(([a, b]) => b - a >= 45).forEach(([a, b]) => {
      // auf max 3 h pro Vorschlagsblock begrenzen
      const end = Math.min(b, a + 180);
      result.push({ date, key, from: minToTime(a), to: minToTime(end), min: end - a });
    });
  }
  return result;
}

function renderSuggestions() {
  const sugg = computeSuggestions();
  const card = el(".card", {}, [
    el(".card-title", { text: "✨ Vorgeschlagene freie Lernzeiten (diese Woche)" }),
    el(".card-sub", { text: "Basierend auf deinem Alltag. Vorschläge belegen nichts automatisch – du entscheidest per Klick, ob daraus ein Lernblock wird." }),
  ]);
  if (!sugg.length) {
    card.appendChild(el(".empty-mini", { text: "Aktuell keine freien Lernfenster gefunden. Passe deine Zeiten oben an." }));
    return card;
  }
  const list = el("div", { style: { marginTop: "12px" } });
  sugg.slice(0, 14).forEach((sg) => {
    list.appendChild(el(".suggestion-slot", {}, [
      el(".ss-day", { text: `${WEEKDAYS_SHORT[sg.date.getDay()]} ${sg.date.getDate()}.` }),
      el(".ss-time", { text: `${sg.from}–${sg.to}` }),
      el("span", { style: { fontSize: "12.5px", color: "#9aa0ac" }, text: fmtDuration(sg.min) }),
      el("button.btn.btn-sm.btn-primary", { text: "+ Lernblock", onclick: () => openEntryModal(null, { date: sg.key, from: sg.from, to: sg.to }) }),
    ]));
  });
  card.appendChild(list);
  return card;
}
