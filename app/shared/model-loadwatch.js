/* model-loadwatch.js — "did this module really start?" — the shell's watchdog for module iframes (pure; timers are injected so tests need no clock).
   A module counts as started only when it says `ready` (the postMessage handshake, see GUIDE §10). Per module id:
     start(id)           the iframe was created: fail after `max` ms in all;
     loaded(id)          the iframe's load event fired: fail `grace` ms later unless `ready` came (a blocked script, a 404 page and an
                         offline first visit all fire `load` but never say ready);
     ready(id) / cancel(id)   the handshake arrived / the frame was dropped: stop watching.
   onFail(id) runs once per start. start() again (a retry) begins a fresh watch. */
export function createLoadWatch({ onFail, grace = 6000, max = 20000, set = setTimeout, clear = clearTimeout } = {}) {
  const watches = new Map();
  const stop = (id) => { const w = watches.get(id); if (w) { clear(w.grace); clear(w.max); watches.delete(id); } };
  const fail = (id) => { if (watches.has(id)) { stop(id); onFail(id); } };
  return {
    start(id, alreadyLoaded = false) {
      stop(id);
      const w = { max: set(() => fail(id), max), grace: null };
      watches.set(id, w);
      if (alreadyLoaded) w.grace = set(() => fail(id), grace);
    },
    loaded(id) { const w = watches.get(id); if (w && w.grace == null) w.grace = set(() => fail(id), grace); },
    ready: stop,
    cancel: stop,
    pending: (id) => watches.has(id)
  };
}
