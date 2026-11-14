# AUTOLAB3 — MASTER PROMPT (v2.0, written for `AutoLab2-8_12_0-full.zip`)

> **This file lives in the repo ROOT as `AUTOLAB3-PROMPT.md`.** It is the one authoritative instruction set. Never copy it elsewhere, never create other prompt/handoff files inside the repo. If any other document disagrees, this file wins.
> The work is split into **phases, one phase per chat session**. After every phase you hand the user **a full zip + the next-phase prompt** (§1). Never start the next phase in the same session.

---

## 0. Mission

You are a senior front-end / WebGL / PWA engineer and auditor. Input: **Auto Lab (AutoLab2) v8.12.0** — a static, no-build 3D automotive learning lab, installable offline PWA, 52 modules in 18 systems / 5 domains, 12-stage student roadmap, three home views (Modules · Systems · Roadmap).

Produce **AutoLab3**, a new repository that:

1. **Restarts at version `1.0.0`** (AutoLab2's v8.x history is lineage only).
2. Has a **simple, flat, easy-to-read file structure** — few folders, no deep nesting (§4).
3. **Fixes the pre-existing failures** — the `differential` module and every similar module — and makes every test actually run (§3).
4. **Removes duplicates**: modules/sub-modules existing twice (a separate HTML *and* a copy inside a larger HTML), duplicated logic, duplicated HTML, repeated demos such as "auto drive". One concept = one home (§5).
5. Uses **fewer JS files** (§4.3), rewriting where that is simpler than moving.
6. Always keeps a **safe way to update any existing module** — written guidelines + tools + tests (§6). The user will make many manual edits later.
7. Ends with a **deep bug audit + fixes** (Phase 5), then a separate **UI smoothening / stray-code disposal / cleanup** phase (Phase 6).

**Out of scope (do not do, do not add placeholders):** Capacitor / Android / iOS wrapping (the user will do it later), and **writing new learning content or new modules** (missing coverage is only *listed*, §3.5). Never modify the original AutoLab2 files you were given — build AutoLab3 as a new tree.

---

## 1. Session & handoff protocol (applies to EVERY phase)

### 1.1 At the start of a session
1. Unzip the input read-only. Save this prompt verbatim as `AUTOLAB3-PROMPT.md` in the repo root if it is not already there.
2. If this is not Phase 0: read `docs/PROGRESS.md` and `docs/DECISIONS.md` first, plus the "state carried over" in the pasted next-phase prompt. Re-run the full test suite and compare with the state claimed there (**input-drift rule**: the zip wins; note differences in `docs/PROGRESS.md`, then continue).
3. Do **only** the phase you were asked to do.

### 1.2 At the end of a session — the handoff (mandatory, even if the phase is only partly done)
Do these in order:
1. Run `node tests/run.mjs` (from Phase 1 on; in Phase 0 run the original tests individually). Fix anything you broke.
2. Update `docs/PROGRESS.md` (phase report: what changed, files added/removed/renamed, tests before→after, decisions, open items, risks, anything *unverified*) and `docs/DECISIONS.md`.
3. **Build the full zip** of the entire repo root: `/mnt/user-data/outputs/AutoLab3-after-phase<N>.zip` (top folder `AutoLab3/`; include everything — app, docs, tests, tools, `.github`, dotfiles, this prompt; exclude only `node_modules`). **Verify it**: unzip into a temp folder and run the tests from there; report file count and size. The zip must be enough, by itself, to continue the work in a brand-new chat.
4. **Write the next-phase prompt** to `/mnt/user-data/outputs/AUTOLAB3-NEXT-PROMPT.md` (NOT inside the zip/repo — only one prompt may live in the repo). Use the template in §11. It must be paste-ready and self-contained about the *state*, while pointing at the root prompt for the *rules*.
5. Call `present_files` with both files, then reply to the user in **≤ 10 short lines**: what was done, test status (pass/fail counts), anything needing the user's decision, and the exact next step ("open a new chat → upload `AutoLab3-after-phase<N>.zip` → paste `AUTOLAB3-NEXT-PROMPT.md`").
6. **Stop.** Do not begin the next phase.

### 1.3 If you are running out of room mid-phase
Never lose work. Stop at a safe point (tests green or failures listed), do the full handoff above, and make the next prompt a **continuation** ("Phase N, part 2") listing the remaining checklist items exactly. For big phases (3 and 5 especially) checkpoint with a zip after each major block and say so in `PROGRESS.md`. Splitting a phase into parts (3a/3b/…) is allowed; say so in the handoff.

---

## 2. Operating rules

1. **Phase order is fixed** (§8). Don't skip; don't merge phases.
2. **Verify, don't assume.** §3 is a pre-audit snapshot of the 8.12.0 zip; re-measure in Phase 0.
3. **Migration ≠ rewrite.** Phase 1 only moves/renames/consolidates with identical behaviour. Behaviour changes happen in Phases 2–6 and are logged.
4. **Log decisions** in `docs/DECISIONS.md` (date, what, why, alternatives). **Nothing is deleted silently** — deleted/merged files go in the "Removed" section of `DECISIONS.md` with the reason and where the logic lives now.
5. **Never weaken a test to pass.** Rewrite a test only when its rule is obsolete, and say so.
6. **One test runner that reports ALL failures** (§9). Several current tests stop at the first assertion and hide further failures.
7. **No new runtime dependencies, no bundler, no build step** for the shipped app. Dev-only tools and `jsdom` (devDependency) are fine.
8. **Ask the user only when blocked or before something destructive.** Otherwise decide, log, continue.
9. Keep the house rules (R1–R10 in `GUIDE.md`): controls only in the shared control code, one dock, one Monitor for readouts, tokens-only colours, one registry, one keymap, no `window.__*`, no charts in panels, precache everything, one version — unless a logged decision replaces them.
10. **Keep module ids and `localStorage` key names stable** (they carry saved progress and recents). File names may change; ids may not.

---

## 3. What the 8.12.0 zip contains (pre-audit — verify in Phase 0)

### 3.1 Shape
- **85 entries flat in the root**: ~52 module/shell HTML, 13 JS (`kit, controls, controls-core, dock, monitor, monitor-core, chrome, labels, keys, components, modules, guard, sw`), 3 CSS, 10 docs, `tests/` (16 files), `icons/`, `vendor/` (only `README.md` + `fetch-three.mjs`; three.js not committed), `_headers`, `manifest.webmanifest`, `404.html`, `robots.txt`.
- `modules.js` (35 KB) holds `DOMAINS` (5), `SYSTEMS` (18, each with `modules[]`, `flow`, `related`, `soon`) and `ROADMAP` (12 stages: `id, title, ask, why, ids[], check`), and sets `window.AUTO_*` globals. System ids: `engine fuel ignition lube cooling exhaust trans shaftdiff wheels brakes steering suspension elec ecu body safety hvac info`.
- **Home has 3 views** (`index.html`, ~98 KB): Modules · Systems · Roadmap (Start-here/Continue, Basics-only, per-stage Checkpoint).
- **Two multi-page module folders with spaces in their names**: `Wheel alignment/` (4 pages, model, parts, rack, 3 scene JS, test, `DECISIONS-WA.md`) and `Wheel balancing/` (5 pages, model, machine, shared scene + page JS, test, `DECISIONS-WB.md`). Only the overview pages are registered; sub-pages hang off the overview.
- **8 modules added in 8.12.0** ("Phase 1 versions to be deepened", all on `runGuidedModule`): includes `bodyframe`, `crumple`, `restraints`, `traction`; the other four are listed in `CHANGELOG.md` 8.12.0 — identify them. Treat all 8 as **drafts** (`status: 'draft'`). They were only checked with a mock 3D smoke test (no real browser).
- Large single-file modules (50–100 KB of inline logic): `differential` 97, `mpfi` 91, `exhaustsystem` 81, `turbocharger` 79, `ignition` 75, `steering` 72, `starting-system` 69, `wiring` 67, `engine` 66, `braking` 65 KB (+ `awd`, `cooling`, `lubrication`, `ecu`, …).

### 3.2 Test baseline (run individually)
| Test | Result |
|---|---|
| `tests/check.mjs` | **FAIL — 10 problems**: stray `DELETE-THESE-OLD-ROOT-FILES.txt`; in `differential.html` a hard-coded colour `var(--text-dim, #94a3b8)` and dead code `isMidEnd, BEVEL_SEGS, makeSpiralBevelGear, PINION_Y, SIDE_R, SPIDER_R, CARRIER_W, DUAL_TYRE_GAP` |
| `dial`, `monitor`, `phase8` | **FAIL**, all on `differential.html` (steering must be an axis not a dial; readout grid/row still in the page; a Phase-8 rule). **They abort at the first assertion → more failures may be hidden.** |
| `axis`, `choice`, `options` | **skipped — "jsdom not available"** → DOM coverage is not really running |
| `chrome, controls, dock, glass, keys, labels, layout, roadmap, shell`, alignment, balancing | pass |

`npm test` is a long `&&` chain, so it stops at the first failure and never reaches later tests.

### 3.3 Structure problems
- Module HTML, shell, core libs, docs and tests all mixed in one flat root. Stub files `Na` (3 bytes) in `Wheel alignment/`, `Wheel balancing/`, `vendor/`.
- **Three.js is loaded from `unpkg.com`** by import maps in (almost) every module page + CSP + SW rule; `vendor/fetch-three.mjs` exists but was never run.
- **Version hand-synced in ~7 places** (`sw.js`, `package.json`, README, GUIDE, COMPONENTS, `components.js`, `components.css`); tests are named after process phases (`phase8`, "9a/9e"); `CHANGELOG.md` is 52 KB, `QA.md` 34 KB; docs sprawl (`POLISH.md`, `MONITOR-MAP.md`, `DECISIONS-WA/WB.md`…).
- README mentions GitHub Actions workflows (CI + Pages) but **no `.github/` folder is in the zip** → re-create a minimal CI workflow (`npm test`) or remove the claim; log it.
- README says GitHub Pages ignores `_headers` (true). Keep `_headers`; note the limit.

### 3.4 Duplicate / overlap suspects (keyword scan — verify with real comparison in Phase 0)
| Where | Overlaps with | Signal |
|---|---|---|
| `differential.html` | `awd`, `transmission`, `driveshaft`, **alignment `wa-toe-scene`** | `differential.html` has **5 "auto-drive" mentions**, `wa-toe-scene.js` has one: the **auto-drive demo exists in several places** (the user's reported example) — find every copy |
| `awd.html` | `differential.html` | 9 differential mentions, own gear builders |
| `transmission.html` | `gearbox`, `automatic`, `clutch`, `differential`, `driveshaft` | 8 gearbox / 4 differential mentions; "Auto" vs "Automatic" |
| `engine.html` | `valvetrain`, `crankshaft-piston` | 29 "piston" mentions |
| `ignition.html` | `sparkplug`, `coilplug` | 7 "distributor" mentions |
| `cooling.html` | `thermostat`, `radiator`, + `hvacflow` | 6 thermostat mentions |
| `turbocharger.html` | `intercooler` | 12 intercooler mentions |
| `braking.html` | `abs-esc`, `traction` | 10 "ABS" mentions |
| `exhaustsystem`, `electrical`, `sensors`/`wiring`/`ecu`/`obd2`, `mpfi`/`commonrail`/`fuelpump`, `lubrication`/`oilpump`/`oilfilter`, `steering`/`suspension`/`tyres` vs `Wheel alignment`+`Wheel balancing` | each other | same pattern: a big page containing material that also has its own page |
| the 8 generated guided pages | each other | boilerplate copy-pasted by the generator; must come from `runGuidedModule` / the template |
| Home: Modules vs Systems vs Roadmap | each other | three views may render the module list by separate code paths |

### 3.5 Coverage & roadmap (the user's goal: a student can follow the roadmap to understand the *entire* automobile)
Canonical taxonomy (the user's own): **Powertrain & Engine** (Engine, Fuel, Ignition, Lubrication, Cooling, Exhaust) · **Drivetrain & Transmission** (Transmission, Drive shaft & Differential, Wheels & Tyres) · **Control & Handling** (Braking, Steering, Suspension) · **Electrical & Electronics** (Electrical & Charging, ECUs & Sensors) · **Body, Safety & Comfort** (Frame & Chassis, Active & Passive Safety, Climate Control, Infotainment & Navigation). The 18 registry systems already match this — keep them.
- `docs/AUDIT.md` gets a **coverage table** (system × each bullet in its definition: hybrid/electric, CNG, CVT, regenerative braking, traction control… → covered fully / partly / not). **Gaps are only listed** (backlog for the user's later phases), never built.
- Roadmap integrity (already partly tested by `roadmap.test.mjs`, keep and extend): every module in exactly one stage and one system; ids/files exist; prerequisites before dependants; levels progress; each stage has a plain-language `ask`/`why`/`check`; Modules, Systems and Roadmap views all render from the one registry.

---

## 4. Target structure (SIMPLE: ≤ 2 levels deep, few folders)

### 4.1 Principles
1. **`app/` is the only folder that ships** (a self-contained static site). Everything else is outside.
2. **Flat folders, no sub-folders inside them.** Maximum depth under `app/` is `app/<folder>/<file>`.
3. **A file's name tells you what it is and where it belongs.** No spaces, no capitals, kebab-case.
4. Relative paths only; works from a sub-path (GitHub Pages) and from a host root.

### 4.2 Layout
```
AutoLab3/
├─ AUTOLAB3-PROMPT.md         ← this file
├─ README.md   CHANGELOG.md   LICENSE (MIT default; log it)   package.json   .gitignore   .editorconfig
├─ .github/workflows/ci.yml   ← runs `npm test` (the only nested path in the repo; GitHub requires it)
├─ docs/                      ← FLAT, 10 files max
│    GUIDE.md  COMPONENTS.md  UPDATING.md  MODULE-MAP.md (generated)  MONITOR-MAP.md
│    DECISIONS.md (incl. "Removed")  PROGRESS.md  AUDIT.md (baseline + duplicates + coverage)  BUGS.md (incl. domain review)  QA.md
├─ tests/                     ← FLAT
│    run.mjs  _lib.mjs  <concern>.test.mjs  mod-<name>.test.mjs  known-failures.json
├─ tools/                     ← FLAT, dev only, 3 scripts
│    sync.mjs  new-module.mjs  fetch-three.mjs
└─ app/
   ├─ index.html  404.html  sw.js  manifest.webmanifest  robots.txt  _headers      ← shell
   ├─ core/       ← FLAT: kit.js controls.js dock.js monitor.js chrome.js labels.js components.js
   │                 registry.js (domains + systems + modules)  roadmap.js (stages)  icons.js (SVG strings)
   │                 app.css controls.css components.css
   ├─ shared/     ← FLAT: part-*.js (3D part builders) and model-*.js (pure maths) used by ≥ 2 modules
   ├─ modules/    ← FLAT: every module page lives here, named  <system-id>--<module-id>.html  (+ .js)
   └─ assets/     ← FLAT: icons (png/svg) and three.module.js + addon files (vendored, pinned r160)
```
**Module file naming (this is how modules are tracked by the file tree):**
`modules/<system-id>--<module-id>.html` and, if it needs logic, `modules/<system-id>--<module-id>.js`.
Examples: `modules/trans--gearbox.html`, `modules/shaftdiff--differential.html`, `modules/wheels--wheel-alignment.html`, `modules/wheels--wa-toe.html`. Sorting the folder groups modules by system automatically. A group's sub-pages share the group's system prefix and are linked to their parent in the registry (`parent`/`children`). A test checks that the prefix equals the registry's system id and that file name = `<system>--<id>`.
(If a clearly better flat scheme exists, use it and log it — but keep it flat.)

### 4.3 JavaScript consolidation
- **Core ≤ 8 JS files** + `registry.js`, `roadmap.js`, `icons.js` (data). `guard.js` may fold into `kit.js` only if the early-failure overlay still works when `kit.js` itself fails to load (otherwise keep it, tiny, and log why).
- Merge `controls-core.js`→`controls.js`, `monitor-core.js`→`monitor.js` **only if** the pure logic stays importable in Node tests without a DOM; merge `keys.js` into `chrome.js` if there is still one keymap with one owner per key.
- **Per module: HTML + at most ONE `.js`.** Inline `<script>` in a module page is only the import map/guard tag and a one-line module import; all logic is in the module's `.js`. The wheel alignment/balancing scene files (`wa-*-scene`, `wb-scene`, `wb-page`, `balancer-machine`, `alignment-parts`, `alignment-rack`) fold into each page's `.js` or into `shared/part-*.js` when used by ≥ 2 pages. Pure maths that is unit-tested or used ≥ 2 times → `shared/model-*.js`.
- Guided modules (`runGuidedModule`) should need **no** `.js` at all — config only.
- Rewrite instead of move when code is dead, convoluted or duplicated; visuals, controls and numbers stay the same unless Phases 2/5 deliberately change them.

### 4.4 Module card = a header comment, not an extra file
Every module `.js`/`.html` starts with a short comment block: `id · system · type (guided|custom|overview|group|sub-module) · version · parent/children · shared files used · Monitor channels · storage keys · test file`. `tools/sync.mjs` reads these + the registry to **generate `docs/MODULE-MAP.md`** (id, system, file, type, version, status, parent/children, shared deps, tests, size). A test fails when a card is missing/wrong or the map is stale.

---

## 5. One concept = one home

1. **Rule of two:** the second time something is needed, move it to `shared/` first, then use it from both places.
2. **Decision tree for a parent page and a standalone page that both contain X:**
   (a) standalone exists + parent has its own copy → delete the copy; **link** to the standalone (`navigate(id)`) or import the shared part/model if a small embedded view is needed;
   (b) X exists only inside a big page but is substantial → extract it to its own module/sub-module (registered with `parent`), the big page links to it;
   (c) overview vs detail pages are both legitimate → the overview contains no logic the detail page also has; it composes shared code or links out.
3. **Formulas** (ratios, torque split, speeds, thermal, geometry/sign conventions) → `shared/model-*.js`, pure, unit-tested. **3D builders** (gears incl. bevel/spiral-bevel, shafts, bearings, wheel+tyre, rack, car body, pipes) → `shared/part-*.js`, each with a matching dispose function. **UI blocks** → `components.js`, never re-built in a page.
4. **"Auto drive"** (and any other demo appearing in more than one page): implement once (`shared/part-autodrive.js` or a helper with a small config: path, speed, bounds, callbacks); every user calls it; delete the other copies.
5. **Home views:** Modules, Systems and Roadmap render from one registry-driven code path; no private lists.
6. **Registry integrity (tested):** ids unique; every `file` exists; every `parent/children/related/flow/roadmap` id exists; every module in exactly one system and one roadmap stage (or marked `optional`); counts in README/docs are **generated**, never typed; every file is in the generated precache; every file in `modules/` is registered; `status ∈ stable|draft|deprecated`.

---

## 6. Updating modules safely (write `docs/UPDATING.md`; the user will edit many modules by hand)

**After any manual edit: `npm run sync && npm test` must catch registry/roadmap/map/precache/version drift, rule violations and duplicated logic, and name the file to fix.**

- **Contract each module keeps:** stable module id; registry entry shape; storage keys `autolab:<id>:…` (add `schemaVersion` + migration if the shape changes); Monitor channel and control ids unless the header comment documents the rename; the `shared/` APIs it imports (a breaking change to a shared export = MAJOR bump + check every user listed in `MODULE-MAP.md`).
- **Protocol to improve a module:** find it in `MODULE-MAP.md` → read its header card → if the problem is in a shared part, fix it **there once** and check all users → edit → update/add its `tests/mod-*.test.mjs` → bump `moduleVersion` in the registry (SemVer) → one line in `CHANGELOG.md` → `npm run sync` → `npm test` → tick its row in `QA.md`.
- **Add a new module:** `node tools/new-module.mjs <system-id> <module-id> [--guided]` scaffolds the file(s) with the header card, a registry entry (`status:'draft'`), a roadmap slot (asks which stage), a test stub, and re-runs sync. Promote `draft → stable` after its QA row is filled and its physics reviewed.
- **Drop-in replacement:** a module's `.html`+`.js` pair can be replaced without touching other files as long as id, registry contract and shared-API use are unchanged (prove once with a dry run).
- **Deprecation:** never delete an id; mark `status:'deprecated'` with `replacedBy`; keep a redirect for old links for at least one MINOR version.
- **Versioning:** `package.json` is the single source of truth (`1.0.0`); `tools/sync.mjs` stamps it into `sw.js` (cache name `autolab3-v1.0.0-…`), docs and core headers; a test fails on any mismatch. SemVer per module and for the app. `CHANGELOG.md` restarts with `## 1.0.0` plus one lineage line ("clean restart based on AutoLab2 v8.12.0").

---

## 7. Web/PWA hygiene
- **Self-host Three.js r160** in `app/assets/` using the existing `fetch-three.mjs` idea (if there is no network, say so, keep unpkg temporarily behind **one** shared import-map snippet, and list it as unfinished). Replace the many per-page import maps with that one snippet, stamped by `tools/sync.mjs`. Remove unpkg from CSP and `sw.js` once vendored.
- The precache list is **generated** by `tools/sync.mjs`; no hand-edited `CORE_ASSETS`.
- Validate `event.origin` / `event.source` on every shell ⇄ module `postMessage`.
- No external hosts at runtime; relative paths only; no spaces/capitals in shipped file names (test).
- Mid-range-phone performance: DPR cap, the existing glass-tier system, dispose WebGL resources when a module closes, no per-frame allocations in hot loops.

---

## 8. Phases (each = one session; each ends with the §1.2 handoff)

### PHASE 0 — Audit (read-only)
Output in `docs/AUDIT.md` (+ `PROGRESS.md`, `DECISIONS.md`); **no code changes**. Zip = original files untouched + the new `docs/` + this prompt.
- [ ] Inventory every file (type, size, referenced-by, references) and a dependency sketch (shell → modules → core).
- [ ] Run every original test **individually with collect-all-failures** (wrap assertions in a temp copy; don't edit originals). Try installing `jsdom` so `axis`, `choice`, `options` really run; record all failures incl. the hidden ones. If jsdom can't be installed, say so and list what stays unverified.
- [ ] True counts: registry vs files vs README vs roadmap; orphans and ghosts; identify the 8 new modules and the generator/scratch leftovers (if any).
- [ ] **Duplicate matrix** (§3.4 + new finds): what is duplicated (HTML/logic/3D part/formula/UI), file + line range, similarity, which copy is better, **proposed resolution** from §5. Use function-name/token-level comparison, not only grep. Find **every** auto-drive copy.
- [ ] **"Differential-class" sweep:** apply the failing rules (dead code, hard-coded colours, module-local readouts, hand-built controls, `window.__*`, dial/axis mismatch, charts in panels, inline logic size) to **all** modules → table module × rule. Failing modules = Phase 2 list.
- [ ] Coverage table + roadmap review (§3.5); list stale docs/tests referring to old counts or structure.
- [ ] External hosts, `window.*` globals, `localStorage` keys, `postMessage` types, iframes, owners of timers/RAF; size/complexity table per module.
- **Gate:** `AUDIT.md` complete; the full failure list is enumerated.

### PHASE 1 — New repo & faithful migration (no behaviour change)
- [ ] Create the §4.2 tree; rename to the §4.2 naming; move modules into `app/modules/` with the `<system>--<id>` names; mechanically extract inline scripts into `<name>.js`; fix paths. Delete stubs/stray files (log them). Merge the wheel folders into the flat layout (sub-pages keep their ids; registry gets `parent/children`).
- [ ] Registry: `modules.js` → `core/registry.js` + `core/roadmap.js` + `core/icons.js`; add `moduleVersion`, `type`, `status`, `parent`, `children`; the 8 new modules `status:'draft'`; keep ids and the 18-system/roadmap structure exactly.
- [ ] Consolidate core JS (§4.3) without behaviour change; one shared import-map snippet; vendor Three.js (§7).
- [ ] `package.json` version `1.0.0`; `tools/sync.mjs` (version stamp, precache, module map, import map); restart `CHANGELOG.md`; add `.github/workflows/ci.yml`.
- [ ] Port tests into flat `tests/`; rename phase-named tests by concern; write `tests/run.mjs` (collect-all-failures; non-zero on any failure or dependency-skip); update the obsolete version-regex rule; put the known Phase-0 failures in `tests/known-failures.json` so the runner shows "N known, 0 new".
- [ ] Generate first `MODULE-MAP.md` and header cards for every module.
- **Gate:** every module loads and behaves as in 8.12.0 (smoke list in `QA.md` + automated checks); only known failures remain; zero new; works offline.

### PHASE 2 — Fix `differential` and all similar modules; clear every failure
- [ ] **differential:** replace hard-coded colours with tokens; for each dead item (`isMidEnd, BEVEL_SEGS, makeSpiralBevelGear, PINION_Y, SIDE_R, SPIDER_R, CARRIER_W, DUAL_TYRE_GAP`) decide **wire in or delete** (check the intended visual — spiral-bevel ring/pinion, dual-tyre gap, mid-end layout); steering control = **axis** per the dial test; every readout grid/row → **Monitor rows**; satisfy the Phase-8 rule; re-check physics (`ω_carrier=(ω_L+ω_R)/2`, open/locked/LSD torque bias, ring/pinion ratio) and unit-test in `shared/model-drivetrain.js`.
- [ ] Every other module that failed the sweep: same treatment (list them in the handoff).
- [ ] With jsdom installed, fix everything newly exposed. Empty `known-failures.json`.
- **Gate:** `node tests/run.mjs` → **0 failures, 0 skipped, 0 known**.

### PHASE 3 — De-duplication (may be split 3a/3b by system group)
- [ ] Execute every row of the duplicate matrix with its decided resolution; mark rows done in `AUDIT.md`.
- [ ] Extract `shared/part-*.js` / `model-*.js` for everything used ≥ 2 times (+ unit tests; "build and dispose" smoke test for parts). Implement **auto-drive once**.
- [ ] Make the 8 generated pages thin (template/`runGuidedModule`); resolve safety/HVAC/infotainment overlaps with `abs-esc`, `braking`, `cooling`, `sensors`, `ecu` by linking or shared models.
- [ ] Convert big pages that embed sub-modules into overview + sub-module (registry `parent/children`); update `flow`/`related`/roadmap ids.
- [ ] Home views from one code path. Reduce JS file counts to §4.3; record before/after.
- [ ] Add `tests/no-duplicates.test.mjs` (same function name + near-identical body in two files; geometry builder defined outside `shared/part-*`; same constant block in two modules; document the similarity threshold).
- **Gate:** all tests green; no open duplicate rows; visual/behavioural parity (spot-check list in `QA.md`).

### PHASE 4 — Update provision & docs
- [ ] Write `UPDATING.md` (§6), finalise `GUIDE.md` (include architecture: shell, core, shared, `postMessage` protocol, add/update/merge/deprecate recipes) and `COMPONENTS.md`.
- [ ] Finish `tools/sync.mjs`, `tools/new-module.mjs`; npm scripts `sync`, `new-module`, `test`.
- [ ] Rule tests: portable paths, header cards, map fresh, precache complete, version consistent, max-1-JS-per-module, no inline logic in module HTML, registry/roadmap integrity.
- [ ] `postMessage` origin/source validation (§7).
- [ ] Dry runs: replace a module pair (tests stay green); change a shared part (map lists all users, tests catch regressions); run `new-module.mjs` and delete the result.
- **Gate:** someone new can update a module using only `UPDATING.md`.

### PHASE 5 — Deep bug audit, then fixes (after all improvements)
First **log** every finding in `docs/BUGS.md` (ID, severity S0 crash/data loss · S1 broken feature · S2 wrong output · S3 polish, module, repro, root cause, fix, test, status); then fix by severity; each S0–S2 gets a regression test (see it fail first). Checklist for **every** module and the shell:
1. **Lifecycle/leaks:** RAF cancelled on close/pause; listeners removed; renderer/geometry/material/texture disposed; observers disconnected; timers/audio cleaned; no memory growth after 20 open/close cycles.
2. **State/reset:** Reset restores everything (controls, traces, counters, quiz); Play/Pause/Speed; mode switches rebuild Monitor rows without stale values.
3. **Numerics:** divide-by-zero, NaN/Infinity, unclamped inputs, angle wrap, sign conventions, huge `dt` after a tab switch, drift.
4. **Domain correctness** (write a "Domain review" section in `BUGS.md`): gear ratios, differential speed/torque relations, U-joint speed variation, toe/camber/caster signs, firing orders, ignition advance, thermostat temps, boost ratios, AFR/lambda, DPF thresholds, ABS slip targets, units. **The 8 draft modules get extra scrutiny** — e.g. restraints/crumple: `a = v²/2d`, peak g and belt/airbag/none ordering, units; label simplifications "simplified for teaching".
5. **Input:** pointer capture, multi-touch, focus loss with a held pedal (must spring back), stuck keys, shell/module key conflicts.
6. **Layout:** 320–360 px phones, landscape, tablets, desktop rail, safe-area, `dvh`, 200 % text, label overlap, dock ≤ 30 vh, info sheet ≤ 50 vh.
7. **Theme/a11y:** both themes readable (≥ 4.5:1 text, 3:1 UI), reduced motion, focus ring, ARIA on custom controls, ≥ 44 px targets.
8. **Shell/PWA:** registry integrity, search/filter in all three views, deep links, unknown id → 404, back/forward, iframe load failure/retry, SW install/update flow, offline first load, cache versioning, quota errors.
9. **Roadmap/home:** walk the roadmap as a beginner (every step opens, order makes sense, Back keeps view + scroll, Continue/Basics-only survive reload and storage failure).
10. **Storage:** corrupt JSON, quota, disabled storage, key naming.
11. **Security:** every `innerHTML` with dynamic data; `postMessage` validation; no `eval`; CSP effective on the intended host.
12. **Performance:** frame time on throttled CPU, draw calls, per-frame allocations, startup per module.
13. **Cross-browser:** Chrome, Safari/iOS (WebGL context loss, audio unlock), Firefox — list what could not be tested.
14. **Honesty:** anything unverifiable (no device, no network, no real browser — the 8 new pages were only mock-tested) is listed under "Unverified".
- **Gate:** no open S0–S2; every fix has a test; domain review covers all modules; tests green.

### PHASE 6 — UI smoothening, stray-code disposal, bug disposal, cleanup
**6A UI:** one spacing/type scale from tokens, one easing set, consistent dock/Monitor/panel/empty/loading/error states and icons; smooth module open/close, dock, sheet drag, theme switch (60 fps, no full-screen blur animation, reduced-motion honoured); fast first paint (instant shell, `modulepreload` of core, lazy heavy scenes); 3D polish (label declutter, camera defaults, lighting consistency, damping, low-tier fallback); touch polish (tap highlight, overscroll, selection, gesture conflicts); learner-facing copy; **roadmap UX** (plain stage names, "you are here / next up", beginner first visit, consistent cards across the three views).
**6B Stray code:** extend dead-code checks to unused CSS selectors/custom properties, unused exports, unreferenced images/files, unreachable branches, commented-out code, `console.log`/`debugger`, `TODO/FIXME` (resolve or move to `QA.md`), debug flags, leftover `window.__*`, duplicate CSS rules, empty files; remove and log; strip process wording ("Phase 8", "9a") from comments, tests and docs.
**6C Bug disposal & cleanup:** close or consciously defer each S3 (deferred → `QA.md` "Known limits"); re-run Phase-5 items 1, 2, 5, 6, 12 after the UI changes; final formatting; docs read-through (README, GUIDE, COMPONENTS, UPDATING, MODULE-MAP, QA consistent, no references to removed files).
- **Gate:** tests green incl. dead-code/duplicate/portable-paths; manual QA matrix filled.

### PHASE 7 — Release gate `1.0.0`
- [ ] `node tests/run.mjs` all green, nothing skipped; fresh unzip → `npm install` (dev deps only) → `npm test` → serve `app/` → offline test (load once, go offline, every module opens).
- [ ] Version consistent everywhere; `CHANGELOG.md` `1.0.0` final; `MODULE-MAP.md` regenerated; counts generated; no external host in `app/`.
- [ ] Final report: before/after metrics (root entries, folders, JS files, total KB, duplicates, failing tests, bugs found/fixed/deferred), decisions for the user to review, unverified items, coverage gaps (the backlog for the user's next work), how to run/deploy. Last handoff: zip only + a short "what to do next" note (no next phase).

---

## 9. Tests
- `tests/run.mjs` discovers `tests/*.test.mjs`, runs each in isolation, uses a `t(name, fn)` harness that **records** failures instead of throwing, prints a summary, exits non-zero on any failure **or any skip for a missing dependency**.
- Repo-wide rule tests run against every module automatically (adding a module adds it to the checks): tokens-only colours, no hand-built controls outside core, no `window.__*`, no readout outside the Monitor, no charts in panels, unique ids, z-index scale, dead code (JS + CSS + exports), generated precache complete, registry/roadmap integrity, header cards, map fresh, version consistent, portable paths, no duplicates, max one JS per module, no inline logic, home views share one code path, draft status present.
- Module/model tests: every `shared/model-*.js` and every custom module's maths; "scene builds and disposes" smoke per part/module (jsdom + mocked WebGL; if impossible, document).
- Regression tests fail first, then pass after the fix.

---

## 10. Definition of Done
1. Version `1.0.0` everywhere, one source of truth, restarted changelog.
2. Flat, simple tree exactly as §4 (≤ 2 levels under `app/`); every module found by file name; `MODULE-MAP.md` generated and current.
3. `differential` and all similar modules fixed; **0 failing, 0 skipped, 0 known** tests.
4. No duplicated module logic/HTML/3D builders/formulas/demos (guard test); core ≤ 8 JS files; ≤ 1 JS per module.
5. 18-system registry, three home views and the roadmap preserved, registry-driven, tested; coverage gaps listed.
6. `UPDATING.md` + `sync` + `new-module` make updating/adding modules safe.
7. Bug audit complete (no open S0–S2), domain review complete, UI polished, stray code removed, everything logged; Three.js self-hosted; zero external runtime requests.

---

## 11. Next-phase prompt template (write this to `AUTOLAB3-NEXT-PROMPT.md` at every handoff)

```markdown
# AutoLab3 — Phase {N+1}: {phase name}
Paste this together with `AutoLab3-after-phase{N}.zip` in a new chat.

## Do this first
1. Unzip the zip. Read `AUTOLAB3-PROMPT.md` (§0–§2, §4–§7, §8 "PHASE {N+1}", §9, §11) and `docs/PROGRESS.md`, `docs/DECISIONS.md`.
2. Run `node tests/run.mjs` and compare with the state below (the zip wins if they differ; note it).
3. Do **only Phase {N+1}**. When finished, do the §1.2 handoff (full zip `AutoLab3-after-phase{N+1}.zip` + next prompt) and stop.

## State carried over
- Version: 1.0.0 · modules: {n} · systems: 18 · roadmap stages: {n} · JS files: core {n}, modules {n}
- Tests: {pass}/{total} pass · known failures: {list or "none"} · skipped: {list or "none"}
- Done so far: {one line per finished phase/part}
- Renames/moves a reader must know: {e.g. "modules are now app/modules/<system>--<id>.html"}
- Open items & decisions waiting for the user: {list, or "none"}
- Unverified so far: {list}
- Known risks for this phase: {list}

## Phase {N+1} checklist (copied from the master prompt, finished items ticked)
{paste the §8 checklist items, ticked/unticked, incl. any "continued from part 1" items}

## Exit gate
{paste the gate}

## Reminders
Flat structure (≤ 2 levels under `app/`); never weaken tests; log decisions and removals; no Capacitor; no new content modules; keep module ids and storage keys stable; one phase per session.
```
