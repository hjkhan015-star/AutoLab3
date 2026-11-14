// shared/model-loadwatch.js (the shell's "did the module really start?" watchdog) + the shell wiring that uses it.
// Bug B-003: a module whose script failed to load (blocked, 404, offline first visit) was revealed as a BLANK frame after a blind timeout.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createLoadWatch } from '../app/shared/model-loadwatch.js';
import { t, finish, APP } from './_lib.mjs';

/* a fake clock: set / clear / advance */
function clock() {
  let now = 0, next = 1; const timers = new Map();
  return { set: (fn, ms) => { const id = next++; timers.set(id, { at: now + ms, fn }); return id; }, clear: (id) => timers.delete(id),
    advance(ms) { now += ms; for (const [id, tm] of [...timers]) if (tm.at <= now) { timers.delete(id); tm.fn(); } }, count: () => timers.size };
}
const mk = (opts = {}) => { const c = clock(), failed = []; return { c, failed, w: createLoadWatch({ onFail: (id) => failed.push(id), set: c.set, clear: c.clear, ...opts }) }; };

t('no handshake after the frame loaded: fails once, `grace` ms after the load event', () => {
  const { c, failed, w } = mk({ grace: 6000, max: 20000 });
  w.start('a'); c.advance(1000); w.loaded('a'); c.advance(5999); assert.deepEqual(failed, []); c.advance(1); assert.deepEqual(failed, ['a']);
  c.advance(60000); assert.deepEqual(failed, ['a'], 'once only'); assert.equal(w.pending('a'), false); assert.equal(c.count(), 0);
});
t('the handshake (ready) before the deadline cancels everything — a working module never shows an error', () => {
  const { c, failed, w } = mk();
  w.start('a'); w.loaded('a'); c.advance(3000); w.ready('a'); c.advance(100000); assert.deepEqual(failed, []); assert.equal(c.count(), 0);
});
t('the frame never loads at all: the overall limit `max` fails it', () => {
  const { c, failed, w } = mk({ grace: 6000, max: 20000 });
  w.start('a'); c.advance(19999); assert.deepEqual(failed, []); c.advance(1); assert.deepEqual(failed, ['a']);
});
t('a late `load` after the failure does not fail it twice; a late ready after failure is harmless', () => {
  const { c, failed, w } = mk({ max: 1000 });
  w.start('a'); c.advance(1000); w.loaded('a'); w.ready('a'); c.advance(99999); assert.deepEqual(failed, ['a']);
});
t('retry: start() again begins a fresh watch with fresh deadlines', () => {
  const { c, failed, w } = mk({ grace: 100, max: 1000 });
  w.start('a'); w.loaded('a'); c.advance(100); assert.deepEqual(failed, ['a']);
  w.start('a'); c.advance(900); assert.deepEqual(failed, ['a'], 'the old deadline must not fire again'); w.loaded('a'); c.advance(100); assert.deepEqual(failed, ['a', 'a']);
});
t('a frame that was already loaded when watching starts (prefetched, never ready) gets the grace period immediately', () => {
  const { c, failed, w } = mk({ grace: 500 });
  w.start('a', true); c.advance(500); assert.deepEqual(failed, ['a']);
});
t('modules are independent; cancel (the frame was evicted) silences only that one', () => {
  const { c, failed, w } = mk({ grace: 100, max: 1000 });
  w.start('a'); w.start('b'); w.loaded('a'); w.loaded('b'); w.cancel('a'); c.advance(100); assert.deepEqual(failed, ['b']);
  assert.doesNotThrow(() => { w.ready('nobody'); w.loaded('nobody'); w.cancel('nobody'); });
});

/* ── the shell uses it, and no longer reveals a frame blindly ── */
const shell = fs.readFileSync(path.join(APP, 'index.html'), 'utf8');
t('shell: a frame is revealed only by the handshake — the blind reveal timers are gone', () => {
  assert.ok(!/setTimeout\(function \(\) \{ revealFrame\(mod\.id\); \}, (1200|9000)\)/.test(shell), 'blind revealFrame after load / 9 s');
});
t('shell: watchdog wired (createLoadWatch, load event, handshake clears it) and the failure screen has Try again + Back', () => {
  assert.match(shell, /createLoadWatch\(/); assert.match(shell, /loadWatch\.loaded\(mod\.id\)/); assert.match(shell, /clearLoadWatch\(id\);\s*delete fr\.dataset\.failed/);
  assert.match(shell, /id="module-error"[^>]*role="alert"/); assert.match(shell, /id="module-retry"/); assert.match(shell, /id="module-back"/);
  assert.match(shell, /getElementById\('module-retry'\)\.addEventListener\('click', retryLoad\)/);
});
await finish();
