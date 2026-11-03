/* ===================================================================
   Utilities – Datum, Zeit, Formatierung (deutsch)
   =================================================================== */

export const WEEKDAYS_SHORT = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
export const WEEKDAYS_LONG = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
export const WEEKDAYS_MON = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]; // montagsbasiert
export const MONTHS = ["Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
export const MONTHS_SHORT = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];

export const COLORS = [
  { name: "Violett", val: "#7c6ff0" },
  { name: "Gelb", val: "#e0ab2a" },
  { name: "Grün", val: "#37a874" },
  { name: "Rot", val: "#d85757" },
  { name: "Blau", val: "#2f80d6" },
  { name: "Pink", val: "#c457b9" },
  { name: "Orange", val: "#e08a3c" },
  { name: "Teal", val: "#3ca896" },
];

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/* ---------- Date keys ---------- */
export function toDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
export function fromDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}
export function todayKey() { return toDateKey(new Date()); }

export function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/* ---------- Week (ISO, Montag-Start) ---------- */
export function startOfWeek(d) {
  const r = new Date(d);
  const day = (r.getDay() + 6) % 7; // 0 = Montag
  r.setDate(r.getDate() - day);
  r.setHours(0, 0, 0, 0);
  return r;
}
export function endOfWeek(d) {
  const r = startOfWeek(d);
  r.setDate(r.getDate() + 6);
  return r;
}
export function isoWeek(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const diff = (date - firstThursday) / 86400000;
  const week = 1 + Math.round((diff - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return week;
}
export function weekKey(d) {
  const date = new Date(d);
  const yearForWeek = (() => {
    const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = (tmp.getUTCDay() + 6) % 7;
    tmp.setUTCDate(tmp.getUTCDate() - dayNum + 3);
    return tmp.getUTCFullYear();
  })();
  return `${yearForWeek}-W${String(isoWeek(d)).padStart(2, "0")}`;
}
export function monthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
export function addMonths(d, n) { const r = new Date(d); r.setMonth(r.getMonth() + n); return r; }

/* ---------- Formatting ---------- */
export function fmtDayShort(d) { return `${d.getDate()}. ${MONTHS_SHORT[d.getMonth()]}`; }
export function fmtDayFull(d) { return `${WEEKDAYS_LONG[d.getDay()]}, ${d.getDate()}. ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; }
export function fmtRange(a, b) {
  const sameMonth = a.getMonth() === b.getMonth();
  if (sameMonth) return `${a.getDate()}. – ${b.getDate()}. ${MONTHS_SHORT[b.getMonth()]}`;
  return `${a.getDate()}. ${MONTHS_SHORT[a.getMonth()]} – ${b.getDate()}. ${MONTHS_SHORT[b.getMonth()]}`;
}
export function fmtDE(key) { // YYYY-MM-DD -> DD.MM.YYYY
  if (!key) return "";
  const [y, m, d] = key.split("-");
  return `${d}.${m}.${y}`;
}

/* ---------- Time helpers ---------- */
export function timeToMin(t) {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
export function minToTime(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
export function durationMin(from, to) {
  const d = timeToMin(to) - timeToMin(from);
  return d > 0 ? d : 0;
}
/** Minuten -> "2 h 30 min" / "45 min" / "3 h" */
export function fmtDuration(min) {
  if (!min) return "0 min";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h && m) return `${h} h ${m} min`;
  if (h) return `${h} h`;
  return `${m} min`;
}
export function fmtHours(min) {
  const h = min / 60;
  return (Math.round(h * 10) / 10).toString().replace(".", ",");
}

/* ---------- HTML escape ---------- */
export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ---------- Contrast text for colored bg ---------- */
export function textOn(hex) {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62 ? "#1f2430" : "#ffffff";
}
