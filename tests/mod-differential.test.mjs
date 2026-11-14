// Differential: physics of shared/model-drivetrain.js + the module page really uses it.
import assert from 'node:assert/strict';
import * as M from '../app/shared/model-drivetrain.js';
import { t, finish, rd, loadJSDOM, skip } from './_lib.mjs';
const near = (a, b, e = 1e-9, m = '') => assert.ok(Math.abs(a - b) <= e, `${m} ${a} vs ${b}`);

/* ── kinematics: ω_carrier = (ω_L + ω_R) / 2 in every mode ── */
t('open: the carrier is the mean of the axles, whatever the turn ratio', () => {
  for (const r of [-0.4, -0.1, 0, 0.1, 0.4]) { const { wL, wR } = M.axleSpeeds('open', 2.2, r); near(M.carrierSpeed(wL, wR), 2.2, 1e-12, 'r=' + r); }
});
t('open: straight = equal speeds; the outer wheel is faster by exactly (1 + r) / (1 − r)', () => {
  const s = M.axleSpeeds('open', 2, 0); assert.equal(s.wL, s.wR);
  const t2 = M.axleSpeeds('open', 2, 0.25); near(t2.wL / t2.wR, 1.25 / 0.75); assert.equal(t2.slip, false);
});
t('turn ratio = (half track / wheelbase) · tan(road angle); sign follows the road angle', () => {
  near(M.turnRatio(1.5, 2.8, 0), 0); near(M.turnRatio(1.5, 2.8, 0.3), (1.5 / 2.8) * Math.tan(0.3)); near(M.turnRatio(1.5, 2.8, -0.3), -M.turnRatio(1.5, 2.8, 0.3));
});
t('locked: both axles at the carrier speed even in a turn, and a slip request does not change that', () => {
  assert.deepEqual(M.axleSpeeds('locked', 3, 0.3), { wL: 3, wR: 3, slip: false });
});
t('open + a wheel with no grip: that wheel spins at 2 ω_c, the other stands still (sum still 2 ω_c)', () => {
  const l = M.axleSpeeds('slipLeft', 1.5, 0), r = M.axleSpeeds('slipRight', 1.5, 0);
  assert.deepEqual(l, { wL: 3, wR: 0, slip: true }); assert.deepEqual(r, { wL: 0, wR: 3, slip: true });
  near(M.carrierSpeed(l.wL, l.wR), 1.5);
});

/* ── gear ratios ── */
t('final drive: 40 : 10 crown / pinion = 4 : 1; the pinion turns four times per carrier turn', () => {
  assert.equal(M.finalDriveRatio(40, 10), 4); assert.equal(M.finalDriveRatio(41, 11) > 3.7, true);
});
t('spider gears: still when both axles match, turning when they differ, opposite sign for opposite turns, scaled by the tooth ratio', () => {
  assert.equal(M.spiderSpeed(2, 2, 14, 10), 0);
  near(M.spiderSpeed(3, 1, 14, 10), (3 - 1) * 0.5 * 1.4); near(M.spiderSpeed(1, 3, 14, 10), -M.spiderSpeed(3, 1, 14, 10));
});

t('tooth counts and pitch cones: 40 : 10 crown / pinion, 14 : 10 side / spider; each meshing pair\'s half angles add up to 90°', () => {
  assert.deepEqual({ ...M.DIFF_TEETH }, { crown: 40, pinion: 10, side: 14, spider: 10 });
  assert.equal(M.finalDriveRatio(M.DIFF_TEETH.crown, M.DIFF_TEETH.pinion), 4);
  const c = M.pitchCones(); near(c.pinion + c.crown, Math.PI / 2); near(c.spider + c.side, Math.PI / 2);
  near(Math.tan(c.pinion), 10 / 40); near(Math.tan(c.spider), 10 / 14); assert.throws(() => { M.DIFF_TEETH.crown = 1; }, 'frozen');
});

/* ── torque: open / limited slip / locked ── */
const sum = (x) => x.L + x.R;
t('full grip: every type splits torque 50 / 50', () => {
  for (const b of [M.BIAS_OPEN, 2.5, M.BIAS_LOCKED]) { const x = M.torqueSplit(1, 1, 1, b); near(x.L, 0.5); near(x.R, 0.5); }
});
t('open differential: the weak wheel sets the limit for both (torque lost)', () => {
  const x = M.torqueSplit(1, 0.1, 1, M.BIAS_OPEN); near(x.L, 0.1); near(x.R, 0.1); near(sum(x), 0.2);
  const y = M.torqueSplit(1, 1, 0.1, M.BIAS_OPEN); near(y.L, 0.1); near(y.R, 0.1);
});
t('locked differential: the strong wheel takes everything the weak one cannot (10 / 90)', () => {
  const x = M.torqueSplit(1, 0.1, 1, M.BIAS_LOCKED); near(x.L, 0.1); near(x.R, 0.9); near(sum(x), 1);
  const y = M.torqueSplit(1, 1, 0.1, M.BIAS_LOCKED); near(y.L, 0.9); near(y.R, 0.1);
});
t('limited slip: the strong wheel gets up to bias × the weak wheel; bias 1 = open, a big bias = locked', () => {
  const lsd = M.torqueSplit(1, 0.1, 1, 3); near(lsd.L, 0.1); near(lsd.R, 0.3);
  assert.deepEqual(M.torqueSplit(1, 0.1, 1, 1), M.torqueSplit(1, 0.1, 1, M.BIAS_OPEN));
  near(M.torqueSplit(1, 0.1, 1, 50).R, 0.9);
});
t('a wheel with zero grip (ice): open and a torque-bias LSD deliver nothing, only a locked differential still drives (no NaN)', () => {
  assert.deepEqual(M.torqueSplit(1, 0, 1, M.BIAS_OPEN), { L: 0, R: 0 });
  assert.deepEqual(M.torqueSplit(1, 0, 1, 3), { L: 0, R: 0 });                 /* a bias multiplies the weak wheel's torque: 3 × 0 = 0 */
  assert.deepEqual(M.torqueSplit(1, 0, 1, M.BIAS_LOCKED), { L: 0, R: 1 });
});
t('torque never exceeds the input, and never exceeds a wheel\'s grip', () => {
  for (const [gL, gR] of [[0.1, 1], [1, 0.1], [0.3, 0.6], [2, 2]]) for (const b of [1, 2, Infinity]) {
    const x = M.torqueSplit(1, gL, gR, b); assert.ok(sum(x) <= 1 + 1e-12); assert.ok(x.L <= gL + 1e-12 && x.R <= gR + 1e-12);
  }
});

/* ── the module page uses the model and keeps the guided-page shape ── */
t('differential page: model imported and used; steering axis; no panel readout; dead items gone; dual gap wired', () => {
  const s = rd('differential.html');
  assert.match(s, /from '\.\.\/shared\/model-drivetrain\.js'/);
  for (const fn of ['axleSpeeds', 'turnRatio', 'spiderSpeed', 'finalDriveRatio', 'torqueSplit']) assert.match(s, new RegExp(fn + '\\('), fn + ' used');
  assert.match(s, /id: 'turn', label: 'Steering', type: 'axis'/);
  assert.ok(!/readout:\s*`/.test(s) && !/data-diff=|diff-row|wheel-speed-extra/.test(s), 'no panel readout');
  for (const dead of ['isMidEnd', 'BEVEL_SEGS', 'makeSpiralBevelGear', 'PINION_Y', 'SIDE_R', 'SPIDER_R', 'CARRIER_W']) assert.ok(!new RegExp('\\b' + dead + '\\b').test(s), dead + ' removed');
  assert.match(s, /showDual \* DUAL_TYRE_GAP/);
  assert.ok(!/#[0-9a-fA-F]{6}\b/.test((s.match(/<style[^>]*>[^]*?<\/style>/g) || []).join('')), 'tokens only in <style>');
});

/* ── DOM: the module's own Steering axis spec, and the Auto Drive hand-over it relies on ── */
const JSDOM = loadJSDOM();
if (!JSDOM) skip('differential DOM tests', 'jsdom not installed (run npm install)');
else {
  const dom = new JSDOM('<!doctype html><body></body>');
  globalThis.document = dom.window.document; globalThis.window = dom.window;
  const { createAxis, registry } = await import('../app/core/controls.js');
  const src = rd('differential.html');
  const specText = /\{ id: 'turn', label: 'Steering'[^}]*\}/.exec(src)[0];
  const SPEC = new Function('return (' + specText + ')')();                    /* the real spec, not a copy */
  const mk = () => { registry.reset(); const ax = createAxis(SPEC); document.body.appendChild(ax.el); return ax; };
  const key = (ax, k) => ax.input.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: k, bubbles: true }));

  await t('Steering axis: −100 … +100 %, starts centred, value text carries the sign and %, one root node', () => {
    const ax = mk();
    assert.equal(ax.value(), 0); assert.equal(document.querySelectorAll('[data-ctl="turn"]').length, 1);
    ax.setValue(37); assert.equal(ax.value(), 37); assert.match(ax.input.getAttribute('aria-valuetext'), /37\s?%/);
    ax.setValue(-100); assert.equal(ax.value(), -100); ax.setValue(250); assert.equal(ax.value(), 100, 'clamped');
  });
  await t('Steering axis: centre detent (|v| ≤ 3 snaps to 0), Home recentres, Reset recentres', () => {
    const ax = mk();
    ax.setValue(2); assert.equal(ax.value(), 0); ax.setValue(-3); assert.equal(ax.value(), 0); ax.setValue(5); assert.equal(ax.value(), 5);
    ax.setValue(60); key(ax, 'Home'); assert.equal(ax.value(), 0);
    ax.setValue(-60); ax.reset(); assert.equal(ax.value(), 0);
  });
  await t('Auto Drive hand-over: a listener fires synchronously on a user change but not for the module\'s own guarded write; Reset can be guarded', () => {
    const ax = mk();
    let autoWriting = false, auto = true;
    ax.on(() => { if (!autoWriting) auto = false; });
    autoWriting = true; ax.setValue(20); autoWriting = false;
    assert.equal(auto, true, 'Auto Drive writing the axis does not hand over');
    ax.input.value = String(Math.round(0.8 * Number(ax.input.max))); ax.input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    assert.equal(auto, false, 'a user change hands the steering back, synchronously');
    auto = true; autoWriting = true; ax.reset(); autoWriting = false;
    assert.equal(auto, true); assert.equal(ax.value(), 0, 'guarded Reset recentres and keeps Auto Drive');
  });
}
await finish();
