/* ===================================================================
   Eintrags-Modal: Lernblock / Termin anlegen & bearbeiten
   (entspricht "Neuer Eintrag" aus den Screenshots)
   =================================================================== */
import { el, openModal, closeModal, confirmDialog } from "./dom.js";
import { getState, upsertEntry, deleteEntry } from "./store.js";
import { COLORS, uid, todayKey } from "./utils.js";
import { LEARN_TYPES } from "../data/moduleCatalog.js";
import { catalogById } from "./modules.js";

export function openEntryModal(existing = null, presets = {}) {
  const d = getState();
  const isEdit = !!existing;

  // Default-Werte
  const state = existing ? { ...existing } : {
    id: uid(),
    kind: "lernblock",           // 'lernblock' | 'termin'
    title: "",
    moduleId: "",
    date: presets.date || todayKey(),
    color: "auto",
    from: presets.from || "10:00",
    to: presets.to || "11:00",
    priority: "normal",
    learnType: "Lesen",
    note: "",
    doneH: 0,
    doneM: 0,
    openPoints: "",
    carryOver: false,
  };

  const selMods = Object.keys(d.selectedModules).map((id) => ({ id, ...catalogById(id) }))
    .filter((m) => m.name);

  let node;

  function rebuild() {
    const fresh = buildForm();
    node.replaceWith(fresh);
    node = fresh;
  }

  function buildForm() {
    const isLern = state.kind === "lernblock";

    // Typ-Toggle
    const typeToggle = el(".type-toggle", {}, [
      el(`.type-opt${isLern ? ".sel" : ""}`, { onclick: () => { state.kind = "lernblock"; rebuild(); } }, [
        el(".ic", { text: "📖" }),
        el("div", {}, [el(".t-title", { text: "Lernblock" }), el(".t-sub", { text: "Zählt zur Lernzeit" })]),
        el(".check", { text: "✓" }),
      ]),
      el(`.type-opt${!isLern ? ".sel" : ""}`, { onclick: () => { state.kind = "termin"; rebuild(); } }, [
        el(".ic", { text: "📅" }),
        el("div", {}, [el(".t-title", { text: "Termin" }), el(".t-sub", { text: "z. B. Vorlesung, Prüfung" })]),
        el(".check", { text: "✓" }),
      ]),
    ]);

    // Titel
    const titleField = el(".field", {}, [
      el("label", { text: "Titel" }),
      el("input.input", {
        value: state.title,
        placeholder: isLern ? "z. B. Onlinemarketing – Kapitel 3" : "z. B. Online-Klausur SEO",
        oninput: (e) => { state.title = e.target.value; },
      }),
    ]);

    // Modul + Datum
    const moduleSelect = el("select.select", { onchange: (e) => { state.moduleId = e.target.value; } }, [
      el("option", { value: "", text: "Ohne Modul" }),
      ...selMods.map((m) => el("option", { value: m.id, text: m.name + ` (${m.id})`, selected: state.moduleId === m.id })),
    ]);
    const modDateRow = el(".field-row", {}, [
      el(".field", { style: { margin: 0 } }, [el("label", { text: "Modul" }), moduleSelect]),
      el(".field", { style: { margin: 0 } }, [
        el("label", { text: "Datum" }),
        el("input.input", { type: "date", value: state.date, onchange: (e) => { state.date = e.target.value; } }),
      ]),
    ]);

    // Farbe
    const colorRow = el(".field", {}, [
      el("label", {}, [document.createTextNode("Farbe "), el("span.opt", { text: "Standard: Modulfarbe. Eigene Farbe hebt den Eintrag hervor." })]),
      el(".color-row", {}, [
        el(`.swatch-auto${state.color === "auto" ? ".sel" : ""}`, {
          onclick: () => { state.color = "auto"; rebuild(); },
        }, [el("span", { text: "◇" }), document.createTextNode("Auto")]),
        ...COLORS.map((c) => el(`.swatch${state.color === c.val ? ".sel" : ""}`, {
          style: { background: c.val }, title: c.name,
          onclick: () => { state.color = c.val; rebuild(); },
        })),
      ]),
    ]);

    // Von / Bis
    const timeRow = el(".field-row", {}, [
      el(".field", { style: { margin: 0 } }, [el("label", { text: "Von" }), el("input.input", { type: "time", value: state.from, onchange: (e) => { state.from = e.target.value; } })]),
      el(".field", { style: { margin: 0 } }, [el("label", { text: "Bis" }), el("input.input", { type: "time", value: state.to, onchange: (e) => { state.to = e.target.value; } })]),
    ]);

    // Lernart (nur Lernblock)
    const learnTypeField = isLern ? el(".field", {}, [
      el("label", { text: "Lernart" }),
      el("select.select", { onchange: (e) => { state.learnType = e.target.value; } },
        LEARN_TYPES.map((t) => el("option", { value: t, text: t, selected: state.learnType === t }))),
    ]) : null;

    // Priorität
    const priorityField = el(".field", {}, [
      el("label", { text: "Priorität" }),
      el(".segmented", {}, [
        el(`button${state.priority === "normal" ? ".sel" : ""}`, { text: "Normal", onclick: () => { state.priority = "normal"; rebuild(); } }),
        el(`button${state.priority === "wichtig" ? ".sel" : ""}`, { html: "☆ Wichtig", onclick: () => { state.priority = "wichtig"; rebuild(); } }),
        el(`button${state.priority === "dringend" ? ".sel" : ""}`, { html: "⚠ Dringend", onclick: () => { state.priority = "dringend"; rebuild(); } }),
      ]),
    ]);

    // Notiz
    const noteField = el(".field", {}, [
      el("label", {}, [document.createTextNode("Notiz "), el("span.opt", { text: "Pro Eintrag frei notieren." })]),
      el("textarea.textarea", { placeholder: "Gedanken, Teilaufgaben, offene Fragen …", oninput: (e) => { state.note = e.target.value; } }, state.note || ""),
    ]);

    // Gelernt (nur Lernblock)
    const doneField = isLern ? el(".field", {}, [
      el("label", {}, [document.createTextNode("Gelernt "), el("span.opt", { text: "Tatsächlich gelernte Zeit – erscheint im Wochenrückblick." })]),
      el(".field-row-3", {}, [
        el("input.input", { type: "number", min: "0", value: state.doneH, oninput: (e) => { state.doneH = +e.target.value || 0; } }),
        el("span.unit", { text: "Std." }),
        el("input.input", { type: "number", min: "0", max: "59", value: state.doneM, oninput: (e) => { state.doneM = +e.target.value || 0; } }),
        el("span.unit", { text: "Min." }),
      ]),
    ]) : null;

    // Offene Punkte (nur Lernblock)
    const openField = isLern ? el(".field", {}, [
      el("label", {}, [document.createTextNode("Offene Punkte "), el("span.opt", { text: "optional" })]),
      el("textarea.textarea", { placeholder: "Optional: Was fehlt noch oder willst du wiederholen? …", oninput: (e) => { state.openPoints = e.target.value; } }, state.openPoints || ""),
    ]) : null;

    const carryField = isLern ? el(".checkbox-row", { style: { padding: "4px 0 2px" } }, [
      el("input", { type: "checkbox", checked: state.carryOver, onchange: (e) => { state.carryOver = e.target.checked; } }),
      el("span", { text: "In nächste Woche mitnehmen" }),
    ]) : null;

    return el(".modal-body", {}, [
      el(".field", {}, [el("label", { text: "Typ" }), typeToggle]),
      titleField,
      modDateRow,
      colorRow,
      timeRow,
      learnTypeField,
      priorityField,
      noteField,
      doneField,
      openField,
      carryField,
    ]);
  }

  node = buildForm();

  const foot = el(".modal-foot", {}, [
    isEdit ? el("button.btn.btn-ghost.spacer", {
      html: "🗑 Löschen",
      style: { color: "#dc2626" },
      onclick: () => confirmDialog("Diesen Eintrag wirklich löschen?", () => { deleteEntry(state.id); closeModal(); }, { danger: true, yesLabel: "Löschen" }),
    }) : null,
    el("button.btn", { text: "Abbrechen", onclick: closeModal }),
    el("button.btn.btn-primary", {
      text: "Speichern",
      onclick: () => {
        if (!state.title.trim()) { state.title = state.kind === "lernblock" ? "Lernblock" : "Termin"; }
        upsertEntry({ ...state });
        closeModal();
      },
    }),
  ]);

  openModal(el("div", {}, [
    el(".modal-head", {}, [
      el("h2", { text: isEdit ? "Eintrag bearbeiten" : "Neuer Eintrag" }),
      el("button.close", { html: "&times;", onclick: closeModal }),
    ]),
    node,
    foot,
  ]));
}
