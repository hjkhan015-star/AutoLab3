// shared/model-messaging.js — who may talk to whom over postMessage — plus a static rule that every listener / sender in the app follows it.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as M from '../app/shared/model-messaging.js';
import { t, finish, APP, jsFiles, rd } from './_lib.mjs';

const ORIGIN = 'https://autolab.example';
const shell = { id: 'shell' }, frameA = { id: 'A' }, frameB = { id: 'B' }, stranger = { id: 'evil' };

t('targetOrigin: the page\'s own origin; only the opaque file:// origin ("null") or nothing falls back to *', () => {
  assert.equal(M.targetOrigin(ORIGIN), ORIGIN); assert.equal(M.targetOrigin('null'), '*'); assert.equal(M.targetOrigin(''), '*'); assert.equal(M.targetOrigin(undefined), '*');
});
t('trustedFromParent: only my parent window on my own origin', () => {
  const ctx = { origin: ORIGIN, parent: shell, self: { id: 'me' } };
  assert.equal(M.trustedFromParent({ source: shell, origin: ORIGIN }, ctx), true);
  assert.equal(M.trustedFromParent({ source: stranger, origin: ORIGIN }, ctx), false, 'wrong window');
  assert.equal(M.trustedFromParent({ source: shell, origin: 'https://evil.example' }, ctx), false, 'wrong origin');
  assert.equal(M.trustedFromParent({ source: null, origin: ORIGIN }, ctx), false);
  assert.equal(M.trustedFromParent(null, ctx), false); assert.equal(M.trustedFromParent({ source: shell, origin: ORIGIN }, null), false);
});
t('trustedFromParent: a page that is not embedded (parent === self) trusts nobody — there is no shell', () => {
  const me = { id: 'me' }; assert.equal(M.trustedFromParent({ source: me, origin: ORIGIN }, { origin: ORIGIN, parent: me, self: me }), false);
});
t('trustedFromFrame: only the windows of my own iframes on my own origin', () => {
  const ctx = { origin: ORIGIN };
  assert.equal(M.trustedFromFrame({ source: frameA, origin: ORIGIN }, [frameA, frameB], ctx), true);
  assert.equal(M.trustedFromFrame({ source: stranger, origin: ORIGIN }, [frameA, frameB], ctx), false, 'not one of my frames');
  assert.equal(M.trustedFromFrame({ source: frameA, origin: 'https://evil.example' }, [frameA], ctx), false, 'wrong origin');
  assert.equal(M.trustedFromFrame({ source: frameA, origin: ORIGIN }, [], ctx), false, 'no frames open');
  assert.equal(M.trustedFromFrame({ origin: ORIGIN }, [frameA], ctx), false); assert.equal(M.trustedFromFrame(null, [frameA], ctx), false);
});
t('the opaque origin works end to end: "null" matches "null" (file:// standalone), a real origin never matches "null"', () => {
  assert.equal(M.trustedFromFrame({ source: frameA, origin: 'null' }, [frameA], { origin: 'null' }), true);
  assert.equal(M.trustedFromFrame({ source: frameA, origin: 'null' }, [frameA], { origin: ORIGIN }), false);
});

/* ── static rule over the whole app ── */
const sources = () => [['index.html', fs.readFileSync(path.join(APP, 'index.html'), 'utf8')], ...jsFiles().map((f) => [f, fs.readFileSync(path.join(APP, f), 'utf8')])];

t('every window "message" listener checks the origin or uses trustedFrom* (the service worker\'s own listener is same-origin by construction)', () => {
  const bad = [];
  for (const [f, s] of sources()) {
    for (const m of s.matchAll(/addEventListener\(\s*['"]message['"]/g)) {
      const body = s.slice(m.index, m.index + 700);
      if (!/\.origin\b|trustedFrom(Parent|Frame)\(/.test(body)) bad.push(`${f}:${s.slice(0, m.index).split('\n').length}`);
    }
  }
  assert.deepEqual(bad, [], 'message listener without an origin / source check: ' + bad.join(', '));
});
t('no postMessage to the wildcard origin — except the documented "null"-origin fallback (? \'*\' :)', () => {
  const bad = [];
  for (const [f, s] of sources()) for (const m of s.matchAll(/postMessage\(([^;]*?)\)\s*[;}\n]/g)) {
    if (/,\s*'\*'\s*$/.test(m[1].trim()) && !/'null'\s*\?\s*'\*'/.test(m[1])) bad.push(`${f}:${s.slice(0, m.index).split('\n').length}`);
  }
  assert.deepEqual(bad, [], "postMessage(…, '*'): " + bad.join(', '));
});
t('the shell and kit import the helper (so it is not dead): index.html + core/kit.js + this test = 3 users', () => {
  assert.match(rd('index.html'), /trustedFromFrame/); assert.match(fs.readFileSync(path.join(APP, 'core/kit.js'), 'utf8'), /trustedFromParent/);
});
await finish();
