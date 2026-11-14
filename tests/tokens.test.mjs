// node tests/tokens.test.mjs  (no dependencies)
// One scale for the whole app: spacing, type size, motion duration and easing come from tokens (core/app.css, @layer tokens).
//  • padding / margin / gap  -> var(--s-*)       (a 1 px hairline, 0 and negative optical offsets are allowed)
//  • font-size               -> var(--fs-*)      (no px literal at all)
//  • transition / animation  -> var(--dur-*) and var(--ease-*) (0s, `linear` and `steps()` allowed; ambient loops — `infinite`,
//                               or longer than .5 s — are exempt, they are scenery, not interface motion)
//  • font: shorthand         -> size from var(--fs-*), no px / rem / em / pt size; line-height and letter-spacing take no px literal (unitless / em are fine)
//  • inline style="" attributes in the page HTML follow the same rules
// Literals inside a var() fallback (var(--dur-base, .2s)) are fine: they never apply while app.css is loaded.
// Scanned: core/*.css and the <style> blocks of every page (modules/*.html, index.html, 404.html).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { t, finish, APP, listDir, modulePages } from './_lib.mjs';

const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
const stripFallbacks = (s) => s.replace(/var\(\s*(--[\w-]+)\s*,[^()]*\)/g, 'var($1)');
const styleBlocks = (html) => [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);

function sources() {
  const out = [];
  for (const f of listDir('core').filter((x) => x.endsWith('.css'))) out.push({ file: 'core/' + f, css: stripComments(fs.readFileSync(path.join(APP, 'core', f), 'utf8')) });
  for (const f of ['index.html', '404.html']) styleBlocks(fs.readFileSync(path.join(APP, f), 'utf8')).forEach((css) => out.push({ file: f, css: stripComments(css) }));
  for (const f of modulePages()) styleBlocks(fs.readFileSync(path.join(APP, 'modules', f), 'utf8')).forEach((css) => out.push({ file: 'modules/' + f, css: stripComments(css) }));
  for (const f of ['index.html', '404.html', ...modulePages().map((x) => 'modules/' + x)]) {
    const html = fs.readFileSync(path.join(APP, f), 'utf8').replace(/<style[^>]*>[\s\S]*?<\/style>/g, '');
    for (const m of html.matchAll(/\sstyle="([^"]*)"/g)) out.push({ file: f, css: `.inline{${m[1]}}` });
  }
  return out;
}

/* named layout dimensions that are not spacing choices: a width reserved for a fixed side panel, a bottom clearance for the nav bar,
   the room an icon needs. Each is `file :: value`. Adding one needs a reason here. */
const SPACE_EXCEPTIONS = new Set([
  'core/controls.css :: 22px',     /* .ui-monitor.has-card .mon-head: clear of the ⌄ icon (22 px glyph) */
  'index.html :: 96px',            /* home list bottom padding: clears the 96 px nav bar */
  'modules/ecu--sensors.html :: 232px', /* body padding-right: room for the fixed side readout */
]);
/* type literals that stay: `file :: value`, each with its reason */
const TYPE_EXCEPTIONS = new Set([
  '404.html :: 16px',  /* the 404 page must render without app.css, so it carries its own base size */
]);

const SPACE_PROP = /(?<![-\w])(?:padding|margin)(?:-(?:top|right|bottom|left|inline|block|inline-start|inline-end|block-start|block-end))?\s*:\s*([^;{}]+)|(?<![-\w])(?:row-gap|column-gap|gap)\s*:\s*([^;{}]+)/g;
const FONT_PROP = /(?<![-\w])font-size\s*:\s*([^;{}]+)/g;
const FONT_SHORT = /(?<![-\w])font\s*:\s*([^;{}]+)/g;
const LINE_PROP = /(?<![-\w])(?:line-height|letter-spacing)\s*:\s*([^;{}]+)/g;
const ABS_SIZE = /(?<![\w#.-])(\d*\.?\d+)(px|rem|em|pt)\b/g;
const MOTION_PROP = /(?<![-\w])(transition|animation)(?:-duration|-timing-function)?\s*:\s*([^;{}]+)/g;
const PX = /(?<![\w#.-])(\d*\.?\d+)px\b/g;   /* also matches .5px (no leading zero) */
const TIME = /^(\d*\.?\d+)(ms|s)$/;

function splitTop(v) { const o = []; let d = 0, c = ''; for (const ch of v) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && d === 0) { o.push(c); c = ''; } else c += ch; } o.push(c); return o; }
function splitWs(v) { const o = []; let d = 0, c = ''; for (const ch of v) { if (ch === '(') d++; if (ch === ')') d--; if (/\s/.test(ch) && d === 0) { if (c) o.push(c); c = ''; } else c += ch; } if (c) o.push(c); return o; }

/** returns a list of violation strings for one CSS text */
export function check(file, css0) {
  const css = stripFallbacks(css0); const bad = [];
  for (const m of css.matchAll(SPACE_PROP)) {
    const val = m[1] ?? m[2];
    for (const p of val.matchAll(PX)) {
      const x = parseFloat(p[1]); if (x === 0 || x === 1) continue;
      if (SPACE_EXCEPTIONS.has(`${file} :: ${p[0]}`)) continue;
      bad.push(`${file}: spacing literal ${p[0]} in "${m[0].trim()}" — use var(--s-*)`);
    }
  }
  for (const m of css.matchAll(FONT_PROP)) for (const p of m[1].matchAll(PX)) bad.push(`${file}: font-size literal ${p[0]} in "${m[0].trim()}" — use var(--fs-*)`);
  for (const m of css.matchAll(FONT_SHORT)) for (const p of m[1].matchAll(ABS_SIZE)) { if (TYPE_EXCEPTIONS.has(`${file} :: ${p[0]}`)) continue; bad.push(`${file}: font shorthand size ${p[0]} in "${m[0].trim()}" — use var(--fs-*)`); }
  for (const m of css.matchAll(LINE_PROP)) for (const p of m[1].matchAll(PX)) bad.push(`${file}: ${m[0].split(':')[0].trim()} literal ${p[0]} in "${m[0].trim()}" — use a unitless or em value`);
  for (const m of css.matchAll(MOTION_PROP)) {
    const kind = m[1];
    for (const item of splitTop(m[2].replace(/\s*!important\s*$/, ''))) {
      const toks = splitWs(item.trim()); if (!toks.length || toks[0] === 'none') continue;
      if (kind === 'animation') { const i = toks.findIndex((x) => TIME.test(x)); if (toks.includes('infinite') || (i >= 0 && secs(toks[i]) > 0.5)) continue; }
      let first = true;
      for (const tk of toks) {
        if (TIME.test(tk)) { const s = secs(tk); if (first && s !== 0) bad.push(`${file}: duration literal ${tk} in "${m[0].trim()}" — use var(--dur-*)`); first = false; }
        if (/^(ease|ease-in|ease-out|ease-in-out)$/.test(tk) || tk.startsWith('cubic-bezier(')) bad.push(`${file}: easing literal ${tk} in "${m[0].trim()}" — use var(--ease-*)`);
      }
    }
  }
  return bad;
}
function secs(t) { const m = TIME.exec(t); return parseFloat(m[1]) / (m[2] === 'ms' ? 1000 : 1); }

const SRC = sources();

t('spacing, type size and motion in every stylesheet and page come from tokens', () => {
  const bad = SRC.flatMap((s) => check(s.file, s.css));
  assert.deepEqual(bad, [], `${bad.length} literal(s):\n  ` + bad.slice(0, 25).join('\n  '));
});

t('the checker fails on literals (negative control)', () => {
  assert.equal(check('x.css', '.a { padding: 10px 12px; }').length, 2);
  assert.equal(check('x.css', '.a { margin-top: 5px; gap: 3px }').length, 2);
  assert.equal(check('x.css', '.a { font-size: 13px; }').length, 1);
  assert.equal(check('x.css', '.a { transition: opacity .2s ease-out; }').length, 2);
  assert.equal(check('x.css', '.a { transition: opacity var(--dur-base) cubic-bezier(.3,.9,.3,1); }').length, 1);
  assert.equal(check('x.css', '.a { animation: pop 200ms var(--ease-out); }').length, 1);
  assert.equal(check('x.css', '.a { font: 700 11px/1.2 var(--font-sans); }').length, 1);
  assert.equal(check('x.css', '.a { font: 12px var(--font-mono); }').length, 1);
  assert.equal(check('x.css', '.a { line-height: 18px; letter-spacing: .5px; }').length, 2);
  assert.equal(check('x.html', '.inline{padding:24px}').length, 1);
  /* what must stay allowed */
  assert.deepEqual(check('x.css', '.a { font: 700 var(--fs-xs)/1.2 var(--font-sans); line-height: 1.4; letter-spacing: .04em; font: inherit; }'), []);
  assert.deepEqual(check('x.css', '.a { padding: 0 var(--s-2) 1px; margin: -4px 0; gap: var(--s-1h); font-size: var(--fs-sm); }'), []);
  assert.deepEqual(check('x.css', '.a { transition: opacity var(--dur-base, .2s) var(--ease-out, ease-out), visibility 0s linear var(--dur-slow, .3s); }'), []);
  assert.deepEqual(check('x.css', '.a { animation: spin .9s linear infinite; animation: fadeUp .6s .3s var(--ease-out) forwards; }'), []);
  assert.deepEqual(check('x.css', '.a { padding: calc(var(--safe-b, 0px) + var(--s-1)); }'), []);
});

t('every spacing / type / motion token a stylesheet uses is defined in app.css (no typos)', () => {
  const app = fs.readFileSync(path.join(APP, 'core/app.css'), 'utf8');
  const defined = new Set([...app.matchAll(/(--(?:s|fs|dur|ease)-[\w-]+)\s*:/g)].map((m) => m[1]));
  const used = new Set();
  for (const s of SRC) for (const m of s.css.matchAll(/var\(\s*(--(?:s|fs|dur|ease)-[\w-]+)/g)) used.add(m[1]);
  const missing = [...used].filter((u) => !defined.has(u));
  assert.deepEqual(missing, [], 'undefined tokens: ' + missing.join(', '));
});

t('the scales are monotonic and complete', () => {
  const app = fs.readFileSync(path.join(APP, 'core/app.css'), 'utf8');
  const val = (n) => { const m = app.match(new RegExp(`${n}:\\s*([\\d.]+)px`)); assert.ok(m, `${n} defined in px`); return parseFloat(m[1]); };
  const fs_ = ['2xs', 'xs', 'sm', 'md', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'].map((k) => val('--fs-' + k));
  for (let i = 1; i < fs_.length; i++) assert.ok(fs_[i] > fs_[i - 1], 'type scale increases: ' + fs_.join(', '));
  assert.ok(fs_[0] >= 10, 'smallest text step is 10 px');
  const sp = ['0h', '1', '1h', '2', '2h', '3', '3h', '4', '4h', '5', '6', '8', '10'].map((k) => val('--s-' + k));
  for (let i = 1; i < sp.length; i++) assert.ok(sp[i] > sp[i - 1], 'space scale increases: ' + sp.join(', '));
  /* the two control-text tokens (controls.css, pinned by options.test / layout.test) sit on the same scale */
  const ctl = fs.readFileSync(path.join(APP, 'core/controls.css'), 'utf8');
  assert.equal(parseFloat(ctl.match(/--ctl-text:\s*([\d.]+)px/)[1]), val('--fs-xs'), '--ctl-text equals --fs-xs');
  assert.equal(parseFloat(ctl.match(/--ctl-value-text:\s*([\d.]+)px/)[1]), val('--fs-sm'), '--ctl-value-text equals --fs-sm');
});

t('durations / easings: three speeds, three curves, collapsed under prefers-reduced-motion', () => {
  const app = fs.readFileSync(path.join(APP, 'core/app.css'), 'utf8');
  for (const k of ['--dur-fast', '--dur-base', '--dur-slow', '--ease-out', '--ease-spring', '--ease-in-out']) assert.match(app, new RegExp(k + ':'));
  assert.match(app, /prefers-reduced-motion: reduce\)\s*\{\s*:root \{ --dur-fast: 1ms; --dur-base: 1ms; --dur-slow: 1ms; \}/);
});

finish();
