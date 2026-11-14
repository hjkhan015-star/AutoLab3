// node tests/registry.test.mjs — registry + roadmap integrity (was roadmap.test.mjs).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { t, finish, rd, APP } from './_lib.mjs';
import { DOMAINS as DOM, SYSTEMS, SUBMODULES, MODULES as MODS, ROADMAP as RM, SYSTEMS_FLAT as SYS, resolveIn, resolveModule } from '../app/core/registry.js';

const ids = MODS.map((m) => m.id);

t('module ids are unique and every file exists', () => {
  assert.equal(new Set(ids).size, ids.length);
  MODS.forEach((m) => assert.ok(fs.existsSync(path.join(APP, m.file)), m.file));
});
t('five domains and 18 systems, every system has a domain and at least one module', () => {
  assert.equal(DOM.length, 5); assert.equal(SYS.length, 18);
  SYS.forEach((s) => { assert.ok(DOM.includes(s.domain), s.id); assert.ok(s.modules.length > 0, s.id); });
});
t('every module belongs to exactly one system', () => {
  const all = SYS.flatMap((s) => s.modules);
  assert.equal(all.length, new Set(all).size); assert.deepEqual([...all].sort(), [...ids].sort());
});
t('related systems and flow links point at real ids', () => {
  const sys = new Set(SYS.map((s) => s.id));
  SYS.forEach((s) => {
    s.related.forEach((r) => assert.ok(sys.has(r), `${s.id} related ${r}`));
    s.flow.forEach((f) => { const p = f.split('|')[1]; if (p) assert.ok(ids.includes(p), `${s.id} flow ${p}`); });
  });
});
t('overview ↔ deep-dive pairs (decision D12): every deep-dive page is a step in its overview\'s system flow, so the big page links to it instead of copying it', () => {
  const PAIRS = [['engine', 'valvetrain'], ['engine', 'crankpiston'], ['ignition', 'sparkplug'], ['ignition', 'coilplug'], ['cooling', 'thermostat'], ['cooling', 'radiator'], ['turbo', 'intercooler'],
    ['braking', 'absesc'], ['transmission', 'gearbox'], ['transmission', 'clutch'], ['transmission', 'automatic'], ['awd', 'differential'], ['mpfi', 'commonrail'], ['mpfi', 'fuelpump'],
    ['lubrication', 'oilpump'], ['lubrication', 'oilfilter'], ['electrical', 'wiring'], ['ecu', 'obd2'], ['exhaustsystem', 'catalytic'], ['exhaustsystem', 'dpf']];
  const sysOf = (id) => SYS.find((s) => s.modules.includes(id));
  for (const [big, deep] of PAIRS) {
    const s = sysOf(big); assert.ok(s, big + ' has a system'); assert.equal(sysOf(deep)?.id, s.id, `${deep} is in the same system as ${big}`);
    assert.ok(s.flow.some((f) => f.split('|')[1] === deep), `${s.id} flow must link ${deep}`);
  }
});
t('roadmap: every live module is in exactly one stage, deprecated ones in none, nothing unknown', () => {
  const all = RM.flatMap((s) => s.ids), live = MODS.filter((m) => m.status !== 'deprecated').map((m) => m.id);
  assert.equal(all.length, new Set(all).size, 'a module is in two stages');
  assert.deepEqual([...all].sort(), [...live].sort());
});
t('deprecation: a deprecated entry names replacedBy (an existing live module), and no flow / related link points at it', () => {
  const dep = MODS.filter((m) => m.status === 'deprecated');
  for (const m of dep) {
    assert.ok(m.replacedBy, `${m.id}: deprecated needs replacedBy`);
    const live = resolveModule(m.id); assert.ok(live && live.status !== 'deprecated', `${m.id}: replacedBy ${m.replacedBy} does not lead to a live module`);
    SYS.forEach((s) => s.flow.forEach((f) => assert.notEqual(f.split('|')[1], m.id, `${s.id} flow still links the deprecated ${m.id}`)));
  }
  MODS.filter((m) => m.status !== 'deprecated').forEach((m) => assert.ok(!m.replacedBy, `${m.id}: replacedBy only belongs on deprecated entries`));
});
t('resolveIn follows replacedBy chains (old links keep working), stops on unknown ids, missing targets, cycles and long chains', () => {
  const L = [{ id: 'a', status: 'deprecated', replacedBy: 'b' }, { id: 'b', status: 'deprecated', replacedBy: 'c' }, { id: 'c', status: 'stable' }, { id: 'd', status: 'draft' },
    { id: 'x', status: 'deprecated', replacedBy: 'y' }, { id: 'y', status: 'deprecated', replacedBy: 'x' }, { id: 'n', status: 'deprecated' }, { id: 'z', status: 'deprecated', replacedBy: 'ghost' }];
  assert.equal(resolveIn(L, 'c').id, 'c', 'a live module resolves to itself'); assert.equal(resolveIn(L, 'd').id, 'd', 'drafts are live');
  assert.equal(resolveIn(L, 'a').id, 'c', 'two hops'); assert.equal(resolveIn(L, 'a', 1), null, 'hop limit');
  assert.equal(resolveIn(L, 'x'), null, 'cycle'); assert.equal(resolveIn(L, 'n'), null, 'no replacedBy'); assert.equal(resolveIn(L, 'z'), null, 'target missing'); assert.equal(resolveIn(L, 'nope'), null, 'unknown id');
  assert.equal(resolveModule('engine').id, 'engine'); assert.equal(resolveModule('not-a-module'), null);
});
t('roadmap stages are complete (title, question, why, checkpoint)', () => {
  RM.forEach((s) => ['title', 'ask', 'why', 'check'].forEach((k) => assert.ok(s[k] && s[k].length > 8, `${s.id}.${k}`)));
  assert.equal(new Set(RM.map((s) => s.id)).size, RM.length);
});
t('roadmap teaches Basic modules before Advanced ones in each stage group start', () => {
  const lvl = (id) => MODS.find((m) => m.id === id).level;
  assert.equal(lvl(RM[0].ids[0]), 'Basic');
  assert.ok(RM[RM.length - 1].ids.every((i) => lvl(i) !== 'Basic'), 'last stage is the advanced level-up');
});
t('the shell has three views and the Systems toggle sits between Modules and Roadmap', () => {
  const order = [...rd('index.html').matchAll(/data-view="(\w+)"/g)].map((m) => m[1]);
  assert.deepEqual(order, ['modules', 'systems', 'roadmap']);
});
t('window.AUTO_* globals are published by the registry for the shell and kit', async () => {
  const g = {}; globalThis.window = g;
  await import('../app/core/registry.js?globals');
  delete globalThis.window;
  assert.ok(g.AUTO_MODULES && g.AUTO_SYSTEMS && g.AUTO_ROADMAP && g.AUTO_DOMAINS && g.AUTO_META);
});
t('sub-modules: parent exists and lists them as children; every group has a sub-module entry per child', () => {
  for (const s of SUBMODULES) { const p = MODS.find((m) => m.id === s.parent); assert.ok(p, s.id); assert.ok(p.children.includes(s.id), s.id); assert.ok(!ids.includes(s.id), s.id + ' must not be a home card'); }
  for (const m of MODS.filter((x) => x.children)) assert.deepEqual(m.children.sort(), SUBMODULES.filter((s) => s.parent === m.id).map((s) => s.id).sort());
});
t('new pages use the shared runtime and no hand-built controls', () => {
  ['bodyframe', 'crumple', 'restraints', 'traction', 'accycle', 'hvacflow', 'headunit', 'gpsnav'].forEach((f) => {
    const s = rd(f + '.html');
    assert.match(s, /runGuidedModule/); assert.doesNotMatch(s, /<button|type="range"|localStorage/);
    assert.match(s, /"quiz"/); assert.match(s, /"faults"/);
  });
});
await finish();
