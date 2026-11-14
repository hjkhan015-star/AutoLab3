# QA matrix — Auto Lab v1.0.0

59 module pages (the registry in `app/core/registry.js`, sub-modules included; the repo also has `index.html` and `404.html`, 61 pages in all) × 4 viewports × 2 modes.

**How to read a cell**
- `auto` — a test in `npm test` proves it for this page (listed below). Nothing to do.
- `☐` — manual. Open the page, check, and replace `☐` with `✓` (pass) or `✗ <note>` (fail; also add a line to `docs/BUGS.md`).
- `n/a` — does not apply (an embedded module has no header of its own).

**What `auto` means, exactly**
| Column | Proved by |
|---|---|
| header 32 px | `controls.css` sets `--hdr-h: 32px` (28 px landscape) and the standalone header uses it (`tests/dock.test.mjs`). Embedded modules have no header. |
| dock ≤ 30 vh | `dockLayout` / `dockHeightPx` are pure and tested at phone sizes with the 30 vh ceiling; landscape uses two 140 px rails (`tests/dock.test.mjs`). The page's own controls are not measured. |
| no duplicate control | `tests/controls.test.mjs` (a duplicate control id throws), `tests/shell.test.mjs` (no duplicate `id` in `index.html`) and the per-control tests `axis`, `dial`, `choice` (modules keep no hand-built controls) and the registry (a duplicate control id throws). |
| no duplicate value | `tests/monitor.test.mjs` (no readout grid, every repeat removed). Not claimed for `sensors` (added after the Monitor migration), `driveshaft` (its two rows repeat their sliders, kept on purpose), and `sparkplug`, `thermostat`, `tyres`, `wiring` (rewritten in Phase 8, never rendered in a browser here). |

Everything else needs a device, a browser and eyes. Two things are known without a device: every page loads without console errors in headless Chromium with the self-hosted three.js (software rendering, checked in Phase 2b / 3), and the shell opens a module, forwards commands and rejects forged messages (Phase 4). That is *not* a pass for the ☐ cells below — only a person looking at a real screen is.

**Rows are maintained by `npm run sync`**: a new module gets a row in every table (automatic cells as in the others, manual cells `☐`), a renamed or removed id changes its row, and every manual cell you have filled is kept.

**Columns:** header 32 px · dock ≤ 30 vh · model in upper/mid · controls reachable · no duplicate control · no duplicate value · keys · reduced motion · light theme · offline


## 360×640 — phone portrait — standalone

| module | header 32 px | dock ≤ 30 vh | model in upper/mid | controls reachable | no duplicate control | no duplicate value | keys | reduced motion | light theme | offline |
|---|---|---|---|---|---|---|---|---|---|---|
| engine | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| crankpiston | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| valvetrain | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| airfilter | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| turbo | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| intercooler | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| fuelpump | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| carburetor | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| mpfi | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| commonrail | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| ignition | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| sparkplug | auto | auto | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| coilplug | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| lubrication | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| oilpump | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| oilfilter | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| cooling | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| thermostat | auto | auto | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| radiator | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| exhaustsystem | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| catalytic | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| egr | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| dpf | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| transmission | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| clutch | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| gearbox | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| automatic | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| driveshaft | auto | auto | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| differential | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| awd | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| tyres | auto | auto | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| wheel-alignment | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wheel-balancing | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| braking | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| absesc | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| steering | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| suspension | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| electrical | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| starting | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| lighting | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wiring | auto | auto | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| sensors | auto | auto | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| ecu | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| obd2 | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| bodyframe | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| crumple | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| restraints | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| traction | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| accycle | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| hvacflow | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| headunit | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| gpsnav | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wa-toe | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wa-camber | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wa-caster | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wb-static | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wb-dynamic | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wb-procedure | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wb-split | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |

## 360×640 — phone portrait — embedded

| module | header 32 px | dock ≤ 30 vh | model in upper/mid | controls reachable | no duplicate control | no duplicate value | keys | reduced motion | light theme | offline |
|---|---|---|---|---|---|---|---|---|---|---|
| engine | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| crankpiston | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| valvetrain | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| airfilter | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| turbo | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| intercooler | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| fuelpump | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| carburetor | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| mpfi | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| commonrail | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| ignition | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| sparkplug | n/a | auto | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| coilplug | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| lubrication | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| oilpump | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| oilfilter | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| cooling | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| thermostat | n/a | auto | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| radiator | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| exhaustsystem | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| catalytic | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| egr | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| dpf | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| transmission | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| clutch | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| gearbox | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| automatic | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| driveshaft | n/a | auto | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| differential | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| awd | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| tyres | n/a | auto | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| wheel-alignment | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wheel-balancing | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| braking | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| absesc | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| steering | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| suspension | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| electrical | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| starting | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| lighting | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wiring | n/a | auto | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| sensors | n/a | auto | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| ecu | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| obd2 | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| bodyframe | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| crumple | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| restraints | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| traction | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| accycle | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| hvacflow | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| headunit | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| gpsnav | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wa-toe | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wa-camber | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wa-caster | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wb-static | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wb-dynamic | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wb-procedure | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wb-split | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |

## 412×915 — phone portrait, tall — standalone

| module | header 32 px | dock ≤ 30 vh | model in upper/mid | controls reachable | no duplicate control | no duplicate value | keys | reduced motion | light theme | offline |
|---|---|---|---|---|---|---|---|---|---|---|
| engine | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| crankpiston | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| valvetrain | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| airfilter | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| turbo | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| intercooler | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| fuelpump | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| carburetor | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| mpfi | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| commonrail | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| ignition | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| sparkplug | auto | auto | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| coilplug | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| lubrication | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| oilpump | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| oilfilter | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| cooling | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| thermostat | auto | auto | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| radiator | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| exhaustsystem | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| catalytic | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| egr | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| dpf | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| transmission | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| clutch | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| gearbox | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| automatic | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| driveshaft | auto | auto | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| differential | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| awd | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| tyres | auto | auto | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| wheel-alignment | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wheel-balancing | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| braking | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| absesc | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| steering | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| suspension | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| electrical | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| starting | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| lighting | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wiring | auto | auto | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| sensors | auto | auto | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| ecu | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| obd2 | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| bodyframe | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| crumple | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| restraints | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| traction | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| accycle | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| hvacflow | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| headunit | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| gpsnav | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wa-toe | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wa-camber | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wa-caster | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wb-static | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wb-dynamic | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wb-procedure | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wb-split | auto | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |

## 412×915 — phone portrait, tall — embedded

| module | header 32 px | dock ≤ 30 vh | model in upper/mid | controls reachable | no duplicate control | no duplicate value | keys | reduced motion | light theme | offline |
|---|---|---|---|---|---|---|---|---|---|---|
| engine | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| crankpiston | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| valvetrain | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| airfilter | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| turbo | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| intercooler | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| fuelpump | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| carburetor | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| mpfi | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| commonrail | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| ignition | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| sparkplug | n/a | auto | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| coilplug | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| lubrication | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| oilpump | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| oilfilter | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| cooling | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| thermostat | n/a | auto | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| radiator | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| exhaustsystem | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| catalytic | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| egr | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| dpf | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| transmission | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| clutch | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| gearbox | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| automatic | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| driveshaft | n/a | auto | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| differential | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| awd | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| tyres | n/a | auto | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| wheel-alignment | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wheel-balancing | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| braking | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| absesc | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| steering | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| suspension | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| electrical | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| starting | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| lighting | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wiring | n/a | auto | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| sensors | n/a | auto | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| ecu | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| obd2 | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| bodyframe | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| crumple | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| restraints | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| traction | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| accycle | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| hvacflow | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| headunit | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| gpsnav | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wa-toe | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wa-camber | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wa-caster | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wb-static | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wb-dynamic | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wb-procedure | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wb-split | n/a | auto | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |

## 844×390 — phone landscape — standalone

| module | header 32 px | dock ≤ 30 vh | model in upper/mid | controls reachable | no duplicate control | no duplicate value | keys | reduced motion | light theme | offline |
|---|---|---|---|---|---|---|---|---|---|---|
| engine | auto (28 px) | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| crankpiston | auto (28 px) | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| valvetrain | auto (28 px) | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| airfilter | auto (28 px) | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| turbo | auto (28 px) | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| intercooler | auto (28 px) | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| fuelpump | auto (28 px) | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| carburetor | auto (28 px) | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| mpfi | auto (28 px) | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| commonrail | auto (28 px) | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| ignition | auto (28 px) | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| sparkplug | auto (28 px) | auto (rails) | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| coilplug | auto (28 px) | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| lubrication | auto (28 px) | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| oilpump | auto (28 px) | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| oilfilter | auto (28 px) | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| cooling | auto (28 px) | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| thermostat | auto (28 px) | auto (rails) | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| radiator | auto (28 px) | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| exhaustsystem | auto (28 px) | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| catalytic | auto (28 px) | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| egr | auto (28 px) | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| dpf | auto (28 px) | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| transmission | auto (28 px) | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| clutch | auto (28 px) | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| gearbox | auto (28 px) | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| automatic | auto (28 px) | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| driveshaft | auto (28 px) | auto (rails) | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| differential | auto (28 px) | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| awd | auto (28 px) | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| tyres | auto (28 px) | auto (rails) | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| wheel-alignment | ☐ | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wheel-balancing | ☐ | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| braking | auto (28 px) | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| absesc | auto (28 px) | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| steering | auto (28 px) | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| suspension | auto (28 px) | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| electrical | auto (28 px) | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| starting | auto (28 px) | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| lighting | auto (28 px) | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wiring | auto (28 px) | auto (rails) | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| sensors | auto (28 px) | auto (rails) | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| ecu | auto (28 px) | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| obd2 | auto (28 px) | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| bodyframe | ☐ | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| crumple | ☐ | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| restraints | ☐ | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| traction | ☐ | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| accycle | ☐ | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| hvacflow | ☐ | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| headunit | ☐ | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| gpsnav | ☐ | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wa-toe | ☐ | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wa-camber | ☐ | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wa-caster | ☐ | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wb-static | ☐ | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wb-dynamic | ☐ | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wb-procedure | ☐ | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wb-split | ☐ | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |

## 844×390 — phone landscape — embedded

| module | header 32 px | dock ≤ 30 vh | model in upper/mid | controls reachable | no duplicate control | no duplicate value | keys | reduced motion | light theme | offline |
|---|---|---|---|---|---|---|---|---|---|---|
| engine | n/a | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| crankpiston | n/a | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| valvetrain | n/a | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| airfilter | n/a | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| turbo | n/a | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| intercooler | n/a | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| fuelpump | n/a | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| carburetor | n/a | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| mpfi | n/a | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| commonrail | n/a | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| ignition | n/a | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| sparkplug | n/a | auto (rails) | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| coilplug | n/a | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| lubrication | n/a | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| oilpump | n/a | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| oilfilter | n/a | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| cooling | n/a | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| thermostat | n/a | auto (rails) | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| radiator | n/a | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| exhaustsystem | n/a | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| catalytic | n/a | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| egr | n/a | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| dpf | n/a | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| transmission | n/a | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| clutch | n/a | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| gearbox | n/a | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| automatic | n/a | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| driveshaft | n/a | auto (rails) | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| differential | n/a | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| awd | n/a | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| tyres | n/a | auto (rails) | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| wheel-alignment | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wheel-balancing | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| braking | n/a | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| absesc | n/a | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| steering | n/a | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| suspension | n/a | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| electrical | n/a | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| starting | n/a | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| lighting | n/a | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wiring | n/a | auto (rails) | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| sensors | n/a | auto (rails) | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| ecu | n/a | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| obd2 | n/a | auto (rails) | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| bodyframe | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| crumple | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| restraints | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| traction | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| accycle | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| hvacflow | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| headunit | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| gpsnav | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wa-toe | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wa-camber | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wa-caster | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wb-static | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wb-dynamic | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wb-procedure | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wb-split | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |

## desktop — 1280×800 or larger — standalone

From 1024 px wide the "dock" is the **left rail** (280 px, 320 px from 1600 px) and the Monitor is the **right column**; read the `dock ≤ 30 vh` column as "no bottom bar, the rails fit the page".

| module | header 32 px | dock ≤ 30 vh | model in upper/mid | controls reachable | no duplicate control | no duplicate value | keys | reduced motion | light theme | offline |
|---|---|---|---|---|---|---|---|---|---|---|
| engine | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| crankpiston | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| valvetrain | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| airfilter | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| turbo | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| intercooler | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| fuelpump | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| carburetor | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| mpfi | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| commonrail | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| ignition | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| sparkplug | auto | ☐ | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| coilplug | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| lubrication | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| oilpump | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| oilfilter | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| cooling | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| thermostat | auto | ☐ | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| radiator | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| exhaustsystem | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| catalytic | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| egr | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| dpf | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| transmission | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| clutch | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| gearbox | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| automatic | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| driveshaft | auto | ☐ | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| differential | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| awd | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| tyres | auto | ☐ | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| wheel-alignment | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wheel-balancing | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| braking | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| absesc | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| steering | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| suspension | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| electrical | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| starting | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| lighting | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wiring | auto | ☐ | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| sensors | auto | ☐ | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| ecu | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| obd2 | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| bodyframe | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| crumple | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| restraints | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| traction | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| accycle | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| hvacflow | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| headunit | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| gpsnav | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wa-toe | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wa-camber | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wa-caster | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wb-static | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wb-dynamic | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wb-procedure | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wb-split | auto | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |

## desktop — 1280×800 or larger — embedded

Same wide layout inside the shell (the rails start under the 32 px shell header).

| module | header 32 px | dock ≤ 30 vh | model in upper/mid | controls reachable | no duplicate control | no duplicate value | keys | reduced motion | light theme | offline |
|---|---|---|---|---|---|---|---|---|---|---|
| engine | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| crankpiston | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| valvetrain | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| airfilter | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| turbo | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| intercooler | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| fuelpump | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| carburetor | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| mpfi | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| commonrail | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| ignition | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| sparkplug | n/a | ☐ | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| coilplug | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| lubrication | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| oilpump | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| oilfilter | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| cooling | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| thermostat | n/a | ☐ | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| radiator | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| exhaustsystem | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| catalytic | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| egr | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| dpf | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| transmission | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| clutch | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| gearbox | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| automatic | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| driveshaft | n/a | ☐ | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| differential | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| awd | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| tyres | n/a | ☐ | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| wheel-alignment | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wheel-balancing | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| braking | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| absesc | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| steering | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| suspension | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| electrical | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| starting | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| lighting | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wiring | n/a | ☐ | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| sensors | n/a | ☐ | ☐ | ☐ | auto | ☐ | ☐ | ☐ | ☐ | ☐ |
| ecu | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| obd2 | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| bodyframe | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| crumple | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| restraints | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| traction | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| accycle | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| hvacflow | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| headunit | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| gpsnav | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wa-toe | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wa-camber | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wa-caster | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wb-static | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wb-dynamic | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wb-procedure | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |
| wb-split | n/a | ☐ | ☐ | ☐ | auto | auto | ☐ | ☐ | ☐ | ☐ |

## Extra checks (manual)

**Stage canvas is visible and does not cover the model.** Look at it in all four viewports, standalone and embedded. The canvas sits in a bottom corner above the dock and ignores pointer events (orbit must still work through it).

| module | canvas | 360×640 | 412×915 | 844×390 | desktop |
|---|---|---|---|---|---|
| gearbox | torque by gear | ☐ | ☐ | ☐ | ☐ |
| exhaustsystem | acoustic spectrum | ☐ | ☐ | ☐ | ☐ |
| ignition | spark advance vs rpm | ☐ | ☐ | ☐ | ☐ |
| crankshaft-piston | piston motion graph | ☐ | ☐ | ☐ | ☐ |

**Wide layout (1024 px and up).** Open one module of each kind at 1024×768, 1280×800, 1920×1080 and on a TV (3840×2160) and check:

| check | 1024×768 | 1280×800 | 1920×1080 | 3840×2160 |
|---|---|---|---|---|
| controls in the left rail, no bottom bar, nothing cut at either rail edge | ☐ | ☐ | ☐ | ☐ |
| the ‹ handle folds the rail to a strip; the model grows to fill; ‹ opens it again | ☐ | ☐ | ☐ | ☐ |
| Monitor is the right column and scrolls when its rows are long (crankshaft-piston, awd, catalytic) | ☐ | ☐ | ☐ | ☐ |
| pedal / dial / gate controls are centred and tappable in the rail (automatic, braking, engine) | ☐ | ☐ | ☐ | ☐ |
| rail scrolls when a module has many controls (awd, thermostat) | ☐ | ☐ | ☐ | ☐ |
| window resized across 1024 px: layout switches between the bottom bar and the rails without a reload | ☐ | ☐ | ☐ | ☐ |
| sensors: document and Monitor column do not overlap | ☐ | ☐ | ☐ | ☐ |

**Mode switch refills the Monitor.** Switch every mode; rows, trace and footer legend must follow at once, with no stale label and no empty first frame.

| module | modes to switch | rows follow | legend follows | trace clears | 360×640 | desktop |
|---|---|---|---|---|---|---|
| electrical | battery / alternator / charging | ☐ | ☐ | ☐ | ☐ | ☐ |
| starting-system | circuit / starter / mesh / crank | ☐ | ☐ | ☐ | ☐ | ☐ |
| exhaustsystem | 4 configurations | ☐ | ☐ | ☐ | ☐ | ☐ |
| cooling | Air Cooling / Radiator (Liquid) Cooling (and any other mode in the page) | ☐ | ☐ | ☐ | ☐ | ☐ |

**Pages rewritten in Phase 8 (check first).** Their panel was replaced by dock controls and Monitor rows / traces; none was rendered in a browser here.

| module | what to look at |
|---|---|
| sensors | dock sliders and the two selects; Monitor strip does not cover the title; scope redraws; theme from ⋯; works without WebGL |
| sparkplug | Heat / Electrode / View / Condition choices rebuild the scene; RPM and Load axes; "Secondary kV" trace; Reset clears it |
| thermostat | View / Rating / Failure / Flow; "Reset to cold" action; temperature trace with the opening-temperature line |
| tyres | Pressure / Load / Speed / Tread axes and the Surface choice; the old main slider is now Pressure |
| wiring | gauge / fuse / fault choices; "Fuse box view" opens the popup; "Replace fuse"; Loop resistance and Ampacity rows; warnings in the Monitor status |

**Colour conversion (Phase 8).** About 316 CSS colours and 85 legend colours became tokens. In both themes, check legend swatches against the 3D parts they name, and badges, callouts and status flashes for contrast: gearbox, wiring, differential, thermostat, sparkplug, tyres, suspension, electrical, lubrication, exhaustsystem, mpfi, transmission, cooling, index.

**Three baseline bugs fixed in Phase 8** (confirm in a browser): fuelpump runs without a console error (`domLast`); oilpump builds (Base import); wiring's heat colours work (THREE import).

## Known limits (touch targets, B-010)
- **Segmented buttons (`.ctl-seg-btn`)** — 25-42 px wide x 44 px tall on 22 pages. They sit edge to edge, so the hit area cannot grow sideways without taking taps from a neighbour. WCAG 2.2 AA (24 px) is met; the 44 px checklist line is met vertically only. **Decided (slice 4): stays at AA.**
- **Portrait dock handle (`.al-dock-handle`)** — 24 px tall in the full state (raised from 20 px in slice 4: AA met, measured on all 59 pages), 12 px in the slim state (the slim bar is 56 px tall; raising it means redesigning that bar). The 44 px line is not reached because the dock clips above the handle and controls start right below it.
- Everything else small (header buttons, Monitor strip, panel toggle, tabs, panel "more", orb toggle, wide-screen dock handle) reaches 44 px through the shared rule in `controls.css`, measured with the layout audit script `layout.py` (an `elementFromPoint` scan, not the CSS; the audit scripts travel in a separate hand-off zip and are not part of the repo).
- **Dock page dots (`.al-dock-dot`)** — 24 x 14 px with a 32 x 44 px hit area (3 pages: `wa-camber`, `wa-toe`, `awd`). Neighbouring dots are 24 px apart, so they cannot grow sideways. Unchanged since Phase 9b.
- **Content links on `ecu--sensors`** — four inline links 30 px tall (AA minimum is 24 px).
- **Off-screen 3D labels / callouts** at 320 and 390 px on `cooling` and `exhaustsystem` (and a few others): they follow the model as it rotates; identical on the Phase 5 build, so not a regression.
- **Spacing / type / motion rounding (slice 4)** — odd px values were rounded to the 2 px grid (down) and half-pixel text sizes up, so long pages drift slightly: the Roadmap list at 390 px is up to ~27 px longer at the bottom, guided pages ~3 px, text up to 0.5 px larger (sub-10 px text raised to 10 px on four rules). Judged better legibility, not a regression; the Roadmap UX slice redesigns those cards anyway.
- **B-026 (draw calls)** — `awd` 466, `lubrication` 433, `ignition` 405, `ecu` 368, `gearbox` 367, `electrical` 339, `automatic` 310, `accycle` 280 per frame (median 93). Not changed: merging or instancing rewrites eight scenes, and frame rate was never measured on a phone. Real-device review in Phase 7.
- **Domain simplifications kept (Phase 6C)** — restraints force limiter 9 kN (real ones 4-7 kN; the page says "illustrative"), tyres aquaplaning coefficient, `starting` animation speeds (a real engine cranks at 150-250 rpm; the text now says so), radiator vs thermostat opening range, catalyst light-off 250 / 270 C, single-tube radiator core. Reasons in BUGS.md "Disposal of the S3 domain notes".
- **`style-src 'unsafe-inline'`** (B-011, second half) — kept. Removing it means moving every inline `<style>` block (59 pages + the shell) and the one `style=` attribute out, or hashing them with `'unsafe-hashes'`; the gain is small for a static site with no user-supplied HTML, and the churn touches every page. Revisit only if the app ever renders user content.
- **B-004** (two "low-end device" rules) and **B-005** (five wheel designs) — not changed on purpose: unifying the rules changes what some phones render, and the wheel designs are a content decision. Review in Phase 7.
- **Safety line wording** (B-027) — each line is the first clause of its Safety text (≤ 90 characters); on some pages it is a fact rather than an instruction. Left as is (a content decision across 24 pages); an `.al-sec` can override it with `data-summary`.
- **Frame rate** — measured only with Chromium's style / layout metrics and animation counts (software GL has no meaningful fps); a 60 fps check on real hardware is still open. The dock height transition and the `.ui-slot` position transition are layout-based on purpose (see DECISIONS slice 5); the dock swipe snaps, it does not follow the finger.
- **`guard.js` and `404.html`** — keep their own inline colours: they must render when the stylesheet failed to load.
- **Opening a module within ~1.5 s of the home screen appearing, on a slow first visit** — about 2 s slower than before slice 6 (three.js is now warmed after the shell paints, not before). After a few seconds of browsing, or on any later visit (service worker), there is no difference. Chosen on purpose, see DECISIONS slice 6.
- **Long-press and pull-to-refresh on real phones** — verified with emulated touch in Chromium only (selection, iOS callout and the Android refresh gesture are browser UI the emulation does not draw).
- **Panel shift on tablet (slice 8)** — the model is centred below an open info panel; `wa-toe` still sits 29% under it (a very tall model, the clamp keeps it inside the stage rather than crop it). The shift needs the panel to cover the stage's centre line, so a corner card on a wide stage is unchanged. Measured in Chromium with software GL; nothing checked on a real GPU or on a real tablet.
- **Framing, pages still cut off on a phone (slice 8)** — scenery-dominated (`suspension`, `lighting`, `differential`, `caster`, `traction`: more than 2x needed, authored camera kept on purpose) and `cooling`, which is still partly cut (its camera tween ends late; 0-78 px between runs in software rendering). Phase 6C slice 4 fixed `driveshaft`, `camber`, `starting`, `airfilter` (causes in BUGS B-031) and measured 58 pages: cut at all 11 -> 7. The scenery pages stay cut on purpose. Not seen on a real phone: how long the camera tweens take there decides whether the 8 s watch window is enough. The probe in `scene7.py` overstates floor slabs and animated pages (`wa-toe`) vary between runs.

## Learner copy (Phase 6B) — manual check
- Open three pages from different systems (for example ECU, Catalytic converter, Starting) and read the overview aloud as someone with no car knowledge: every technical word should be explained where it first appears.
- **Phase 6C pass on faults and quizzes (by reading and a script, not by a beginner):** every fault table and quiz of the 26 pages with a parseable config and of the 9 wheel pages was checked for long sentences (only 7 of 1,212 were 24 words or more) and for abbreviations used without an explanation; 12 sentences were split or glossed (list in DECISIONS "Phase 6C slice 2"). The 19 hand-built pages keep their fault / quiz text inside page code and were checked only for long sentences. Shell text (About, errors, toasts) read; two lines reworded. **Not done:** a reader test with real beginners; tooltips / aria-labels were read, not reworded (they are short names).

## Status at the end of Phase 6C — what is NOT verified
- **3,113 of the 4,784 matrix cells are still `☐`** (1,435 are `auto`, 236 `n/a`). None was filled by hand: a `✓` here means a person looked at the page on that viewport and mode, and nobody has. They are listed here as Unverified, not hidden.
- **What was checked by script, in headless Chromium with software rendering (not a person, not a phone, not a real GPU):** every page loads without console errors (smoke, 59 pages); no horizontal overflow on 59 pages at 320 / 390 / 1024 px (layout); no 3D label past the screen edge at 390 px (614 labels, 59 pages); model cut-off at 390 px measured on 58 pages (see Known limits); accessible names, text contrast in both themes, reduced-motion rule and focus style (a11y audit script, re-run at the end of Phase 6C: 59 pages x 2 themes, 0 failures); touch targets (layout audit script, Phase 6A / 6B, not re-run). This is evidence for the columns "model in upper/mid", "controls reachable" and "light theme", but it does not replace looking.
- **Phase 5 re-runs not repeated after the Phase 6 UI changes (owner decision at the release gate: not required for 1.0.0):** memory leaks across module switches (`leak.py`), the Reset sweep (`sweep.py`), keyboard / pointer input, and performance (frame time, long tasks). Their Phase 5 results predate the 6A-6C changes (labels, framing, dock, type tokens); the layout re-run was done in 6C (59 pages x 320 / 390 / 1024 px, 0 overflow) and the touch-target scan was not. Listed here as Unverified.
- **Needs a device or a browser this project has not used:** a real phone (frame rate, touch feel, how long camera tweens take), Firefox and Safari, a real host with the CSP header and a service-worker update, and the keyboard / reduced-motion columns on real hardware. The same list is in BUGS.md "Unverified".

