// node tests/safety-summary.test.mjs  (no dependencies)
// B-027 — every page that has a Safety section gets a one-line summary above the fold, from ONE shared piece of code
// (kit.js, the panel's auto-collapse). The Safety section itself stays last (teaching flow first).
import assert from 'node:assert/strict';
import { t, finish, rd, modulePages, pageSource } from './_lib.mjs';

const kit = rd('kit.js'), css = rd('app.css');
const hasSafety = (src) => /<h4>Safety(?:<\\?\/|<\/)h4>|<strong>Safety\.<\/strong>/.test(src);
const SAFE_PAGES = modulePages().filter((f) => hasSafety(pageSource(f)));

t('the shared panel builds the summary line for both authoring forms (section h4 / inline lead-in)', () => {
  assert.match(kit, /const syncSafety = \(\) =>/);
  assert.match(kit, /al-safety-line/);
  assert.match(kit, /\.al-sec/, 'section form');
  assert.match(kit, /querySelectorAll\('strong'\)/, 'inline lead-in form');
  assert.match(kit, /measure = \(\) => \{\s*syncSafety\(\)/, 'runs with every panel measure (tab switch, resize, remeasure)');
});

t('the line is a real button (chromeButton), named, and keyboard-reachable', () => {
  assert.match(kit, /chromeButton\(document, \{ cls: 'al-safety-line'/);
  assert.match(kit, /setAttribute\('aria-label', 'Safety: '/);
});

t('CSS: tokens only, 44 px tall, focus ring, themed (no hex / rgb / hsl colours)', () => {
  const blk = css.slice(css.indexOf('.al-safety-line {'), css.indexOf('/* ---- Badge ---- */'));
  assert.ok(blk.length > 100, 'safety block present');
  assert.match(blk, /min-height:\s*44px/);
  assert.match(blk, /\.al-safety-line:focus-visible/);
  assert.ok(!/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i.test(blk), 'no literal colours');
  assert.match(blk, /var\(--warn\)/);
});

t('every page with a Safety section uses the shared panel (UI.create / runGuidedModule), so it gets the summary', () => {
  assert.ok(SAFE_PAGES.length >= 24, `expected >= 24 pages with a Safety section, found ${SAFE_PAGES.length}`);
  for (const f of SAFE_PAGES) assert.match(pageSource(f), /UI\.create\(|runGuidedModule\(/, f);
});

t('a page that swaps its description on a mode switch and carries Safety text re-syncs (panel.descChanged)', () => {
  for (const f of ['cooling--cooling.html', 'engine--turbo.html', 'fuel--mpfi.html']) {
    assert.match(pageSource(f), /innerHTML\s*=\s*(?:isCRDI|info\.desc)[^;]*;\s*ui\.panel\.descChanged\(\)/, f);
  }
});

t('the Safety section stays last in the Overview of every guided page (owner decision: teaching flow first)', () => {
  for (const f of SAFE_PAGES) {
    const src = pageSource(f), i = src.search(/<h4>Safety/);
    if (i < 0) continue;
    const after = src.slice(i).split(/<h4>/).length - 1;       /* h4 headings after the Safety one inside the same overview string */
    assert.ok(after <= 1, `${f}: another section follows Safety`);
  }
});

finish();
