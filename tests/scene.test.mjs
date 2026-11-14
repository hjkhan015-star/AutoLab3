// node tests/scene.test.mjs  (no dependencies)
// 3D stage rules: camera framing and the label band.
//  • frameScale (dock.js) — how far to dolly the camera back so a model fits the stage; never below `min`, capped, centre-aware.
//  • panelShiftPx (dock.js) — how far the model moves down so it sits in the free band under an open info panel that covers the stage's middle.
//  • bandFromObstacles (labels.js) — the vertical band the labels may use; a full-height rail OUTSIDE the stage must not count
//    (it used to collapse the band on a 1024 x 768 tablet and slide 143 labels under the info panel on 43 pages).
//  • kit.js wiring — framing runs only from the scheduled resize, stops when the camera is moved by anyone, and can be switched off.
import assert from 'node:assert/strict';
import { t, finish, rd, appURL } from './_lib.mjs';

const { frameScale, panelShiftPx } = await import(appURL('core/dock.js').href);
const { bandFromObstacles } = await import(appURL('core/labels.js').href);

t('frameScale: a model that fits needs no dolly', () => {
  assert.equal(frameScale({ l: 60, r: 330, t: 150, b: 400 }, 390, 600), 1);
});
t('frameScale: a model cut off at the sides is pulled back until it fits (with the margin)', () => {
  const k = frameScale({ l: -30, r: 420, t: 200, b: 360 }, 390, 600);          // 450 px wide on a 390 px stage
  assert.ok(k > 1.1 && k < 1.4, 'k=' + k);
  const after = (450 / k);                                                      // projected size scales with 1/k about the centre
  assert.ok(after <= 390 * (1 - 0.06) + 0.5, 'still too wide after the dolly: ' + after);
});
t('frameScale: an off-centre model is judged from its farthest edge, not its width', () => {
  const centred = frameScale({ l: 100, r: 290, t: 200, b: 360 }, 390, 600);     // 190 px wide, centred
  const offCentre = frameScale({ l: 200, r: 400, t: 200, b: 360 }, 390, 600);   // 200 px wide, cut off on the right
  assert.equal(centred, 1); assert.ok(offCentre > 1, 'off-centre cut-off not detected');
});
t('frameScale: the result is capped, and a view offset moves the dolly centre', () => {
  assert.equal(frameScale({ l: -3000, r: 3000, t: 0, b: 600 }, 390, 600), 1.4);
  assert.equal(frameScale({ l: 0, r: 390, t: 0, b: 600 }, 390, 600, 195, 300, 0.03, 2), frameScale({ l: 0, r: 390, t: 0, b: 600 }, 390, 600, 195, 300, 0.03, 2));
  const ext = { l: 100, r: 290, t: 70, b: 570 };
  assert.equal(frameScale(ext, 390, 600, 195, 300), 1);
  assert.ok(frameScale(ext, 390, 600, 195, 270) > 1, 'a view offset moves the principal point, so the bottom edge is now closer to being cut off');
});
t('frameScale: min < 1 lets a pulled-back camera come in again; garbage input means "no change"', () => {
  assert.ok(frameScale({ l: 150, r: 240, t: 250, b: 350 }, 390, 600, 195, 300, 0.03, 1.4, 0.2) < 1);
  assert.equal(frameScale({ l: 150, r: 240, t: 250, b: 350 }, 390, 600), 1);
  assert.equal(frameScale(null, 390, 600), 1);
  assert.equal(frameScale({ l: NaN, r: 1, t: 1, b: 1 }, 390, 600), 1);
  assert.equal(frameScale({ l: 0, r: 1, t: 0, b: 1 }, 0, 600), 1);
});

/* the 1024 x 768 landscape tablet from audit-scripts/scene7.py: stage 280..744, info panel (top stack) 296..728 x 44..374,
   readout rail (ui-slot-tr) is the full-height column at 744..1024 */
const stage = { left: 280, right: 744, top: 32 };
const panel = { side: 'top', rect: { left: 296, right: 728, top: 44, bottom: 374 } };
const rail = { side: 'top', rect: { left: 744, right: 1024, top: 32, bottom: 768 } };
const H = 736;
/* the rule before this fix, kept here as the negative control */
const oldBand = (items) => { let top = 8, bottom = H - 8; for (const it of items) { const r = it.rect; if (!(r.bottom - r.top > 4)) continue; if (it.side === 'top') top = Math.max(top, r.bottom - stage.top + 10); else bottom = Math.min(bottom, r.top - stage.top - 10); } return bottom - top < 150 ? [8, H - 8] : [top, bottom]; };

t('label band: the readout rail outside the stage is ignored, the info panel inside it is honoured', () => {
  assert.deepEqual(oldBand([panel, rail]), [8, 728], 'negative control: the old rule collapsed the band');
  const [top, bottom] = bandFromObstacles(stage, [panel, rail], H);
  assert.equal(top, 374 - 32 + 10); assert.equal(bottom, H - 8);
});
t('label band: phone portrait (header strip on top, dock below) and the degenerate fallback', () => {
  const ps = { left: 0, right: 390, top: 32 };
  const [top, bottom] = bandFromObstacles(ps, [{ side: 'top', rect: { left: 8, right: 382, top: 36, bottom: 64 } }, { side: 'bottom', rect: { left: 8, right: 382, top: 641, bottom: 836 } }], 609);
  assert.equal(top, 64 - 32 + 10); assert.equal(bottom, 641 - 32 - 10);   // the dock's top edge, 10 px clear
  assert.deepEqual(bandFromObstacles(ps, [{ side: 'top', rect: { left: 0, right: 390, top: 32, bottom: 500 } }], 609), [8, 601], 'no room: ignore the UI rather than squash the labels');
});
t('label band: empty and zero-height obstacles are ignored; a sliver of overlap does not count', () => {
  assert.deepEqual(bandFromObstacles(stage, [], H), [8, 728]);
  assert.deepEqual(bandFromObstacles(stage, [{ side: 'top', rect: { left: 296, right: 728, top: 44, bottom: 46 } }], H), [8, 728]);
  assert.deepEqual(bandFromObstacles(stage, [{ side: 'top', rect: { left: 730, right: 1000, top: 44, bottom: 374 } }], H), [8, 728]);
});

const kit = rd('kit.js');
t('kit.js: framing runs only from a scheduled resize, never from the synchronous first call', () => {
  assert.match(kit, /raf = requestAnimationFrame\(\(\) => \{ raf = 0; resize\(true\); \}\);/);
  assert.match(kit, /\n  resize\(false\);/);
  assert.match(kit, /if \(fit\) fitModel\(camera, w, h, dy\);/);
});
t('kit.js: framing stops for good once the camera is moved by the user or the module, and can be switched off', () => {
  assert.match(kit, /f\.off = true; return;/);
  assert.match(kit, /Math\.abs\(dist - f\.last\) > 0\.02/);
  assert.match(kit, /opts\.frame === false \? null :/);
  assert.match(kit, /__noFrame/);
});
t('kit.js: framing never brings the camera closer than the authored distance and is capped', () => {
  const fc = kit.match(/const FRAME_MAX = ([\d.]+), FRAME_SKIP = ([\d.]+), FLOOR_CLEAR = 0\.12;/);
  assert.ok(fc, 'the FRAME_MAX / FRAME_SKIP / FLOOR_CLEAR line moved: update this rule with it');
  assert.ok(+fc[1] > 1 && +fc[1] <= 2.5, `FRAME_MAX ${fc[1]}: the dolly stays capped (more than 1x, at most 2.5x)`);
  assert.ok(+fc[2] > +fc[1] && +fc[2] <= 3, `FRAME_SKIP ${fc[2]}: above the cap, and a model needing more than this is scenery (authored camera kept)`);
  assert.match(kit, /k >= FRAME_SKIP \? lo/);
  assert.match(kit, /top < floorY \+ FLOOR_CLEAR/);
  assert.match(kit, /Math\.max\(f\.authored, f\.controls\.minDistance \|\| 0\)/);
  assert.match(kit, /\(f\.controls\.maxDistance \|\| 1e9\) \* 0\.98/);
});
t('labels.js: the band is computed by the pure rule, not by ad-hoc code', () => {
  const l = rd('labels.js');
  assert.match(l, /bandFromObstacles\(\{ left: stage\.left/);
  assert.ok(!/const bumpTop/.test(l), 'the old per-id bump helpers are back');
});
t('labels.js: a label is measured after its tier styling is applied, and a tier change re-measures it (B-032)', () => {
  const l = rd('labels.js');
  const iTier = l.indexOf('r.el.dataset.tier = r.tier');
  const iSize = l.indexOf('const b = r.el.getBoundingClientRect();');
  assert.ok(iTier > 0 && iSize > 0, 'the tier assignment or the measuring call moved: update this rule with it');
  assert.ok(iTier < iSize, 'the label is measured before data-tier (font size / weight / padding) is applied: right-column labels then end past the edge');
  assert.match(l, /r\.lastTier = r\.tier;\s*r\.sized = false;/, 'a tier change must invalidate the measured size');
  assert.equal((l.match(/r\.el\.dataset\.tier = r\.tier/g) || []).length, 1, 'the tier is applied in one place only');
});
t('app.css: a label longer than its max width is cut with an ellipsis inside the pill instead of running out of it (B-032)', () => {
  const css = rd('app.css').replace(/\s+/g, ' ');
  const m = css.match(/\.label3d-text \{([^}]*)\}/);
  assert.ok(m, 'there is no .label3d-text rule');
  assert.match(m[1], /overflow: hidden/);
  assert.match(m[1], /text-overflow: ellipsis/);
  assert.match(m[1], /min-width: 0/);
});
t('kit.js: the camera fit waits out a module start-up camera move and ends for good at the first user gesture (B-031 follow-up)', () => {
  const k = rd('kit.js');
  assert.match(k, /FRAME_SETTLE_MS = \d+/, 'the watch window is a named constant');
  assert.match(k, /controls\.addEventListener\('start', \(\) => \{ f\.user = true; \}\)/, 'a user gesture is recorded');
  assert.match(k, /if \(f\.settling && !f\.user\)/, 'inside the window a module camera move re-baselines the fit instead of switching it off');
  assert.match(k, /f\.off = true; return;/, 'outside the window (or after a user gesture) a camera move still switches the fit off for good');
  assert.match(k, /setInterval\(/, 'the watch polls for the camera coming to rest');
  assert.ok(k.indexOf('FRAME_SETTLE_MS') < k.indexOf('function fitModel'), 'the constant is declared before it is used');
});
t('components.js: a guided module can raise its own zoom-out limit with CFG.maxDistance; airfilter needs it (framing follow-up)', () => {
  const c = rd('components.js');
  assert.match(c, /if \(CFG\.maxDistance\) controls\.maxDistance = CFG\.maxDistance;/, 'components.js applies CFG.maxDistance after buildScene');
  const a = rd('airfilter.html').match(/"maxDistance": ([\d.]+)/);
  assert.ok(a && +a[1] > 16, 'airfilter sets maxDistance above the 16-unit default: its fit needs about 20 units on a phone');
});
t('panelShiftPx: an open panel over the stage centre moves the model to the middle of the free band below it', () => {
  const stage = { left: 280, top: 32, width: 464, height: 736 }, panel = { left: 297, right: 635, bottom: 373 };   // the 1024 x 768 tablet
  const dy = panelShiftPx(stage, panel);
  assert.equal(dy, Math.round((373 + 8 - 32) / 2));                      // half of what the panel covers (plus the gap)
  assert.ok(stage.top + stage.height / 2 + dy > panel.bottom, 'the new centre must lie below the panel');
});
t('panelShiftPx: 0 for a corner card that misses the centre line, a closed / missing panel, a panel above the stage, garbage input', () => {
  const stage = { left: 0, top: 48, width: 1100, height: 700 };
  assert.equal(panelShiftPx(stage, { left: 16, right: 356, bottom: 400 }), 0);   // wide desktop: the card is a left column, the model is not under it
  assert.equal(panelShiftPx(stage, null), 0);
  assert.equal(panelShiftPx({ left: 0, top: 100, width: 400, height: 600 }, { left: 0, right: 400, bottom: 80 }), 0);
  assert.equal(panelShiftPx(null, { left: 0, right: 1, bottom: 1 }), 0);
  assert.equal(panelShiftPx({ left: 0, top: 0, width: 0, height: 600 }, { left: 0, right: 1, bottom: 1 }), 0);
});
t('panelShiftPx: capped, so a very tall panel cannot push the model off the stage', () => {
  const stage = { left: 0, top: 0, width: 400, height: 500 };
  assert.equal(panelShiftPx(stage, { left: 0, right: 400, bottom: 480 }), 150);   // 30 % of the stage height
});
t('kit.js wiring: the panel shift is subtracted from the phone shift, only for an expanded #edu-panel on a non-phone, and a panel resize re-frames', () => {
  const k = rd('app/core/kit.js');
  assert.match(k, /base = modelShiftPx\(w, h, window\.innerWidth, window\.innerHeight\), pan = panelShift\(w, h\), dy = base - pan/, 'view offset must combine the phone shift and the panel shift');
  assert.match(k, /classList\.contains\('expanded'\) \|\| isPhone\(/, 'the shift is for an expanded panel on a non-phone only');
  assert.match(k, /new ResizeObserver\(\(\) => schedule\(\)\)\.observe\(p\)/, 'a panel height change must re-run the framing');
});

t('kit.js wiring: a model too big for the free band keeps its place (the panel shift gives back only the part that would crop it)', () => {
  const k = rd('app/core/kit.js');
  assert.match(k, /ext\.b > room\) offset\(base - Math\.max\(0, pan - Math\.ceil\(ext\.b - room\)\)\)/, 'the bottom-edge clamp is missing');
});

finish();
