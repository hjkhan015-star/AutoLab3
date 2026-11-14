// node tests/startup.test.mjs  (no dependencies)
// First paint and touch rules.
//  • First paint — the shell's head carries nothing heavy: no static <link rel="modulepreload"> (1.3 MB of three.js ahead of the shell's own
//    files delayed first paint ~1.2 s on slow 4G in audit-scripts/firstpaint6.py). three.js is warmed by a deferred loader (idle, 4 s timeout,
//    not on Save-Data / 2G) that lists exactly the files the module pages' import map points to.
//  • Touch — controls, labels and the canvas are not selectable and show no iOS callout; the root does not overscroll; a native range
//    keeps vertical scroll.  (A real swipe on the dock handle / canvas is driven by audit-scripts/touch6.py.)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { t, finish, rd, APP } from './_lib.mjs';

const MARK = /<!--three-preload:begin-->([\s\S]*?)<!--three-preload:end-->/;

/** problems with a shell page's start-up head */
export function headProblems(html) {
  const bad = [];
  const head = (html.match(/<head[^>]*>([\s\S]*?)<\/head>/) || [, ''])[1];
  if (/<link[^>]+rel="modulepreload"/.test(head)) bad.push('static <link rel="modulepreload"> in <head> (defer it)');
  if (/<script\b[^>]*\bsrc=/.test(head.replace(/<script\b[^>]*type="module"[^>]*>/g, ''))) bad.push('classic <script src> in <head> blocks the first paint');
  const sheets = (head.match(/<link[^>]+rel="stylesheet"/g) || []).length;
  if (sheets > 2) bad.push(`${sheets} stylesheets in <head> (budget: 2)`);
  return bad;
}

t('shell start-up head: no static modulepreload, no render-blocking script, at most two stylesheets', () => {
  assert.deepEqual(headProblems(rd('index.html')), []);
});

t('start-up head checker fails on a heavy head (negative control)', () => {
  assert.equal(headProblems('<head><link rel="modulepreload" href="a.js"></head>').length, 1);
  assert.equal(headProblems('<head><script src="a.js"></script></head>').length, 1);
  assert.equal(headProblems('<head><link rel="stylesheet" href="a"><link rel="stylesheet" href="b"><link rel="stylesheet" href="c"></head>').length, 1);
  assert.deepEqual(headProblems('<head><script type="module" src="a.js"></script><script>var x=1</script><link rel="stylesheet" href="a"></head>'), []);
});

t('three.js warm-up: deferred to idle with a timeout, skipped on Save-Data / 2G, wrapped in an IIFE', () => {
  const m = rd('index.html').match(MARK); assert.ok(m, 'markers present');
  const s = m[1];
  assert.match(s, /<script>/); assert.match(s, /\(function\(\)\{/); assert.match(s, /addEventListener\('load'/);
  assert.match(s, /requestIdleCallback/); assert.match(s, /timeout:4000/);
  assert.match(s, /saveData/); assert.match(s, /2g/); assert.match(s, /rel='modulepreload'|l\.rel='modulepreload'/);
  assert.ok(!/<link/.test(s.replace(/<script>[\s\S]*<\/script>/, '').replace(/<link rel="(preconnect|dns-prefetch)"[^>]*>/g, '')), 'no static <link> besides preconnect / dns-prefetch');
});

t('three.js warm-up lists exactly the files the module pages import (vendored build)', () => {
  if (!fs.existsSync(path.join(APP, 'assets/three.module.js'))) return;   // CDN build: urls differ, not pinned here
  const m = rd('index.html').match(MARK)[1];
  const urls = JSON.parse(m.match(/(\[[^\]]*\])\.forEach/)[1]).sort();
  const page = fs.readFileSync(path.join(APP, 'modules/cooling--radiator.html'), 'utf8');
  const map = JSON.parse(page.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]).imports;
  const wanted = Object.values(map).map((v) => v.replace(/^\.\.\//, '')).sort();
  assert.deepEqual(urls, wanted);
  for (const u of urls) assert.ok(fs.existsSync(path.join(APP, u)), u + ' exists');
});

t('touch: root does not overscroll; controls, labels and the canvas are not selectable and show no callout; native range keeps pan-y', () => {
  const css = rd('app.css');
  assert.match(css, /html \{[^}]*overscroll-behavior: none;/);
  assert.match(css, /body \{[^}]*overscroll-behavior: none;/);
  const rule = css.match(/(button, \[role="button"\][^{]*)\{([^}]*)\}/);
  assert.ok(rule, 'touch rule present');
  for (const sel of ['button', '[role="button"]', '[role="tab"]', '[role="switch"]', '[role="slider"]', 'summary', 'canvas', '.label3d', '.al-dock-handle']) assert.ok(rule[1].includes(sel), sel + ' covered');
  assert.match(rule[2], /user-select: none/); assert.match(rule[2], /-webkit-user-select: none/); assert.match(rule[2], /-webkit-touch-callout: none/);
  assert.match(css, /input\[type="range"\] \{ touch-action: pan-y; \}/);
});

t('touch: drag surfaces opt out of browser panning, everything else is `manipulation` (no double-tap zoom delay)', () => {
  const css = rd('app.css') + rd('controls.css');
  assert.match(css, /button \{[^}]*touch-action: manipulation/);
  assert.ok((css.match(/touch-action: none/g) || []).length >= 6, 'drag surfaces set touch-action: none (R8)');
});

finish();
