# PROGRESS

## Phase 0 — Audit (done 2026-10-09)
- **What changed:** nothing in the app. Added `docs/AUDIT.md`, `docs/PROGRESS.md`, `docs/DECISIONS.md`, `AUTOLAB3-PROMPT.md`.
- **Tests (before → after):** unchanged by design. Baseline: 11 files pass, `check` 10 fail, `dial` 2, `monitor` 5, `phase8` 1 = **18 failures**; with jsdom `axis`/`choice`/`options` run and pass (no longer skipped).
- **Note:** inside this zip `tests/check.mjs` reports **12** problems, not 10: the added `AUTOLAB3-PROMPT.md` and `docs/` are flagged as stray by the old root-layout rule. They disappear with the Phase 1 restructure (new layout rules); they are not product bugs.
- **Open items:** vendor three.js r160; `.github` CI; version restart; register 7 sub-pages with `parent/children`; mark the 8 new modules `draft`; read D12 pairs section by section.
- **Risks:** `npm test` chain stops at the first failure; zero RAF/dispose cleanup in most custom pages; `postMessage` origin unchecked; hand-synced SW precache with spaced folder names.
- **Unverified:** see AUDIT §10.
- **Next:** Phase 1 — new repo & faithful migration.

## Phase 1 — New repo & faithful migration (done 2026-10-10)
- **What changed:** flat layout (`app/{core,shared,modules,assets}`, `tools/`, `tests/`, `docs/`); 59 pages → `<system>--<id>.html` + `.js` (inline scripts extracted, no logic edits); registry split into `registry.js`/`roadmap.js`/`icons.js` with `moduleVersion/type/status`, `SUBMODULES`, `children`; core 11 → 8 engine JS files; `tools/sync.mjs` (precache, import map, SW version, header cards, MODULE-MAP, version/count stamps, `--check`); `tools/fetch-three.mjs`; package.json, LICENSE, CI (`sync --check` + tests), .editorconfig; README rewritten; docs reorganised (GUIDE §1 new).
- **Tests (before → after):** collect-all runner. Before: 18 failures (Phase 0). After: **0 new**, 325 checks pass, 16 known items (differential: 2 dial, 3 monitor, 1 rule, hex colour and dead-code items; plus the stale MONITOR-MAP row — all Phase 0 baseline, listed per item) and 5 jsdom skips (sandbox only). Added rules: file naming, every `modules/*` registered, ≤ 8 engine files, shared-file users, SW precache generated/complete, one version, relative imports resolve and export the imported names.
- **Browser smoke (Chromium, three.js blocked):** shell renders 52 modules / 18 systems, opening a module loads `modules/engine--airfilter.html`, zero 404s, SW registers. A direct module page loads with zero 404s.
- **Open items:** run `npm install` + `node tools/fetch-three.mjs` with internet (self-host three, un-skip DOM tests); card lacks Monitor channels; 3D runtime of the modules NOT verified (three unreachable here); no `CHANGELOG` build-up beyond 1.0.0.
- **Risks:** shell now pulls `controls.js` via `chrome.js` (first-load bytes ↑, behaviour same); sub-pages' storage/relative links rely on `modules/` depth (checked by the import/ref tests).
- **Unverified:** real-device behaviour, offline mode end-to-end, every module's 3D scene.
- **Next:** Phase 2 — clear the known failures (differential), install jsdom, vendor three.

## Phase 2 — Fix `differential` and the sweep (done in part, 2026-10-10)
- **What changed:** `differential` 1.1.0 (see DECISIONS): dead items removed / wired, Steering axis, Monitor rows, tokens-only CSS, physics in the new `shared/model-drivetrain.js` + `tests/mod-differential.test.mjs` (14 checks). Sweep over all 59 pages: exhaustsystem, lubrication, wiring inline colours → tokens, new repo rule. `tools/sync.mjs` now generates `docs/MONITOR-MAP.md`; its test was rewritten (old rule obsolete). `known-failures.json` emptied. Master prompt added to the repo root.
- **Files:** added `app/shared/model-drivetrain.js`, `tests/mod-differential.test.mjs`, `AUTOLAB3-PROMPT.md`; changed `modules/shaftdiff--differential.{html,js}`, `exhaust--exhaustsystem.js`, `lube--lubrication.js`, `elec--wiring.js`, `core/registry.js` (differential 1.1.0), `tools/sync.mjs`, `tests/{repo,monitor}.test.mjs`, docs.
- **Tests (before → after):** before: 18 files, 325 checks, 16 known, 5 skipped. After: **19 files, 349 checks pass, 0 failed, 0 known, 5 skipped** (the jsdom DOM groups: axis, choice, dial, monitor, options).
- **Not done / open:** (1) jsdom could not be installed (no network) → the 5 DOM groups have not run; whatever they expose is still unknown, and the `0 skipped` gate is open. (2) three.js still on unpkg (`fetch-three.mjs` failed: no network). (3) `differential` was NOT run in a browser: the 3D scene, the axis steering, the Monitor rows and Reset are verified only by static checks and unit tests; offline reload unverified. (4) Header cards still lack Monitor channels (optional item, not done; MONITOR-MAP.md covers it).
- **Risks:** the Steering axis does not spring back (behaviour change, logged); `ui.controls.on('turn')` → Auto Drive hand-over relies on listeners firing synchronously inside `set()` (read from the code, not run); no DOM test covers the new axis spec (`look:'equalizer'` with `unit:'%'`).
- **Next:** re-run this phase's open items where `npm install` and the network work (first: `npm install && node tools/fetch-three.mjs && npm run sync && npm test`, then open `differential` in a browser), then Phase 3 — de-duplication.

- **After the Phase 2 hand-off (2026-10-12):** four pages replaced on request (accycle, absesc, awd, airfilter → 1.1.0, see DECISIONS). Tests: 349 pass, 0 known, 5 skipped (unchanged). Not run in a browser.

## Phase 2b — vendor three.js, browser verification (2026-10-12)
- **What changed:** three.js r160 self-hosted (`app/assets/`, from the uploaded npm tarball); every import map, `sw.js` and the CSP now local. No other code change.
- **Tests:** `node tests/run.mjs` → 19 files, **349 checks pass, 0 failed, 0 known, 5 skipped** (still only the jsdom DOM groups: `axis choice dial monitor options`). `sync --check` clean.
- **Browser results (headless Chromium, software GL):** *differential* — renders, no console / page errors, no failed requests; Monitor shows Rear L / Rear R / Carrier / Turn radius / Torque L / R; Auto Drive moves the Steering axis; touching the axis switches Auto Drive off (switch → off); steering 80 % → radius 5.27 u, −60 % → 7.31 u with L / R = 1.22× / 0.78×; Traction = left-wheel slip → 2.00× / 0.00×, torque 10 / 10 %, status “Open · SLIP ⚠”; + Locked → 1.00× / 1.00×, torque 10 / 90 %, status “Locked”; **R** resets the axis and switches Auto Drive back on. *All 59 module pages* load with three.js local: 58 clean; `mpfi` logs `THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN` (a position attribute holds NaN — **open finding for Phase 5**, not caused by Phase 2). *Offline:* the service worker precached 156 files; with the network off the shell reloads with the same content and `differential` loads with its canvas and 5 Monitor rows, zero failed requests.
- **Not verified:** the 5 jsdom DOM groups (jsdom not supplied) — **the gate “0 skipped” is still open**; visual quality of the 3D scene (only DOM/state checked, screenshots not reviewed for aesthetics); frame rate on real phones; touch dragging of the axis (set programmatically); the other 58 pages beyond “loads without errors”.
- **Next:** supply jsdom (`node_modules.zip`), run the DOM groups and fix what they expose, then Phase 3.

## Phase 2c — jsdom, DOM groups, gate closed (2026-10-12)
- **What changed:** jsdom supplied and used; one stale import path fixed in `tests/monitor.test.mjs`; 3 DOM tests for the differential Steering axis / Auto Drive hand-over added. No app code changed.
- **Tests:** `node tests/run.mjs` → 19 files, **392 checks pass, 0 failed, 0 skipped, 0 known**, exit code 0; `sync --check` clean. **Phase 2 exit gate met** (tests, sync, `differential` browser-verified in 2b, offline reload verified in 2b).
- **Not verified / open:** touch-dragging the axis and frame rate on a real phone; visual quality of the 3D scenes (only state and errors were checked); `mpfi` NaN bounding-sphere warning (→ Phase 5, logged); optional header-card Monitor channels (not done). Headless runs are software-rendered.
- **Next:** Phase 3 — de-duplication.

## Phase 3a — de-duplication, first half (2026-10-12)
- **What changed:** see DECISIONS (Phase 3a) and AUDIT §4 / §12. Closed D2–D6; partly D10 (gear kit) and D11 (canvas textures). 5 new shared files: `part-pipe`, `part-signal`, `part-gear`, `part-canvas` (+ `makeLine`, `DIFF_TEETH`, `pitchCones` added to existing ones). 14 pages edited (mpfi, turbocharger, ignition, starting, exhaustsystem, ecu, obd2, differential, awd, clutch, transmission, 3 alignment scenes, rack, balancing scene).
- **Tests:** 24 files, all green, 0 skipped, 0 known (needs jsdom in `node_modules`) — `no-duplicates` + 4 new part tests (build-and-dispose smoke) + differential model tests extended. Headless-Chromium load of every touched page: no console errors (mpfi's old NaN warning unchanged); screenshots of mpfi, differential, awd checked by eye.
- **Not done (3b):** D1 auto-drive, D8 springs, D9 wheel / tyre builders, rest of D10 / D11, D12 sub-module overviews, D13 verify generated pages, D14 one home renderer, JS-file consolidation (§4.3), quality-detection helper in `kit.js`; D7 judged not a duplicate (0.19–0.59).
- **Unverified:** pixel-level visual parity (only load / screenshots, no before / after diff); behaviour on real phones; the animation of ecu / obd2 signal particles beyond "loads without errors".
- **Next:** Phase 3b.

## Phase 3b — de-duplication, second half (2026-10-12)
- **What changed:** see DECISIONS (Phase 3b) and AUDIT §13. New `shared/model-autodrive.js` (+ test: parity, closed loop); `kit.makeHelixSpring` removed; `Base.pageQuality()` replaces 15 copies; four more canvas helpers use `part-canvas`; `no-duplicates` allow-list now holds only permanent exceptions (wheel designs, steering wheel, leaf spring, starter teeth, charging wire).
- **Tests:** 25 files, all green, 0 skipped, 0 known (needs jsdom). Browser: all 59 pages load (headless Chromium), screenshots checked for dpf; Auto Drive in differential still steers the axis.
- **Not done (3c):** D12 sub-module overviews, D14 one home renderer, §4.3 check (guided pages' config `.js`), quality-rule unification (owner decision).
- **Unverified:** pixel-level parity (no before / after diff), real phones; the spring pages were checked by load + the identical-formula argument (the kit function and `Parts.coilSpring` compute the same helix with the same sample / radial counts).
- **Next:** Phase 3c.

## Phase 3c — closing Phase 3 (2026-10-12)
- **What changed:** D7 / D12 / D14 decided and verified with measurements (see DECISIONS, AUDIT §14); `registry.test` gained the overview → deep-dive link rule; 35 pages patch-bumped; docs updated. No page logic changed in 3c.
- **Tests:** 25 files, **428 checks pass, 0 failed, 0 skipped, 0 known** (needs jsdom). Browser: all 59 pages load (headless Chromium; only the known `mpfi` NaN warning); the home views verified by clicking them (52 / 18 / 12).
- **Phase 3 totals:** 8 new shared parts / models (`part-pipe part-signal part-gear part-canvas model-autodrive` + additions to `part-alignment`, `model-drivetrain`, `kit.pageQuality`), 2 shared-code deletions (`kit.makeHelixSpring`, 9 duplicate local helpers), `no-duplicates` guard, 15 pages lost their copy of the quality block.
- **Not verified:** pixel-level parity (no before / after image diff), real phones, spring pages by formula identity only; the "two `isLowEnd` rules" and wheel-look questions are owner decisions, not done.
- **Next:** Phase 4 — update provision & docs.

## Phase 4 — update provision & docs (2026-10-13)
- **What changed:** `postMessage` origin / source validation + `shared/model-messaging.js`; `tools/new-module.mjs`, `tools/import-module.mjs`, npm scripts; deprecation (`resolveModule`); `tests/hygiene.test.mjs` (7 rules); QA rows generated by sync; `docs/UPDATING.md` written, GUIDE (layout, recipes, §10 protocol), COMPONENTS (shared parts, `pageQuality`) and README brought up to date (they still said three.js loads from unpkg and pointed at files that no longer exist); vendored add-ons renamed to lower case. All 59 modules patch-bumped.
- **Tests:** 27 files, **445 checks pass, 0 failed, 0 skipped, 0 known** (needs jsdom). Browser: all 59 pages load (headless Chromium, only the known `mpfi` NaN warning), offline reload works (161 files precached), shell ⇄ module handshake works with the new checks, a forged message is ignored.
- **Dry runs (all recorded in UPDATING.md §6):** **B replace a module pair** — the four original single-file pages re-imported with `import-module`: byte-identical to the hand-migrated files (and `awd` shows the risk of replacing a refactored module); **D change a shared part** — a deliberate break in `part-pipe.js` failed `part-pipe.test.mjs`, MODULE-MAP listed its 5 users, revert restored green; **C new module** — a guided and a custom scaffold passed all rules on creation (448 checks), loaded in the browser (screenshots checked), `--remove` restored `registry.js` / `icons.js` / `roadmap.js` byte for byte; **F deprecate** — a scaffold deprecated with `replacedBy: oilfilter`: rules green, `#demodep` opened `#oilfilter`, the card left the home view, `--remove` refused it (as designed). **A change a module** — walked through with the npm commands only: edit → sync → test → bump → sync → green.
- **Gate:** "someone new can update a module using only UPDATING.md" — I followed the doc literally for recipes A–D and F; I am not a newcomer, so a person who has never seen the repo has not done it. Treat the doc as verified for correctness, unverified for readability.
- **Not done / open:** the manual ☐ cells of QA.md and the whole bug audit (Phase 5); `mpfi` NaN warning (Phase 5); the two `isLowEnd` rules and the wheel-look question (owner decisions); header-card Monitor channels (optional); unknown `#id` links silently stay on the home view (a 404-style message is a Phase 5 item).
- **Next:** Phase 5 — bug audit and stray code.

## Phase 5a — bug audit, scriptable half (2026-10-14)
- **What changed:** `docs/BUGS.md` (B-001 … B-011, checklist coverage, honest "Unverified" list); fixes B-001 … B-003, B-006 … B-009 (see CHANGELOG); `shared/model-spray.js`, `shared/model-loadwatch.js`; shell: load watchdog + error screen, unknown-link note; `kit`-level: none; `components.js`: Reset; CSS tokens + `--mon-val` / pivot rules; 7 custom pages call `controls.resetAll()`; `tests/`: `model-spray`, `model-loadwatch`, `contrast`, rules B-006 / B-007, shell B-002, mod-wheel-alignment B-008, monitor / layout / axis / repo adjusted (DECISIONS). All 59 modules patch-bumped.
- **Tests:** 30 files, 468 checks, all green, 0 skipped, 0 known (needs jsdom). Every S0–S2 fix has a test that I saw failing against the old code.
- **Browser results (Chromium, software GL):** all 59 pages: 0 console / page errors, 0 NaN / undefined text, Reset restores the start values (except `differential` steering: Auto Drive, by design); no horizontal overflow at 6 viewports; 1,534 interactive elements all named; contrast ≥ 4.5 : 1 in both themes; 24 open / close cycles without growth; shell failure scenarios handled.
- **Not done (5b):** the domain review (item 4) of all 59 modules — the main remaining work, with the 8 drafts first; the S3 deferrals B-010 (touch targets) and B-011 (CSP) go to Phase 6; real devices, Firefox, Safari, performance on hardware.
- **Next:** Phase 5b — domain review and the rest of the checklist, then close Phase 5.

## Phase 5b (part 1) — domain review of the drafts (2026-10-18)
- **What changed:** `docs/BUGS.md` gained the "Domain review" section: the 8 drafts (`bodyframe crumple restraints traction accycle hvacflow headunit gpsnav`) read against the engineering with values recomputed by hand (full list of what was checked and not checked). No errors of fact found. One text fix (accycle: accumulator on orifice-tube systems), one S3 note (restraints: force limiter 9 kN vs 4–7 kN typical, left as illustrative). accycle patch-bumped.
- **Tests:** 30 files, 468 checks, all green, 0 skipped, 0 known.
- **Not done:** the domain review of the other 51 pages (listed in BUGS.md), the rest of the checklist (touch gestures, keyboard-only walk, SW update flow, performance, cross-browser); real devices.
- **Honest limit of this review:** it is a reading by one reviewer with hand calculations; it cannot see wrong 3D proportions or misplaced callouts, and it is not a substitute for a person who works on cars.
- **Next:** Phase 5b part 2 (51 pages), then close Phase 5.

## Phase 5b (part 2, slices 1–2) — domain review of chassis and electrical (2026-10-19)
- **What changed:** BUGS.md "Domain review": tyres, braking, absesc, steering, suspension, electrical, wiring, starting, lighting reviewed (values recomputed: crush / deceleration is in part 1; here AWG resistances, R-134a-independent: fuse colours, yaw-rate formula, damping ratio, alternator pulley ratio …). Fixes: B-012 braking circuit-split text, B-013 accycle drier text (part 1), B-014 electrical rotor speed + charging voltage. New `tests/domain-text.test.mjs` (a text / source assertion per corrected statement, each seen failing against the old text). electrical and braking patch-bumped.
- **Tests:** 31 files, 471 checks, all green, 0 skipped, 0 known.
- **Domain review status:** 17 of 59 pages; 42 left (BUGS.md, "Not yet reviewed": engine, fuel, ignition, lube, cooling, exhaust, trans, shaftdiff, wheels alignment / balancing and their 7 sub-modules, ecu / sensors / obd2).
- **Next:** continue the review (≈ 4 tool calls per module), then the remaining checklist items and close Phase 5.

## Phase 5b (part 3, slice 3) — ECU and cooling groups (2026-10-21)
- **What changed:** BUGS.md: sensors, ecu, obd2, thermostat, radiator, cooling reviewed; B-015 (OBD-II legislation dates) and B-016 (radiator hose wording) fixed, each with an assertion in `tests/domain-text.test.mjs` seen failing on the old text; obd2 and radiator patch-bumped.
- **Tests:** 31 files, 473 checks, all green, 0 skipped, 0 known.
- **Domain review status:** 23 of 59 pages; 36 left (BUGS.md, "Not yet reviewed": engine, fuel, ignition, lubrication, exhaust, transmission, shaft / differential, wheel alignment and balancing with their 7 sub-modules).

## Phase 5b (part 4, slice 4) — exhaust group (2026-10-22)
- **What changed:** BUGS.md: catalytic, dpf, egr, exhaustsystem reviewed — no errors of fact (balanced reaction equation, 33 kJ/g soot heat = carbon's heat of combustion, regeneration temperatures, DTC meanings). No code changes.
- **Tests:** 31 files, 473 checks, all green (unchanged).
- **Domain review status:** 27 of 59 pages; 32 left (engine, fuel, ignition, lubrication, transmission, shaft / differential, wheel alignment and balancing with their 7 sub-modules).

## Phase 5b (part 5, slice 5) — fuel group (2026-10-24)
- **What changed:** BUGS.md: commonrail, fuelpump, mpfi, carburetor reviewed. **B-017 (S2):** the three pressurised-fuel pages had no safety statement — added (diesel injection injury, petrol fire), each asserted in `tests/domain-text.test.mjs`. **B-018 (S3):** carburettor part-throttle mechanism and "float bowl" wording. The four pages patch-bumped.
- **Environment note:** the sandbox was reset mid-session; the repo, helper scripts and jsdom were restored from the saved hand-off zip, the audit-scripts zip and your `node_modules.zip` — nothing was lost, the suite was re-run (31 files, 473 checks) before the work continued.
- **Tests:** 31 files, 477 checks, all green, 0 skipped, 0 known.
- **Domain review status:** 31 of 59 pages; 28 left (engine, ignition, lubrication, transmission, shaft / differential, wheel alignment and balancing with their 7 sub-modules).

## Phase 5b (part 6, slice 6) — the last 28 pages (2026-10-25)
- **What changed:** BUGS.md: engine, ignition, lubrication, transmission, shaft / differential, wheel alignment and wheel balancing reviewed — the domain review now covers all 59 pages. **B-019 (S2):** spark-plug electrode factors contradicted the page text. **B-020 / B-022 / B-023 / B-024 / B-025 (S2):** the missing safety statement on 17 more pages (ignition, lubrication, transmission, shaft / differential, five wheel-balancing pages), each asserted in `tests/domain-text.test.mjs`; the first ignition Monitor frame (dwell) corrected. **B-021 / B-023 / B-024 (S3):** VVT-at-idle, DCT, torque-converter and yoke-phase wording; automatic torque multiplication now capped at 2.2x like the text. 19 modules patch-bumped; `sync` re-run.
- **Environment note:** `node_modules.zip` was not uploaded this time; jsdom was installed from npm (`npm install jsdom --no-save`) and the baseline reproduced exactly (31 files, 477 checks) before any change. The two audit helpers `dumpcfg.mjs` and `dumpcustom.py` (new, in the audit-scripts zip) read the guided `CFG` literals and the custom-page strings.
- **Tests:** 31 files, 496 checks, all green, 0 skipped, 0 known.
- **Domain review status:** 59 of 59 pages. **Not re-run:** the browser sweep (impossible values, Reset) over the 59 pages — no browser here; the fixes are text, one data constant and one slope.
- **Next:** the rest of Phase 5b (checklist items 5, 7, 12, 13 and the "Unverified" list), then close Phase 5 and start Phase 6.

## Phase 5b (part 7) — the browser half of the audit (2026-10-25)
- **What changed:** documentation only (BUGS.md checklist rows 5, 6, 7, 8, 12, the Unverified list, B-026 and B-027; DECISIONS; CHANGELOG). **Code and tests untouched:** 31 files, 496 checks, 0 failed, `sync --check` clean.
- **Browser:** Chromium 153 from the `@sparticuz/chromium` npm package + `playwright-core` (see DECISIONS and `audit-scripts/browser/`). Software GL, 1 CPU.
- **Results:** smoke 59 pages 0 bad; sweep 59 pages / 353 controls / 124 moved / 0 errors / 0 NaN / only the known `differential` steering Reset difference (identical to the Phase 5a baseline); contrast and accessible names on the 19 modules changed in part 6, both themes: 460 elements, 0 failures; layout on those 19 at 320 / 390 / 1024: no overflow (`awd`'s off-screen dock widget is identical in the original build); keyboard path on the shell and two modules; touch (CDP-emulated) drag / cancel / hidden-during-drag: no stuck state; service-worker update: toast, swap, old cache dropped; performance of all 59 pages (median 93 draw calls per frame, maximum 466; one 274 ms long task).
- **New findings:** B-026 (S3, draw calls, deferred to Phase 6), B-027 (S3, owner decision on where the Safety section sits).
- **Still not done:** Firefox / WebKit (cannot be installed here), a real phone (frame rate, multi-touch, long press, soft keyboard, notch, landscape, 200 % zoom), the full-suite contrast run on the 40 pages not changed in part 6 (Phase 5a measured them; nothing in part 6 touched shared CSS), the real host (CSP, caching).
- **Next:** decide B-027, then close Phase 5 (the exit gate: no open S0-S2, every fix with a test, 59 / 59 reviewed, tests green, Unverified honest) and start Phase 6 (B-010 touch targets, B-026 draw calls, B-011, the stray-code and cleanup pass).

## Phase 5b part 8 — closing Phase 5 (2026-10-26)
- **What was compared first:** the uploaded `AutoLab3-after-phase5b7.zip` against my `5b5` — 19 page scripts and the docs differ (the part-6 domain review of the last 28 pages and the part-7 browser verification); no file added or removed; `5b7` reproduces its documented numbers (31 files, 496 checks).
- **What changed:** Safety sections on `turbo` (both tabs), `cooling`, `thermostat`, `radiator` (B-028, owner decision), four assertions, four patch-bumped pages; B-027 recorded as an owner decision (summary above the fold → Phase 6); BUGS.md coverage and Unverified updated; DECISIONS / CHANGELOG.
- **Browser results on the final tree (Chromium, software GL):** 59 pages × 2 themes: 1,517 interactive elements all named, contrast ≥ 4.5 : 1 everywhere once the theme transition has finished; 353 controls driven, 0 console / page errors, 0 NaN text, Reset restores the start except `differential` steering (Auto Drive); 1,249 Monitor texts with no impossible value; 59 pages × 6 viewports with no horizontal overflow.
- **Tests:** 31 files, 500 checks, all green, 0 skipped, 0 known; `sync --check` clean.
- **Phase 5 exit gate: met** (see DECISIONS).
- **Next:** Phase 6 — UI smoothening, stray-code disposal, bug disposal; it already owns B-010 (touch targets), B-011 (CSP), B-027 (safety summary above the fold) and the manual QA matrix.

## Phase 6A — slice 1 (B-027, Safety summary above the fold)
- **What was compared first:** the uploaded `AutoLab3-after-phase5` zip against `AUTOLAB3-NEXT-PROMPT.md`: state matched (31 files, 500 checks, sync clean). `npm install` worked in this sandbox, so `node_modules.zip` was not needed.
- **What changed:** `core/kit.js` (`syncSafety`, `descChanged()`), `core/app.css` (`.al-safety-line`), `cooling--cooling`, `engine--turbo`, `fuel--mpfi` (call `descChanged()` after swapping the description), registry (all 59 `moduleVersion` patch-bumped), `tests/safety-summary.test.mjs` (6 checks).
- **Results:** 32 files, 506 checks green, 0 skipped, 0 known; `sync --check` clean. Chromium: 23 pages show the line at load, `cooling` when its Liquid mode is selected (24 in all); 0 page errors.
- **Not done yet (Phase 6A remainder, 6B, 6C):** B-010 touch targets, B-011 CSP, spacing / easing / state consistency, 3D polish, roadmap UX, stray-code checks, S3 disposal, QA matrix.

## Phase 6A — slice 2 (B-010, touch targets)
- **Changed:** `core/controls.css` only (shared hit-area rule, Monitor strip downward-only, header `z-index` +1 above the dock, header button inset `-4px 0 -12px`), registry (59 `moduleVersion` patch-bumped), `tests/hit-area.test.mjs` (5 checks), `tests/layout.test.mjs` (header check now computes the outcome), `docs/QA.md` (Known limits), `docs/BUGS.md` (B-010 partly fixed).
- **Measured:** `audit-scripts/layout.py` now hit-tests (`elementFromPoint` scan) instead of trusting CSS. Full run, 59 pages x 320 / 390 / 1024 px: 0 exceptions, 0 horizontal overflow. Remaining under 44 px: portrait dock handle (59 pages), segmented buttons (32 pages), dock dots (3), four links on `ecu--sensors`. Off-screen labels/callouts are identical on the Phase 5 build.
- **Results:** 33 files, 511 checks, 0 skipped, 0 known, 0 new; `sync --check` clean.
- **Not done:** the other four viewports of the sweep (360x640, 768x1024, 1366x768) were not re-run; real-finger testing on a device.

## Phase 6A — slice 3 (B-011, script CSP)
- **Changed:** `tools/sync.mjs` (computes `script-src` hashes), `app/_headers` (generated), `tests/csp.test.mjs` (5 checks), docs. No page, module or shell code changed, so no module version bump.
- **Why hashes work here:** module pages have one inline script (the import map, identical on 58 pages); `index.html` has three; the shell's `perfController` is injected as text, so its hash is built from the same source text (`Function.prototype.toString` returns it unchanged).
- **Enforced in Chromium** (a small server adds the exact `_headers` policy, minus `upgrade-insecure-requests` which cannot apply on http://localhost): shell, one module opened inside the shell, and 3 standalone modules — 0 violations, canvas renders, perf-guard injected; a foreign inline script is blocked; a policy without the hashes breaks the shell (control).
- **Results:** 34 files, 516 checks, 0 skipped, 0 known, 0 new; `sync --check` clean.
- **Not done:** `style-src`, the real host, Firefox / WebKit (import maps under CSP hashes are supported in current Chrome; not run elsewhere).

## Phase 6A — slice 4 (spacing / type / motion tokens, dock handle)
- **Compared first:** the uploaded zip against the prompt: state matched (34 files, 516 checks, `sync --check` clean). `npm install` crashed in this sandbox (no network: ENOTFOUND), so the DOM groups were skipped at first; jsdom became loadable later in the session and the final run has **0 skipped**.
- **Inventory** (before): 308 spacing and 182 font-size literals, 22 distinct font sizes, 13 distinct durations, 5 easing spellings across `app.css`, `controls.css`, `components.css`, 16 page `<style>` blocks and the shell; no CSS is injected from JS and one inline `style=` exists.
- **Changed:** `core/app.css` (new tokens `--s-0h … --s-4h`, `--fs-2xs … --fs-5xl`), 20 CSS / HTML files tokenised by a script (`/tmp` tool, rules in DECISIONS), `core/controls.css` + `core/dock.js` (handle 20 -> 24 px), registry (59 `moduleVersion` patch-bumped), `tests/tokens.test.mjs` (5 checks, with a negative control), GUIDE rule R3b, BUGS (B-029 new; B-010 / B-011 closed with remainders deferred; B-004 / B-005 deferred), QA "Known limits", DECISIONS, CHANGELOG.
- **Measured (Chromium, software GL):** before / after for guided (`radiator`), hand-built (`lubrication`), 2D (`catalytic`), wheel (`wheel-balancing`), shell home and Roadmap, at 390 x 844 and 1024 x 768, both themes (24 shots + element geometry). Geometry: same DOM, per-element shifts mostly 1–4 px, accumulating on long lists (Roadmap at 390 px up to ~27 px at the bottom); visually near-identical. Full `layout.py`, 59 pages x 320 / 390 / 1024 px: **0 exceptions, 0 horizontal overflow**; dock handle now 24 px on all 59 pages; remaining small targets are the known-limits set (segmented buttons, dock dots, four links). `a11y.py`, 59 pages x 2 themes: **0 exceptions, 0 unnamed controls, 0 contrast flags**, reduced-motion and focus-visible OK (1,486 interactive elements).
- **Results:** 35 files, 521 checks, 0 skipped, 0 known, 0 new; `sync --check` clean.
- **Not done:** theme-switch / open-close smoothness, empty / loading / error states, first paint, 3D polish, roadmap UX (the owner-facing visual decision; next), 6B, 6C. The other three layout viewports (360x640, 768x1024, 1366x768) were not re-run; real devices, Firefox, Safari.

## Phase 6A — slice 5 (theme switch, state screens)
- **Changed:** `core/app.css` (`html.al-theme-swap` rule in the reset layer; `.al-state*` pattern), `core/kit.js` (`applyTheme`), `index.html` (`applyShellTheme`, error + empty markup / CSS onto `.al-state`), registry (59 `moduleVersion` patch-bumped), `tests/states.test.mjs` (6 checks, with negative controls), GUIDE rule R3c, DECISIONS. `sync` recomputed the shell's script hashes (its inline script changed).
- **Measured** (`audit-scripts/motion5.py`, shell + `radiator`): theme switch **45 -> 3** simultaneous transitions (3 = ambient loops), style-recalc 64-74 -> 31-41 ms; module open / close and dock tap unchanged (transform / opacity, one `height`). Real error path forced (module script blocked): shown in both themes, buttons 44 px, **Try again recovers**. Empty states checked in both themes.
- **Browser audits on this build:** CSP enforcement (`csp_check*.py`): 0 violations in the shell, standalone modules and a module in the shell, perf-guard injected, foreign inline script blocked. `layout.py` 59 pages x 320 / 390 / 1024 px: 0 exceptions, 0 overflow, same known-limits set. `a11y.py` 59 pages x 2 themes: 0 exceptions, 0 unnamed controls, 0 contrast flags, reduced-motion and focus-visible OK (1,483 interactive elements).
- **Results:** 36 files, 527 checks, 0 skipped, 0 known, 0 new; `sync --check` clean.
- **Not done:** frame-time on real hardware (software GL cannot give fps), the sheet-drag question (no finger-following drag exists), first paint, 3D polish, touch polish, learner copy, roadmap UX, 6B, 6C.

## Phase 6A — slice 6 (first paint, touch)
- **Changed:** `tools/sync.mjs` (the three.js `modulepreload` tags become a deferred, Save-Data-aware warm-up script), `index.html` (regenerated block), `core/app.css` (reset layer: root `overscroll-behavior: none`, no selection / callout on controls, labels and canvas, native range `pan-y`), registry (59 `moduleVersion` patch-bumped), `tests/startup.test.mjs` (6 checks, negative control, mutation-checked), GUIDE rule R3d, DECISIONS, QA, CHANGELOG.
- **Measured** (slow-4G / 4x CPU, median of 3): first paint **2.4 -> 1.7 s**, home cards **4.0 -> 2.8 s**; module open after 8 s of browsing **3.5 -> 3.6 s** (unchanged); module opened 1.5 s after the cards **6.4 -> 8.5 s** (the stated trade-off). Warm-up verified in the browser: 3 preloads after load + idle, none on Save-Data or a 2G connection. Touch: handle swipe works, canvas drag does not scroll, no selectable controls left on the two sampled pages.
- **Results:** 37 files, 533 checks, 0 skipped, 0 known, 0 new; `sync --check` clean. Browser audits on this build: CSP (`csp_check*.py`) 0 violations (the new inline warm-up script is hashed by `sync`); `layout.py` 59 pages x 320 / 390 / 1024 px: 0 exceptions, 0 overflow, same known-limits set; `a11y.py` 59 pages x 2 themes: 0 exceptions, 0 unnamed controls, 0 contrast flags, reduced-motion and focus-visible OK (1,494 interactive elements).
- **Not done:** 3D polish, learner copy, roadmap UX, 6B, 6C; real-device long-press / pull-to-refresh; in-module lazy loading.

## Phase 6A — slice 7 (3D stage: labels, camera framing)
- **Changed:** `core/labels.js` (`bandFromObstacles`), `core/dock.js` (`frameScale`), `core/kit.js` (`modelExtent`, `fitModel`, wiring in `attachResize`, `buildScene({ frame })`), `tests/scene.test.mjs` (12 checks), all module versions +0.0.1, docs.
- **Measured:** labels under the info panel 143 -> 0; cut-off views 42 -> fewer (first version 24 of 118; the tightened rule was re-measured only on 8 pages plus screenshots of 4).
- **Results:** 38 files, 545 checks, 0 known, 0 new; `sync --check` clean.
- **Not done:** the info panel still covers > 25% of the model on 34 tablet pages (a view offset that follows the panel is the next step); `airfilter` ~30 px cut at the 16-unit zoom limit; `starting` unchanged (cause not found); lighting / damping / low-tier left as they are; real-GPU check.


## Phase 6A — slice 8 (3D: model clear of the panel; Roadmap UX)
- **Changed:** `core/dock.js` (`panelShiftPx`), `core/kit.js` (`panelShift`, panel `ResizeObserver`, bottom-edge clamp in `attachResize`), `index.html` (Roadmap: You are here, Next up, first-visit welcome and default, "explored" wording, explored tick in system lists), `tests/scene.test.mjs` (17 checks), all module versions +0.0.1, docs.
- **Measured:** panel covering > 25% of the model on tablet 33 pages -> 1; label overlaps and dock overlaps unchanged at 0. Home screenshots before / after (first visit and mid-progress, three views, phone and tablet): `/tmp/shots8` in the session, `AutoLab3-6a8-before-after-screenshots.zip` in the hand-off.
- **Results:** 38 files, 550 checks, 0 known, 0 new; `sync --check` clean.
- **Not done:** `airfilter` ~30 px cut at the zoom limit; `starting` unchanged (cause unknown); `ecu--sensors` gives no probe data (the instrumented copy does not reach its scene; not investigated); light rig, damping, low-tier fallback and a real-GPU check; learner-facing copy beyond the Roadmap (6A e); 6B, 6C.
- **Added later in slice 8:** framing cap 1.4 / 1.6 -> 1.8 / 2.0 (see DECISIONS). Six named pages looked at on a phone: `clutch` and `gearbox` fixed; `cooling` improved (125 px still cut on phone); `driveshaft` (~200 px), `camber` (~167 px), `starting` (~42 px) and `airfilter` (~30 px, at the 16-unit zoom limit) unchanged and not yet explained (the fit does not move them, so the module may set the camera itself). Audit scripts now pin the Modules view; module audits re-run on the final tree: layout 0 overflow / 0 exceptions, a11y 59 pages x 2 themes 0 flags, CSP 0 violations.


## Phase 6B — learner copy and stray-code clean-up
- **Changed (copy):** the overview, part descriptions, safety lines and a few quiz explanations of 55 of the 59 pages, and the blurbs of 5 system cards in `core/registry.js` (transmission, brakes, suspension, steering, body). Rules used: define a technical term in a few words at its first use, split long sentences, no change to any number, unit or engineering claim. The biggest rewrites are `ecu--ecu` (whole overview) and `elec--electrical` (alternator). `trans--transmission` and `hvac--hvacflow` were left as they were. The per-page list is in DECISIONS.
- **Changed (code):** old "Phase N" / "7b2" labels and history wording ("the old …", "(replaces …)") removed from comments in `app/` (not `controls.css`, see DECISIONS); removed `choiceText` (controls), `detectEmbed` (kit), `cloneState` (model-alignment), `SPEEDS_KMH` and `dimensionError` (model-balancing), which nothing used; `export` dropped from 35 names that are used only inside their own file; removed the unused `.ui-toolbar`, `.ui-tb-divider`, `.ui-hidden`, `.ui-stack` and `.ui-row` rules from `app.css` (and the empty `utilities` layer block; the layer name stays in the order line). All 59 module versions +0.0.1.
- **Searched for and not found:** `console.log` in app code (only `warn` / `error` in real error handlers), unreferenced files in `app/`, commented-out code, unused `#id` selectors.
- **Results:** 38 files, 550 checks, 0 known, 0 new; `sync --check` clean. Audit scripts re-run on the final tree (Chromium, software GL): CSP 0 violations on the three pages checked; layout 59 pages x 320 / 390 / 1024 px, 0 exceptions, 0 horizontal overflow, the small-target and off-screen entries are of the kinds already listed in QA known limits (not compared one by one with the 6A8 run); a11y 59 pages x dark / light, 0 exceptions, 0 unnamed controls, 0 contrast flags, reduced motion and focus ring present.
- **Not done:** faults, quiz and tooltip wording, and the shell text beyond the Roadmap, were not reviewed for plain language; no reader test with real beginners (the pass is by reading only); the a11y script counted 1,480 interactive elements against 1,494 recorded earlier (dark 714, light 766; no control was changed, so probably settling time, not checked); no real device or real GPU; unused CSS custom properties and unused module-local functions were not searched for; `controls.css` still has "PHASE" section headers and the tests / tools still mention phases in comments and test names.
- **Next:** Phase 6C (see `AUTOLAB3-NEXT-PROMPT.md`).

## Phase 6C — slice 1 (S3 domain notes, B-032)
- **Changed:** five wording fixes (`electrical`, `wiring`, `starting`, `radiator`, `crankpiston`), B-032 fixed in `labels.js` and `app.css`, B-026 and the model simplifications deferred with reasons (BUGS, QA, DECISIONS). 7 new checks (5 in `domain-text`, 2 in `scene`), each seen failing first. All 59 module versions +0.0.1.
- **Results:** 38 files, 557 checks, 0 known, 0 new; `sync --check` clean. Chromium (software GL), 390 px, 8 s settle: no label box past the edge on the 7 B-032 pages.
- **Also:** removed 5 unused CSS custom properties (`--info`, `--ui-top / -right / -bottom / -left`) and the `body.embedded` rule that only set them. Kept `--dock-kbd`, `--dock-slim`, `--dock-options`, `--z-guard`: unread, but `layout.test.mjs` asserts them as part of the documented scale (removing them means changing those tests; not done). `--hit` is a documented marker, kept.
- **Browser re-run after the shared change (Chromium, software GL):** smoke 59 pages, 0 bad; layout 59 pages x 320 / 390 / 1024 px, 0 exceptions, 0 horizontal overflow; label sweep 59 pages at 390 px after an 8 s settle, 614 labels, 0 past the viewport edge. Not re-run: a11y (2 themes) and the 6B CSP check; no CSS colour or markup changed.
- **Not done yet:** the rest of 6C (fault / quiz / tooltip copy, stray code, 3D leftovers, final docs read-through, manual QA cells).

## Phase 6C — slice 2 (fault / quiz / shell copy, stray code)
- **Changed:** 12 plain-language edits to fault and quiz text and two shell lines; controls.css section headers renamed by topic with their 14 test anchors; phase / step wording removed from 18 test files; one duplicate CSS rule removed; a missing full stop in the `starting` text restored (my slip from slice 1). All 59 module versions +0.0.1. Details and rejected alternatives: DECISIONS.
- **Checked, nothing to change:** unused non-exported functions (none), unused custom properties (done in slice 1), inline `style=` attributes beyond the one already known (not re-scanned).
- **Results:** 38 files, 557 checks, 0 known, 0 new; `sync --check` clean. Negative controls (hex colour injected into three renamed blocks) fail their tests.
- **Not done:** a reader test with beginners; the 3D leftovers; the final docs read-through; the manual QA cells.

## Phase 6C — slice 3 (type tokens)
- **Changed:** 20 `font:` shorthands and one `letter-spacing` moved onto the type scale (four off-scale sizes now shift by 0.5-1.5 px: home tile badge, `lubrication` equalizer labels, two `wiring` fuse label sizes); new `tokens.test.mjs` rules (font shorthand, line-height / letter-spacing px, inline `style=""` attributes) with negative controls; inline `padding:24px` -> `var(--s-6)`; the px matcher no longer misses `.5px`.
- **Results:** 38 files, 557 checks, 0 known, 0 new; `sync --check` clean. Browser re-run after the change: see the next entry.

## Phase 6C — slice 4 (camera framing leftovers)
- **Changed:** framing thresholds 2.3 / 2.5; a start-up watch in `kit.js` (a module's own camera tween no longer ends the fit); optional `CFG.maxDistance` for guided modules, used by `airfilter`; 3 new rules in `scene.test.mjs` and the pinned-constants test refined to its intent (negative controls tried). Causes of the 6A leftovers (`airfilter`, `starting`, `driveshaft`, `camber`) are now known and fixed; `cooling` improved. Details: BUGS B-031, DECISIONS.
- **Results:** 38 files, 559 checks, 0 known, 0 new; `sync --check` clean. Chromium (software GL), 390 px, 58 pages: pages cut at all 11 -> 7, cut by more than 20 px 8 -> 5, none worse. On the final tree (after the `kit.js` change): smoke 59 pages, 0 bad; layout 59 pages x 320 / 390 / 1024 px, 0 exceptions, 0 horizontal overflow; a11y 59 pages x 2 themes, 0 exceptions, 1,498 interactive elements all named, 0 contrast failures, 0 pages without a reduced-motion rule or a `:focus-visible` style.
- **Also:** `ecu--sensors` has no 3D scene (so no probe data); its registry mode corrected from "2D + 3D" to "2D".
- **Not done:** real phone / GPU; the rest of 6C (final docs read-through, manual QA cells, Phase 5 re-runs).

## Phase 6C — docs read-through (partial)
- **Checked by script:** every file path named in README / GUIDE / COMPONENTS / UPDATING / MODULE-MAP / QA exists; every helper named there (`name(`) exists in the code; no old framing constants, removed tokens or test counts are repeated. History files (DECISIONS, PROGRESS, AUDIT, the master prompt) name removed files on purpose and were left alone.
- **Fixed:** `GUIDE` (`sensors.html` -> `ecu--sensors.html`), `QA` (`POLISH.md` -> `docs/BUGS.md`, `tests/check.mjs` -> the tests that exist now, `audit-scripts/layout.py` explained as outside the repo, two step labels removed), new "Status at the end of Phase 6C" section listing the 3,113 unfilled manual cells as Unverified.
- **Not done:** reading the docs start to finish as a new maintainer would (a script finds broken references, not unclear writing).

## Phase 7 — release gate 1.0.0
- **Run on the final tree:** `node tests/run.mjs` 38 files, 559 checks, 0 failed, nothing skipped, 0 known; `node tools/sync.mjs --check` clean (MODULE-MAP and the generated counts current); version 1.0.0 in `package.json` and `sw.js` (`autolab3-v1.0.0`); no external host loaded from `app/` (the only URLs are comments inside the vendored three.js files).
- **Offline test (Chromium, fresh profile, localhost):** the shell was loaded once, the service worker filled the cache (163 of 163 listed files), then the network was switched off and the shell plus all 59 module pages were opened: every page answered 200 from the cache, none showed the offline fallback, each has a canvas, and there were no page errors, console errors or failed requests.
- **Not run:** `npm install` (no network in this environment; the dev dependencies were supplied as `node_modules.zip`). Phase 5 re-runs: skipped by owner decision, logged as Unverified in QA.md. The manual QA matrix (3,113 cells) and everything that needs a real phone, GPU, Firefox / Safari or a real host: Unverified, listed in QA.md and BUGS.md.
