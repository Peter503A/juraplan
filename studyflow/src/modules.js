/* ===================================================================
   Modul-Helfer: Katalog-Zugriff, ECTS-Berechnung, Fortschritt
   =================================================================== */
import { modules, electiveGroups } from "../data/moduleCatalog.js";
import { getState } from "./store.js";

const byId = new Map(modules.map((m) => [m.id, m]));

export function catalogById(id) { return byId.get(id) || {}; }
export function allModules() { return modules; }
export function groups() { return electiveGroups; }

/** Pflichtmodule nach Semester gruppiert */
export function pflichtBySemester() {
  const map = {};
  modules.filter((m) => m.type === "pflicht").forEach((m) => {
    (map[m.semester] ||= []).push(m);
  });
  return map;
}

/** Module einer Wahlpflichtgruppe */
export function modulesInGroup(groupId) {
  return modules.filter((m) => m.groups.includes(groupId));
}

export function zusatzModules() {
  return modules.filter((m) => m.type === "zusatz");
}

/** Gewählte Module (inkl. Katalogdaten + User-State) */
export function selectedModulesDetailed() {
  const d = getState();
  return Object.entries(d.selectedModules).map(([id, user]) => ({
    ...catalogById(id),
    id,
    user,
  }));
}

/** Zählt das Modul zum Studienfortschritt?
 *  - Pflicht: immer (wenn gewählt / automatisch)
 *  - Wahlpflicht D: nur der gewählte Pfad zählt
 *  - Zusatz: nie (0 ECTS)
 */
export function countsTowardProgress(mod, dPathChoice) {
  if (mod.type === "zusatz") return false;
  if (mod.groups && mod.groups.includes("D")) {
    if (dPathChoice === "praktikum") return mod.dPath === "praktikum";
    if (dPathChoice === "module") return mod.dPath === "module";
    return false; // noch kein Weg gewählt
  }
  return true;
}

/** ECTS je Wahlpflichtgruppe aus aktuell gewählten Modulen */
export function ectsSelectedInGroup(groupId) {
  const d = getState();
  let sum = 0;
  Object.keys(d.selectedModules).forEach((id) => {
    const m = catalogById(id);
    if (m.groups && m.groups.includes(groupId)) {
      if (groupId === "D" && !countsTowardProgress(m, d.dPathChoice)) return;
      sum += m.ects || 0;
    }
  });
  return sum;
}

/** Gesamt-ECTS-Fortschritt (Pflicht + gewählte Wahlpflicht, Bachelor-relevant) */
export function totalEctsProgress() {
  const d = getState();
  let earned = 0;      // bestanden/angerechnet
  let planned = 0;     // alle gewählten/pflicht zählenden Module
  const TOTAL_BACHELOR = 180;

  // Pflichtmodule zählen immer zum Studienplan (auch wenn nicht explizit gewählt)
  modules.filter((m) => m.type === "pflicht").forEach((m) => {
    planned += m.ects;
    const u = d.selectedModules[m.id];
    if (u && (u.status === "bestanden" || u.status === "angerechnet")) earned += m.ects;
  });

  // Wahlpflicht: nur gewählte, die zum Fortschritt zählen
  Object.keys(d.selectedModules).forEach((id) => {
    const m = catalogById(id);
    if (m.type !== "wahlpflicht") return;
    if (!countsTowardProgress(m, d.dPathChoice)) return;
    planned += m.ects;
    const u = d.selectedModules[id];
    if (u && (u.status === "bestanden" || u.status === "angerechnet")) earned += m.ects;
  });

  return { earned, planned, total: TOTAL_BACHELOR };
}

/** Modul-Fortschritt in % (gewichtet aus Seiten + Aufgaben + Status) */
export function moduleProgressPct(user) {
  if (!user) return 0;
  const statusWeight = { offen: 0, begonnen: 20, gelernt: 60, pruefungsbereit: 85, bestanden: 100, angerechnet: 100 };
  let base = statusWeight[user.status] ?? 0;

  const parts = [];
  if (user.pages && user.pages.total > 0) parts.push(Math.min(100, (user.pages.done / user.pages.total) * 100));
  if (user.tasks && user.tasks.length > 0) parts.push((user.tasks.filter((t) => t.done).length / user.tasks.length) * 100);

  if (parts.length) {
    const detail = parts.reduce((a, b) => a + b, 0) / parts.length;
    // Mische Status (40%) und Detailfortschritt (60%)
    return Math.round(base * 0.4 + detail * 0.6);
  }
  return Math.round(base);
}
