// tests/_lib.mjs — shared helpers for every test file.
//  • t(name, fn)  records a failure instead of throwing, so ONE run reports ALL failures; finish() prints the summary.
//  • rd(f)        reads a shipped file by short name ('kit.js', 'app.css', 'index.html', 'sw.js') or by module page
//                 ('shaftdiff--differential.html' or just the id 'differential'); a module page is returned in the
//                 "old shape": its HTML with the module's .js inlined into <script type="module">, so source-level
//                 rules can scan page + logic together.
//  • pages()      every module page file name (modules/*.html) ; shellPages() adds index.html / 404.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const APP = path.join(ROOT, 'app');
export const rootURL = pathToFileURL(ROOT + '/');
export const appURL = (f) => pathToFileURL(path.join(APP, f));
const read = (p) => fs.readFileSync(p, 'utf8');

export const listDir = (d) => fs.readdirSync(path.join(APP, d)).sort();
export const modulePages = () => listDir('modules').filter((f) => f.endsWith('.html'));
export const shellPages = () => ['index.html', '404.html', ...modulePages()];
/* legacy test shape: array of every html page (shell + modules) */
export const pages = shellPages();
export const jsFiles = () => ['core', 'shared', 'modules'].flatMap((d) => listDir(d).filter((f) => f.endsWith('.js')).map((f) => d + '/' + f));
export const cssFiles = () => listDir('core').filter((f) => f.endsWith('.css')).map((f) => 'core/' + f);

/* id / short name → module page file name */
const idToFile = {};
for (const f of modulePages()) idToFile[f.replace(/\.html$/, '').split('--')[1]] = f;
/* four modules were registered under a different id than their old file name; tests still say the old name */
const ALIAS = { 'crankshaft-piston': 'crankpiston', turbocharger: 'turbo', 'abs-esc': 'absesc', 'starting-system': 'starting' };
export const pageOf = (idOrFile) => { let k = idOrFile.replace(/\.html$/, ''); if (ALIAS[k]) k = ALIAS[k]; return modulePages().includes(k + '.html') ? k + '.html' : idToFile[k]; };

export const stripCard = (js) => js.replace(/\/\* @card:begin[\s\S]*?@card:end \*\/\n?/, '');
export function pageSource(file) {
  let h = read(path.join(APP, 'modules', file));
  const m = h.match(/<script type="module" src="([^"]+)"><\/script>/);
  if (m) h = h.replace(m[0], '<script type="module">\n' + stripCard(read(path.join(APP, 'modules', m[1]))) + '\n</script>');
  return h;
}
/* old core file names that were merged */
const MERGED = { 'controls-core.js': 'controls.js', 'monitor-core.js': 'monitor.js', 'keys.js': 'chrome.js', 'MONITOR-MAP.md': 'docs/MONITOR-MAP.md',
  'alignment-model.js': 'model-alignment.js', 'alignment-parts.js': 'part-alignment.js', 'alignment-rack.js': 'part-alignment-rack.js',
  'wa-toe-scene.js': 'part-alignment-toe-scene.js', 'wa-camber-scene.js': 'part-alignment-camber-scene.js', 'wa-caster-scene.js': 'part-alignment-caster-scene.js',
  'balancing-model.js': 'model-balancing.js', 'wb-scene.js': 'part-balancing-scene.js', 'wb-page.js': 'part-balancing-page.js' };
export function rd(f) {
  f = MERGED[f] || f;
  if (f === 'sw.js' || f === 'index.html' || f === '404.html' || f === '_headers' || f === 'manifest.webmanifest') return read(path.join(APP, f));
  for (const d of ['core', 'shared']) if (fs.existsSync(path.join(APP, d, f))) return read(path.join(APP, d, f));
  if (fs.existsSync(path.join(APP, f))) return read(path.join(APP, f));
  const p = pageOf(f); if (p) return pageSource(p);
  if (fs.existsSync(path.join(ROOT, f))) return read(path.join(ROOT, f));
  throw new Error('rd: cannot find ' + f);
}

/* jsdom is a devDependency (npm install). In a sandbox without it the DOM groups report SKIP, which run.mjs counts. */
export function loadJSDOM() {
  try { const req = createRequire(process.env.JSDOM_PATH ? pathToFileURL(path.join(process.env.JSDOM_PATH, 'x.js')) : import.meta.url); return req('jsdom').JSDOM; }
  catch (_) { return null; }
}

const pending = []; const failures = []; let n = 0;
export function t(name, fn) {
  const p = (async () => { try { await fn(); n++; console.log('ok  ', name); } catch (e) { failures.push(name); console.log('FAIL\t' + name + '\t' + String(e && e.message || e).split('\n')[0].slice(0, 400)); } })();
  pending.push(p); return p;
}
export const skip = (name, why) => console.log('SKIP\t' + name + '\t' + why);
export async function finish(label = '') {
  await Promise.all(pending);
  console.log(`${label ? label + ': ' : ''}${n} passed, ${failures.length} failed`);
  process.exitCode = failures.length ? 1 : 0;
}
