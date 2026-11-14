// shared/part-pipe.js — build and dispose smoke test + geometry facts (three.js runs in Node without a DOM).
import assert from 'node:assert/strict';
import * as THREE from '../app/assets/three.module.js';
import * as P from '../app/shared/part-pipe.js';
import { t, finish } from './_lib.mjs';
const v = (x, y, z) => new THREE.Vector3(x, y, z);
const L = [v(0, 0, 0), v(1, 0, 0), v(1, 1, 0), v(1, 1, 2)];
const mat = new THREE.MeshBasicMaterial();

t('makeOrthoCurve: one straight segment per distinct pair, zero-length pairs skipped, length = polyline length', () => {
  const c = P.makeOrthoCurve(THREE, [...L, v(1, 1, 2)]);
  assert.equal(c.curves.length, 3); near(c.getLength(), 1 + 1 + 2);
});
t('makeStraightPipe: n−1 cylinders + n−2 joint spheres, option radial / renderOrder, material is the caller\'s', () => {
  const g = P.makeStraightPipe(THREE, L, 0.05, mat, { radial: 6, renderOrder: 4 });
  assert.equal(g.children.length, 3 + 2);
  assert.ok(g.children.every((m) => m.material === mat && m.renderOrder === 4));
  assert.equal(g.children[0].geometry.parameters.radialSegments, 6);
  near(g.children[0].position.x, 0.5);                                   /* first segment's midpoint */
});
t('makeCollar: sits on the point, torus radius = pipe radius + 0.013, faces along dir', () => {
  const r = P.makeCollar(THREE, v(2, 3, 4), v(1, 0, 0), 0.05, mat);
  assert.deepEqual(r.position.toArray(), [2, 3, 4]); near(r.geometry.parameters.radius, 0.063);
  const n = v(0, 0, 1).applyQuaternion(r.quaternion); near(n.x, 1); near(n.z, 0);
});
t('buildManhattanPoints: ends untouched, straight runs untouched, a corner becomes 6 fillet points kept inside the corner radius', () => {
  const pts = P.buildManhattanPoints(THREE, L, 0.045);
  assert.deepEqual(pts[0].toArray(), [0, 0, 0]); assert.deepEqual(pts[pts.length - 1].toArray(), [1, 1, 2]);
  assert.equal(pts.length, 2 + 2 * 6);
  const straight = P.buildManhattanPoints(THREE, [v(0, 0, 0), v(1, 0, 0), v(2, 0, 0)]);                 /* a straight run gets the same 6 fillet points, all on the line: no bowing */
  assert.equal(straight.length, 2 + 6); assert.ok(straight.every((p) => p.y === 0 && p.z === 0));
  assert.equal(P.buildManhattanPoints(THREE, [v(0, 0, 0), v(1, 0, 0), v(0, 0, 0)]).length, 3, 'a 180° fold (cos > 0.9995) is left as is');
  assert.ok(pts.slice(1, 7).every((p) => p.distanceTo(v(1, 0, 0)) <= 0.045 + 1e-9));
});
t('makeManhattanWire: returns { mesh, curve }; the curve passes through the end points', () => {
  const w = P.makeManhattanWire(THREE, L, 0.02, mat, { fillet: 0.05, radial: 8 });
  assert.ok(w.mesh.isMesh && w.curve.getPoint(0).distanceTo(L[0]) < 1e-9 && w.curve.getPoint(1).distanceTo(L[3]) < 1e-9);
});
t('makeCylinder: orient x → lying on x, z → on z, anything else → upright', () => {
  const ax = (o) => v(0, 1, 0).applyQuaternion(P.makeCylinder(THREE, 0.1, 1, mat, o).quaternion);
  near(Math.abs(ax('x').x), 1); near(Math.abs(ax('z').z), 1); near(ax('y').y, 1);
});
t('disposePipe: every geometry built here is released, the caller\'s material is not', () => {
  const g = P.makeStraightPipe(THREE, L, 0.05, mat);
  g.add(P.makeCollar(THREE, v(0, 0, 0), v(0, 1, 0), 0.05, mat), P.makeManhattanWire(THREE, L, 0.02, mat).mesh, P.makeCylinder(THREE, 0.1, 1, mat));
  let geo = 0, matDisposed = 0; const geos = [];
  g.traverse((o) => { if (o.geometry) { geos.push(o.geometry); o.geometry.addEventListener('dispose', () => geo++); } });
  mat.addEventListener('dispose', () => matDisposed++);
  P.disposePipe(g);
  assert.equal(geo, geos.length); assert.equal(geos.length, 8); assert.equal(matDisposed, 0);
});
function near(a, b, e = 1e-6) { assert.ok(Math.abs(a - b) <= e, `${a} vs ${b}`); }
await finish();
