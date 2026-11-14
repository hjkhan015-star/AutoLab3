#!/usr/bin/env node
// tools/import-module.mjs — replace a module with an updated page in the OLD single-file shape (inline <script type="module">, flat paths).
//
//   node tools/import-module.mjs <page.html> [--id <module-id>] [--dry-run]
//
// It splits the page into app/modules/<system>--<id>.html + .js (the module is found by file name; --id overrides),
// rewrites paths (app.css / controls.css / components.css / guard.js / ./kit.js / ./components.js … → ../core/…, ./model-*.js / ./part-*.js → ../shared/…),
// swaps the import map for the stamped snippet, keeps the header card, then runs tools/sync.mjs.
// It never touches the registry: id, files and contract stay as they are (docs/UPDATING.md, "Replace a module").
// Afterwards, by hand: bump moduleVersion in the registry, one line in CHANGELOG.md, `npm test`.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname), APP = path.join(ROOT, 'app');
const die = (m) => { console.error('import-module: ' + m); process.exit(1); };
const args = process.argv.slice(2), opt = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : null);
const src = args.find((a, i) => !a.startsWith('--') && !['--id'].includes(args[i - 1]));
if (!src) die('usage: node tools/import-module.mjs <page.html> [--id <module-id>] [--dry-run]');
if (!fs.existsSync(src)) die(`no such file: ${src}`);

/* old file names that were registered under a different id (the same four the tests know) */
const ALIAS = { 'crankshaft-piston': 'crankpiston', turbocharger: 'turbo', 'abs-esc': 'absesc', 'starting-system': 'starting' };
const stem = path.basename(src).replace(/\.html$/, '');
const id = opt('--id') || ALIAS[stem] || stem;
const { MODULES } = await import(pathToFileURL(path.join(APP, 'core/registry.js')).href + '?t=' + Date.now());
const m = MODULES.find((x) => x.id === id);
if (!m) die(`no module "${id}" in the registry (page name "${stem}"). Pass --id <module-id>; new modules are created with tools/new-module.mjs`);
const base = path.basename(m.file, '.html'), htmlOut = path.join(APP, 'modules', base + '.html'), jsOut = path.join(APP, 'modules', base + '.js');

const core = new Set(fs.readdirSync(path.join(APP, 'core')).filter((f) => /\.(js|css)$/.test(f)));
const shared = new Set(fs.readdirSync(path.join(APP, 'shared')).filter((f) => f.endsWith('.js')));
const where = (f) => (core.has(f) ? '../core/' + f : shared.has(f) ? '../shared/' + f : null);

let html = fs.readFileSync(src, 'utf8');
const scripts = [...html.matchAll(/<script type="module">\n?([\s\S]*?)<\/script>/g)];
if (!scripts.length) die('no inline <script type="module"> found — is this already a split page?');
const main = scripts[scripts.length - 1];
let js = main[1];
const unknown = [];
js = js.replace(/(from\s+|import\s*\()(['"])((?:\.\.?\/)[^'"]+)\2/g, (all, pre, q, spec) => {
  const f = spec.replace(/^\.\.?\//, '');
  const to = where(path.basename(f));
  if (!to) { unknown.push(spec); return all; }
  return `${pre}${q}${to}${q}`;
});
if (unknown.length) die('relative import(s) that match no file in core/ or shared/: ' + [...new Set(unknown)].join(', '));

html = html.replace(main[0], `<script type="module" src="${base}.js"></script>\n`);
html = html.replace(/(href|src)="(?:\.\/)?([\w.-]+\.(?:css|js))"/g, (all, attr, f) => (core.has(f) ? `${attr}="../core/${f}"` : all));
html = html.replace(/<script type="importmap">[\s\S]*?<\/script>/, '<!--importmap:begin-->\n<script type="importmap">\n{ "imports": {} }\n</script>\n<!--importmap:end-->');
if (!/<!--importmap:begin-->/.test(html) && !/data-no3d/.test(html)) console.warn('import-module: warning — no import map in the page (a 3D page needs one)');

const card = (fs.existsSync(jsOut) ? fs.readFileSync(jsOut, 'utf8').match(/\/\* @card:begin[\s\S]*?@card:end \*\/\n?/) : null)?.[0] || '';
if (args.includes('--dry-run')) { console.log(`would replace ${path.relative(ROOT, htmlOut)} (${html.length} bytes) and ${path.relative(ROOT, jsOut)} (${js.length} bytes) for module "${id}"`); process.exit(0); }
fs.writeFileSync(htmlOut, html);
fs.writeFileSync(jsOut, card + js.replace(/^\n+/, '').replace(/\s+$/, '') + '\n');
const r = spawnSync(process.execPath, [path.join(ROOT, 'tools/sync.mjs')], { stdio: 'inherit' });
if (r.status) die('sync failed');
console.log(`\nreplaced ${base}. Now: bump moduleVersion for "${id}" in app/core/registry.js, add a line to CHANGELOG.md, run npm test.`);
