// node tests/repo.test.mjs — whole-repo rules (the old check.mjs, reshaped for the flat layout).
// Each rule reports ONE line when clean, and ONE FAIL line per offending file/item otherwise.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { t, finish, ROOT, APP, rd, modulePages, shellPages, jsFiles, cssFiles, listDir, stripCard } from './_lib.mjs';
import { SYSTEMS, SUBMODULES, ROADMAP } from '../app/core/registry.js';

const read = (p) => fs.readFileSync(p, 'utf8');
const problems = new Map();                                  /* rule → [[item, message]] */
const fail = (rule, item, msg) => { if (!problems.has(rule)) problems.set(rule, []); problems.get(rule).push([item, msg]); };
const RULES = [];
const rule = (name, fn) => { RULES.push(name); fn(name); };
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');

const sw = rd('sw.js');
const testSources = fs.readdirSync(path.join(ROOT, 'tests')).filter((f) => f.endsWith('.test.mjs')).map((f) => read(path.join(ROOT, 'tests', f)));
const tmp = fs.mkdtempSync(path.join(tmpdir(), 'al-'));
const pkg = JSON.parse(read(path.join(ROOT, 'package.json')));
const mods = [...SYSTEMS.flatMap((s) => s.modules.map((m) => ({ ...m, system: s.id }))), ...SUBMODULES];
const htmlAll = shellPages();

rule('page basics: viewport, zoom allowed, guard.js on 3D pages, referenced files exist', (r) => {
  for (const f of htmlAll) {
    const dir = f === 'index.html' || f === '404.html' ? APP : path.join(APP, 'modules');
    const s = read(path.join(dir, f));
    if (!/name="viewport"/.test(s)) fail(r, f, 'no viewport');
    if (/user-scalable=no|maximum-scale=1/.test(s)) fail(r, f, 'blocks zoom');
    if (f !== 'index.html' && f !== '404.html' && /type="importmap"/.test(s) && !/guard\.js/.test(s)) fail(r, f, 'missing guard.js');
    for (const m of s.matchAll(/(?:src|href)="(?!https?:|#|data:|mailto:)([^"?#]+)"/g)) if (!fs.existsSync(path.join(dir, m[1]))) fail(r, f, 'missing ' + m[1]);
  }
});
rule('syntax: every shipped .js parses, every inline module script parses', (r) => {
  for (const f of jsFiles().filter((x) => x !== 'sw.js')) {
    const p = path.join(tmp, f.replace(/\//g, '__') + '.mjs'); fs.writeFileSync(p, read(path.join(APP, f)));
    try { execFileSync('node', ['--check', p], { stdio: 'pipe' }); } catch (_) { fail(r, f, 'syntax error'); }
  }
  for (const f of ['sw.js']) { try { execFileSync('node', ['--check', path.join(APP, f)], { stdio: 'pipe' }); } catch (_) { fail(r, f, 'syntax error'); } }
  for (const f of htmlAll) {
    const s = read(path.join(f === 'index.html' || f === '404.html' ? APP : path.join(APP, 'modules'), f));
    [...s.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)].forEach((m, i) => {
      const p = path.join(tmp, `${f}.${i}.mjs`); fs.writeFileSync(p, m[1]);
      try { execFileSync('node', ['--check', p], { stdio: 'pipe' }); } catch (_) { fail(r, f, `syntax error in inline module script ${i}`); }
    });
  }
  try { JSON.parse(rd('manifest.webmanifest')); } catch (_) { fail(r, 'manifest.webmanifest', 'not JSON'); }
});
rule('registry: every file exists, ids unique, file names are <system>--<id>.html, every modules/*.html is registered', (r) => {
  const ids = mods.map((m) => m.id);
  if (new Set(ids).size !== ids.length) fail(r, 'registry', 'duplicate module ids');
  for (const m of mods) {
    if (!fs.existsSync(path.join(APP, m.file))) fail(r, m.id, 'missing ' + m.file);
    if (m.file !== `modules/${m.system}--${m.id}.html`) fail(r, m.id, `file should be modules/${m.system}--${m.id}.html, is ${m.file}`);
    if (!fs.existsSync(path.join(APP, m.file.replace(/\.html$/, '.js')))) fail(r, m.id, 'no matching .js');
    if (!/^\d+\.\d+\.\d+$/.test(m.moduleVersion || '')) fail(r, m.id, 'moduleVersion is not SemVer');
    if (!['stable', 'draft', 'deprecated'].includes(m.status)) fail(r, m.id, 'status must be stable|draft|deprecated');
  }
  const files = new Set(mods.map((m) => path.basename(m.file)));
  for (const f of modulePages()) if (!files.has(f)) fail(r, f, 'in modules/ but not registered');
  for (const f of listDir('modules')) if (!/\.(html|js)$/.test(f)) fail(r, f, 'stray file in modules/');
  for (const m of mods.filter((x) => x.children)) for (const c of m.children) if (!SUBMODULES.find((s) => s.id === c && s.parent === m.id)) fail(r, m.id, `child ${c} not in SUBMODULES`);
});
rule('layout: ≤ 8 core JS files, shared/ files are part-*/model-*, every shared file has ≥ 2 users (a test that imports it counts)', (r) => {
  const core = listDir('core').filter((f) => f.endsWith('.js'));
  const coreAllowed = new Set(['kit.js', 'controls.js', 'dock.js', 'monitor.js', 'chrome.js', 'labels.js', 'components.js', 'guard.js', 'registry.js', 'roadmap.js', 'icons.js']);
  const engine = core.filter((f) => !['registry.js', 'roadmap.js', 'icons.js'].includes(f));
  if (engine.length > 8) fail(r, 'core/', `${engine.length} engine JS files (max 8): ${engine.join(', ')}`);
  for (const f of core) if (!coreAllowed.has(f)) fail(r, 'core/' + f, 'unexpected core file');
  const all = [...jsFiles().map((f) => [f, read(path.join(APP, f))]), ['index.html', read(path.join(APP, 'index.html'))]];   /* the shell's inline module script is a user too */
  for (const f of listDir('shared')) {
    if (!/^(part|model)-[a-z0-9-]+\.js$/.test(f)) { fail(r, 'shared/' + f, 'name must be part-*.js or model-*.js'); continue; }
    const re = new RegExp(`(?:from\\s+|import\\()['"][^'"]*/${f.replace('.', '\\.')}['"]`);
    const users = [...all.filter(([g, s]) => g !== 'shared/' + f && re.test(s)), ...testSources.filter((s) => re.test(s))];
    if (users.length < 2) fail(r, 'shared/' + f, `used by ${users.length} file(s) — shared files need ≥ 2 users (tests count)`);
  }
});
rule('imports resolve: every relative import points at an existing file that exports each imported name', (r) => {
  const exportsOf = (src) => {
    const out = new Set(); let star = false;
    for (const m of src.matchAll(/^export\s+(?:async\s+)?(?:function\*?|const|let|var|class)\s+([A-Za-z_$][\w$]*)/gm)) out.add(m[1]);
    for (const m of src.matchAll(/^export\s*\{([^}]*)\}/gm)) m[1].split(',').map((x) => x.trim()).filter(Boolean).forEach((x) => out.add(x.split(/\s+as\s+/).pop()));
    for (const m of src.matchAll(/^export\s+(?:const|let|var)\s+([^;\n]*(?:,\s*[A-Za-z_$][\w$]*\s*=[^;\n]*)+);/gm)) for (const d of m[1].matchAll(/(?:^|,\s*)([A-Za-z_$][\w$]*)\s*=/g)) out.add(d[1]);
    if (/^export\s*\*\s*from/m.test(src)) star = true;
    return { out, star };
  };
  for (const f of jsFiles().filter((x) => x !== 'sw.js')) {
    const src = stripCard(read(path.join(APP, f))), dir = path.dirname(path.join(APP, f));
    for (const m of src.matchAll(/^import\s+([\s\S]*?)\s+from\s+['"](\.{1,2}\/[^'"]+)['"]/gm)) {
      const target = path.join(dir, m[2]);
      if (!fs.existsSync(target)) { fail(r, f, `imports ${m[2]} which does not exist`); continue; }
      const named = m[1].match(/\{([\s\S]*)\}/); if (!named) continue;
      const ex = exportsOf(read(target)); if (ex.star) continue;
      for (const n of named[1].split(',').map((x) => x.trim().split(/\s+as\s+/)[0]).filter(Boolean)) if (!ex.out.has(n)) fail(r, f, `imports { ${n} } from ${m[2]} but it is not exported there`);
    }
  }
});
const precachedList = [...(sw.match(/const CORE_ASSETS = \[([\s\S]*?)\n\];/) || [, ''])[1].matchAll(/'\.\/([^']*)'/g)].map((m) => m[1]);
rule('service worker: every shipped file precached (generated), one VERSION that matches package.json', (r) => {
  const precached = new Set(precachedList);
  const walk = (d, out = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? walk(p, out) : out.push(path.relative(APP, p).split(path.sep).join('/')); } return out; };
  for (const f of walk(APP)) if (!['sw.js', '_headers', 'robots.txt'].includes(f) && !precached.has(f)) fail(r, f, 'exists but is not in sw.js CORE_ASSETS (run npm run sync)');
  for (const f of precached) if (f && !fs.existsSync(path.join(APP, f))) fail(r, f, 'in CORE_ASSETS but does not exist');
  if ((sw.match(/\bconst VERSION\s*=/g) || []).length !== 1) fail(r, 'sw.js', 'must define exactly one VERSION constant');
  const v = (sw.match(/const VERSION\s*=\s*'autolab3-v([\d.]+)'/) || [, ''])[1];
  if (v !== pkg.version) fail(r, 'sw.js', `VERSION v${v} ≠ package.json v${pkg.version} (run npm run sync)`);
});
rule('one version everywhere: package.json = sw.js = README/GUIDE/COMPONENTS stamps = components.js/css headers', (r) => {
  for (const [f, re] of [['README.md', /Auto Lab v([\d.]+)|\*\*v([\d.]+)\*\*/], ['docs/GUIDE.md', /Auto Lab v([\d.]+)/], ['docs/COMPONENTS.md', /Auto Lab v([\d.]+)/], ['components.js', /\(v([\d.]+)\)/], ['components.css', /\(v([\d.]+)\)/]]) {
    let s; try { s = rd(f); } catch (_) { fail(r, f, 'missing'); continue; }
    const m = s.match(re); const got = m && (m[1] || m[2]);
    if (!got) fail(r, f, `no version string (expected v${pkg.version})`); else if (got !== pkg.version) fail(r, f, `says v${got}, package.json is v${pkg.version}`);
  }
});
const CONTROL_OWNERS = new Set(['core/controls.js', 'core/chrome.js', 'core/dock.js', 'core/monitor.js']);
const CONTROL_OK = [[/^core\/guard\.js$/, 'guard.js is a standalone script: one Retry button'], [/^(index|404)\.html$/, 'the shell owns module cards, search and install UI; 404.html is standalone']];
const CONTROL_RE = /<(button|select)\b|type\s*=\s*["']range["']|type\s*=\s*['"]?range|createElement\(\s*['"`](button|select)['"`]\s*\)|createElement\(\s*['"`]input['"`]\s*\)/;
const hex = [];
/* sweep rule: inline style="" attributes (HTML and JS templates) are CSS too → tokens only.
   Allowed: the seven blade-fuse rating colours in wiring (a real-world colour code, i.e. data, not theme). */
rule('inline style attributes: no hard-coded colour in any module page or script (fuse-rating swatches in wiring are data)', (r) => {
  const FUSE_DATA = /^background:#(?:d4b483|dc2626|3b82f6|eab308|f1f5f9|22c55e|f97316)$/;
  for (const f of modulePages()) {
    for (const m of rd(f).matchAll(/style="([^"]*)"/g)) {
      const v = m[1].trim();
      if (FUSE_DATA.test(v) || !/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/.test(v)) continue;
      fail(r, f, 'hard-coded colour in an inline style (use a token): ' + v.slice(0, 80));
    }
  }
});
rule('per page: no duplicate ids, no kit-owned ids, no hand-built controls, no window.__*, no chart in a panel template, no hard-coded colour in <style>', (r) => {
  for (const f of htmlAll) {
    const s = rd(f);
    const code = stripComments(s.replace(/<style[\s\S]*?<\/style>/g, ''));
    const seen = new Map(); for (const m of s.matchAll(/\sid="([^"]+)"/g)) seen.set(m[1], (seen.get(m[1]) || 0) + 1);
    const dups = [...seen].filter(([, c]) => c > 1).map(([id]) => id);
    if (dups.length) fail(r, f, `duplicate id(s): ${dups.join(', ')}`);
    if (f !== 'index.html' && f !== '404.html') {
      for (const id of ['btn-play', 'btn-reset', 'speed', 'toolbar-extras']) if (seen.has(id)) fail(r, f, `defines id="${id}" (owned by the kit/dock)`);
      if (/getElementById\(\s*['"]toolbar-extras['"]\s*\)|#toolbar-extras/.test(code)) fail(r, f, 'writes into #toolbar-extras (retired: use options:[...])');
    }
    if (!CONTROL_OK.some(([re]) => re.test(f))) for (const l of code.split('\n')) if (CONTROL_RE.test(l)) { fail(r, f, 'builds its own control (use options:[...] / axes): ' + l.trim().slice(0, 80)); break; }
    if (/from\s+['"](?:\.\.\/core\/|\.\/)(kit|components)\.js['"]/.test(s)) {
      if (/extras:\s*\[\s*\{/.test(code)) fail(r, f, 'toolbar extras are retired — use options:[...]');
      if (/window\.__\w*Sync\w*\s*=/.test(code)) fail(r, f, 'window.__*Sync* hook');
      if (/window\.__\w+/.test(code)) fail(r, f, 'window.__* global');
      for (const m of code.matchAll(/(?:overview|faults|quiz|widgets|readout|panel)[\w.]*\s*[:=]\s*(?:\(\)\s*=>\s*)?`([\s\S]*?)`/g)) if (/<canvas\b|<svg\b/.test(m[1])) fail(r, f, '<canvas>/<svg> chart inside a panel/widget template (use ui.stage.canvas or a Monitor trace)');
      if (/monitor\.root\s*(\.(innerHTML|textContent|style|classList|append\w*|insert\w*|replace\w*|remove\w*)|\s*=[^=])/.test(code)) fail(r, f, 'writes ui.monitor.root (use ui.monitor.set / update)');
      if (/(?:dock|panel|monitor)[\w.]*\.(?:appendChild|append|prepend)\(\s*[\w.]*stage[\w.]*canvas/.test(code)) fail(r, f, 'a ui.stage canvas is appended into the dock / panel / Monitor');
    }
    if (f !== '404.html') {
      const styles = [...s.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
      for (const l of styles.split('\n')) {
        if (/--al-accent\s*:/.test(l)) continue;
        if (/#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(l.replace(/#[a-zA-Z_][\w-]*\s*[{,.:\[>]/g, ''))) { hex.push(f); fail(r, f, 'hard-coded colour in <style> (use a token): ' + l.trim().slice(0, 80)); break; }
      }
    }
  }
  for (const f of jsFiles().filter((x) => x !== 'sw.js')) {
    if (CONTROL_OWNERS.has(f) || CONTROL_OK.some(([re]) => re.test(f))) continue;
    const code = stripComments(stripCard(rd(f)));
    for (const l of code.split('\n')) if (CONTROL_RE.test(l)) { fail(r, f, 'builds its own control outside controls/chrome/dock/monitor: ' + l.trim().slice(0, 80)); break; }
    if (/window\.__\w+/.test(code)) fail(r, f, 'window.__* global');
  }
});
rule('clean tree: only allow-listed files, no console.log / debugger, no dead code', (r) => {
  const ROOT_FILES = new Set(['AUTOLAB3-PROMPT.md', 'README.md', 'LICENSE', 'package.json', 'package-lock.json', '.gitignore', '.editorconfig', 'known-failures.json', 'CHANGELOG.md']);
  for (const f of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (f.name === 'node_modules' || f.name === '.git' || f.name === '.github') continue;
    if (f.isDirectory()) { if (!['app', 'tools', 'tests', 'docs'].includes(f.name)) fail(r, f.name + '/', 'stray directory'); continue; }
    if (!ROOT_FILES.has(f.name)) fail(r, f.name, 'stray file in the repo root');
  }
  for (const f of fs.readdirSync(path.join(ROOT, 'tests'))) if (!/\.mjs$|^known-failures\.json$/.test(f)) fail(r, 'tests/' + f, 'stray file in tests/');
  for (const f of fs.readdirSync(path.join(ROOT, 'tools'))) if (!/\.mjs$/.test(f)) fail(r, 'tools/' + f, 'stray file in tools/');
  for (const f of fs.readdirSync(path.join(ROOT, 'docs'))) if (!/\.md$/.test(f)) fail(r, 'docs/' + f, 'stray file in docs/');
  for (const f of fs.readdirSync(path.join(APP, 'assets'))) if (!/\.(png|svg|js)$/.test(f)) fail(r, 'assets/' + f, 'stray file in assets/');
  const shipped = [...jsFiles().filter((f) => f !== 'sw.js').map((f) => [f, stripCard(read(path.join(APP, f)))]),
    ...htmlAll.map((f) => [f, [...read(path.join(f === 'index.html' || f === '404.html' ? APP : path.join(APP, 'modules'), f)).matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n')])];
  const seenSrc = new Set();
  for (const [f, src] of shipped) {
    const code = stripComments(src);
    if (/\bconsole\.(log|debug|info|trace|dir)\s*\(/.test(code)) fail(r, f, 'console.log/debug/info left in shipped code');
    if (/\bdebugger\b\s*;?/.test(code)) fail(r, f, 'debugger statement');
    const names = new Set();
    for (const m of code.matchAll(/(?:^|[\s;{(])(?:function\s*\*?\s+([A-Za-z_$][\w$]*)\s*\(|(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=)/g)) names.add(m[1] || m[2]);
    for (const n of names) {
      const refs = code.match(new RegExp('(?<![\\w$])' + n.replace(/\$/g, '\\$') + '(?![\\w$])', 'g')) || [];
      if (refs.length === 1 && !new RegExp('export\\s+(?:async\\s+)?(?:function|const|let)\\s+' + n.replace(/\$/g, '\\$') + '\\b').test(code)) fail(r, f, `dead code — \`${n}\` is declared and never used`);
    }
  }
});

for (const name of RULES) {
  const list = problems.get(name) || [];
  if (!list.length) t(name, () => {});
  else for (const [item, msg] of list) t(`${name} — ${item}${msg && !/^dead code/.test(msg) ? '' : ''}${/^dead code/.test(msg) ? ' — ' + msg.split('`')[1] : ''}`, () => { throw new Error(msg); });
}
await finish();
