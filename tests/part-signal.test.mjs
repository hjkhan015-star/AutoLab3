// shared/part-signal.js — signal particles along a link: build, flow, dispose.
import assert from 'node:assert/strict';
import * as THREE from '../app/assets/three.module.js';
import * as S from '../app/shared/part-signal.js';
import { t, finish } from './_lib.mjs';
const v = (x, y, z) => new THREE.Vector3(x, y, z);
const geo = new THREE.SphereGeometry(0.05, 6, 5);
const near = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) <= e, `${a} vs ${b}`);

t('makeSignalLink: count particles added to the parent, endpoints cloned, plain vs additive materials', () => {
  const parent = new THREE.Group(), a = v(0, 0, 0), b = v(2, 0, 0);
  const plain = S.makeSignalLink(THREE, parent, geo, a, b, 0x38bdf8, { count: 2 });
  const add = S.makeSignalLink(THREE, parent, geo, a, b, 0xff0000, { additive: true });
  assert.equal(plain.parts.length, 2); assert.equal(add.parts.length, 4); assert.equal(parent.children.length, 6);
  a.x = 9; assert.equal(plain.a.x, 0, 'endpoints are cloned');
  assert.equal(plain.parts[0].material.transparent, false);
  assert.ok(add.parts[0].material.transparent && add.parts[0].material.blending === THREE.AdditiveBlending && add.parts[0].material.depthWrite === false);
  assert.ok(plain.parts.every((p) => p.geometry === geo), 'one shared geometry');
});
t('flowSignalLinks: particles stay on the segment, staggered by i / n, advance with time, wrap around, scale peaks mid-link', () => {
  const L = S.makeSignalLink(THREE, new THREE.Group(), geo, v(0, 0, 0), v(4, 0, 0), 0xffffff, { count: 4 });
  S.flowSignalLinks([L], 0, 1, { base: 0.5, amp: 0.6 });
  assert.deepEqual(L.parts.map((p) => p.position.x), [0, 1, 2, 3]);
  near(L.parts[2].scale.x, 0.5 + 0.6);                                      /* u = 0.5 → sin = 1 */
  S.flowSignalLinks([L], 0.25, 1);
  assert.deepEqual(L.parts.map((p) => p.position.x), [1, 2, 3, 0]);          /* wrapped */
  S.flowSignalLinks([L], -0.25, 1); assert.ok(L.parts.every((p) => p.position.x >= 0 && p.position.x <= 4), 'negative time stays on the link');
});
t('flowSignalLinks: fade drives opacity and visibility; a dead link hides its particles; non-fade leaves visibility alone', () => {
  const L = S.makeSignalLink(THREE, new THREE.Group(), geo, v(0, 0, 0), v(1, 0, 0), 0xffffff, { additive: true });
  S.flowSignalLinks([L], 0.5, 1, { fade: true });
  near(L.parts[0].material.opacity, 0.35 + 0.65 * Math.sin(Math.PI * L.parts[0].position.x));
  L.dead = true; S.flowSignalLinks([L], 0.5, 1, { fade: true }); assert.ok(L.parts.every((p) => !p.visible));
  const M = S.makeSignalLink(THREE, new THREE.Group(), geo, v(0, 0, 0), v(1, 0, 0), 0xffffff);
  M.parts[0].visible = false; S.flowSignalLinks([M], 0.3, 1); assert.equal(M.parts[0].visible, false);
});
t('disposeSignalLinks: removes the particles from the scene and releases their materials, never the shared geometry', () => {
  const parent = new THREE.Group(); let m = 0, g = 0;
  geo.addEventListener('dispose', () => g++);
  const L = S.makeSignalLink(THREE, parent, geo, v(0, 0, 0), v(1, 0, 0), 0xffffff, { count: 3 });
  L.parts.forEach((p) => p.material.addEventListener('dispose', () => m++));
  S.disposeSignalLinks([L]);
  assert.equal(parent.children.length, 0); assert.equal(m, 3); assert.equal(g, 0);
});
await finish();
