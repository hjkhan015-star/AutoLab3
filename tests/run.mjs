#!/usr/bin/env node
// tests/run.mjs — discovers tests/*.test.mjs, runs each in its own process, reports ALL failures.
// Output lines understood:  "FAIL<TAB>name<TAB>msg"  and  "SKIP<TAB>name<TAB>why"  (see _lib.mjs).
// Exit code is non-zero on any NEW failure, any crash, or any SKIP that is not listed in known-failures.json.
// known-failures.json: { "known": { "<file>::<test name>": "reason" }, "skipped": { "<file>::<name>": "reason" } }
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const dir = path.dirname(new URL(import.meta.url).pathname);
const kf = path.join(dir, 'known-failures.json');
const known = fs.existsSync(kf) ? JSON.parse(fs.readFileSync(kf, 'utf8')) : { known: {}, skipped: {} };
const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.test.mjs') && (!only.length || only.some((o) => f.includes(o)))).sort();
const seen = new Set(); const fresh = []; const freshRaw = []; const knownHit = []; const skippedHit = []; let passed = 0;
for (const f of files) {
  const r = spawnSync(process.execPath, [path.join(dir, f)], { encoding: 'utf8', maxBuffer: 64 << 20, env: process.env });
  const out = (r.stdout || '') + (r.stderr || '');
  let fails = 0;
  for (const line of out.split('\n')) {
    let m;
    if ((m = line.match(/^ok   /))) passed++;
    else if ((m = line.match(/^FAIL\t(.*?)\t(.*)$/))) { fails++; const k = f + '::' + m[1]; seen.add(k); (known.known[k] !== undefined ? knownHit : fresh).push(`${k} — ${m[2]}`); if (known.known[k] === undefined) freshRaw.push([k, 'fail']); }
    else if ((m = line.match(/^SKIP\t(.*?)\t(.*)$/))) { const k = f + '::' + m[1]; seen.add(k); (known.skipped[k] !== undefined ? skippedHit : fresh).push(`${k} — SKIPPED (${m[2]})`); if (known.skipped[k] === undefined) freshRaw.push([k, 'skip']); }
  }
  if (r.status !== 0 && !fails) { const k = f + '::<crash>'; seen.add(k); (known.known[k] !== undefined ? knownHit : fresh).push(`${k} — exit ${r.status}: ${out.trim().split('\n').slice(-3).join(' | ').slice(0, 300)}`); }
  console.log(`${r.status === 0 ? 'pass' : 'FAIL'}  ${f}  ${(out.match(/(\d+) passed, (\d+) failed/) || [])[0] || ''}`);
}
if (process.argv.includes('--emit-known')) { console.log(JSON.stringify({ known: Object.fromEntries(freshRaw.filter((x) => x[1] === 'fail').map((x) => [x[0], 'TODO reason'])), skipped: Object.fromEntries(freshRaw.filter((x) => x[1] === 'skip').map((x) => [x[0], 'TODO reason'])) }, null, 2)); process.exit(0); }
const stale = [...Object.keys(known.known), ...Object.keys(known.skipped)].filter((k) => !seen.has(k) && (!only.length));
console.log('\n' + '─'.repeat(60));
console.log(`${files.length} files · ${passed} checks passed · ${knownHit.length + skippedHit.length} known · ${fresh.length} new`);
if (knownHit.length) console.log('\nknown failures:\n  ' + knownHit.join('\n  '));
if (skippedHit.length) console.log('\nknown skips (dependency missing here):\n  ' + skippedHit.join('\n  '));
if (stale.length) console.log('\nnote — entries in known-failures.json that no longer occur (remove them):\n  ' + stale.join('\n  '));
if (fresh.length) { console.log('\nNEW failures:\n  ' + fresh.join('\n  ')); process.exit(1); }
console.log('\nOK — 0 new');
