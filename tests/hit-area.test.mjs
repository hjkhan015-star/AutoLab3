// node tests/hit-area.test.mjs  (no dependencies)
// B-010 — small controls keep their picture but reach a 44 px hit area through ONE shared pseudo-element rule in controls.css.
// jsdom has no layout, so this pins the rule; the real measurement (elementFromPoint scan at 3+ viewports) is audit-scripts/layout.py.
import assert from 'node:assert/strict';
import { t, finish, rd } from './_lib.mjs';

const css = rd('controls.css');
const MARKED = ['.al-hdr-btn', '.al-dock-handle', '.ui-panel-toggle', '.ui-panel-more', '.ui-tab', '.ui-orb-toggle', '.ui-monitor .mon-toggle'];

t('every small control is marked --hit: 1 in one :is() rule', () => {
  const m = css.match(/:is\(([^)]*)\) \{ --hit: 1; \}/);
  assert.ok(m, 'marker rule present');
  for (const s of MARKED) assert.ok(m[1].includes(s), `${s} is marked`);
});

t('the extension is a transparent ::after sized from --ctl-tap (no hard-coded 44), growing only when the control is smaller', () => {
  const m = css.match(/:is\(\.al-dock-handle, \.ui-panel-toggle, \.ui-panel-more, \.ui-tab, \.ui-orb-toggle\)::after \{([^}]*)\}/);
  assert.ok(m, 'shared ::after rule');
  assert.match(m[1], /content:\s*""/);
  assert.match(m[1], /position:\s*absolute/);
  assert.match(m[1], /inset-block:\s*min\(0px,\s*calc\(\(100% - var\(--ctl-tap\)/);
  assert.match(m[1], /inset-inline:\s*min\(0px,\s*calc\(\(100% - var\(--ctl-tap\)/);
  assert.ok(!/background|border/.test(m[1]), 'invisible: the picture does not change');
});

t('the Monitor strip grows downward only (the header is directly above it)', () => {
  assert.match(css, /\.ui-monitor \.mon-toggle::before \{[^}]*inset-block:\s*0 min\(0px,\s*calc\(100% - var\(--ctl-tap\)\)\)/);
});

t('the header (shell and standalone) is stacked above the dock so its extended hit area is not covered', () => {
  assert.match(css, /\.al-hdr \{[^}]*z-index:\s*calc\(var\(--z-dock\) \+ 1\)/s);
  assert.match(css, /body:not\(\.embedded\) > \.al-hdr \{[^}]*z-index:\s*calc\(var\(--z-dock\) \+ 1\)/s);
});

t('controls that are positioned by the extension are position: relative (or already absolute / sticky)', () => {
  assert.match(css, /:is\(\.al-dock-handle, \.ui-panel-toggle, \.ui-tab\) \{ position: relative; \}/);
});

finish();
