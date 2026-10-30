/* ============================================================
   JuraPlan – Hilfsfunktionen (Datum, Zeit, DOM, Toast)
   ============================================================ */
(function () {
  "use strict";

  const DOW_SHORT = ["MO", "DI", "MI", "DO", "FR", "SA", "SO"];
  const DOW_LONG = [
    "Montag", "Dienstag", "Mittwoch", "Donnerstag",
    "Freitag", "Samstag", "Sonntag",
  ];
  const MONTHS = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember",
  ];
  const MONTHS_SHORT = [
    "Jan.", "Feb.", "März", "Apr.", "Mai", "Juni",
    "Juli", "Aug.", "Sep.", "Okt.", "Nov.", "Dez.",
  ];

  // ---- Datum als lokaler ISO-String (YYYY-MM-DD), zeitzonensicher ----
  function toISODate(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  function fromISODate(iso) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  // Montag = Wochenstart
  function startOfWeek(d) {
    const x = new Date(d);
    const day = (x.getDay() + 6) % 7; // 0=Mo
    x.setDate(x.getDate() - day);
    x.setHours(0, 0, 0, 0);
    return x;
  }
  function endOfWeek(d) {
    const x = startOfWeek(d);
    x.setDate(x.getDate() + 6);
    return x;
  }
  function addDays(d, n) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  }
  function addWeeks(d, n) { return addDays(d, n * 7); }
  function addMonths(d, n) {
    const x = new Date(d);
    x.setMonth(x.getMonth() + n);
    return x;
  }
  function startOfMonth(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
  }
  function isToday(d) { return sameDay(d, new Date()); }

  function weekKey(d) { return toISODate(startOfWeek(d)); }

  // ---- Formatierungen ----
  function fmtRangeShort(start, end) {
    // "26. Okt. – 1. Nov. 2026"
    const s = `${start.getDate()}. ${MONTHS_SHORT[start.getMonth()]}`;
    const e = `${end.getDate()}. ${MONTHS_SHORT[end.getMonth()]} ${end.getFullYear()}`;
    return `${s} – ${e}`;
  }
  function fmtRangeNoYear(start, end) {
    const s = `${start.getDate()}. ${MONTHS_SHORT[start.getMonth()]}`;
    const e = `${end.getDate()}. ${MONTHS_SHORT[end.getMonth()]}`;
    return `${s} – ${e}`;
  }
  function fmtDayLong(d) {
    return `${DOW_LONG[(d.getDay() + 6) % 7]}, ${d.getDate()}. ${MONTHS[d.getMonth()]}`;
  }
  function fmtTodayLabel(d) {
    return `${d.getDate()}. ${MONTHS[d.getMonth()]}`;
  }
  function fmtMonthYear(d) { return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`; }

  // ---- Zeit in Minuten <-> "HH:MM" ----
  function timeToMin(t) {
    if (!t) return 0;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }
  function minToTime(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  // Dauer in Minuten -> "2 h 30 min" / "45 min" / "3 h"
  function fmtDuration(min) {
    if (!min || min <= 0) return "0 min";
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h && m) return `${h} h ${m} min`;
    if (h) return `${h} h`;
    return `${m} min`;
  }
  // Minuten -> Dezimalstunden gerundet, z.B. 90 -> "1,5 h"
  function fmtHours(min) {
    const h = min / 60;
    const rounded = Math.round(h * 10) / 10;
    const str = Number.isInteger(rounded)
      ? String(rounded)
      : String(rounded).replace(".", ",");
    return `${str} h`;
  }

  // ---- DOM-Helfer ----
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        if (k === "class") node.className = attrs[k];
        else if (k === "html") node.innerHTML = attrs[k];
        else if (k === "text") node.textContent = attrs[k];
        else if (k.startsWith("on") && typeof attrs[k] === "function") {
          node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        } else if (k === "style" && typeof attrs[k] === "object") {
          Object.assign(node.style, attrs[k]);
        } else if (attrs[k] != null && attrs[k] !== false) {
          node.setAttribute(k, attrs[k]);
        }
      }
    }
    if (children != null) {
      (Array.isArray(children) ? children : [children]).forEach((c) => {
        if (c == null || c === false) return;
        node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
      });
    }
    return node;
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  function uid() {
    return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  let toastTimer = null;
  function toast(msg) {
    const old = document.querySelector(".toast");
    if (old) old.remove();
    const t = el("div", { class: "toast" }, [Icons.check(16), msg]);
    document.body.appendChild(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.remove(), 2200);
  }

  window.U = {
    DOW_SHORT, DOW_LONG, MONTHS, MONTHS_SHORT,
    toISODate, fromISODate, startOfWeek, endOfWeek, addDays, addWeeks,
    addMonths, startOfMonth, sameDay, isToday, weekKey,
    fmtRangeShort, fmtRangeNoYear, fmtDayLong, fmtTodayLabel, fmtMonthYear,
    timeToMin, minToTime, fmtDuration, fmtHours,
    el, clear, uid, toast,
  };
})();
