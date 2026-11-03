/* ===================================================================
   Store – zentraler Zustand mit automatischer localStorage-Persistenz
   =================================================================== */

const STORAGE_KEY = "studyflow_data_v1";

const DEFAULT_SETTINGS = {
  studentName: "Studium",
  initials: "OM",
  // Arbeitszeit: Di–Do 7–15 Uhr
  work: { days: [2, 3, 4], from: "07:00", to: "15:00" },
  // Lernfrei-Tage (zum Lernen gut geeignet)
  freeLearnDays: [1, 5], // Mo, Fr
  // Fitnessstudio: Mo, Di, Do, Fr ~1–1,5 h
  gym: { days: [1, 2, 4, 5], durationMin: 75, preferredTime: "17:00" },
  // Mindestens ein Ruhetag am Wochenende
  restDay: 0, // Sonntag
  // Tagesfenster für Lernvorschläge
  wakeFrom: "07:00",
  wakeTo: "21:00",
  // Studienzieltermin (August)
  targetDate: "2027-08-31",
  weeklyGoalHours: 20,
};

const DEFAULT_DATA = {
  version: 1,
  settings: { ...DEFAULT_SETTINGS },
  entries: [],          // Lernblöcke + Termine
  selectedModules: {},  // id -> { status, estHours, targetDate, color, pages:{done,total}, tasks:[{id,text,done}], notes, dChoice }
  notes: {},            // "day-YYYY-MM-DD" | "week-YYYY-Www" | "month-YYYY-MM" -> text
  weekGoals: {},        // "YYYY-Www" -> hours
  monthGoals: {},       // "YYYY-MM" -> hours
  dPathChoice: null,    // 'praktikum' | 'module' | null  (Wahlpflichtbereich D)
};

let data = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_DATA);
    const parsed = JSON.parse(raw);
    // merge, damit neue Felder nicht fehlen
    return {
      ...structuredClone(DEFAULT_DATA),
      ...parsed,
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
    };
  } catch (e) {
    console.warn("Konnte Daten nicht laden, starte frisch:", e);
    return structuredClone(DEFAULT_DATA);
  }
}

let saveTimer = null;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Speichern fehlgeschlagen:", e);
    }
  }, 120);
}

export function getState() { return data; }

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setState(mutator) {
  mutator(data);
  persist();
  listeners.forEach((fn) => fn(data));
}

/* ---------- Entries (Lernblöcke & Termine) ---------- */
export function upsertEntry(entry) {
  setState((d) => {
    const i = d.entries.findIndex((e) => e.id === entry.id);
    if (i >= 0) d.entries[i] = entry;
    else d.entries.push(entry);
  });
}

export function deleteEntry(id) {
  setState((d) => { d.entries = d.entries.filter((e) => e.id !== id); });
}

/* ---------- Module ---------- */
export function toggleModule(mod) {
  setState((d) => {
    if (d.selectedModules[mod.id]) {
      delete d.selectedModules[mod.id];
    } else {
      d.selectedModules[mod.id] = {
        status: "offen",
        estHours: 0,
        color: mod._defaultColor || "#7c6ff0",
        pages: { done: 0, total: 0 },
        tasks: [],
        notes: "",
        targetDate: "",
      };
    }
  });
}

export function updateModule(id, patch) {
  setState((d) => {
    if (d.selectedModules[id]) Object.assign(d.selectedModules[id], patch);
  });
}

/* ---------- Notizen & Ziele ---------- */
export function setNote(key, text) { setState((d) => { d.notes[key] = text; }); }
export function setWeekGoal(key, h) { setState((d) => { d.weekGoals[key] = h; }); }
export function setMonthGoal(key, h) { setState((d) => { d.monthGoals[key] = h; }); }
export function setSettings(patch) { setState((d) => { Object.assign(d.settings, patch); }); }
export function setDPathChoice(choice) { setState((d) => { d.dPathChoice = choice; }); }

/* ---------- Export / Import ---------- */
export function exportJSON() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `studyflow-export-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || typeof parsed !== "object") throw new Error("Ungültiges Format");
        setState((d) => {
          d.settings = { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) };
          d.entries = Array.isArray(parsed.entries) ? parsed.entries : [];
          d.selectedModules = parsed.selectedModules || {};
          d.notes = parsed.notes || {};
          d.weekGoals = parsed.weekGoals || {};
          d.monthGoals = parsed.monthGoals || {};
          d.dPathChoice = parsed.dPathChoice ?? null;
        });
        resolve();
      } catch (e) { reject(e); }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export function resetAll() {
  setState((d) => {
    const fresh = structuredClone(DEFAULT_DATA);
    Object.keys(d).forEach((k) => delete d[k]);
    Object.assign(d, fresh);
  });
}
