/* Interaktions-Smoke-Test: Modal öffnen, speichern, Export/Import */
const _store = {};
globalThis.localStorage = { getItem: (k) => (k in _store ? _store[k] : null), setItem: (k, v) => { _store[k] = String(v); }, removeItem: (k) => { delete _store[k]; } };
globalThis.structuredClone ||= (o) => JSON.parse(JSON.stringify(o));

let idc = 0;
class El {
  constructor(tag){ this.tagName=(tag||"div").toUpperCase(); this.children=[]; this.attributes={}; this.style={}; this._classes=new Set(); this.listeners={}; this._text=""; this.value=""; this.checked=false; this.files=[]; this.parentNode=null; this._id=++idc; }
  set className(v){ this._classes=new Set(String(v).split(/\s+/).filter(Boolean)); }
  get className(){ return [...this._classes].join(" "); }
  get classList(){ const s=this._classes; return { has:c=>s.has(c), add:c=>s.add(c), delete:c=>s.delete(c), toggle:(c,f)=>{const a=f===undefined?!s.has(c):f; a?s.add(c):s.delete(c); return a;} }; }
  set id(v){ this.attributes.id=v; } get id(){ return this.attributes.id; }
  set textContent(v){ this._text=v; this.children=[]; }
  get textContent(){ if(this._text) return this._text; return this.children.map(c=>c.nodeType===3?c.data:c.textContent).join(""); }
  set innerHTML(v){ this._html=v; this._text=String(v).replace(/<[^>]*>/g,""); } get innerHTML(){ return this._html||""; }
  setAttribute(k,v){ this.attributes[k]=v; } getAttribute(k){ return this.attributes[k]; }
  appendChild(c){ c.parentNode=this; this.children.push(c); return c; }
  removeChild(c){ this.children=this.children.filter(x=>x!==c); }
  replaceWith(n){ if(!this.parentNode) return; const i=this.parentNode.children.indexOf(this); if(i>=0){ this.parentNode.children[i]=n; n.parentNode=this.parentNode; } }
  remove(){ if(this.parentNode) this.parentNode.removeChild(this); }
  get firstChild(){ return this.children[0]; }
  addEventListener(ev,fn){ (this.listeners[ev]||=[]).push(fn); }
  removeEventListener(){}
  dispatch(ev,arg={}){ (this.listeners[ev]||[]).forEach(fn=>fn({target:this,stopPropagation(){},preventDefault(){},...arg})); }
  querySelector(){ return null; }
  querySelectorAll(sel){ const cls=sel.replace(/^\./,""); const res=[]; const walk=n=>{ if(n._classes&&n._classes.has(cls)) res.push(n); (n.children||[]).forEach(walk); }; this.children.forEach(walk); return res; }
  click(){ this.dispatch("click"); }
  focus(){}
}
class TextNode{ constructor(t){ this.nodeType=3; this.data=String(t); this.textContent=String(t); } }
const bodyEl=new El("body");
globalThis.document={ createElement:t=>new El(t), createTextNode:t=>new TextNode(t), getElementById:id=>id==="app"?appEl:null, addEventListener(){}, removeEventListener(){}, querySelector(){return null;}, body:bodyEl };
const appEl=new El("div"); appEl.attributes.id="app";
globalThis.window=globalThis;
globalThis.FileReader=class{};
globalThis.Blob=class{ constructor(p){ this.parts=p; } };
globalThis.URL={ createObjectURL:()=>"blob:x", revokeObjectURL(){} };

function findModal(){ return bodyEl.querySelectorAll(".modal-overlay")[0]; }
function deep(node, cls){ const r=[]; const walk=n=>{ if(n._classes&&n._classes.has(cls)) r.push(n); (n.children||[]).forEach(walk); }; walk(node); return r; }

const results=[];
const check=(n,c,e="")=>results.push({n,ok:!!c,e});

const { openEntryModal } = await import("./src/entryModal.js");
const store = await import("./src/store.js");

// Modal öffnen
openEntryModal();
let modal = findModal();
check("Eintrags-Modal öffnet", !!modal);
check("Modal hat Typ-Toggle (Lernblock/Termin)", deep(modal, "type-opt").length === 2);
check("Modal hat Farbauswahl", deep(modal, "swatch").length >= 8);
check("Modal hat Prioritäts-Segmente", deep(modal, "segmented").length === 1);

// Speichern-Button finden und klicken
const before = store.getState().entries.length;
const buttons = deep(modal, "btn-primary");
buttons[buttons.length-1].click();
check("Eintrag gespeichert (Modal)", store.getState().entries.length === before + 1);

// Export erzeugt Blob ohne Fehler
let exportOk = true;
try { store.exportJSON(); } catch(e){ exportOk = false; }
check("Export ohne Fehler", exportOk);

// Reset
store.resetAll();
check("Reset leert Einträge", store.getState().entries.length === 0);
check("Reset setzt Default-Settings (Arbeitszeit Di-Do)", JSON.stringify(store.getState().settings.work.days)==="[2,3,4]");

let fails=0;
for(const r of results){ if(!r.ok) fails++; console.log(`${r.ok?"✓":"✗ FAIL"}  ${r.n}${r.e?"  ["+r.e+"]":""}`); }
console.log(`\n${results.length-fails}/${results.length} Checks bestanden`);
process.exit(fails?1:0);
