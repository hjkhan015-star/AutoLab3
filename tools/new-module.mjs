#!/usr/bin/env node
// tools/new-module.mjs — scaffold a new module that passes every rule test on day one.
//
//   node tools/new-module.mjs <system-id> <module-id> [--guided] [--stage <stage-id>] [--title "Title"] [--dry-run]
//   node tools/new-module.mjs --remove <module-id>        undo a scaffold that is still a draft (refuses anything else)
//
// It creates  app/modules/<system>--<id>.html + .js   (a spinning-block demo: one control, one Monitor value),
//             a registry entry (status 'draft', version 0.1.0, type guided|custom), a placeholder icon in core/icons.js,
//             a slot in ONE roadmap stage, and tests/mod-<id>.test.mjs (real checks, no TODO that passes).
// Then it runs tools/sync.mjs (header card, maps, precache) — so `npm test` is green immediately.
// Promote draft → stable by hand when the QA row is filled and the physics reviewed (docs/UPDATING.md, "Add a module").
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname), APP = path.join(ROOT, 'app');
const MARK = 'scaffold: created by tools/new-module.mjs';
const read = (p) => fs.readFileSync(p, 'utf8'), write = (p, s) => fs.writeFileSync(p, s);
const die = (msg) => { console.error('new-module: ' + msg); process.exit(1); };

/* ───────────────────────────── templates ───────────────────────────── */
const HEAD = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>__TITLE__ — Auto Lab</title>
<link rel="stylesheet" href="../core/app.css">
<link rel="stylesheet" href="../core/controls.css">
`;
const TAIL = `<style>
:root { --al-accent: __ACCENT__; }
html.light-theme { --al-accent: color-mix(in oklch, __ACCENT__ 68%, black); }
</style>
</head>
<body>
<div id="canvas-wrap"></div>
<div id="labels-root"></div>

<script src="../core/guard.js"></script>
<!--importmap:begin-->
<script type="importmap">
{ "imports": {} }
</script>
<!--importmap:end-->

<script type="module" src="__BASE__.js"></script>
</body>
</html>
`;
const HTML_CUSTOM = HEAD + TAIL;
const HTML_GUIDED = HEAD + '<link rel="stylesheet" href="../core/components.css">\n' + TAIL;

const JS_CUSTOM = `/* __MARK__ — replace the block, the numbers and the text; delete this line when the module is yours. */
import * as THREE from 'three';
import * as Base from '../core/kit.js';
import { UI } from '../core/kit.js';

const { scene, camera, renderer, controls, wrap } = Base.buildScene({ fov: 42, camPos: [3.4, 2.4, 5.2], target: [0, 0, 0], floorY: -1.2 });
Base.attachResize(camera, renderer, wrap, 42);
const state = Base.createUIState();

const block = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.4), new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.3, roughness: 0.5 }));
scene.add(block);
let angle = 0;

const ui = UI.create({
  moduleId: '__ID__',
  panel: {
    kicker: '__KICKER__',
    title: '__TITLE__',
    badge: { text: 'Draft', color: '__ACCENT__' },
    desc: '<strong>__TITLE__.</strong> Explain what the learner sees and why it matters. Keep numbers out of this text: they belong in the Monitor.'
  },
  monitor: {
    config: { label: 'Speed', value: { label: 'Speed', unit: ' rpm', max: 100, bar: true }, rows: [['turns', 'Turns']], status: { text: 'Running' } },
    initial: { value: { text: '0', unit: ' rpm' }, rows: { turns: '0' }, status: ['Running', true] }
  },
  toolbar: { play: true, reset: true },
  axes: [{ id: 'level', label: 'Level', min: 0, max: 100, def: 40, step: 1, unit: ' %', side: 'left' }],
  onCommand: (d) => { if (d.action === 'reset') reset(); }
});

function reset() { angle = 0; ui.controls.resetAll(); }

const clock = new THREE.Clock();
let frame = 0;
function animate() {
  requestAnimationFrame(animate);
  frame++;
  const dt = Math.min(clock.getDelta(), 0.05), level = ui.controls.value('level');
  if (state.playing) angle += dt * level * 0.05;
  block.rotation.y = angle;
  if (frame % 6 === 0) ui.monitor.update({ value: { text: String(Math.round(level)), unit: ' rpm', bar: level }, rows: { turns: (angle / (Math.PI * 2)).toFixed(1) }, status: [state.playing ? 'Running' : 'Paused', state.playing] });
  controls.update();
  renderer.render(scene, camera);
}
animate();
`;

const JS_GUIDED = `/* __MARK__ — replace the config, the block and the numbers; delete this line when the module is yours. */
import { runGuidedModule } from '../core/components.js';

const CFG = {
  moduleId: '__ID__', title: '__TITLE__', kicker: '__KICKER__', accent: '__ACCENT__', badge: 'Draft',
  camPos: [3.4, 2.4, 5.2], target: [0, 0, 0], floorY: -1.2,
  ctl: { label: 'Level', val: 40, caption: 'Level' },
  chipLabel: 'Speed',
  rows: [['turns', 'Turns']],
  ro: [['speed', 'Speed'], ['turns', 'Turns']],
  legend: [['var(--c-cyan)', 'The block']],
  overview: '<div class="al-sec"><h4>What it shows</h4><p>Explain what the learner sees and why it matters.</p></div>',
  faults: [['Example fault', 'What the learner would notice.', 'How to check it.']],
  quiz: [['Replace this question?', ['Yes', 'No', 'Maybe'], 0, 'Why the first answer is right.']]
};

function build(H) {
  const { box, mat } = H;
  const block = box(1.4, 1.4, 1.4, mat(0x38bdf8, 0.3, 0.5), 0, 0, 0);
  let angle = 0;
  return {
    labels: [['The block', [0, 1, 0]]],
    update(c) {
      angle += c.dt * c.k * 5;
      block.rotation.y = angle;
      const rpm = Math.round(c.k * 100);
      return { big: String(rpm), unit: ' rpm', bar: rpm, rows: { turns: (angle / (Math.PI * 2)).toFixed(1) },
        ro: { speed: [rpm + ' rpm', ''], turns: [(angle / (Math.PI * 2)).toFixed(1), ''] }, status: ['Running', true], ctl: rpm + ' %' };
    }
  };
}

runGuidedModule(CFG, build);
`;

const TEST_STUB = `// __ID__ — checks for the new module. Add the physics / behaviour tests here as the module grows (see tests/mod-differential.test.mjs for the pattern):
// pure maths → a shared/model-*.js with unit tests; DOM behaviour → a jsdom group.
import assert from 'node:assert/strict';
import { t, finish, rd } from './_lib.mjs';
import { MODULES } from '../app/core/registry.js';

const m = MODULES.find((x) => x.id === '__ID__');

t('__ID__: registered, in its system, type and status are set', () => {
  assert.ok(m, 'registry entry'); assert.equal(m.file, 'modules/__BASE__.html'); assert.ok(['draft', 'stable', 'deprecated'].includes(m.status)); assert.match(m.moduleVersion, /^\\d+\\.\\d+\\.\\d+$/);
});
t('__ID__: the page loads its own script and uses the shared runtime (no hand-built chrome)', () => {
  const s = rd('__BASE__.html');
  assert.match(s, /moduleId: '__ID__'|"moduleId": "__ID__"|moduleId: "__ID__"/);
  assert.ok(/runGuidedModule\\(|UI\\.create\\(/.test(s), 'guided config or UI.create');
});
await finish();
`;

const args = process.argv.slice(2);
const flag = (n) => args.includes(n), opt = (n) => (args.includes(n) ? args[args.indexOf(n) + 1] : null);
const positional = args.filter((a, i) => !a.startsWith('--') && !['--stage', '--title', '--remove'].includes(args[i - 1]));
const reg = await import(pathToFileURL(path.join(APP, 'core/registry.js')).href + '?t=' + Date.now());
const { ROADMAP } = await import(pathToFileURL(path.join(APP, 'core/roadmap.js')).href + '?t=' + Date.now());
const all = [...reg.SYSTEMS_FLAT.flatMap((s) => s.modules.map((id) => ({ id, system: s.id }))), ...reg.SUBMODULES];
const allMods = reg.MODULES;

/* ───────────────────────────── remove ───────────────────────────── */
if (flag('--remove')) {
  const id = opt('--remove'), m = allMods.find((x) => x.id === id);
  if (!m) die(`no module "${id}"`);
  const base = path.basename(m.file, '.html'), js = path.join(APP, 'modules', base + '.js');
  if (m.status !== 'draft' || !fs.existsSync(js) || !read(js).includes(MARK)) die(`"${id}" is not an untouched scaffold (needs status draft and the scaffold marker in its .js) — deprecate it instead (docs/UPDATING.md)`);
  for (const f of [path.join(APP, m.file), js, path.join(ROOT, 'tests', `mod-${id}.test.mjs`)]) if (fs.existsSync(f)) fs.rmSync(f);
  edit(path.join(APP, 'core/registry.js'), (s) => s.replace(new RegExp(`\\n\\s*\\{"id": "${id}",[^\\n]*\\},?(?=\\n)`), '').replace(/,(\n\s*\])/g, '$1'), { optional: true });
  edit(path.join(APP, 'core/icons.js'), (s) => s.replace(new RegExp(`\\n  "${id}": [^\\n]*?(,?)(?=\\n)`), '').replace(/,(\n\};)/g, '$1'), { optional: true });
  edit(path.join(APP, 'core/roadmap.js'), (s) => s.replace(new RegExp(`,?"${id}"(,?)`), (mm, c) => c ? ',' : ''), { optional: true });
  runSync(); console.log(`removed ${id}`); process.exit(0);
}

/* ───────────────────────────── create ───────────────────────────── */
const [sysId, id] = positional;
if (!sysId || !id) die('usage: node tools/new-module.mjs <system-id> <module-id> [--guided] [--stage <stage-id>] [--title "Title"]');
const system = reg.SYSTEMS_FLAT.find((s) => s.id === sysId);
if (!system) die(`unknown system "${sysId}". Systems: ${reg.SYSTEMS_FLAT.map((s) => s.id).join(', ')}`);
if (!/^[a-z][a-z0-9]{1,23}$/.test(id)) die('module id: lower-case letters and digits, starting with a letter, 2–24 characters (it becomes a file name and a storage key)');
if (allMods.some((m) => m.id === id) || reg.SUBMODULES.some((m) => m.id === id)) die(`id "${id}" already exists — ids are never reused`);
const guided = flag('--guided'), title = opt('--title') || id.replace(/^./, (c) => c.toUpperCase());
let stageId = opt('--stage');
if (!stageId) {
  if (!process.stdin.isTTY) die(`which roadmap stage? pass --stage <id>. Stages: ${ROADMAP.map((s) => s.id).join(', ')}`);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log(ROADMAP.map((s, i) => `  ${i + 1}. ${s.id.padEnd(9)} ${s.title}`).join('\n'));
  const a = (await rl.question('Roadmap stage (number or id): ')).trim(); rl.close();
  stageId = ROADMAP[Number(a) - 1]?.id || a;
}
const stage = ROADMAP.find((s) => s.id === stageId);
if (!stage) die(`unknown stage "${stageId}". Stages: ${ROADMAP.map((s) => s.id).join(', ')}`);

const base = `${sysId}--${id}`, accent = system.color;
const files = { html: path.join(APP, 'modules', base + '.html'), js: path.join(APP, 'modules', base + '.js'), test: path.join(ROOT, 'tests', `mod-${id}.test.mjs`) };
for (const f of Object.values(files)) if (fs.existsSync(f)) die(`${path.relative(ROOT, f)} already exists`);
const fill = (s) => s.replaceAll('__ID__', id).replaceAll('__SYS__', sysId).replaceAll('__TITLE__', title).replaceAll('__KICKER__', system.title.replace(/ System.*$/, '')).replaceAll('__ACCENT__', accent).replaceAll('__BASE__', base).replaceAll('__MARK__', MARK);

if (flag('--dry-run')) {
  console.log(`would create:\n  app/modules/${base}.html\n  app/modules/${base}.js (${guided ? 'guided' : 'custom'})\n  tests/mod-${id}.test.mjs\n  registry entry in system "${sysId}" (draft 0.1.0), icon "${id}", roadmap stage "${stageId}"`);
  process.exit(0);
}

write(files.html, fill(guided ? HTML_GUIDED : HTML_CUSTOM));
write(files.js, fill(guided ? JS_GUIDED : JS_CUSTOM));
write(files.test, fill(TEST_STUB));

const entry = `      {"id": "${id}", "label": "${title}", "title": "${title}", "subtitle": "${system.title.replace(/ System.*$/, '')} · New module", "file": "modules/${base}.html", "color": "${accent}", "level": "Basic", "min": 10, "mode": "3D", "moduleVersion": "0.1.0", "type": "${guided ? 'guided' : 'custom'}", "status": "draft", "icon": MODULE_ICONS["${id}"]}`;
edit(path.join(APP, 'core/registry.js'), (s) => {
  const at = s.indexOf(`id: "${sysId}",`); if (at < 0) die('registry layout: system block not found');
  const open = s.indexOf('modules: [', at), close = s.indexOf('\n    ]', open);
  return s.slice(0, close) + ',\n' + entry + s.slice(close);
});
edit(path.join(APP, 'core/icons.js'), (s) => {
  const close = s.lastIndexOf('\n};');
  return s.slice(0, close) + `,\n  "${id}": ${JSON.stringify('<rect x="6" y="6" width="12" height="12" rx="2"/>')}` + s.slice(close);
});
edit(path.join(APP, 'core/roadmap.js'), (s) => {
  const at = s.indexOf(`id: "${stageId}"`), ids = s.indexOf('ids: [', at), close = s.indexOf(']', ids);
  return s.slice(0, close) + `,"${id}"` + s.slice(close);
});
runSync();
console.log(`\ncreated ${base} (${guided ? 'guided' : 'custom'}, draft 0.1.0) in stage "${stageId}".\nNext: edit app/modules/${base}.js, then \`npm test\`. Undo while it is still a scaffold: node tools/new-module.mjs --remove ${id}`);

/* ───────────────────────────── helpers ───────────────────────────── */
function edit(p, fn, { optional = false } = {}) { const before = read(p), after = fn(before); if (after === before) { if (optional) return; die(`${path.relative(ROOT, p)}: nothing changed (layout not recognised)`); } write(p, after); }
function runSync() {
  const r = spawnSync(process.execPath, [path.join(ROOT, 'tools/sync.mjs')], { stdio: 'inherit' });
  if (r.status) die('sync failed');
}
