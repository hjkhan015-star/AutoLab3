// node tests/states.test.mjs  (no dependencies)
// Motion and state rules of the interface:
//  • theme switch  — no colour transition runs between themes (one shared class, set and cleared in the same task);
//  • cost rules    — no `transition: all`, no animated blur / filter;
//  • state screens — "error" and "empty" are one pattern (.al-state in core/app.css), loading is the shared .boot-ring.
// What the browser does with them is measured by audit-scripts/motion5.py (animations started per interaction).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { t, finish, rd, APP, listDir, modulePages } from './_lib.mjs';

const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
const styleBlocks = (html) => [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
function allCss() {
  const out = [];
  for (const f of listDir('core').filter((x) => x.endsWith('.css'))) out.push({ file: 'core/' + f, css: stripComments(fs.readFileSync(path.join(APP, 'core', f), 'utf8')) });
  for (const f of ['index.html', '404.html']) styleBlocks(fs.readFileSync(path.join(APP, f), 'utf8')).forEach((css) => out.push({ file: f, css: stripComments(css) }));
  for (const f of modulePages()) styleBlocks(fs.readFileSync(path.join(APP, 'modules', f), 'utf8')).forEach((css) => out.push({ file: 'modules/' + f, css: stripComments(css) }));
  return out;
}

/** violations of the cost rules in one CSS text */
export function costViolations(file, css) {
  const bad = [];
  for (const m of css.matchAll(/(?<![-\w])transition(?:-property)?\s*:\s*([^;{}]+)/g)) {
    const items = m[1].split(/,(?![^(]*\))/).map((x) => x.trim().split(/\s+/)[0]);
    if (items.includes('all')) bad.push(`${file}: "${m[0].trim()}" — name the properties, never all`);
    for (const it of items) if (/^(backdrop-filter|-webkit-backdrop-filter|filter)$/.test(it)) bad.push(`${file}: "${m[0].trim()}" — blur / filter must not animate`);
  }
  for (const m of css.matchAll(/@keyframes\s+([\w-]+)\s*\{((?:[^{}]|\{[^{}]*\})*)\}/g)) if (/(?<![-\w])(backdrop-filter|filter)\s*:/.test(m[2])) bad.push(`${file}: @keyframes ${m[1]} animates a filter`);
  return bad;
}

t('no `transition: all` and no animated blur / filter in any stylesheet or page', () => {
  const bad = allCss().flatMap((s) => costViolations(s.file, s.css));
  assert.deepEqual(bad, [], bad.join('\n'));
});

t('the cost checker fails on violations (negative control)', () => {
  assert.equal(costViolations('x', '.a { transition: all .2s; }').length, 1);
  assert.equal(costViolations('x', '.a { transition: opacity .2s, backdrop-filter .2s; }').length, 1);
  assert.equal(costViolations('x', '.a { transition: filter var(--dur-base); }').length, 1);
  assert.equal(costViolations('x', '@keyframes b { from { filter: blur(0); } to { filter: blur(4px); } }').length, 1);
  assert.deepEqual(costViolations('x', '.a { transition: transform var(--dur-fast), opacity var(--dur-fast); backdrop-filter: blur(8px); }'), []);
});

t('theme switch: the shared class turns every transition off, in the first layer (so its !important wins)', () => {
  const css = rd('app.css');
  const m = css.match(/@layer reset \{[^]*?html\.al-theme-swap, html\.al-theme-swap \*, html\.al-theme-swap \*::before, html\.al-theme-swap \*::after \{ transition: none !important; \}/);
  assert.ok(m, 'rule inside @layer reset');
});

t('theme switch: kit.js and the shell set the class, change the theme classes, flush styles, then clear it — in that order, synchronously', () => {
  const order = /classList\.add\('al-theme-swap'\)[^]*?classList\.toggle\('light-theme'[^]*?getComputedStyle\(root\)[^]*?classList\.remove\('al-theme-swap'\)/;
  assert.match(rd('kit.js'), order, 'kit.js applyTheme');
  assert.match(rd('index.html'), order, 'index.html applyShellTheme');
  for (const f of ['kit.js', 'index.html']) assert.ok(!/setTimeout\([^)]*al-theme-swap/.test(rd(f)), f + ': no timer (a timer would leave the class on while the page is busy)');
});

t('state screens: one .al-state pattern defined once, used by the module-error screen and the empty states', () => {
  const css = rd('app.css'), html = rd('index.html');
  for (const c of ['.al-state', '.al-state-icon', '.al-state-title', '.al-state-sub', '.al-state-actions', '.al-state-btn', '.al-state-btn.is-primary'])
    assert.equal(css.split(new RegExp(c.replace(/\./g, '\\.') + ' \\{')).length - 1, 1, c + ' defined exactly once in app.css');
  assert.match(html, /<div id="module-error"[^>]*role="alert"><div class="al-state">/);
  assert.match(html, /id="module-retry" class="al-state-btn is-primary"/);
  assert.match(html, /id="module-back" class="al-state-btn"/);
  assert.match(html, /el\.className = 'empty-state al-state'/);
  assert.ok(!/\bme-(card|title|sub|btn|actions|primary)\b|\be-title\b|\be-body\b/.test(html), 'old per-screen state classes are gone');
});

t('state screens: the action button reaches the 44 px tap size from the token, and loading is the shared ring', () => {
  const css = rd('app.css'), html = rd('index.html');
  assert.match(css, /\.al-state-btn \{[^}]*min-height: 44px/);
  assert.equal((html.match(/class="boot-ring"/g) || []).length, 2, 'start-up loader and module loader use the same ring');
});

finish();
