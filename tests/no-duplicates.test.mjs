// no-duplicates — the same code must not live in two files. Three rules:
//  A  same function name in two files with near-identical bodies  (token 5-gram Jaccard similarity ≥ SIM, body ≥ 250 chars)
//  B  a builder for a wheel / tyre / gear / spring / pipe / wire defined in a module page instead of a shared/part-*.js
//  C  the same block of ≥ 4 numeric `const` lines in two files
// Known leftovers are listed below WITH the reason (permanent exception) or the phase that removes them; an entry that no longer matches anything fails (so the list only shrinks).
import fs from 'node:fs';
import path from 'node:path';
import { t, finish, APP, jsFiles, stripCard } from './_lib.mjs';

const SIM = 0.6, MIN_BODY = 250, BLOCK = 4;

const KNOWN_B = {   /* builder name → why it is still in a page */
  makeWheel: 'permanent: a page-specific wheel design (profile, tread, axis, detail) — merging would change how modules look; alignment + balancing already share part-alignment buildTyre / buildRim',
  makeRoadWheel: 'permanent: a page-specific wheel design (profile, tread, axis, detail) — merging would change how modules look; alignment + balancing already share part-alignment buildTyre / buildRim',
  makeWheelAssembly: 'permanent: a page-specific wheel design (profile, tread, axis, detail) — merging would change how modules look; alignment + balancing already share part-alignment buildTyre / buildRim',
  makeTyreCarcass: 'permanent: a page-specific wheel design (profile, tread, axis, detail) — merging would change how modules look; alignment + balancing already share part-alignment buildTyre / buildRim',
  makeLeafSpring:     'a leaf spring is not a coil: one page, different shape — permanent exception (coil springs are Parts.coilSpring)',
  buildGearTeeth:     'permanent: extruded trapezoid teeth on circles for the starter pages (cached geometry); other spur gears are kit.makeCog, bevel gears are part-gear',
  makeSteeringWheel:  'not a road wheel: the driver\'s steering wheel, single use — permanent exception',
  makeChgWire:        'single-use charging-wire shape in electrical — permanent exception unless a second page needs it'
};
const KNOWN_C = {   /* first line of the block → why (none left: add one only with a phase that removes it) */
};

const files = jsFiles();
const src = (f) => stripCard(fs.readFileSync(path.join(APP, f), 'utf8'));

/* ── tokenising ── */
const tok = (s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ').match(/[A-Za-z_$][\w$]*|\d+\.?\d*|[^\s\w]/g) || [];
const grams = (tk, n = 5) => { const g = new Set(); for (let i = 0; i + n <= tk.length; i++) g.add(tk.slice(i, i + n).join(' ')); return g; };
const jaccard = (a, b) => { let x = 0; for (const k of a) if (b.has(k)) x++; return x / ((a.size + b.size - x) || 1); };

/* ── function extraction: `function name(` and `const name = (…) => {` / `= function (…) {` ── */
function functions(text) {
  const out = []; const re = /(?:^|\n)[ \t]*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(|(?:^|\n)[ \t]*(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function\b[^(]*)?\([^)]*\)\s*(?:=>)?\s*\{/g;
  let m;
  while ((m = re.exec(text))) {
    const name = m[1] || m[2];
    let i = m[1] ? text.indexOf('{', text.indexOf(')', m.index + m[0].length)) : text.indexOf('{', m.index + m[0].length - 1);
    if (i < 0) continue;
    let d = 0, j = i;
    for (; j < text.length; j++) { const c = text[j]; if (c === '{') d++; else if (c === '}') { d--; if (!d) break; } }
    out.push({ name, body: text.slice(i, j + 1) });
  }
  return out;
}
const all = [];
for (const f of files) for (const fn of functions(src(f))) if (fn.body.length >= MIN_BODY) all.push({ f, name: fn.name, g: grams(tok(fn.body)) });

t('A: no function with the same name and a near-identical body (similarity ≥ ' + SIM + ') in two files', () => {
  const byName = {}; for (const x of all) (byName[x.name] ??= []).push(x);
  const bad = [];
  for (const [n, xs] of Object.entries(byName)) for (let i = 0; i < xs.length; i++) for (let j = i + 1; j < xs.length; j++) {
    if (xs[i].f === xs[j].f) continue;
    const s = jaccard(xs[i].g, xs[j].g); if (s >= SIM) bad.push(`${n}() in ${xs[i].f} and ${xs[j].f} (${s.toFixed(2)})`);
  }
  if (bad.length) throw new Error('duplicates → move to shared/part-*.js or shared/model-*.js:\n  ' + bad.join('\n  '));
});

t('B: builders for wheels / tyres / gears / springs / pipes / wires live in shared/part-*.js (known leftovers listed with their phase)', () => {
  const re = /^(make|build)\w*(Wheel|Tyre|Tire|Gear|Spring|Pipe|Wire)\w*$/;
  const found = new Set(), bad = [];
  for (const f of files.filter((x) => x.startsWith('modules/'))) for (const fn of functions(src(f))) {
    if (!re.test(fn.name)) continue; found.add(fn.name);
    if (!KNOWN_B[fn.name]) bad.push(`${fn.name}() in ${f}`);
  }
  const stale = Object.keys(KNOWN_B).filter((n) => !found.has(n));
  if (bad.length) throw new Error('builder defined in a page — put it in shared/part-*.js:\n  ' + bad.join('\n  '));
  if (stale.length) throw new Error('KNOWN_B entry no longer matches anything — delete it: ' + stale.join(', '));
});

t('C: no block of ' + BLOCK + '+ identical numeric const lines in two files (known leftovers listed)', () => {
  const seen = new Map();
  for (const f of files) {
    const lines = src(f).split('\n').map((l) => l.replace(/\/\*.*?\*\//g, '').replace(/\/\/.*$/, '').trim());
    const ok = lines.map((l) => /^const [A-Za-z_$][\w$]* *=/.test(l) && /\d/.test(l) && l.length >= 22);
    for (let i = 0; i + BLOCK <= lines.length; i++) if (ok.slice(i, i + BLOCK).every(Boolean)) {
      const k = lines.slice(i, i + BLOCK).join('\n'); if (!seen.has(k)) seen.set(k, new Set()); seen.get(k).add(f);
    }
  }
  const hits = [...seen.entries()].filter(([, v]) => v.size > 1), bad = [], used = new Set();
  for (const [k, v] of hits) { const first = k.split('\n')[0]; if (KNOWN_C[first]) used.add(first); else bad.push(`${first.slice(0, 60)} … in ${[...v].join(', ')}`); }
  const stale = Object.keys(KNOWN_C).filter((k) => !used.has(k));
  if (bad.length) throw new Error('same constant block in several files — share it:\n  ' + bad.join('\n  '));
  if (stale.length) throw new Error('KNOWN_C entry no longer matches anything — delete it: ' + stale.join(' | '));
});

await finish();
