// node tests/csp.test.mjs  (no dependencies)
// B-011 — script-src is 'self' + SHA-256 hashes of every inline script; no 'unsafe-inline' / 'unsafe-eval' for scripts.
// jsdom does not enforce CSP: this pins the header against the files. The enforcement itself was run in Chromium (audit-scripts/csp_check*.py).
import assert from 'node:assert/strict';
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
import { t, finish } from './_lib.mjs';

const APP = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'app');
const walk = (d, out = []) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); e.isDirectory() ? walk(p, out) : out.push(p); } return out; };
const files = walk(APP).filter((f) => !f.includes(`${path.sep}assets${path.sep}`));
const html = files.filter((f) => f.endsWith('.html'));
const headers = fs.readFileSync(path.join(APP, '_headers'), 'utf8');
const csp = headers.match(/Content-Security-Policy: (.*)/)[1];
const directive = (name) => (csp.match(new RegExp(`(?:^|; )${name} ([^;]*)`)) || [])[1] || '';
const sha = (s) => `'sha256-${crypto.createHash('sha256').update(s, 'utf8').digest('base64')}'`;

const needed = new Set();
for (const f of html) {
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)) {
    const type = (m[1].match(/\btype\s*=\s*["']([^"']*)["']/) || [])[1];
    if (m[2].trim() && !(type && !/^(module|importmap|text\/javascript)$/i.test(type))) needed.add(sha(m[2]));
  }
}
const index = fs.readFileSync(path.join(APP, 'index.html'), 'utf8');
const i = index.indexOf('function perfController()'), j = index.indexOf('\n  var CONTROLLER =');
const controller = sha('(' + index.slice(i, j).trimEnd() + ')();');

t('script-src: self + hashes only — no unsafe-inline, no unsafe-eval, no wildcard or http(s) host', () => {
  const d = directive('script-src');
  assert.ok(d.startsWith("'self'"), d);
  assert.ok(!/unsafe-inline|unsafe-eval|unsafe-hashes|strict-dynamic|\*|https?:/.test(d), 'script-src is not loosened: ' + d);
});

t('every inline script in every page has its hash in script-src, and the header holds no stale hash', () => {
  const have = new Set(directive('script-src').match(/'sha256-[^']+'/g) || []);
  assert.ok(needed.size >= 4, `expected the shell scripts + the import map, found ${needed.size}`);
  for (const h of needed) assert.ok(have.has(h), `missing ${h} (run npm run sync)`);
  const expected = new Set([...needed, controller]);
  for (const h of have) assert.ok(expected.has(h), `stale ${h} (run npm run sync)`);
});

t('the perf-guard controller the shell injects into module iframes is allowed by hash', () => {
  assert.ok(i > 0 && j > i, 'perfController markers found');
  assert.match(index, /s\.textContent = CONTROLLER;/);
  assert.match(index, /var CONTROLLER = '\(' \+ perfController\.toString\(\) \+ '\)\(\);';/, 'injected text is exactly the hashed text');
  assert.ok(directive('script-src').includes(controller));
});

t('nothing needs an inline event handler or a javascript: URL (script-src would block them)', () => {
  const bad = /[\s"'<]on(?:click|change|input|load|error|submit|pointer\w*|touch\w*|mouse\w*|key\w*|focus|blur)\s*=\s*["']/i;
  for (const f of files.filter((x) => /\.(html|js)$/.test(x) && !x.endsWith('sw.js'))) {
    const s = fs.readFileSync(f, 'utf8');
    assert.ok(!bad.test(s), `${path.relative(APP, f)}: inline event handler`);
    assert.ok(!/javascript:/.test(s), `${path.relative(APP, f)}: javascript: URL`);
  }
});

t('the rest of the policy keeps its limits (object-src none, frame-ancestors self, base-uri self, connect-src self)', () => {
  assert.equal(directive('object-src'), "'none'");
  assert.equal(directive('frame-ancestors'), "'self'");
  assert.equal(directive('base-uri'), "'self'");
  assert.equal(directive('connect-src'), "'self'");
  assert.equal(directive('default-src'), "'self'");
});

finish();
