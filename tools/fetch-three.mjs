#!/usr/bin/env node
// tools/fetch-three.mjs — self-host three.js r160 (no CDN at runtime).
//   node tools/fetch-three.mjs                 download r160 from unpkg (needs internet, once)
//   node tools/fetch-three.mjs --from <dir>    copy from a local three@0.160.0 package folder (holds build/ and examples/)
//                                              e.g.  npm pack three@0.160.0 && tar xzf three-0.160.0.tgz  → --from package
// It writes app/assets/{three.module.js,orbit-controls.js,room-environment.js} (lower-case names), then runs
// tools/sync.mjs, which switches every import map to the local files, drops the CDN rule from sw.js and the CSP,
// and adds the files to the precache. Safe to run twice. Afterwards: npm test.
import { writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const root = new URL('..', import.meta.url).pathname, out = join(root, 'app/assets'), V = '0.160.0', CDN = `https://unpkg.com/three@${V}/`;
const FILES = [['build/three.module.js', 'three.module.js'], ['examples/jsm/controls/OrbitControls.js', 'orbit-controls.js'],
  ['examples/jsm/environments/RoomEnvironment.js', 'room-environment.js']];     /* only what the app imports; names lower-case (portable) */
const from = process.argv.includes('--from') ? process.argv[process.argv.indexOf('--from') + 1] : null;
mkdirSync(out, { recursive: true });
for (const [src, dst] of FILES) {
  if (from) { if (!existsSync(join(from, src))) throw new Error('missing ' + join(from, src)); copyFileSync(join(from, src), join(out, dst)); continue; }
  const res = await fetch(CDN + src); if (!res.ok) throw new Error(`${CDN + src}: HTTP ${res.status}`);
  const txt = await res.text(); if (!/export/.test(txt)) throw new Error(src + ': not a module'); writeFileSync(join(out, dst), txt);
}
console.log('app/assets/ three.js r' + V.split('.')[1] + ' written');
const r = spawnSync(process.execPath, [join(root, 'tools/sync.mjs')], { stdio: 'inherit' });
process.exit(r.status ?? 1);
