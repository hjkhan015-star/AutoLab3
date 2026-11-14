// shared/part-canvas.js — painted CanvasTexture (needs a DOM: jsdom, with a stubbed 2-D context).
import assert from 'node:assert/strict';
import { t, finish, loadJSDOM, skip } from './_lib.mjs';
const JSDOM = loadJSDOM();
if (!JSDOM) skip('part-canvas DOM tests', 'jsdom not installed (run npm install)');
else {
  const THREE = await import('../app/assets/three.module.js');
  const dom = new JSDOM('<!doctype html><body></body>');
  globalThis.document = dom.window.document;
  const ctx = { calls: [], fillRect(...a) { this.calls.push(a); } };
  dom.window.HTMLCanvasElement.prototype.getContext = () => ctx;
  const { canvasTexture, paintCanvas, textureFromCanvas, disposeCanvasTexture } = await import('../app/shared/part-canvas.js');

  await t('canvasTexture: canvas is w × h, draw gets (ctx, w, h) once, defaults = sRGB, clamped, anisotropy untouched', () => {
    ctx.calls.length = 0; let seen = null;
    const tex = canvasTexture(THREE, 64, 32, (g, w, h) => { seen = [g === ctx, w, h]; g.fillRect(0, 0, w, h); });
    assert.deepEqual(seen, [true, 64, 32]); assert.equal(ctx.calls.length, 1);
    assert.ok(tex.isCanvasTexture); assert.equal(tex.image.width, 64); assert.equal(tex.image.height, 32);
    assert.equal(tex.colorSpace, THREE.SRGBColorSpace); assert.equal(tex.wrapS, THREE.ClampToEdgeWrapping); assert.equal(tex.anisotropy, 1);
  });
  await t('canvasTexture: srgb:false → NoColorSpace; wrap → RepeatWrapping on both axes; repeat [x, y]; anisotropy', () => {
    const tex = canvasTexture(THREE, 8, 8, () => {}, { srgb: false, wrap: true, repeat: [3, 2], anisotropy: 8 });
    assert.equal(tex.colorSpace, THREE.NoColorSpace); assert.equal(tex.wrapS, THREE.RepeatWrapping); assert.equal(tex.wrapT, THREE.RepeatWrapping);
    assert.deepEqual(tex.repeat.toArray(), [3, 2]); assert.equal(tex.anisotropy, 8);
  });
  await t('paintCanvas / textureFromCanvas: no draw callback → no 2-D context requested; the texture wraps exactly that canvas', () => {
    let asked = 0; dom.window.HTMLCanvasElement.prototype.getContext = () => { asked++; return ctx; };
    const cv = paintCanvas(10, 20); assert.equal(asked, 0); assert.equal(cv.width, 10); assert.equal(cv.height, 20);
    assert.equal(textureFromCanvas(THREE, cv).image, cv); paintCanvas(4, 4, () => {}); assert.equal(asked, 1);
    dom.window.HTMLCanvasElement.prototype.getContext = () => ctx;
  });
  await t('disposeCanvasTexture: releases the texture and empties the canvas', () => {
    const tex = canvasTexture(THREE, 16, 16, () => {}); let d = 0; tex.addEventListener('dispose', () => d++);
    disposeCanvasTexture(tex); assert.equal(d, 1); assert.equal(tex.image.width, 0);
  });
}
await finish();
