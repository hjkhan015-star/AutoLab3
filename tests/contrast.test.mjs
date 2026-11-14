// contrast — WCAG text contrast of the colour system, computed (no browser): tokens vs surfaces in both themes, the lightness limits for colours a module
// supplies (controls.css: --l-floor / --l-ceil / --on-accent-pivot), and the real module accents.  Audit B-009: small text was 3.3–3.9 : 1 and pale
// accents on the light theme were 1.3–2.1 : 1.  (A browser sweep of all 59 pages × 2 themes confirmed the result; this keeps it from drifting.)
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { t, finish, rd, APP, modulePages } from './_lib.mjs';
const readFileSync = fs.readFileSync;

/* ── colour maths: OKLCH → linear sRGB (clipped), relative luminance, WCAG ratio ── */
const lin = (L, c, h) => { const a = c * Math.cos(h * Math.PI / 180), b = c * Math.sin(h * Math.PI / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s]; };
const clip = (v) => v.map((x) => Math.min(1, Math.max(0, x)));
const inGamut = (v) => v.every((x) => x >= -0.0005 && x <= 1.0005);
const Y = (v) => { const c = clip(v); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
const parseOklch = (s) => { const m = s.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)/); assert.ok(m, 'cannot parse ' + s); return { L: +m[1], c: +m[2], h: +m[3], a: m[4] == null ? 1 : +m[4] }; };
const yOf = (o) => Y(lin(o.L, o.c, o.h));
const over = (fg, bg) => { const f = clip(lin(fg.L, fg.c, fg.h)), b = clip(lin(bg.L, bg.c, bg.h)); return 0.2126 * (f[0] * fg.a + b[0] * (1 - fg.a)) + 0.7152 * (f[1] * fg.a + b[1] * (1 - fg.a)) + 0.0722 * (f[2] * fg.a + b[2] * (1 - fg.a)); };
const hexToOklch = (hex) => { const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  const l = Math.cbrt(0.4122214708 * c[0] + 0.5363325363 * c[1] + 0.0514459929 * c[2]), m = Math.cbrt(0.2119034982 * c[0] + 0.6806995451 * c[1] + 0.1073969566 * c[2]), s = Math.cbrt(0.0883024619 * c[0] + 0.2817188376 * c[1] + 0.6299787005 * c[2]);
  const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
  return { L, c: Math.hypot(A, B), h: (Math.atan2(B, A) * 180 / Math.PI + 360) % 360, a: 1 }; };

/* ── the token blocks of app.css: dark first, light after the LIGHT banner ── */
const css = rd('app.css'), cut = css.indexOf('COLOR — LIGHT') > 0 ? css.indexOf('COLOR — LIGHT') : css.search(/COLOR\s+.\s+LIGHT/);
assert.ok(cut > 0, 'LIGHT banner in app.css');
const tok = (block, name) => { const m = block.match(new RegExp('--' + name + ':\\s*(oklch\\([^)]*\\))')); assert.ok(m, `--${name} in ${block === css.slice(0, cut) ? 'dark' : 'light'} block`); return parseOklch(m[1]); };
const dark = css.slice(0, cut), light = css.slice(cut), lightBlock = light;
const num = (name) => { const m = css.match(new RegExp('--' + name + ':\\s*([\\d.]+)')); assert.ok(m, '--' + name); return +m[1]; };
const FLOOR = num('l-floor'), CEIL = num('l-ceil'), PIVOT = num('on-accent-pivot');
const surfaceY = (b) => over(tok(b, 'surface'), tok(b, 'bg'));          /* the translucent card over the page background */

for (const [name, block] of [['dark', dark], ['light', light]]) {
  t(`${name} theme: every text and tone token is ≥ 4.5 : 1 on the card surface`, () => {
    const sy = surfaceY(block), low = [];
    for (const k of ['text', 'text-dim', 'text-mute', 'accent', 'ok', 'warn', 'crit']) { const r = ratio(yOf(tok(block, k)), sy); if (r < 4.5) low.push(`--${k} ${r.toFixed(2)}`); }
    assert.deepEqual(low, [], low.join(', '));
  });
}
t('lightness limits: a supplied colour lifted to --l-floor reads on the dark card, one deepened to --l-ceil reads on the light card — whatever its hue or chroma', () => {
  let worstD = 99, worstL = 99;
  for (let h = 0; h < 360; h += 3) for (const c of [0.05, 0.12, 0.2, 0.3]) {
    const d = lin(FLOOR, c, h), l = lin(CEIL, c, h);
    if (inGamut(d)) worstD = Math.min(worstD, ratio(Y(d), surfaceY(dark)));
    if (inGamut(l)) worstL = Math.min(worstL, ratio(Y(l), surfaceY(light)));
  }
  assert.ok(worstD >= 4.5, `dark: worst ${worstD.toFixed(2)} at L ${FLOOR}`); assert.ok(worstL >= 4.5, `light: worst ${worstL.toFixed(2)} at L ${CEIL}`);
});
t('every in-page accent (--al-accent of the guided pages, plus the default --accent token) has readable text on its selected-segment fill — black or white by the lightness pivot — as the page defines them for dark and light', () => {
  const found = new Map(), low = [];
  for (const f of modulePages()) {
    const html = readFileSync(path.join(APP, 'modules', f), 'utf8'), m = html.match(/:root\s*\{\s*--al-accent:\s*(#[0-9a-fA-F]{6})\s*;?\s*\}/);
    if (!m) continue;
    const lm = html.match(/html\.light-theme\s*\{\s*--al-accent:\s*([^;}]+)/), v = lm && lm[1].trim();
    assert.ok(v, `${f}: a light-theme accent is required`);
    let light;
    const mix = v.match(/^color-mix\(in oklch,\s*(#[0-9a-fA-F]{6})\s+(\d+)%,\s*black\)$/);        /* the same colour, mixed N % toward black: OKLCH lightness and chroma × N % */
    if (mix) { assert.equal(mix[1].toLowerCase(), m[1].toLowerCase(), `${f}: the light accent mixes a different colour`); const k = +mix[2] / 100, o = hexToOklch(m[1]); light = { ...o, L: o.L * k, c: o.c * k }; }
    else { assert.match(v, /^#[0-9a-fA-F]{6}$/, `${f}: unrecognised light accent "${v}"`); light = hexToOklch(v); }                 /* a hand-picked darker hex */
    found.set(m[1].toLowerCase(), { file: f, light });

  }
  assert.ok(found.size >= 10, 'accents found: ' + found.size);
  const pairs = [...[...found].map(([hex, x]) => [hex, [['dark', hexToOklch(hex)], ['light', x.light]], x.file]), ['--accent (default)', [['dark', tok(dark, 'accent')], ['light', tok(lightBlock, 'accent')]], 'app.css']];
  for (const [name, variants, file] of pairs) for (const [theme, o] of variants) { const white = o.L <= PIVOT, r = ratio(yOf(o), white ? 1 : 0); if (r < 4.5) low.push(`${name} ${theme} ${r.toFixed(2)} (${white ? 'white' : 'black'} text, L ${o.L.toFixed(2)}) in ${file}`); }
  assert.deepEqual(low, [], 'accent / text pairs below 4.5 : 1 — adjust the page accent or the pivot: ' + low.join('; '));
});
t('the three limits exist as tokens (no literal lightness inside the colour functions of controls.css)', () => {
  const ctl = rd('controls.css');
  assert.match(ctl, /max\(l, var\(--l-floor\)\)/); assert.match(ctl, /min\(l, var\(--l-ceil\)\)/); assert.match(ctl, /var\(--on-accent-pivot\) - l/);
});
await finish();
