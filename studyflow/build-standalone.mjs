/* Baut eine einzige, eigenständige HTML-Datei (studyflow.html),
   die OHNE Server und OHNE Internet durch Doppelklick im Browser läuft.

   Umsetzung: Ein winziges CommonJS-artiges Modulsystem im Browser.
   Jede Quelldatei wird zu einem Modul-Wrapper (function(require, module, exports){...}).
   import/export werden in require(...) / module.exports umgeschrieben.
   So bleibt die Modul-Isolation erhalten (keine Variablen-Kollisionen). */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname, join, normalize } from "node:path";

const ROOT = resolve(".");

const files = [
  "data/moduleCatalog.js",
  "src/utils.js",
  "src/store.js",
  "src/dom.js",
  "src/modules.js",
  "src/entryModal.js",
  "src/views/calendar.js",
  "src/views/modules.js",
  "src/views/review.js",
  "src/views/settings.js",
  "src/app.js",
  "src/main.js",
];

// Normalisiert einen Importpfad relativ zur aktuellen Datei auf einen Modulschlüssel.
function resolveKey(fromFile, spec) {
  const dir = dirname(fromFile);
  let p = normalize(join(dir, spec)).replace(/\\/g, "/");
  if (!p.endsWith(".js")) p += ".js";
  return p;
}

function transform(fromFile, code) {
  const out = [];

  // 1) named imports:  import { a, b as c } from "x"
  code = code.replace(
    /import\s*\{([^}]*)\}\s*from\s*["']([^"']+)["']\s*;?/g,
    (_, names, spec) => {
      const key = resolveKey(fromFile, spec);
      const parts = names.split(",").map((s) => s.trim()).filter(Boolean).map((n) => {
        const m = n.match(/^(\S+)\s+as\s+(\S+)$/);
        return m ? `${m[1]}: ${m[2]}` : n;
      });
      return `const { ${parts.join(", ")} } = require(${JSON.stringify(key)});`;
    }
  );

  // 2) namespace import:  import * as ns from "x"
  code = code.replace(
    /import\s*\*\s*as\s*(\w+)\s*from\s*["']([^"']+)["']\s*;?/g,
    (_, ns, spec) => `const ${ns} = require(${JSON.stringify(resolveKey(fromFile, spec))});`
  );

  // 3) default import (hier nicht genutzt, aber sicherheitshalber)
  code = code.replace(
    /import\s+(\w+)\s+from\s*["']([^"']+)["']\s*;?/g,
    (_, name, spec) => `const ${name} = require(${JSON.stringify(resolveKey(fromFile, spec))}).default;`
  );

  // 4) export const/let/var/function/class  -> Deklaration + exports.x = x
  const exported = [];
  code = code.replace(
    /export\s+(const|let|var)\s+([A-Za-z0-9_$]+)/g,
    (_, kw, name) => { exported.push(name); return `${kw} ${name}`; }
  );
  code = code.replace(
    /export\s+(async\s+)?function\s+([A-Za-z0-9_$]+)/g,
    (_, asyncKw, name) => { exported.push(name); return `${asyncKw || ""}function ${name}`; }
  );
  code = code.replace(
    /export\s+class\s+([A-Za-z0-9_$]+)/g,
    (_, name) => { exported.push(name); return `class ${name}`; }
  );

  // 5) export { a, b as c };
  code = code.replace(/export\s*\{([^}]*)\}\s*;?/g, (_, names) => {
    names.split(",").map((s) => s.trim()).filter(Boolean).forEach((n) => {
      const m = n.match(/^(\S+)\s+as\s+(\S+)$/);
      if (m) exported.push(`${m[2]}=${m[1]}`);
      else exported.push(n);
    });
    return "";
  });

  out.push(code);
  // exports anhängen
  const expLines = exported.map((e) => {
    if (e.includes("=")) { const [alias, local] = e.split("="); return `exports.${alias} = ${local};`; }
    return `exports.${e} = ${e};`;
  });
  out.push("\n" + expLines.join("\n"));
  return out.join("\n");
}

const moduleDefs = files.map((rel) => {
  const abs = resolve(ROOT, rel);
  const key = rel.replace(/\\/g, "/");
  const code = transform(key, readFileSync(abs, "utf8"));
  return `__modules[${JSON.stringify(key)}] = function(require, module, exports){\n${code}\n};`;
});

const runtime = `
var __modules = {};
var __cache = {};
function require(key){
  if (__cache[key]) return __cache[key].exports;
  var m = { exports: {} };
  __cache[key] = m;
  var fn = __modules[key];
  if (!fn) throw new Error("Modul nicht gefunden: " + key);
  fn(require, m, m.exports);
  return m.exports;
}
`;

const css = readFileSync(resolve(ROOT, "styles.css"), "utf8");

const bootstrap = `require("src/main.js");`;

// Icon + Manifest als Data-URLs einbetten, damit die EINZELNE Datei
// ebenfalls ein App-Icon hat und (wo möglich) installierbar ist.
const iconSvg = readFileSync(resolve(ROOT, "icons/icon.svg"), "utf8");
const iconSvgUrl = "data:image/svg+xml;base64," + Buffer.from(iconSvg).toString("base64");
const icon512 = "data:image/png;base64," + readFileSync(resolve(ROOT, "icons/icon-512.png")).toString("base64");
const icon192 = "data:image/png;base64," + readFileSync(resolve(ROOT, "icons/icon-192.png")).toString("base64");
const icon180 = "data:image/png;base64," + readFileSync(resolve(ROOT, "icons/icon-180.png")).toString("base64");
const iconMaskable = "data:image/png;base64," + readFileSync(resolve(ROOT, "icons/icon-maskable-512.png")).toString("base64");

const manifest = {
  name: "StudyFlow – Online Marketing & E-Commerce",
  short_name: "StudyFlow",
  description: "Dein Lernplaner für das Fernstudium Online Marketing & E-Commerce. Alle Daten bleiben lokal auf dem Gerät.",
  start_url: ".",
  scope: ".",
  display: "standalone",
  orientation: "any",
  background_color: "#f4f5f8",
  theme_color: "#7c6ff0",
  lang: "de",
  categories: ["productivity", "education"],
  icons: [
    { src: icon192, sizes: "192x192", type: "image/png", purpose: "any" },
    { src: icon512, sizes: "512x512", type: "image/png", purpose: "any" },
    { src: iconMaskable, sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
};
const manifestUrl = "data:application/manifest+json;base64," + Buffer.from(JSON.stringify(manifest)).toString("base64");

const pwaScript = `
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  // Inline Service Worker als Blob (nur über http(s) nutzbar)
  try {
    var swCode = 'self.addEventListener("install",e=>self.skipWaiting());self.addEventListener("activate",e=>self.clients.claim());self.addEventListener("fetch",function(){});';
    var swUrl = URL.createObjectURL(new Blob([swCode], { type: "text/javascript" }));
    navigator.serviceWorker.register(swUrl).catch(function(){});
  } catch(e){}
}
window.addEventListener("beforeinstallprompt", function(e){ e.preventDefault(); window.__deferredInstallPrompt = e; window.dispatchEvent(new CustomEvent("sf-installable")); });
window.addEventListener("appinstalled", function(){ window.__deferredInstallPrompt = null; window.dispatchEvent(new CustomEvent("sf-installed")); });
`;

const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover" />
<meta name="theme-color" content="#7c6ff0" />
<meta name="description" content="StudyFlow – Lernplaner für Online Marketing & E-Commerce. Läuft offline, speichert lokal." />
<title>StudyFlow – Lernplaner Online Marketing & E-Commerce</title>
<link rel="manifest" href="${manifestUrl}" />
<link rel="icon" href="${iconSvgUrl}" type="image/svg+xml" />
<link rel="apple-touch-icon" href="${icon180}" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-title" content="StudyFlow" />
<meta name="mobile-web-app-capable" content="yes" />
<style>
${css}
</style>
</head>
<body>
<div id="app"></div>
<script>
${pwaScript}
</script>
<script>
"use strict";
(function(){
${runtime}
${moduleDefs.join("\n")}
${bootstrap}
})();
</script>
</body>
</html>
`;

writeFileSync(resolve(ROOT, "studyflow.html"), html, "utf8");
console.log("studyflow.html erzeugt (" + (html.length / 1024).toFixed(1) + " KB)");
