/* ===================================================================
   Module & Projekte: durchsuchbarer Modulkatalog + Meine Module
   =================================================================== */
import { el, clear, openModal, closeModal } from "../dom.js";
import { getState, toggleModule, updateModule, setDPathChoice } from "../store.js";
import { EXAM_STATUS } from "../../data/moduleCatalog.js";
import {
  allModules, groups, pflichtBySemester, modulesInGroup, zusatzModules,
  catalogById, ectsSelectedInGroup, moduleProgressPct, countsTowardProgress,
  selectedModulesDetailed,
} from "../modules.js";
import { esc, uid, fmtDE } from "../utils.js";

const ui = { search: "", filter: "alle", tab: "katalog" };

function statusMeta(id) { return EXAM_STATUS.find((s) => s.id === id) || EXAM_STATUS[0]; }

function isSelected(id) { return !!getState().selectedModules[id]; }

/* ---------- Modulzeile ---------- */
function moduleRow(m, { showGroups = false } = {}) {
  const d = getState();
  const sel = isSelected(m.id);
  const user = d.selectedModules[m.id];

  // Pflicht-/Wahlpflicht-Checkbox-Logik
  const canToggle = m.type !== "pflicht"; // Pflicht sind immer Teil des Plans, aber wählbar zum "Meine Module" hinzufügen
  const row = el(`.mod-row${sel ? ".selected" : ""}`);

  // Checkbox
  const cb = el("input.mod-check", {
    type: "checkbox",
    checked: sel,
    title: sel ? "Aus 'Meine Module' entfernen" : "Zu 'Meine Module' hinzufügen",
    onchange: () => {
      // D-Pfad-Exklusivität prüfen
      if (!sel && m.groups && m.groups.includes("D")) {
        handleDSelection(m);
        return;
      }
      toggleModule({ ...m, _defaultColor: "#7c6ff0" });
    },
  });

  // Metadaten
  const metaBits = [];
  metaBits.push(el("span.m-code", { text: m.id }));
  metaBits.push(el("span", { text: `${m.ects} ECTS` }));
  if (m.semester) metaBits.push(el("span", { text: `${m.semester}. Sem.` }));
  if (m.examForm && m.examForm !== "—") metaBits.push(el("span", { text: m.examForm }));
  if (m.subCourses) metaBits.push(el("span", { text: `Teilkurse: ${m.subCourses.join(", ")}` }));

  // Badges
  const badges = [];
  if (m.type === "pflicht") badges.push(el("span.badge.badge-pflicht", { text: "Pflicht" }));
  if (m.type === "wahlpflicht") badges.push(el("span.badge.badge-wp", { text: "Wahlpflicht" }));
  if (m.type === "zusatz") badges.push(el("span.badge.badge-zusatz", { text: "Zusatz (0 ECTS)" }));
  if (showGroups && m.groups && m.groups.length) {
    m.groups.forEach((g) => badges.push(el("span.badge.badge-group", { text: `Gruppe ${g}` })));
  }
  if (m.possibleDuplicate) badges.push(el("span.badge.badge-dup", { text: "⚠ möglicher Doppeleintrag" }));
  if (m.dPath === "praktikum") badges.push(el("span.badge", { text: "Praktikum-Weg (D)" }));
  if (m.dPath === "module") badges.push(el("span.badge", { text: "Modul-Weg (D)" }));

  const main = el(".mod-main", {}, [
    el(".m-name", {}, [document.createTextNode(m.name + " "), ...badges]),
    el(".m-meta", {}, metaBits),
  ]);

  const side = el(".mod-side");
  if (sel) {
    // Status-Dropdown + Fortschritt + Detail-Button
    const pct = moduleProgressPct(user);
    const statusSel = el("select.status-select", {
      style: { color: statusMeta(user.status).color },
      onchange: (e) => { updateModule(m.id, { status: e.target.value }); },
    }, EXAM_STATUS.map((s) => el("option", { value: s.id, text: s.label, selected: user.status === s.id })));
    side.appendChild(el("span", { style: { fontSize: "12px", color: "#6b7280", width: "34px", textAlign: "right" }, text: `${pct}%` }));
    side.appendChild(statusSel);
    side.appendChild(el("button.btn.btn-sm", { text: "Details", onclick: () => openModuleDetail(m.id) }));
  } else {
    side.appendChild(el("span", { style: { fontSize: "12.5px", color: "#9aa0ac" }, text: m.type === "zusatz" ? "optional" : "nicht gewählt" }));
  }

  row.appendChild(cb);
  row.appendChild(main);
  row.appendChild(side);
  return row;
}

/* ---------- Wahlpflichtbereich D: Exklusive Wahl ---------- */
function handleDSelection(m) {
  const d = getState();
  if (!d.dPathChoice) {
    // Pfad festlegen anhand des gewählten Moduls
    const path = m.dPath;
    openModal(el("div", {}, [
      el(".modal-head", {}, [el("h2", { text: "Wahlpflichtbereich D" }), el("button.close", { html: "&times;", onclick: closeModal })]),
      el(".modal-body", {}, [
        el("p", { text: path === "praktikum"
          ? "Du wählst den Praktikumsweg (30 ECTS). Dann können die sechs Einzelmodule nicht zusätzlich gewählt werden."
          : "Du wählst den Modul-Weg (sechs Module à 5 ECTS = 30 ECTS). Dann ist das Praktikum nicht zusätzlich wählbar." }),
      ]),
      el(".modal-foot", {}, [
        el("button.btn", { text: "Abbrechen", onclick: closeModal }),
        el("button.btn.btn-primary", { text: "Weg festlegen", onclick: () => { setDPathChoice(path); toggleModule({ ...m, _defaultColor: "#7c6ff0" }); closeModal(); } }),
      ]),
    ]), { size: "narrow" });
  } else if (d.dPathChoice !== m.dPath) {
    // falscher Pfad
    openModal(el("div", {}, [
      el(".modal-head", {}, [el("h2", { text: "Nicht möglich" }), el("button.close", { html: "&times;", onclick: closeModal })]),
      el(".modal-body", {}, [el("p", { text: `Du hast bereits den ${d.dPathChoice === "praktikum" ? "Praktikumsweg" : "Modul-Weg"} für Wahlpflichtbereich D gewählt. Beide Wege gleichzeitig zählen nicht.` })]),
      el(".modal-foot", {}, [
        el("button.btn", { text: "OK", onclick: closeModal }),
        el("button.btn.btn-primary", { text: "Weg wechseln", onclick: () => {
          // alte D-Auswahl entfernen
          Object.keys(getState().selectedModules).forEach((id) => {
            const cm = catalogById(id);
            if (cm.groups && cm.groups.includes("D")) toggleModule({ ...cm });
          });
          setDPathChoice(m.dPath);
          toggleModule({ ...m, _defaultColor: "#7c6ff0" });
          closeModal();
        } }),
      ]),
    ]), { size: "narrow" });
  } else {
    toggleModule({ ...m, _defaultColor: "#7c6ff0" });
  }
}

/* ---------- Gruppen-Header mit ECTS-Soll ---------- */
function groupHeader(g) {
  const sel = ectsSelectedInGroup(g.id);
  const done = sel >= g.requiredEcts;
  return el(".group-header", {}, [
    el("h3", { text: `${g.label}${g.semester ? ` · ${g.semester}. Semester` : ""}` }),
    el(".ects-goal", {}, [
      el("span", { class: done ? "ok" : "pending", text: `${sel} / ${g.requiredEcts} ECTS` }),
      el("span", { style: { color: "#9aa0ac", marginLeft: "8px", fontSize: "12px" }, text: g.note }),
    ]),
  ]);
}

/* ---------- Modul-Detail-Modal ---------- */
function openModuleDetail(id) {
  const m = catalogById(id);
  const user = getState().selectedModules[id];
  if (!user) return;

  let node;
  function rebuild() { const f = buildBody(); node.replaceWith(f); node = f; }

  function buildBody() {
    const pct = moduleProgressPct(user);
    const statusSel = el("select.select", {
      onchange: (e) => { updateModule(id, { status: e.target.value }); rebuild(); refresh(); },
    }, EXAM_STATUS.map((s) => el("option", { value: s.id, text: s.label, selected: user.status === s.id })));

    const tasksList = el("ul.step-list", {}, (user.tasks || []).map((t) =>
      el("li", {}, [
        el("input", { type: "checkbox", checked: t.done, onchange: (e) => {
          t.done = e.target.checked; updateModule(id, { tasks: user.tasks }); rebuild(); refresh();
        } }),
        el("span", { class: t.done ? "done" : "", text: t.text }),
        el("button.step-del", { html: "&times;", onclick: () => { user.tasks = user.tasks.filter((x) => x.id !== t.id); updateModule(id, { tasks: user.tasks }); rebuild(); refresh(); } }),
      ])));
    const newTask = el("input.input", { placeholder: "Neue Lernaufgabe / verbleibender Lernschritt …", onkeydown: (e) => {
      if (e.key === "Enter" && e.target.value.trim()) {
        user.tasks = user.tasks || [];
        user.tasks.push({ id: uid(), text: e.target.value.trim(), done: false });
        updateModule(id, { tasks: user.tasks }); e.target.value = ""; rebuild(); refresh();
      }
    } });

    return el(".modal-body", {}, [
      el(".mod-detail-grid", { style: { marginBottom: "16px" } }, [
        el(".detail-stat", {}, [el(".l", { text: "Kurscode" }), el(".v", { style: { fontSize: "15px" }, text: m.id })]),
        el(".detail-stat", {}, [el(".l", { text: "ECTS" }), el(".v", { text: `${m.ects}` })]),
        el(".detail-stat", {}, [el(".l", { text: "Prüfungsform" }), el(".v", { style: { fontSize: "15px" }, text: m.examForm || "—" })]),
        el(".detail-stat", {}, [el(".l", { text: "Fortschritt" }), el(".v", { text: `${pct} %` })]),
      ]),
      el(".progress", { style: { marginBottom: "18px" } }, [el("span", { style: { width: pct + "%" } })]),

      el(".field", {}, [el("label", { text: "Prüfungsstatus" }), statusSel]),
      el(".field-row", {}, [
        el(".field", { style: { margin: 0 } }, [el("label", { text: "Geschätzter Aufwand (Std.)" }),
          el("input.input", { type: "number", min: "0", value: user.estHours || 0, oninput: (e) => updateModule(id, { estHours: +e.target.value || 0 }) })]),
        el(".field", { style: { margin: 0 } }, [el("label", { text: "Zieltermin" }),
          el("input.input", { type: "date", value: user.targetDate || "", onchange: (e) => updateModule(id, { targetDate: e.target.value }) })]),
      ]),
      el(".field-row", {}, [
        el(".field", { style: { margin: 0 } }, [el("label", { text: "Seiten gelesen" }),
          el("input.input", { type: "number", min: "0", value: user.pages?.done || 0, oninput: (e) => { user.pages = { ...(user.pages || {}), done: +e.target.value || 0 }; updateModule(id, { pages: user.pages }); rebuild(); refresh(); } })]),
        el(".field", { style: { margin: 0 } }, [el("label", { text: "Seiten gesamt" }),
          el("input.input", { type: "number", min: "0", value: user.pages?.total || 0, oninput: (e) => { user.pages = { ...(user.pages || {}), total: +e.target.value || 0 }; updateModule(id, { pages: user.pages }); rebuild(); refresh(); } })]),
      ]),

      el(".field", {}, [el("label", { text: "Verbleibende Lernschritte / Aufgaben" }), tasksList, newTask]),
      el(".field", {}, [el("label", { text: "Notizen" }),
        el("textarea.textarea", { oninput: (e) => updateModule(id, { notes: e.target.value }) }, user.notes || "")]),

      el(".field", {}, [el("label", { text: "Modulfarbe (für Kalender)" }),
        el(".color-row", {}, ["#7c6ff0","#e0ab2a","#37a874","#d85757","#2f80d6","#c457b9","#e08a3c","#3ca896"].map((c) =>
          el(`.swatch${user.color === c ? ".sel" : ""}`, { style: { background: c }, onclick: () => { updateModule(id, { color: c }); rebuild(); refresh(); } })))]),
    ]);
  }

  node = buildBody();
  openModal(el("div", {}, [
    el(".modal-head", {}, [el("h2", { text: m.name }), el("button.close", { html: "&times;", onclick: closeModal })]),
    node,
    el(".modal-foot", {}, [el("button.btn.btn-primary", { text: "Fertig", onclick: closeModal })]),
  ]), { size: "wide" });
}

/* ---------- Haupt-Render ---------- */
let host = null;
function refresh() { if (host) render(host); }

export function render(container) {
  host = container;
  clear(container);
  const d = getState();

  container.appendChild(el(".main-eyebrow", { text: "Dein Studienplan. In deiner Struktur." }));
  container.appendChild(el(".page-head", {}, [
    el("h1", { text: "Module & Projekte" }),
    el(".date-badge", { html: `<span class="avatar">${esc(d.settings.initials || "OM")}</span>` }),
  ]));
  container.appendChild(el(".page-sub", { text: "Ordne Lernblöcke zu. Pflichtmodule sind vorgegeben, Wahlpflichtmodule wählst du per Checkbox. Nur gewählte Wahlmöglichkeiten zählen zum Studienfortschritt." }));

  // Tabs
  const selCount = Object.keys(d.selectedModules).length;
  container.appendChild(el(".filter-chips", { style: { marginBottom: "14px" } }, [
    el(`button.chip${ui.tab === "katalog" ? ".sel" : ""}`, { text: "📚 Modulkatalog", onclick: () => { ui.tab = "katalog"; refresh(); } }),
    el(`button.chip${ui.tab === "meine" ? ".sel" : ""}`, { text: `⭐ Meine Module (${selCount})`, onclick: () => { ui.tab = "meine"; refresh(); } }),
  ]));

  if (ui.tab === "meine") return renderMyModules(container);
  renderCatalog(container);
}

/* ---------- Katalog ---------- */
function renderCatalog(container) {
  // Suche + Filter
  const searchBox = el(".search-box", {}, [
    el("span.s-ico", { text: "🔍" }),
    el("input", { placeholder: "Module durchsuchen (Name oder Kurscode) …", value: ui.search, oninput: (e) => { ui.search = e.target.value; renderList(); } }),
  ]);
  const filters = [["alle", "Alle"], ["pflicht", "Pflicht"], ["wahlpflicht", "Wahlpflicht"], ["gewaehlt", "Gewählt"], ["zusatz", "Zusatz"]];
  const chips = el(".filter-chips", {}, filters.map(([v, l]) =>
    el(`button.chip${ui.filter === v ? ".sel" : ""}`, { text: l, onclick: () => { ui.filter = v; renderList(); } })));
  container.appendChild(el(".mod-toolbar", {}, [searchBox, chips]));

  const listHost = el("div");
  container.appendChild(listHost);

  function matches(m) {
    const q = ui.search.trim().toLowerCase();
    if (q && !(m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q))) return false;
    if (ui.filter === "pflicht") return m.type === "pflicht";
    if (ui.filter === "wahlpflicht") return m.type === "wahlpflicht";
    if (ui.filter === "zusatz") return m.type === "zusatz";
    if (ui.filter === "gewaehlt") return isSelected(m.id);
    return true;
  }

  function renderList() {
    // Re-sync chips/search highlight
    chips.querySelectorAll(".chip").forEach((c, i) => c.classList.toggle("sel", filters[i][0] === ui.filter));
    clear(listHost);

    const q = ui.search.trim();
    const anyFilter = ui.filter !== "alle" || q;

    // Pflicht nach Semester
    const pf = pflichtBySemester();
    let shownAny = false;
    Object.keys(pf).sort().forEach((sem) => {
      const list = pf[sem].filter(matches);
      if (!list.length) return;
      shownAny = true;
      listHost.appendChild(el(".group-header", {}, [el("h3", { text: `${sem}. Semester · Pflicht` }), el(".ects-goal.pending", { text: `${list.reduce((s, m) => s + m.ects, 0)} ECTS` })]));
      list.forEach((m) => listHost.appendChild(moduleRow(m)));
    });

    // Wahlpflichtgruppen
    const gs = groups();
    Object.values(gs).forEach((g) => {
      const list = modulesInGroup(g.id).filter(matches);
      if (!list.length) return;
      shownAny = true;
      listHost.appendChild(groupHeader(g));
      // Dubletten innerhalb der Gruppe vermeiden (ein Katalogeintrag, aber Gruppenzugehörigkeit zeigen)
      const seen = new Set();
      list.forEach((m) => { if (seen.has(m.id)) return; seen.add(m.id); listHost.appendChild(moduleRow(m, { showGroups: true })); });
    });

    // Zusatz
    const zus = zusatzModules().filter(matches);
    if (zus.length) {
      shownAny = true;
      listHost.appendChild(el(".group-header", {}, [el("h3", { text: "Zusätzliche Angebote" }), el(".ects-goal.pending", { text: "ohne ECTS für den Bachelor" })]));
      zus.forEach((m) => listHost.appendChild(moduleRow(m)));
    }

    if (!shownAny) listHost.appendChild(el(".empty-mini", { text: "Keine Module gefunden. Suchbegriff oder Filter anpassen." }));
  }

  renderList();
}

/* ---------- Meine Module ---------- */
function renderMyModules(container) {
  const mods = selectedModulesDetailed();
  if (!mods.length) {
    container.appendChild(el(".card", {}, [el(".empty-state", {}, [
      el(".big-ico", { text: "📖" }),
      el("h2", { text: "Noch keine Module gewählt." }),
      el("p", { text: "Wechsle zum Modulkatalog und hake die Module an, die du bearbeiten möchtest. Sie erscheinen dann hier und lassen sich Lernblöcken im Kalender zuordnen." }),
      el("button.btn.btn-primary", { text: "Zum Modulkatalog", onclick: () => { ui.tab = "katalog"; refresh(); } }),
    ])]));
    return;
  }

  // nach Semester / Gruppe gruppieren
  mods.sort((a, b) => (a.semester || 99) - (b.semester || 99) || a.name.localeCompare(b.name));
  mods.forEach((m) => container.appendChild(moduleRow(m, { showGroups: true })));
}
