# Updating Auto Lab

How to change, add, replace, merge and retire modules without breaking anything. Read this file top to bottom once; after that use the
recipe you need. Everything here was run for real (see "Dry runs" at the end).

## 0. The one-minute picture

- **You edit only hand-written files.** A module is two files, `app/modules/<system>--<id>.html` + `.js`. The registry
  (`app/core/registry.js`), the roadmap (`core/roadmap.js`) and the icons (`core/icons.js`) are data you edit by hand.
- **Everything derived is generated** by `npm run sync`: the header card at the top of each module `.js`, the import map in every page,
  the service-worker precache list and cache version, `docs/MODULE-MAP.md`, `docs/MONITOR-MAP.md`, the README counts, and the rows of
  `docs/QA.md`. Never edit those by hand — the next sync overwrites it, and `npm test` fails if you forget to run sync.
- **The tests are the safety net.** `npm test` runs every rule. A failure names the file and the rule.

| Command | What it does |
|---|---|
| `npm run sync` | regenerate everything derived (`npm run sync -- --check` changes nothing and fails if something is stale) |
| `npm test` | all rule tests + unit tests + DOM tests (needs `npm install` once, for jsdom) |
| `npm run new-module -- <system-id> <module-id> [--guided] --stage <stage-id>` | scaffold a new draft module (below) |
| `npm run import-module -- <page.html>` | replace a module with an updated single-file page (below) |
| `npm start` | serve `app/` on http://localhost:8080 |

**First time:** `npm install` (jsdom, for the DOM tests), then `npm test`. It must be green *before* you change anything; if it is not, stop
and fix that first, otherwise you will not know what you broke.

**Three.js is self-hosted** in `app/assets/` (pinned r160). Nothing is fetched at run time; the app works offline after the first visit.

## 1. Rules you must not break (the contract of a module)

These are what other modules, saved progress and old links depend on. Change any of them only through "Merge / split" or "Deprecate".

1. **The module id** (`"id"` in the registry) — never reused, never renamed. It is the URL hash (`#engine`), the key of recents / visited
   (`autolab.recents`, `autolab.visited`) and the `moduleId` the page announces to the shell.
2. **The file names** `<system-id>--<module-id>.html` / `.js` (a test checks the pattern, lower-case, no spaces).
3. **One `.js` per page, no inline logic in the HTML** (a test checks it).
4. **Numbers live in the Monitor, controls are specs** (`axes` / `options`), colours are tokens (`var(--c-*)`), no hand-built controls.
5. **Shared code goes in `app/shared/part-*.js` / `model-*.js`** and is used by ≥ 2 modules; a function copied between pages fails
   `no-duplicates`.

## 2. Version rules

Each module has a `moduleVersion` in the registry (SemVer). The app has one version, `package.json` (`sync` stamps it into `sw.js`, so a
new version makes browsers refresh their cache).

| You changed | Module version | App version (`package.json`) |
|---|---|---|
| text, a typo, internals with identical behaviour | patch (1.0.0 → 1.0.1) | patch when you ship |
| a new control, row, scene part or section; a physics improvement | minor (1.0.1 → 1.1.0) | minor |
| the module id, file name, or anything saved — **avoid**; use Merge / Deprecate instead | major | major |
| a shared part / model / kit | patch every module that uses it (the section "Who uses which shared / core file" in `MODULE-MAP.md` lists them) | patch |
| a new module | starts as `draft` 0.1.0; `stable` 1.0.0 when QA passes | minor |

Add one line to `CHANGELOG.md` for every shipped change.

## 3. Recipes

### A. Change a module
1. Edit its `.js` (and `.html` only for head / markup).
2. `npm run sync` then `npm test`. Fix what fails; never weaken a test.
3. Open the page: `npm start`, then `http://localhost:8080/modules/<system>--<id>.html` standalone, and `http://localhost:8080/#<id>` inside the shell.
4. Bump `moduleVersion` in the registry (table above), run `npm run sync` again (it rewrites the card), add the CHANGELOG line.

### B. Replace a module with an updated single-file page
Use this when you have a page in the old shape (one `.html` with an inline `<script type="module">` and flat paths like `app.css`, `./kit.js`).
1. `npm run import-module -- path/to/airfilter.html` — the module is found by file name (`--id <module-id>` overrides; `abs-esc`,
   `crankshaft-piston`, `turbocharger`, `starting-system` are known old names). It writes the `.html` + `.js` pair, fixes the paths and imports
   (`../core/…`, `../shared/…`), restores the import-map markers, keeps the header card and runs `sync`. Add `--dry-run` to see what it would do.
2. `npm test`. If it reports a relative import that matches no file, the old page used a file that no longer exists: put the code in `shared/` or adapt the page.
3. Bump `moduleVersion`, CHANGELOG, open the page in a browser (as in A).
   *Careful:* the import **replaces** the module's current files. If the module was refactored since the page you have (for example to use
   `shared/part-gear.js`), you bring the old code back — `no-duplicates` will fail and name it; merge by hand instead.

### C. Add a module
1. `npm run new-module -- <system-id> <module-id> --stage <stage-id>` (add `--guided` for a config-driven page; `--title "My Title"`).
   System ids and stage ids are listed if you get one wrong. The id is lower-case letters and digits, 2–24 characters.
2. It creates the page pair (a spinning block with one control and one Monitor value), a registry entry (`draft`, 0.1.0), a placeholder
   icon, a slot in the roadmap stage you named, and `tests/mod-<id>.test.mjs`, then runs `sync`. `npm test` is green immediately.
3. Replace the block with the real scene, write the text (`panel.desc` / `overview` — no numbers in text), fill `rows`, add real tests
   (pure maths → a `shared/model-*.js` with unit tests, see `tests/mod-differential.test.mjs`).
4. Add the module to its system's `flow` in the registry if it is a step in the story (`"Label|<id>"`), and to `related` where useful.
5. Change `"status": "draft"` to `"stable"` and the version to `1.0.0` only when the QA rows are filled (`docs/QA.md`, see section 5) and the physics reviewed.
6. Changed your mind while it is still a scaffold? `npm run new-module -- --remove <module-id>` deletes it and every trace (it refuses a
   module that is not an untouched draft scaffold).

### D. Change a shared part, a model or `kit.js`
1. Look up its users: `docs/MODULE-MAP.md`, section "Who uses which shared / core file".
2. Change it. Pure maths (`model-*.js`) has a unit test beside it — extend the test first.
3. `npm test`, then open **every** user page in a browser (software rendering is fine) — the unit tests cannot see a changed picture.
4. Patch-bump every user (section 2), CHANGELOG.
5. Never copy the part into a page "just for now": `no-duplicates` fails on near-identical functions, builders named `make…Wheel/Gear/Spring/Pipe/Wire`
   outside `shared/`, and repeated constant blocks.

### E. Merge two modules, or split a module into overview + sub-module
Ids are never reused, so merging means *deprecating* the loser (F) and moving its content into the survivor; splitting means giving the new part
a new id with `parent: <id>` (`type: "sub-module"`, listed in `SUBMODULES`, and in the parent's `children`). Read `AUDIT.md` section 4 and the
decision tree in `AUTOLAB3-PROMPT.md` §5.2 before you start; check first that content is really duplicated (compare text, not titles).

### F. Deprecate / remove a module
Never delete an id outright. Instead, in the registry entry set `"status": "deprecated"` and `"replacedBy": "<live-id>"`. Then:
- remove its id from its roadmap stage and from every `flow` that links it (the test names each one); update or delete its `tests/mod-<id>.test.mjs`;
- keep its files and its entry for at least one MINOR version of the app: the shell opens the replacement for an old `#id` link
  (`resolveModule`), and the module disappears from every home view;
- after that, delete the two files and the entry in a MINOR release; add the removal to `docs/DECISIONS.md` ("Removed").

### G. Update three.js
`node tools/fetch-three.mjs` (needs network; `--from <unpacked npm package>` works offline), then `npm run sync` (it rewrites the import maps, the
preload hints and the precache list), `npm test`, and look at three pages. Only the files the app imports are vendored (`three.module.js`,
`orbit-controls.js`, `room-environment.js`); a new add-on needs a line in `tools/fetch-three.mjs` and in `ADDONS` in `tools/sync.mjs`.

### H. Release
1. `npm run sync -- --check` and `npm test` are green, no skipped groups.
2. Module versions bumped (section 2); app version in `package.json`; `npm run sync` (stamps `sw.js`, README, QA title); `CHANGELOG.md`.
3. Fill the manual cells you changed in `docs/QA.md`; put findings in the "Known limits" part of QA.md.
4. Zip the repo without `node_modules`; publish `app/`.

## 4. What the tests catch (failure → what to do)

| The failure says | Meaning | Fix |
|---|---|---|
| `generated files are fresh` / sync drift | you changed a registry entry, a module import, a version or a page without syncing | `npm run sync`, re-run |
| `header cards` | a module `.js` lost or changed its card | `npm run sync` (never edit the card) |
| `imports resolve` | an import points at a missing file or a name the file does not export | fix the path / name |
| `shared files need ≥ 2 users` | a `shared/` file is used by one module | inline it into the page, or add the second user / a test |
| `no-duplicates` A / B / C | the same function, a builder in a page, or the same constant block exists twice | move it into `shared/part-*.js` / `model-*.js`; the message names both files |
| `inline style attributes` / colour rules | a hex or `rgb()` colour in CSS, or an inline `style=""` | use a token (`var(--c-cyan)`, `var(--text)`, …) |
| `one .js per module` / `no inline logic` | extra script or inline code in a module `.html` | move it into the module `.js` |
| `portable file names / paths` | capital letters, spaces, or a machine path (`/home/…`, `C:\`) in a shipped file | rename / use a relative URL |
| `message listener without an origin check` | a new `postMessage` receiver or a `'*'` target | use `trustedFromParent` / `trustedFromFrame` and `targetOrigin` from `shared/model-messaging.js` |
| `registry` rules | duplicate id, module not in a system or a roadmap stage, flow link to a missing or deprecated id, `replacedBy` problems | fix the data |
| `QA.md` rows | the matrix and the registry disagree | `npm run sync` |
| a DOM group *skipped* | jsdom is not installed | `npm install` — a skipped group is a failure of the release gate |

## 5. QA matrix and manual checks

`docs/QA.md` is a matrix: every module page × 4 viewports × standalone / embedded × 10 checks. `auto` cells are proved by tests, `☐` cells are
manual: open the page, look, replace `☐` with `✓` or `✗ <note>`. `npm run sync` adds a row to every table for a new module and keeps every cell
you have filled. A page is "done" when its row has no `☐` and no `✗`.

## 6. Dry runs (so you know this file is true)

Each recipe was executed on the real repository; results are in `docs/PROGRESS.md` (Phase 4):
**B** — the four original single-file pages were re-imported and reproduced the hand-migrated files byte for byte;
**D** — a deliberate break in `shared/part-pipe.js` made `part-pipe.test.mjs` fail and `MODULE-MAP.md` listed the five pages that use it;
**F** — a scaffold was deprecated with `replacedBy: oilfilter`: all rules passed (apart from the scaffold's own stub test, now tolerant), `index.html#demodep` opened `#oilfilter`, the card vanished from the home view, and `--remove` correctly refused it;
**C** — a guided and a custom scaffold passed all 448 checks on creation, loaded in the browser, and `--remove` restored `registry.js`,
`icons.js`, `roadmap.js` exactly.
