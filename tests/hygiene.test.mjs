// hygiene — the rules that let someone edit a module by hand and have `npm run sync && npm test` name the file to fix (UPDATING.md §"What the tests catch").
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { t, finish, ROOT, APP, modulePages } from './_lib.mjs';
import { SYSTEMS, SUBMODULES } from '../app/core/registry.js';

const read = (p) => fs.readFileSync(p, 'utf8');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const shipped = walk(APP).map((f) => path.relative(APP, f).split(path.sep).join('/'));
const mods = [...SYSTEMS.flatMap((s) => s.modules.map((m) => ({ ...m, system: s.id }))), ...SUBMODULES];

t('portable file names: shipped files are lower-case, no spaces, only a-z 0-9 . _ - (the three Netlify / PWA names with a leading underscore or digit are fine)', () => {
  const bad = shipped.filter((f) => !/^[a-z0-9._\-\/]+$/.test(f));
  assert.deepEqual(bad, [], 'file names must be lower-case without spaces: ' + bad.join(', '));
});
t('portable paths: no absolute or machine-specific path in any shipped source (no /home, /mnt, /Users, C:\\, file:), pages use relative URLs only', () => {
  const bad = [];
  for (const f of shipped.filter((x) => /\.(html|js|css|webmanifest)$/.test(x) && !x.startsWith('assets/'))) {
    const s = read(path.join(APP, f));
    if (/(?:^|[^\w.:])(?:\/home\/|\/mnt\/|\/Users\/|[A-Za-z]:\\\\)/.test(s.replace(/\/\*[\s\S]*?\*\//g, ''))) bad.push(f + ': machine path');
    if (/['"]file:\/\//.test(s)) bad.push(f + ': file://');
    if (f.endsWith('.html')) for (const m of s.matchAll(/(?:src|href)="(\/[^"\/][^"]*)"/g)) if (!/^\/\//.test(m[1])) bad.push(f + ': root-absolute ' + m[1]);
  }
  assert.deepEqual(bad, [], bad.join('\n  '));
});
t('every module page has a registry entry and every entry has its two files (html + js), nothing else lives in modules/', () => {
  const files = fs.readdirSync(path.join(APP, 'modules')), expect = new Set(mods.flatMap((m) => [path.basename(m.file), path.basename(m.file).replace(/\.html$/, '.js')]));
  assert.deepEqual(files.filter((f) => !expect.has(f)), [], 'unregistered file in modules/');
  assert.deepEqual([...expect].filter((f) => !files.includes(f)), [], 'registered file missing');
});
t('max one .js per module and no inline logic: a module page loads guard.js, one import map, and exactly its own <script type="module" src="<same name>.js">', () => {
  const bad = [];
  for (const f of modulePages()) {
    const s = read(path.join(APP, 'modules', f)), base = f.replace(/\.html$/, '');
    const scripts = [...s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)].map((m) => ({ attrs: m[1], body: m[2].trim() }));
    const own = scripts.filter((x) => new RegExp(`type="module"[^>]*src="${base}\\.js"|src="${base}\\.js"[^>]*type="module"`).test(x.attrs));
    if (own.length !== 1) bad.push(`${f}: needs exactly one <script type="module" src="${base}.js"> (found ${own.length})`);
    for (const x of scripts) {
      if (own.includes(x)) continue;
      if (/type="importmap"/.test(x.attrs)) continue;                                              /* the one stamped snippet */
      if (/\bsrc="\.\.\/core\/guard\.js"/.test(x.attrs) && !x.body) continue;                      /* the early-failure overlay */
      bad.push(`${f}: extra script (${x.attrs.trim().slice(0, 50) || 'inline'}${x.body ? ', ' + x.body.length + ' chars of inline code' : ''})`);
    }
  }
  assert.deepEqual(bad, [], bad.join('\n  '));
});
t('header cards: every module .js starts with a complete generated card whose id / system / version / status match the registry', () => {
  const bad = [];
  for (const m of mods) {
    const base = path.basename(m.file).replace(/\.html$/, ''), js = read(path.join(APP, 'modules', base + '.js'));
    const card = js.match(/^\/\* @card:begin\n([\s\S]*?)\s*@card:end \*\//);
    if (!card) { bad.push(base + ': no header card at the top'); continue; }
    const c = card[1], need = [`id: ${m.id}   system: ${m.system}`, `version: ${m.moduleVersion}`, `status: ${m.status}`, `files: ${base}.html + ${base}.js`, 'parent:', 'children:', 'shared:', 'storage:', 'test:'];
    for (const n of need) if (!c.includes(n)) bad.push(`${base}: card lacks "${n}"`);
  }
  assert.deepEqual(bad, [], bad.join('\n  '));
});
t('the generated files are fresh: `node tools/sync.mjs --check` exits 0 (cards, maps, import maps, precache list, version stamps)', () => {
  const r = spawnSync('node', ['tools/sync.mjs', '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(r.status, 0, 'sync drift — run `npm run sync`:\n' + (r.stdout + r.stderr).trim().split('\n').slice(0, 12).join('\n'));
});
t('QA.md: every viewport table has exactly one row per module page, in registry order, with the registry\'s ids (rows are kept in step by sync; manual cells are kept)', () => {
  const lines = read(path.join(ROOT, 'docs/QA.md')).split('\n'), ids = mods.map((m) => m.id), bad = [];
  let tables = 0;
  for (let i = 0; i < lines.length; i++) if (/^\| module \| header 32 px/.test(lines[i])) {
    tables++; const rows = []; for (let j = i + 2; /^\| /.test(lines[j] || ''); j++) rows.push(lines[j].split('|')[1].trim());
    if (JSON.stringify(rows) !== JSON.stringify(ids)) bad.push(`table ${tables}: ${rows.length} rows vs ${ids.length} modules`);
  }
  assert.equal(tables, 8, '4 viewports × standalone / embedded'); assert.deepEqual(bad, [], bad.join('; '));
});
await finish();
