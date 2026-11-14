// shared/model-autodrive.js — pure-pursuit steering: geometry facts, parity with the original inline algorithm, closed-loop stays on the road.
import assert from 'node:assert/strict';
import * as THREE from '../app/assets/three.module.js';
import * as A from '../app/shared/model-autodrive.js';
import { t, finish } from './_lib.mjs';
const near = (a, b, e = 1e-9, m = '') => assert.ok(Math.abs(a - b) <= e, `${m} ${a} vs ${b}`);
const WB = 2.8, MAXA = 0.61, LA = 5.5;
const opts = { lookahead: LA, wheelbase: WB, maxRoadAngle: MAXA };

/* a closed oval, spaced evenly like THREE's getSpacedPoints */
const curve = new THREE.CatmullRomCurve3([[0, 0, -30], [25, 0, -15], [25, 0, 15], [0, 0, 30], [-25, 0, 15], [-25, 0, -15]].map(([x, y, z]) => new THREE.Vector3(x, y, z)), true, 'catmullrom', 0.5);
const pts = curve.getSpacedPoints(480), step = curve.getLength() / pts.length;
const path = A.makePath(pts, step, true);

/* the algorithm as it was written inline in differential.js before it moved to the shared model — the reference for parity */
function original(pos, heading) {
  let best = 0, bestD = Infinity;
  for (let i = 0; i < pts.length; i++) { const d = pts[i].distanceToSquared(pos); if (d < bestD) { bestD = d; best = i; } }
  const stepsAhead = Math.max(1, Math.round(LA / step)), target = pts[(best + stepsAhead) % pts.length];
  const dx = target.x - pos.x, dz = target.z - pos.z, c = Math.cos(heading), s = Math.sin(heading);
  const localX = dx * c - dz * s, localZ = dx * s + dz * c, Ld = Math.max(0.75, Math.sqrt(localX * localX + localZ * localZ));
  return Math.max(-1, Math.min(1, -Math.atan(WB * (2 * localX / (Ld * Ld))) / MAXA));
}

t('nearestIndex: the point on the path closest to (x, z); wraps nothing, just the minimum', () => {
  const p = A.makePath([{ x: 0, z: 0 }, { x: 1, z: 0 }, { x: 2, z: 0 }], 1, false);
  assert.equal(A.nearestIndex(p, 1.2, 5), 1); assert.equal(A.nearestIndex(p, -9, 0), 0); assert.equal(A.nearestIndex(p, 9, 0), 2);
});
t('lookaheadPoint: closed paths wrap, open paths stop at the end, at least one step ahead', () => {
  const pts3 = [{ x: 0, z: 0 }, { x: 1, z: 0 }, { x: 2, z: 0 }];
  assert.equal(A.lookaheadPoint(A.makePath(pts3, 1, true), 1.9, 0, 2).x, 1, 'closed: index 2 + 2 wraps to 1');
  assert.equal(A.lookaheadPoint(A.makePath(pts3, 1, false), 1.9, 0, 5).x, 2, 'open: clamped to the last point');
  assert.equal(A.lookaheadPoint(A.makePath(pts3, 1, false), 0, 0, 0.01).x, 1, 'never less than one step');
});
t('pursuitAngle: a target dead ahead needs no steering; one to the side steers toward it; symmetric', () => {
  const line = A.makePath([{ x: 0, z: 0 }, { x: 0, z: 1 }, { x: 0, z: 2 }, { x: 0, z: 3 }, { x: 0, z: 4 }, { x: 0, z: 5 }, { x: 0, z: 6 }], 1, false);
  near(A.pursuitAngle(line, 0, 0, 0, { lookahead: 3, wheelbase: WB }), 0);
  const right = A.pursuitAngle(line, -1, 0, 0, { lookahead: 3, wheelbase: WB }), left = A.pursuitAngle(line, 1, 0, 0, { lookahead: 3, wheelbase: WB });
  assert.ok(right > 0 && left < 0); near(right, -left, 1e-12);                 /* heading 0 faces +z; the path is on the +x side of a car at x = −1 */
});
t('pursuitAngle: matches the bicycle-model geometry — the circle through the target (κ = 2x / L²)', () => {
  const p = A.makePath([{ x: 0, z: 0 }, { x: 3, z: 4 }], 5, false);          /* target at local (3, 4): L = 5 */
  near(A.pursuitAngle(p, 0, 0, 0, { lookahead: 5, wheelbase: 2, minLd: 0.1 }), Math.atan(2 * 2 * 3 / 25));
});
t('pursuitSteerInput: clamped to −1 … 1 and sign-flipped (module convention)', () => {
  const p = A.makePath([{ x: 0, z: 0 }, { x: 5, z: 0.1 }], 5, false);        /* a sharp turn: far beyond the lock */
  assert.equal(A.pursuitSteerInput(p, 0, 0, 0, { lookahead: 5, wheelbase: WB, maxRoadAngle: MAXA }), -1);
  assert.equal(A.pursuitSteerInput(p, 0, 0, Math.PI, { lookahead: 5, wheelbase: WB, maxRoadAngle: MAXA }), 1);
});
t('parity: identical to the original inline algorithm on 400 random poses around the oval', () => {
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 400; i++) {
    const pos = new THREE.Vector3((rnd() - 0.5) * 60, 0, (rnd() - 0.5) * 70), h = (rnd() - 0.5) * 2 * Math.PI;
    near(A.pursuitSteerInput(path, pos.x, pos.z, h, opts), original(pos, h), 1e-12, `pose ${i}`);
  }
});
t('closed loop: a car steered only by pursuitSteerInput (bicycle model, 6 m/s) stays within 1.5 m of the oval for three laps', () => {
  const v = 6, dt = 1 / 60; let x = pts[0].x, z = pts[0].z, h = Math.atan2(pts[3].x - pts[0].x, pts[3].z - pts[0].z), steer = 0, worst = 0, travelled = 0;
  while (travelled < 3 * curve.getLength()) {
    const want = -A.pursuitSteerInput(path, x, z, h, opts) * MAXA;           /* road-wheel angle the controller asks for */
    steer += (want - steer) * Math.min(1, dt * 3.2);                         /* the same smoothing rate as the page */
    h += v * Math.tan(steer) / WB * dt; x += v * Math.sin(h) * dt; z += v * Math.cos(h) * dt; travelled += v * dt;
    worst = Math.max(worst, Math.sqrt(pts.reduce((m, p) => Math.min(m, (p.x - x) ** 2 + (p.z - z) ** 2), Infinity)));
  }
  assert.ok(worst < 1.5, 'worst distance from the path ' + worst.toFixed(2) + ' m');
});
await finish();
