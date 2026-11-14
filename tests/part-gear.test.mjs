// shared/part-gear.js — gear geometry kit (differential + 4WD/AWD): build and dispose, geometry facts.
import assert from 'node:assert/strict';
import * as THREE from '../app/assets/three.module.js';
import { createGearKit, disposeGear } from '../app/shared/part-gear.js';
import { t, finish } from './_lib.mjs';
const K = createGearKit(THREE, 0.5);
const near = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) <= e, `${a} vs ${b}`);
const bbox = (g) => { const b = new THREE.Box3().setFromBufferAttribute(g.getAttribute('position')); return b; };

t('kit exposes the toolkit and the scale it was built with', () => {
  assert.deepEqual(Object.keys(K).sort(), ['PI', 'S', 'TAU', 'bevelGear', 'box', 'cylinder', 'merge', 'mkGeo', 'revolve', 'xform']);
  assert.equal(K.S, 0.5); assert.equal(createGearKit(THREE).S, 0.19, 'default scale');
});
t('revolve: axis x / y / z puts the axial coordinate on that axis; seg + 1 columns per profile segment; coincident points skipped', () => {
  const prof = [[0, 1], [2, 1]];                                              /* a tube of radius 1, length 2, one segment (open) */
  for (const [axis, i] of [['x', 0], ['y', 1], ['z', 2]]) {
    const g = K.revolve(prof, 8, axis, 0, K.TAU, false);
    assert.equal(g.p.length / 3, (8 + 1) * 2); assert.equal(g.i.length, 8 * 6);
    const us = []; for (let k = 0; k < g.p.length; k += 3) us.push(g.p[k + i]); assert.deepEqual([...new Set(us)].sort(), [0, 2]);
  }
  assert.equal(K.revolve([[0, 1], [0, 1], [2, 1]], 4, 'x', 0, K.TAU, false).p.length / 3, (4 + 1) * 2, 'the zero-length segment adds nothing');
});
t('cylinder: closed profile (4 segments: two caps, the wall and the axis closing segment), radius and length as asked', () => {
  const g = K.cylinder('z', 0.3, -1, 1, 12), geo = K.mkGeo(g), b = bbox(geo);
  assert.equal(g.p.length / 3, 4 * (12 + 1) * 2, 'cap, wall, cap and the axis closing segment');
  near(b.max.z, 0.5); near(b.min.z, -0.5); near(b.max.x, 0.15, 1e-6);        /* scaled by S = 0.5 */
});
t('box: 6 faces × 2 triangles, centred where asked, no index (flat)', () => {
  const g = K.box(2, 4, 6, 1, 1, 1); assert.equal(g.p.length / 3, 36); assert.equal(g.i, null);
  const xs = []; for (let k = 0; k < g.p.length; k += 3) xs.push(g.p[k]); near(Math.min(...xs), 0); near(Math.max(...xs), 2);
});
t('merge: concatenates positions and offsets indices; un-indexed parts get sequential indices', () => {
  const a = { p: [0, 0, 0, 1, 0, 0, 0, 1, 0], i: [0, 1, 2] }, b = { p: [0, 0, 1, 1, 0, 1, 0, 1, 1], i: null };
  const m = K.merge([a, b]); assert.equal(m.p.length, 18); assert.deepEqual(m.i, [0, 1, 2, 3, 4, 5]);
  assert.deepEqual(K.merge([a, a]).i, [0, 1, 2, 3, 4, 5]);
});
t('xform: maps every vertex, leaves the source untouched, keeps the index', () => {
  const g = { p: [1, 2, 3, 4, 5, 6], i: [0, 1] }, h = K.xform(g, (x, y, z) => [x + 10, y, -z]);
  assert.deepEqual(h.p, [11, 2, -3, 14, 5, -6]); assert.deepEqual(g.p, [1, 2, 3, 4, 5, 6]); assert.deepEqual(h.i, [0, 1]);
});
t('mkGeo: a BufferGeometry with scaled positions and computed normals', () => {
  const geo = K.mkGeo({ p: [0, 0, 0, 2, 0, 0, 0, 2, 0], i: [0, 1, 2] });
  assert.deepEqual([...geo.getAttribute('position').array], [0, 0, 0, 1, 0, 0, 0, 1, 0]); near(geo.getAttribute('normal').getZ(0), 1);
});
t('bevelGear: N teeth × (2 + 3·stations) quads of 6 vertices, body is a closed revolve, spiral twist moves the teeth but not their count', () => {
  const o = { N: 16, delta: 1.0, dIn: 0.5, dOut: 1.2, toothH: 0.08, stations: 3, boreR: 0.1, hubR: 0.2, hubLen: 0.1 };
  const g = K.bevelGear(o);
  assert.equal(g.teeth.p.length, 16 * (2 + 3 * 3) * 18); assert.equal(g.teeth.i, null);
  assert.ok(g.body.p.length > 0 && g.body.i.length > 0 && g.zEnd > 0);
  const sp = K.bevelGear({ ...o, twist: 0.5 });
  assert.equal(sp.teeth.p.length, g.teeth.p.length); assert.notDeepEqual(sp.teeth.p, g.teeth.p);
  /* the teeth lie on the pitch cone: radius from the axis ≈ distance along the cone × sin(delta) at the outer edge */
  let rmax = 0; for (let k = 0; k < g.teeth.p.length; k += 3) rmax = Math.max(rmax, Math.hypot(g.teeth.p[k], g.teeth.p[k + 1]));
  assert.ok(rmax > 1.2 * Math.sin(1.0) - 0.05 && rmax < 1.2 * Math.sin(1.0) + 0.1, 'tip radius ' + rmax);
});
t('disposeGear: every geometry under the object is released', () => {
  const grp = new THREE.Group(), m = new THREE.MeshBasicMaterial(); let n = 0;
  for (let i = 0; i < 3; i++) { const geo = K.mkGeo(K.cylinder('x', 1, 0, 1, 6)); geo.addEventListener('dispose', () => n++); grp.add(new THREE.Mesh(geo, m)); }
  disposeGear(grp); assert.equal(n, 3);
});
await finish();
