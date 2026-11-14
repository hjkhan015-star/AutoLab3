#!/usr/bin/env node
// tools/sync.mjs — regenerate everything that is derived, from ONE source of truth each:
//   version        package.json  → app/sw.js (cache name), core headers, README
//   import map     one snippet   → every module page (CDN until app/assets/three.module.js exists, then local)
//   precache       app/ file list → app/sw.js CORE_ASSETS
//   header cards   registry + code → top of every modules/*.js
//   module map     registry + cards → docs/MODULE-MAP.md
//   monitor map    static scan of every page → docs/MONITOR-MAP.md
//   QA matrix      rows of docs/QA.md follow the registry (manual cells kept)
//   counts         registry      → README.md
//   CSP            _headers      (drops the CDN host once three.js is vendored; script-src = 'self' + hashes of every inline script)
// Usage:  node tools/sync.mjs          write changes
//         node tools/sync.mjs --check  write nothing, exit 1 and name every stale file
import fs from 'node:fs'; import crypto from 'node:crypto'; import path from 'node:path'; import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const APP = path.join(ROOT, 'app');
const CHECK = process.argv.includes('--check');
const stale = [];
const rd = (f) => fs.readFileSync(f, 'utf8');
function put(file, text) {
  const old = fs.existsSync(file) ? rd(file) : null;
  if (old === text) return;
  stale.push(path.relative(ROOT, file));
  if (!CHECK) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); }
}
const between = (text, a, b, body) => {
  const i = text.indexOf(a), j = text.indexOf(b);
  if (i < 0 || j < i) throw new Error(`markers ${a} … ${b} missing`);
  return text.slice(0, i + a.length) + body + text.slice(j);
};

const pkg = JSON.parse(rd(path.join(ROOT, 'package.json')));
const VERSION = pkg.version;
const reg = await import(pathToFileURL(path.join(APP, 'core/registry.js')).href);
const vendored = fs.existsSync(path.join(APP, 'assets/three.module.js'));

/* ── file lists ── */
const walk = (d, out = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? walk(p, out) : out.push(p); } return out; };
const appFiles = walk(APP).map((p) => path.relative(APP, p).split(path.sep).join('/')).sort();

/* ── import map (the ONE snippet) ── */
const ADDONS = { 'controls/OrbitControls.js': 'orbit-controls.js', 'environments/RoomEnvironment.js': 'room-environment.js' };   /* import specifier → vendored file (lower-case names: portable) */
const importMap = vendored
  ? `<!--importmap:begin-->\n<script type="importmap">\n{ "imports": {\n  "three": "../assets/three.module.js",\n${Object.entries(ADDONS).map(([k, v]) => `  "three/addons/${k}": "../assets/${v}"`).join(',\n')}\n} }\n</script>\n<!--importmap:end-->`
  : `<!--importmap:begin-->\n<script type="importmap">\n{ "imports": {\n  "three": "https://unpkg.com/three@0.160.0/build/three.module.js",\n  "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"\n} }\n</script>\n<!--importmap:end-->`;
/* three.js warm-up for the first module open. NOT static <link rel="modulepreload"> tags in <head>: measured on a slow-4G / 4x CPU profile they
   delayed the shell's first paint by ~1.2 s and the home cards by ~1.5 s (1.3 MB of three.js ahead of the shell's own files), while a deferred
   start gives the same module-open time for anyone who browses for a few seconds. So: add the tags once the page has loaded and is idle
   (4 s timeout), and not at all on Save-Data or a 2G connection. */
const WARM = ['build/three.module.js', 'examples/jsm/controls/OrbitControls.js', 'examples/jsm/environments/RoomEnvironment.js'];
const warmScript = (urls, cors) => `<script>/* warm three.js after the shell has painted (see tools/sync.mjs) */\n(function(){var c=navigator.connection;if(c&&(c.saveData||/(^|-)2g$/.test(c.effectiveType||'')))return;addEventListener('load',function(){(window.requestIdleCallback||setTimeout)(function(){${JSON.stringify(urls)}.forEach(function(u){var l=document.createElement('link');l.rel='modulepreload';l.href=u;${cors ? "l.crossOrigin='';" : ''}document.head.appendChild(l)})},{timeout:4000})})})();\n</script>`;
const preload = vendored
  ? `<!--three-preload:begin-->\n${warmScript(['assets/three.module.js', 'assets/orbit-controls.js', 'assets/room-environment.js'], false)}\n<!--three-preload:end-->`
  : `<!--three-preload:begin-->\n<link rel="preconnect" href="https://unpkg.com" crossorigin>\n<link rel="dns-prefetch" href="https://unpkg.com">\n${warmScript(WARM.map((x) => 'https://unpkg.com/three@0.160.0/' + x), true)}\n<!--three-preload:end-->`;

for (const f of appFiles.filter((x) => x.startsWith('modules/') && x.endsWith('.html'))) {
  const p = path.join(APP, f); let s = rd(p);
  if (/<html[^>]*data-no3d/.test(s) && !s.includes('<!--importmap:begin-->')) continue;   /* 2D page: no three.js */
  const m = s.match(/<!--importmap:begin-->[\s\S]*?<!--importmap:end-->/);
  if (!m) throw new Error(f + ': import-map markers missing');
  put(p, s.replace(m[0], importMap));
}
{ const p = path.join(APP, 'index.html'); const s = rd(p); const m = s.match(/<!--three-preload:begin-->[\s\S]*?<!--three-preload:end-->/); put(p, s.replace(m[0], preload)); }

/* ── service worker ── */
{
  const p = path.join(APP, 'sw.js'); let s = rd(p);
  s = s.replace(/const VERSION = '[^']*'; \/\* @version \*\//, `const VERSION = 'autolab3-v${VERSION}'; /* @version */`);
  const list = ['./', ...appFiles.filter((f) => !['sw.js', '_headers', 'robots.txt'].includes(f)).map((f) => './' + f)];
  s = between(s, '/* @precache:begin */\n', '/* @precache:end */', `const CORE_ASSETS = [\n${list.map((u) => `  '${u}'`).join(',\n')}\n];\n`);
  if (vendored) s = s.replace(/  \/\* @cdn:begin \*\/[\s\S]*?  \/\* @cdn:end \*\/\n/, '  /* @cdn:begin */\n  /* @cdn:end */\n');
  put(p, s);
}
/* ── CSP ── script-src is 'self' + the SHA-256 of every inline script (B-011): no 'unsafe-inline', so an injected inline script does not run.
   The hashes are computed from the files, so editing an inline script only needs `npm run sync`. Two sources:
   (1) every <script> without src in every html file under app/ (the shell's three, the import map shared by the module pages);
   (2) the perf-guard controller, which the shell injects into each module iframe as text — built exactly as index.html builds it
       ('(' + perfController.toString() + ')();'), and Function.prototype.toString returns the source text unchanged. */
const sha = (text) => `'sha256-${crypto.createHash('sha256').update(text, 'utf8').digest('base64')}'`;
const inlineHashes = new Set();
for (const f of appFiles.filter((x) => x.endsWith('.html'))) {
  for (const m of rd(path.join(APP, f)).matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)) {
    const type = (m[1].match(/\btype\s*=\s*["']([^"']*)["']/) || [])[1];
    if (!m[2].trim() || (type && !/^(module|importmap|text\/javascript)$/i.test(type))) continue;   /* empty or a data block (not executed) */
    inlineHashes.add(sha(m[2]));
  }
}
{ const idx = rd(path.join(APP, 'index.html')), i = idx.indexOf('function perfController()'), j = idx.indexOf('\n  var CONTROLLER =');
  if (i < 0 || j < i) throw new Error('index.html: perfController / CONTROLLER markers missing (CSP hash)');
  inlineHashes.add(sha('(' + idx.slice(i, j).trimEnd() + ')();')); }
{ const p = path.join(APP, '_headers'); let s = rd(p); if (vendored) s = s.replace(/ https:\/\/unpkg\.com/g, '');
  s = s.replace(/script-src [^;]*;/, `script-src 'self' ${[...inlineHashes].sort().join(' ')};`); put(p, s); }

/* ── version stamps in core headers ── */
for (const f of ['core/components.js', 'core/components.css']) {
  const p = path.join(APP, f); put(p, rd(p).replace(/\(v\d+\.\d+\.\d+\)/, `(v${VERSION})`));
}

/* ── version stamps in docs ── */
for (const f of ['docs/GUIDE.md', 'docs/COMPONENTS.md']) {
  const p = path.join(ROOT, f); if (fs.existsSync(p)) put(p, rd(p).replace(/^# Auto Lab v[\d.]+/m, `# Auto Lab v${VERSION}`));
}
{ const p = path.join(ROOT, 'README.md'); if (fs.existsSync(p)) put(p, rd(p).replace(/^# AutoLab3 \(Auto Lab v[\d.]+\)/m, `# AutoLab3 (Auto Lab v${VERSION})`)); }

/* ── module data ── */
const all = [];
for (const s of reg.SYSTEMS) for (const m of s.modules) all.push({ ...m, system: s.id });
for (const m of reg.SUBMODULES) all.push({ ...m });
const stage = {}; for (const st of reg.ROADMAP) for (const id of st.ids) stage[id] = st.id;

/* ── header cards ── */
const importsOf = (js) => [...new Set([...js.matchAll(/\bfrom\s*['"](\.{1,2}\/[^'"]+)['"]/g)].map((m) => path.posix.normalize(m[1]).replace(/^\.\.\//, '')))].sort();
const storageOf = (js) => [...new Set([...js.matchAll(/(?:local|session)Storage\.(?:get|set|remove)Item\(\s*['"`]([^'"`$]+)/g)].map((m) => m[1]).concat([...js.matchAll(/['"`](autolab\.[A-Za-z0-9_.:-]+)/g)].map((m) => m[1])))].sort();
const info = {};
for (const m of all) {
  const base = path.basename(m.file, '.html');
  const jsPath = path.join(APP, 'modules', base + '.js');
  let js = rd(jsPath);
  const body = js.replace(/\/\* @card:begin[\s\S]*?@card:end \*\/\n?/, '');
  const shared = importsOf(body).filter((x) => /^(core|shared)\//.test(x) || /^\.\.\/(core|shared)\//.test(x));
  const sharedClean = shared.map((x) => x.replace(/^\.\.\//, '')).sort();
  const storage = storageOf(body);
  const testFile = fs.existsSync(path.join(ROOT, `tests/mod-${m.id}.test.mjs`)) ? `tests/mod-${m.id}.test.mjs` : 'repo-wide rule tests';
  const card = `/* @card:begin\n   id: ${m.id}   system: ${m.system}   type: ${m.type}   version: ${m.moduleVersion}   status: ${m.status}\n   files: ${base}.html + ${base}.js\n   parent: ${m.parent || '—'}   children: ${(m.children || []).join(', ') || '—'}\n   shared: ${sharedClean.join(', ') || '—'}\n   storage: ${storage.join(', ') || '—'}\n   test: ${testFile}\n   (generated by tools/sync.mjs — edit the registry or the code, not this block)\n   @card:end */\n`;
  const next = /\/\* @card:begin[\s\S]*?@card:end \*\/\n?/.test(js) ? js.replace(/\/\* @card:begin[\s\S]*?@card:end \*\/\n?/, card) : card + js;
  put(jsPath, next);
  info[m.id] = { m, base, shared: sharedClean, storage, testFile, kb: Math.round((fs.statSync(path.join(APP, 'modules', base + '.html')).size + fs.statSync(jsPath).size) / 1024) };
}

/* ── MODULE-MAP.md ── */
{
  const rows = all.map((m) => { const i = info[m.id]; return `| ${m.id} | ${m.system} | \`modules/${i.base}.html\` | ${m.type} | ${m.moduleVersion} | ${m.status} | ${m.parent || (m.children || []).join(', ') || '—'} | ${stage[m.id] || '—'} | ${i.shared.join(', ') || '—'} | ${i.storage.join(', ') || '—'} | ${i.testFile === 'repo-wide rule tests' ? 'rules' : i.testFile} | ${i.kb} |`; });
  const users = {}; for (const m of all) for (const s of info[m.id].shared) (users[s] ||= []).push(m.id);
  const sharedRows = Object.entries(users).sort().map(([f, u]) => `| \`${f}\` | ${u.length} | ${u.join(', ')} |`);
  const text = `# MODULE-MAP\n\n> Generated by \`node tools/sync.mjs\` — do not edit. v${VERSION}: ${reg.MODULES.length} modules in ${reg.SYSTEMS.length} systems, ${reg.SUBMODULES.length} sub-modules, ${reg.ROADMAP.length} roadmap stages.\n\n## Modules\n| id | system | file | type | version | status | parent / children | roadmap stage | shared / core files used | storage keys | test | KB (html+js) |\n|---|---|---|---|---|---|---|---|---|---|---|---|\n${rows.join('\n')}\n\n## Who uses which shared / core file\nChange one of these → check every module listed.\n\n| file (under app/) | users | modules |\n|---|---|---|\n${sharedRows.join('\n')}\n`;
  put(path.join(ROOT, 'docs/MODULE-MAP.md'), text);
}

/* ── MONITOR-MAP.md (static scan: where each module prints its numbers) ── */
{
  const idsOf = (txt) => [...txt.matchAll(/\[\s*["']([\w-]+)["']\s*,/g)].map((m) => m[1]);
  const rowsOf = (js) => {
    const ro = js.match(/"ro"\s*:\s*(\[\[[^\n]*?\]\])\s*,\s*"/);                      /* guided CFG: ro = every Monitor row */
    if (ro) return idsOf(ro[1]);
    const r = js.match(/\brows\s*:\s*(\[\s*\[[\s\S]*?\]\s*\])\s*[,}\n]/);              /* custom: monitor config rows */
    return r ? idsOf(r[1]) : null;
  };
  const rows = all.map((m) => {
    const i = info[m.id], js = rd(path.join(APP, 'modules', i.base + '.js')).replace(/\/\* @card:begin[\s\S]*?@card:end \*\//, '');
    const guided = /runGuidedModule\(/.test(js);
    const head = (js.match(/"chipLabel"\s*:\s*"([^"]+)"/) || js.match(/value\s*:\s*\{\s*label\s*:\s*['"]([^'"]+)['"]/) || [])[1] || '—';
    const ids = rowsOf(js);
    const traces = /"traces"\s*:|traces\s*:\s*\[\s*\{/.test(js) ? 'yes' : '—';
    const legend = /"legend"\s*:|footer\s*:/.test(js) ? 'yes' : '—';
    const panel = /\n\s*readout\s*:\s*`/.test(js) ? 'text only' : 'none';
    return `| ${m.id} | ${guided ? 'guided' : 'custom'} | ${head} | ${ids ? (ids.join(', ') || '—') : 'see code'} | ${traces} | ${legend} | ${panel} |`;
  });
  put(path.join(ROOT, 'docs/MONITOR-MAP.md'), `# MONITOR-MAP\n\n> Generated by \`node tools/sync.mjs\` — do not edit. Static scan of every module page: where its numbers are printed.\n> Rule R2: numbers live in the Monitor (headline value + rows + traces + legend footer); the info panel keeps text only. A \`panel readout\` slot, where present, holds text only (tests check it).\n> \`see code\` = the rows are built at run time (per-mode configs); read the module's \`monConfig\` / \`UI.create\`.\n\n| module | kind | headline value | Monitor rows (ids) | traces | legend footer | panel readout |\n|---|---|---|---|---|---|---|\n${rows.join('\n')}\n`);
}

/* ── QA.md: one row per module page in every viewport table — rows added / renamed / dropped to match the registry; every manual cell is kept ── */
{
  const QA_ALIAS = { 'crankshaft-piston': 'crankpiston', turbocharger: 'turbo', 'abs-esc': 'absesc', 'starting-system': 'starting' };   /* names the matrix used before the registry ids settled */
  const f = path.join(ROOT, 'docs/QA.md');
  if (fs.existsSync(f)) {
    const ids = all.map((m) => m.id), pkgVersion = JSON.parse(rd(path.join(ROOT, 'package.json'))).version;
    const lines = rd(f).split('\n'), out = [];
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (/^# QA matrix/.test(l)) { out.push(`# QA matrix — Auto Lab v${pkgVersion}`); continue; }
      if (/^\d+ module pages \(/.test(l)) { out.push(`${ids.length} module pages (the registry in \`app/core/registry.js\`, sub-modules included; the repo also has \`index.html\` and \`404.html\`, ${ids.length + 2} pages in all) × 4 viewports × 2 modes.`); continue; }
      out.push(l);
      if (/^\| module \| header 32 px/.test(l) && /^\|---/.test(lines[i + 1] || '')) {          /* a viewport table: rewrite its body */
        out.push(lines[i + 1]); i += 2;
        const old = new Map(); let template = null;
        for (; i < lines.length && /^\| /.test(lines[i]); i++) {
          const cells = lines[i].split('|').slice(1, -1).map((c) => c.trim()), id = QA_ALIAS[cells[0]] || cells[0];
          old.set(id, cells); if (!template) template = cells;
        }
        i--;
        for (const id of ids) {
          let cells = old.get(id);
          if (!cells) cells = [id, ...template.slice(1).map((c) => (c === 'auto' || c === 'n/a' ? c : '☐'))];     /* a new page: automatic cells as in the others, manual cells open */
          out.push('| ' + [id, ...cells.slice(1)].join(' | ') + ' |');
        }
      }
    }
    put(f, out.join('\n'));
  }
}

/* ── README counts ── */
{
  const p = path.join(ROOT, 'README.md');
  if (fs.existsSync(p)) {
    let s = rd(p);
    if (s.includes('<!--counts:begin-->')) s = between(s, '<!--counts:begin-->', '<!--counts:end-->', `\n**v${VERSION}** — ${reg.MODULES.length} modules (+ ${reg.SUBMODULES.length} sub-pages) in ${reg.SYSTEMS.length} systems and ${reg.DOMAINS.length} domains, ${reg.ROADMAP.length}-stage roadmap.\n`);
    put(p, s);
  }
}

if (CHECK) {
  if (stale.length) { console.error('sync: STALE (run `npm run sync`):\n  ' + stale.join('\n  ')); process.exit(1); }
  console.log('sync: everything is up to date');
} else console.log(`sync: ${stale.length} file(s) updated (v${VERSION}, ${vendored ? 'three.js vendored' : 'three.js from CDN'})`);
