// shared/model-spray.js — injector spray particles. Bug B-001: the page created particles with `spd` but stepped them with `p.speed` (undefined),
// so the firing cylinder's particles became NaN (no spray, and a "Computed radius is NaN" warning from three.js).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as S from '../app/shared/model-spray.js';
import { t, finish, rd } from './_lib.mjs';

const seeded = (seed) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const near = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) <= e, `${a} vs ${b}`);
const TIP = { x: 1.5, y: 2, z: 0 };

t('makeSprayParticle: cylinder from the index, every field finite, ranges as documented, the speed field is spd', () => {
  const rnd = seeded(3);
  for (let i = 0; i < 160; i++) {
    const p = S.makeSprayParticle(i, 40, rnd);
    assert.equal(p.cyl, Math.floor(i / 40)); assert.deepEqual(Object.keys(p).sort(), ['ang', 'cyl', 'rad', 'spd', 't']);
    assert.ok(Object.values(p).every(Number.isFinite)); assert.ok(p.t >= 0 && p.t < 1 && p.rad >= 0.4 && p.rad <= 1 && p.spd >= 0.7 && p.spd <= 1.3);
  }
});
t('stepSpray: only the firing cylinder moves, by sim · spd · spraySpeed; past 1 it restarts at the tip', () => {
  const mine = { cyl: 2, t: 0.1, ang: 0, rad: 1, spd: 1 }, other = { cyl: 1, t: 0.1, ang: 0, rad: 1, spd: 1 };
  S.stepSpray(mine, 0.01, 6, 2, true); S.stepSpray(other, 0.01, 6, 2, true); near(mine.t, 0.16); near(other.t, 0.1);
  S.stepSpray(mine, 0.01, 6, 2, false); near(mine.t, 0.16, 1e-12);                          /* not firing → rests */
  mine.t = 0.99; S.stepSpray(mine, 0.1, 6, 2, true); assert.equal(mine.t, 0);
});
t('REGRESSION B-001: ten thousand firing steps never produce NaN, in the particle or in its position', () => {
  const rnd = seeded(11), ps = Array.from({ length: 160 }, (_, i) => S.makeSprayParticle(i, 40, rnd));
  for (let step = 0; step < 10000; step++) for (const p of ps) {
    S.stepSpray(p, 0.016, step % 2 ? 6.0 : 3.5, Math.floor(step / 100) % 4, true);
    const q = S.sprayPoint(p, TIP, 0.55, 0.12); assert.ok(Number.isFinite(p.t) && Number.isFinite(q.x) && Number.isFinite(q.y) && Number.isFinite(q.z), `NaN at step ${step}`);
  }
});
t('sprayPoint: at the tip it sits on the axis, it falls by t · length and the cone widens linearly with t', () => {
  const p = { cyl: 0, t: 0, ang: 0, rad: 1, spd: 1 };
  assert.deepEqual(S.sprayPoint(p, TIP, 0.5, 0.3), { x: 1.5, y: 2, z: 0 });
  p.t = 1; const q = S.sprayPoint(p, TIP, 0.5, 0.3); near(q.y, 1.5); near(q.x, 1.5 + 0.3); near(q.z, 0);
  p.ang = Math.PI / 2; const r = S.sprayPoint(p, TIP, 0.5, 0.3); near(r.x, 1.5, 1e-12); near(r.z, 0.3);
});
t('the page uses the model (no private copy of the particle maths, no `p.speed` read)', () => {
  const s = rd('mpfi.html');
  assert.match(s, /Spray\.stepSpray\(/); assert.match(s, /Spray\.makeSprayParticle\(/); assert.match(s, /Spray\.sprayPoint\(/);
  assert.ok(!s.includes('p.t += sim * p.speed * spraySpeed'), 'the old inline step, which read a field the spray particles do not have');
});
await finish();
