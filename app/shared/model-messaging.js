/* model-messaging.js — who may talk to whom over window.postMessage (shell ⇄ module iframe). Pure: no DOM access, easy to test.
   Rules: the shell and every module page are served from the SAME origin, so
     • a module accepts a message only from its parent window AND the same origin;
     • the shell accepts a message only from one of ITS OWN iframes' windows AND the same origin;
     • messages are sent to that origin, never to '*' (file:// pages have the opaque origin "null" — the only case that falls back to '*',
       and there the source check still applies).
   Message shapes are unchanged: { source: 'auto-shell' | 'auto-module' | 'auto-module-perf', … }. */

/** The targetOrigin to pass to postMessage: this page's own origin ('*' only for the opaque "null" origin of file:// pages). */
export function targetOrigin(origin) {
  return !origin || origin === 'null' ? '*' : origin;
}

/** Module side: is this message from my parent window, on my own origin?   ctx = { origin: location.origin, parent: window.parent, self: window } */
export function trustedFromParent(e, ctx) {
  if (!e || !ctx || ctx.parent === ctx.self) return false;          /* not embedded: there is no shell to trust */
  return e.source === ctx.parent && e.origin === ctx.origin;
}

/** Shell side: is this message from the window of one of my module iframes, on my own origin?   frameWindows = [iframe.contentWindow, …] */
export function trustedFromFrame(e, frameWindows, ctx) {
  if (!e || !ctx || !e.source) return false;
  return e.origin === ctx.origin && frameWindows.some((w) => w === e.source);
}
