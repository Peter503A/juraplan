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

const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
<meta name="theme-color" content="#7c6ff0" />
<title>StudyFlow – Lernplaner Online Marketing & E-Commerce</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='22' fill='%237c6ff0'/><text x='50' y='70' font-size='60' text-anchor='middle' fill='white'>%E2%9C%A6</text></svg>" />
<style>
${css}
</style>
</head>
<body>
<div id="app"></div>
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
