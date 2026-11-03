/* ===================================================================
   DOM-Helfer – minimaler Ersatz für ein Framework
   =================================================================== */

/** Element erzeugen: el('div.klasse#id', {attrs}, [children|string]) */
export function el(tag, attrs = {}, children = []) {
  let tagName = "div";
  const classes = [];
  let id = null;

  const m = tag.match(/^([a-zA-Z0-9]+)?((?:[.#][\w-]+)*)$/);
  if (m) {
    if (m[1]) tagName = m[1];
    const rest = m[2] || "";
    rest.split(/(?=[.#])/).forEach((tok) => {
      if (tok.startsWith(".")) classes.push(tok.slice(1));
      else if (tok.startsWith("#")) id = tok.slice(1);
    });
  }

  const node = document.createElement(tagName);
  if (classes.length) node.className = classes.join(" ");
  if (id) node.id = id;

  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") node.className += (node.className ? " " : "") + v;
    else if (k === "html") node.innerHTML = v;
    else if (k === "text") node.textContent = v;
    else if (k === "style" && typeof v === "object") Object.assign(node.style, v);
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === "value") node.value = v;
    else if (k === "checked") node.checked = !!v;
    else if (k === "disabled") node.disabled = !!v;
    else node.setAttribute(k, v);
  }

  const kids = Array.isArray(children) ? children : [children];
  for (const c of kids) {
    if (c == null || c === false) continue;
    node.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
  }
  return node;
}

export function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); return node; }

/* ---------- Modal ---------- */
let activeModal = null;

export function openModal(contentNode, { size = "" } = {}) {
  closeModal();
  const overlay = el(".modal-overlay", {
    onclick: (e) => { if (e.target === overlay) closeModal(); },
  }, [el(`.modal${size ? "." + size : ""}`, {}, [contentNode])]);
  document.body.appendChild(overlay);
  activeModal = overlay;
  const esc = (e) => { if (e.key === "Escape") closeModal(); };
  document.addEventListener("keydown", esc);
  overlay._esc = esc;
  return overlay;
}

export function closeModal() {
  if (activeModal) {
    document.removeEventListener("keydown", activeModal._esc);
    activeModal.remove();
    activeModal = null;
  }
}

/* ---------- Toast ---------- */
let toastTimer = null;
export function toast(msg) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const t = el(".toast", { text: msg });
  document.body.appendChild(t);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.remove(), 2600);
}

/* ---------- Confirm ---------- */
export function confirmDialog(message, onYes, { danger = false, yesLabel = "OK" } = {}) {
  const body = el(".modal-body", {}, [el("p", { text: message, style: { margin: "6px 0 2px", fontSize: "15px" } })]);
  const foot = el(".modal-foot", {}, [
    el("button.btn", { text: "Abbrechen", onclick: closeModal }),
    el(`button.btn.btn-primary`, {
      text: yesLabel,
      style: danger ? { background: "#dc2626", borderColor: "#dc2626", boxShadow: "none" } : {},
      onclick: () => { closeModal(); onYes(); },
    }),
  ]);
  openModal(el("div", {}, [
    el(".modal-head", {}, [el("h2", { text: "Bestätigen" }), el("button.close", { html: "&times;", onclick: closeModal })]),
    body, foot,
  ]), { size: "narrow" });
}
