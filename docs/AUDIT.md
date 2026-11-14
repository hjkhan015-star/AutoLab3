# AUTOLAB3 — Phase 0 audit (read-only)

Input: `AutoLab2-8_12_0-full.zip` (top folder `AutoLab2-main/`, 130 files, 3.5 MB). No original file was modified. Measured 2026-10-09 with Node 22.22.2 and jsdom installed (scratch dir, not committed).

## 1. Headline numbers (re-measured)
| Item | Prompt snapshot | Measured |
|---|---|---|
| Registered modules | 52 | **52** (all 52 ids unique, all files exist) |
| Systems / domains / roadmap stages | 18 / 5 / 12 | **18 / 5 / 12** |
| Module pages incl. unregistered sub-pages | — | **59** (52 + 7 sub-pages: `wa-toe/camber/caster`, `wb-static/dynamic/split/procedure`) |
| Root entries | 85 | **~85** (root HTML 54 incl. `index`/`404`; 13 JS; 3 CSS; 8 md/txt; 2 spaced folders) |
| Guided pages (`runGuidedModule`) | — | **35 of 59**; custom pages 24 |
| Inline script ≥ 50 KB | 10 named | **14** (adds wiring 52, awd 54, lubrication 50, dpf 50) |
| Total page size | — | 1,931 KB |
| `unpkg.com` | most pages | **59 pages + CSP + SW rule** (123 URL hits); three.js never vendored |
| `.github/` | missing | **missing** (README claims CI + Pages) |
| Version typed by hand | ~7 places | `sw.js`, `package.json`, README, GUIDE, COMPONENTS, `components.js/.css`, + stale test regexes |

## 2. Test baseline (each original test run individually, jsdom installed)
jsdom installs fine from the npm registry here, so `axis` (30 groups), `choice` (22), `options` (21) **now run and pass** — the "skipped" status was environmental, no hidden failures there.

Collect-all copies of the three aborting tests (temp copy, originals untouched) expose **every** failure:

| Test | Failures |
|---|---|
| `check.mjs` (10) | stray `DELETE-THESE-OLD-ROOT-FILES.txt`; `differential.html`: hard-coded colour `var(--text-dim, #94a3b8)`; dead code `isMidEnd`, `BEVEL_SEGS`, `makeSpiralBevelGear`, `PINION_Y`, `SIDE_R`, `SPIDER_R`, `CARRIER_W`, `DUAL_TYRE_GAP` |
| `dial.test.mjs` (2, 23 pass) | differential steers with an axis, not a dial (rule 1); "exactly one dial per migrated module, none elsewhere" (same cause) |
| `monitor.test.mjs` (5, 54 pass) | differential: readout grid/row still in page; numbers/bars in the panel readout slot; dead readout CSS · **stale test/doc**: `MONITOR-MAP.md` lacks the 8 new pages (`accycle bodyframe crumple gpsnav headunit hvacflow restraints traction`) · **obsolete rule**: regex `autolab-v8.([89]|10)` rejects `autolab-v8.12.0` |
| `phase8.test.mjs` (1, 13 pass) | "guided differential/thermostat: no dial, no panel of their own" fails on differential |
| pass | `axis choice chrome controls dock glass keys labels layout options roadmap shell`, alignment (44), balancing (22) |

Total: **18 failures** (11 on `differential.html`, 1 stray file, 1 stale doc table, 1 obsolete regex, + overlaps counted once). Other version regexes (`axis`, `choice`, `dock`, `shell`) pass only because they accept v8.x — all must go when the version restarts at 1.0.0 (Phase 1).
Risk: `npm test` is an `&&` chain — it stops at `check.mjs` and never runs the rest.

## 3. Registry, roadmap, orphans
- Registry (`modules.js`: `AUTO_DOMAINS`, `AUTO_SYSTEMS`, `AUTO_MODULES`, `AUTO_ROADMAP`, `AUTO_META`): every module is in exactly one system and one roadmap stage; no ghosts, no orphans among the 52. Files in folders: `Wheel alignment/wheel-alignment.html`, `Wheel balancing/wheel-balancing.html`.
- Sub-pages (7) are unregistered; they hang off the two overviews (Phase 1 adds `parent/children`).
- Systems per module count: engine 6, fuel 4, ignition 3, lube 3, cooling 3, exhaust 4, trans 4, shaftdiff 3, wheels 3, brakes 2, steering 1, suspension 1, elec 4, ecu 3, body 1, safety 3, hvac 2, info 2. `soon[]` is empty everywhere.
- Roadmap stages (modules): power 3 · breathe 4 · spark 5 · care 6 · exhaust 4 · drive 7 · grip 5 · stop 2 · brain 5 · body 6 · connect 2 · boost 3.
- **The 8 new 8.12.0 modules** (all guided, 7–10 KB each): `bodyframe` (body), `crumple`, `restraints`, `traction` (safety), `accycle`, `hvacflow` (hvac), `headunit`, `gpsnav` (info). None has `status:'draft'` yet; none is in `MONITOR-MAP.md`.
- Doc/count drift: `QA.md` says "42 module pages … 44 pages in all"; `README` says 52; counts are typed by hand.
- Stray / stub: `DELETE-THESE-OLD-ROOT-FILES.txt`; 3-byte `Na` files in `Wheel alignment/`, `Wheel balancing/`, `vendor/`. `POLISH.md` (process notes).
- `vendor/fetch-three.mjs` was never run (three.js r160 is available from the npm registry, which this sandbox can reach → vendoring is feasible in Phase 1).

## 4. Duplicate matrix (token 5-gram similarity on function bodies ≥250 chars; 40 names defined in ≥2 files)
| # | What | Where | Sim | Resolution (§5) | Phase |
|---|---|---|---|---|---|
| D1 | **Auto-drive** demo | `differential.html` (toggle `autodrive`, `autoDrive` loop, l.1533–1743); `Wheel alignment/wa-toe-scene.js` l.117 + `alignment-rack.js` l.166 ("road-test mode") | different code, same concept | one `shared/part-autodrive.js` with config (path, speed, bounds, callbacks); delete copies. Also check `steering.html` (3 `steerAngle` hits) | ◐ 3b: the steering controller (pure pursuit) → `shared/model-autodrive.js` (differential, unit-tested, parity with the old code on 400 poses, closed-loop test). **Not merged:** the alignment “road test” is a cosmetic scrolling grid + drift (no path following) and `steering` has no auto mode — one consumer each, different logic, so no common `part-autodrive` |
| D2 | `makeManhattanWire/Points` | `ignition` ↔ `mpfi` | 0.88–0.91 | → `shared/part-wire.js` | ✅ done 3a → `shared/part-pipe.js` (ignition, mpfi) |
| D3 | `makeOrthoCurve`, `addCollarAt` (byte-identical), `makeStraightPipe`, `makeStream/updateStream` | `mpfi` ↔ `turbocharger` | 1.00 / 0.85 / 0.6 | → `shared/part-pipe.js` | ✅ done 3a → `shared/part-pipe.js` (mpfi, turbocharger); streams stay per page (different particle logic, similarity 0.26–0.35) |
| D4 | `makeCyl` (identical), `initAudio`, `applyMode`, `updateAudio`, `updateLivePanel` | `exhaustsystem` ↔ `starting-system` | 1.00 / low | `makeCyl` → shared part; audio engine → `shared/` (check real overlap) | ✅ done 3a → `makeCylinder` in `part-pipe.js` (starting, exhaustsystem); the audio blocks overlap only 0.23–0.41 → not duplicates |
| D5 | `mkLine` (identical), `mount` | `wa-camber-scene` ↔ `wa-caster-scene` | 1.00 / 0.70 | fold into alignment shared part | ✅ done 3a → `makeLine` in `part-alignment.js`; `mount` is 0.31–0.41 similar → not a duplicate |
| D6 | `makeLink` | `ecu` ↔ `obd2` | 0.81 | → shared / components | ✅ done 3a → `shared/part-signal.js` (ecu, obd2: build + flow + dispose) |
| D7 | `applyConfig` ×5, `update`, `animate` ×17 | `braking`, `carburetor`, … | 0.77–0.81 | check; likely shared loop in `kit.js` | ✅ decided 3c: not a duplicate — measured 0.19–0.59 on real bodies (the 0.77–0.81 was shared boilerplate shape); each page's animate/applyConfig drives different parts. No shared loop invented |
| D8 | **Spring builders** ×3 | `suspension.makeCoilSpring`, `kit.makeHelixSpring`, `lubrication.makeSpring` | — | one `part-spring.js` | ✅ done 3b: coil springs are `Parts.coilSpring` (core/components.js); `kit.makeHelixSpring` (identical geometry) deleted, 3 callers moved; `suspension` / `lubrication` wrappers inlined. `makeLeafSpring` stays (not a coil) |
| D9 | **Wheel/tyre builders** ×5 | `alignment-parts.buildWheel/Tyre/Rim`, `suspension.makeWheel`, `differential.makeWheelAssembly/makeTyreCarcass`, `steering.makeRoadWheel`, `balancing-model.makeWheel` | — | one `part-wheel.js` (+ dispose) | ✅ decided 3b: not one builder — five *different* wheel designs; alignment + balancing already share `part-alignment.buildTyre/buildRim`. Others are permanent page-specific exceptions (merging would change visuals) |
| D10 | **Gear builders** | `awd.makeGear`, `starting-system.buildGearTeeth`, differential gears (incl. dead `makeSpiralBevelGear`) | — | one `part-gear.js` incl. bevel/spiral-bevel | ✅ 3a gear kit (`part-gear`) + 3b: spur gears are `kit.makeCog` (11 users); `starting.buildGearTeeth` is a different tooth style → permanent exception; `awd.makeGear` no longer exists |
| D11 | `canvasTex`, `box`, `wedge`, `show` | alignment-rack ↔ differential, kit ↔ differential … | low | shared helper if body matches | ✅ 3a+3b: every painted-canvas helper → `shared/part-canvas.js` (differential, clutch, transmission, rack, balancing scene, lighting, catalytic, dpf, tyres). `box` / `wedge` / `show` have different bodies → not duplicates |
| D12 | Big pages containing sub-modules that also exist standalone | `engine`↔`valvetrain`/`crankshaft-piston`; `ignition`↔`sparkplug`/`coilplug` (7 "distributor"); `cooling`↔`thermostat`/`radiator`; `turbocharger`↔`intercooler`; `braking`↔`abs-esc`/`traction`; `transmission`↔`gearbox`/`automatic`/`clutch`; `awd`↔`differential`; `exhaustsystem`; `electrical`/`wiring`/`sensors`/`ecu`/`obd2`; `mpfi`/`commonrail`/`fuelpump`; `lubrication`/`oilpump`/`oilfilter`; `steering`/`suspension`/`tyres`↔ wheel alignment/balancing | keyword-level only | needs a section-by-section read in Phase 3 (decision tree §5.2 a/b/c) | ✅ done 3c: **no copy exists** — 7-word text shingles and 50-char sentences shared between each big page and its standalone: 0 (a handful of numbers / import comments); function-name overlap ≤ 9 and below the 0.6 threshold. The pairs are overview ↔ deep-dive by design. Each deep-dive page is a step in its overview's system flow (new test). Decision (c) for all 20 pairs; no registry change |
| D13 | 35 guided pages share boilerplate | `runGuidedModule` already shared; the 8 new pages are config-only | OK | verify no page re-implements HTML | ✅ checked 3b: all 35 guided pages have no HTML beyond the template; their scripts build DOM only for canvas textures (now `part-canvas`) and `wiring`'s own wire-builder UI (page-specific) |
| D14 | Home: 3 views from separate code paths? | `index.html` | unverified | single registry-driven renderer | ✅ verified 3c in the browser: one dispatcher (`renderHome` → `renderAllModules`) over the registry globals, shared row / card builders (`modRow`, `buildCard`); Modules view 52 cards, Systems 18 cards covering all 52 modules, Roadmap 12 stages resolving all 52; no console errors |

Not duplicates: `build`, `tick`, `step`, `set`, `loop`, `draw`, `measure` share only a name.

## 5. "Differential-class" sweep (rule × module)
Existing repo rules (check.mjs, monitor, dial, phase8, choice, layout) run on **every** page. Only **differential.html** fails any of them. Rules checked: hard-coded colour in `<style>`, dead code, module-local readouts, hand-built controls, `window.__*` (none anywhere), dial/axis mismatch, charts in panel, `Base.*` import, throttle clock typo.
Extra signals (not rule failures): 14 pages have ≥ 50 KB inline logic; `differential` (81 KB) is the largest; `wiring`, `awd`, `lubrication`, `dpf` are guided yet carry 50+ KB of inline script. **Phase 2 list: `differential` only**; Phase 5 watches the large pages.
Not covered by any rule today: unused CSS selectors, unused exports, `TODO/FIXME`, `innerHTML` with dynamic data (counts per page in the inventory), RAF-cancel/dispose on close (only `ignition`, `differential`, `lubrication`, `obd2`, `transmission`, `clutch`, `sparkplug`, wheel-alignment call `.dispose(` at all → **Phase 5 leak risk**).

## 6. Runtime surface
- **External hosts:** only `https://unpkg.com` (123 refs; 59 pages, CSP in `_headers`, SW rule) and the `w3.org` SVG namespace.
- **`window.__*`:** none. Globals set by `modules.js`: `AUTO_DOMAINS`, `AUTO_ROADMAP`, `AUTO_MODULES`, `AUTO_META`, `AUTO_SYSTEMS`.
- **`localStorage`:** `autolab.visited`, `autolab.recents`, `autolab.prefs` (dotted names; the prompt's `autolab:<id>:…` convention is *new* — keep these three stable, §2.10).
- **`postMessage`:** shell→module `{source:'auto-shell', type:'command'|'key', action…}`; module→shell `{source:'auto-module', moduleId…}`, `{source:'auto-module-perf', action:'perf-ready'}`; SW `SKIP_WAITING`. Sent with `targetOrigin '*'`. Receivers check `d.source` strings only; `index.html` uses `findBySource(e.source)` for one handler; **`event.origin` is never validated** (Phase 4 item).
- **Timers:** 14 `setInterval/setTimeout` in `index.html`, 2 in `kit.js` → ownership review in Phase 5.
- **CSP** (`_headers`): `script-src 'self' 'unsafe-inline' https://unpkg.com`; GitHub Pages ignores `_headers`.
- **SW:** `VERSION='autolab-v8.12.0'`, hand-maintained list of 61 `.html'` entries plus core assets (incl. the two spaced folders, URL-encoding risk).

## 7. Size / complexity (top)
differential 88 KB (inline 81), mpfi 81, exhaustsystem 76, turbocharger 71, ignition 67, steering 67, starting-system 64, wiring 63, engine 61, cooling 58, braking 57, awd 55, lubrication 53, dpf 51, suspension 51, electrical 50. Full per-page table (kb, inline kb, guided, raf, innerHTML, dispose, storage keys) was generated by script for this audit; Phase 1 regenerates it as `MODULE-MAP.md`.

## 8. Coverage table (system × bullets in its definition; **gaps listed only, nothing built**)
Legend: ● fully · ◐ partly · ○ not covered. Judgement from module titles/subtitles and `CHANGELOG`; Phase 5's domain review re-checks depth.
| System | Covered | Partly | Not covered |
|---|---|---|---|
| Engine | 4-stroke cycle ●, crank/piston ●, valvetrain ●, air filter ●, turbo ●, intercooler ● | diesel vs petrol cycle ◐, multi-cylinder layouts/firing order ◐ | **2-stroke, rotary, variable valve timing/Atkinson (hybrid engine), electric motor & battery pack/hybrid/EV powertrain, CNG/LPG systems** |
| Fuel | pump/tank ●, carburetor ●, MPFI ●, common rail ● | GDI ◐ | CNG/LPG kits, fuel evaporative (EVAP) system |
| Ignition | conventional ●, spark plug ●, coil-on-plug ● | — | CDI/capacitive discharge, ignition timing map (ECU) beyond advance ◐ |
| Lubrication | system ●, pump ●, filter ● | viscosity grades ◐ | dry sump |
| Cooling | system ●, thermostat ●, radiator ● | water pump, fan control ◐ | — |
| Exhaust | system ●, catalytic ●, EGR ●, DPF ● | SCR/AdBlue ◐ | muffler acoustics ◐ |
| Transmission | manual ●, clutch ●, gearbox ●, automatic ● | — | **CVT, DCT/dual clutch, AMT, hybrid e-CVT** |
| Drive shaft & differential | shaft/U-joints ●, differential ●, AWD ● | LSD/locker ◐ | transfer case, CV-joint detail ◐ |
| Wheels & tyres | tyres ●, alignment ●, balancing ● | TPMS ◐ | wheel hub bearings |
| Braking | disc/drum ●, ABS/ESC ● | brake booster/master cylinder ◐ | **regenerative braking, parking/EPB, brake bleeding** |
| Steering | rack/pinion, hydraulic, EPS ● (steering.html) | — | steer-by-wire |
| Suspension | coil/leaf, dampers ● (one page) | — | air suspension, active/adaptive dampers, MacPherson vs wishbone (split) |
| Electrical & charging | battery/alternator ●, starting ●, lighting ●, wiring ● | fuses/relays ◐ | **HV battery/BMS, EV charging** |
| ECUs & sensors | sensors ●, ECU ●, OBD-II ● | CAN bus ◐ | LIN/FlexRay, ADAS sensors (radar/lidar) |
| Frame & chassis | body-on-frame vs unibody ◐ (draft, 1 module) | — | aerodynamics, materials |
| Active & passive safety | crumple ◐, restraints ◐, traction control ◐ (drafts) | — | ESC beyond abs-esc, ADAS (AEB, lane keep), pedestrian protection |
| Climate control | A/C cycle ◐, HVAC airflow ◐ (drafts) | — | heat pump, auto climate control logic |
| Infotainment & navigation | head unit ◐, GPS ◐ (drafts) | — | Bluetooth/CarPlay-Android Auto, telematics, OTA |

## 9. Stale docs and tests (to fix in Phase 1)
Docs: README/GUIDE/COMPONENTS carry hand-typed version and counts; `QA.md` says 42 modules; `MONITOR-MAP.md` omits 8 pages; `CHANGELOG.md` 52 KB and `QA.md` 34 KB; `POLISH.md`, `DECISIONS-WA.md`, `DECISIONS-WB.md`, `DELETE-THESE…txt` are process leftovers. Tests: file names after process phases (`phase8`), comments "Phase 5/7b3/9e", version regexes for v8.x in 6 tests, `choice.test` "sw.js cache is autolab-v8.6.x", `dial.test` says jsdom "NOT a project dependency".

## 10. Unverified in Phase 0
- Real-browser behaviour of all 59 pages (no browser here); the 8 new pages were only mock-smoke-tested upstream.
- Section-level overlap for D12 (keyword scan only).
- Whether `steering.html` has an auto-drive copy (3 hits for `steerAngle`).
- Coverage-table depth judgements (from titles, not from reading each page's content).
- three.js r160 download from the npm tarball (reachable in principle, not yet run).

## 11. Gate
Complete failure list enumerated (18, with causes), counts measured, duplicates tabulated, sweep done, coverage listed. Phase 1 may begin.


## 12. Phase 3a status (2026-10-12)
Rows done: D2, D3, D4, D5, D6. Partly done: D10 (gear kit), D11 (canvas textures). **Open for 3b:** D1 auto-drive, D7 (`applyConfig` / `animate` — measured 0.19–0.59, below the 0.6 duplicate threshold; decide whether a shared loop in `kit.js` is worth it), D8 springs, D9 wheel / tyre builders, rest of D10 / D11, D12 sub-module overviews, D13 verification of generated pages, D14 single home renderer, JS-file consolidation (§4.3). New finding: quality detection (`cores` / `mem` / `isLowEnd`) repeated in ~9 pages. `tests/no-duplicates.test.mjs` guards the closed rows and lists the leftovers with their phase.

## 13. Phase 3b status (2026-10-12)
Closed: D1 (controller), D8, D9 (decision), D10, D11, D13; plus the quality-detection block (`Base.pageQuality()` in `kit.js`, 15 pages). **Open for 3c:** D12 (embedded sub-modules → overview + sub-module: needs a section-by-section read of ~20 large pages, decision tree §5.2), D14 (one home renderer), §4.3 consolidation check (core has 11 JS files = 8 + registry / roadmap / icons; guided pages still have a config `.js` each), D7 stays “not a duplicate”. New finding: two `isLowEnd` rules exist (pages: cores ≤ 4 or mem ≤ 2; kit `quality`: `classifyDevice` tiers) — see DECISIONS.

## 14. Phase 3c status (2026-10-12) — Phase 3 closed
Every row of §4 is closed or logged as a permanent exception (D9 wheel designs, D10 starter teeth, leaf spring, steering wheel, charging wire). §4.3: `core/` = 8 engine + 3 data JS files, every page has HTML + exactly one `.js`, scene files are `shared/part-*` used by ≥ 2 pages; guided pages keep their `.js` (config **and** the 3D `build(H)`, which cannot be pure config). 35 pages patch-bumped (internals changed, behaviour intended identical).
