# AutoLab3 (Auto Lab v1.0.0)

Interactive 3D automotive learning lab — an installable, offline-capable PWA. Static site, no build step.

<!--counts:begin-->
**v1.0.0** — 52 modules (+ 7 sub-pages) in 18 systems and 5 domains, 12-stage roadmap.
<!--counts:end-->

## Layout
`app/` is the whole product (publish this folder) · `tools/` four dev scripts (`sync`, `new-module`, `import-module`, `fetch-three`) · `tests/` · `docs/`. See `docs/GUIDE.md` §1.

## Run, test
```
npm install            # once (installs jsdom for the DOM tests)
npm start              # http://localhost:8080  (service workers work on localhost)
npm run sync           # regenerate everything derived (precache, import maps, header cards, MODULE-MAP, version stamps)
npm test               # all tests; prints every failure; exit code ≠ 0 on any failure or skipped group
npm run new-module -- <system-id> <module-id> --stage <stage-id> [--guided]   # scaffold a draft module that passes every test
npm run import-module -- <page.html>                                      # replace a module with an updated single-file page
```
**Changing anything? Read `docs/UPDATING.md` first** — recipes for change / replace / add / merge / deprecate, the version rules, and what each test failure means.
`npm run sync -- --check` fails when anything derived is stale (CI runs it).

## Deploy
Upload `app/` to any static host over **HTTPS** (Netlify, Cloudflare Pages, GitHub Pages, S3+CDN). `app/_headers` (Netlify / Cloudflare Pages format) sets the CSP,
nosniff, referrer and permissions policy, and no-cache on `sw.js` / `index.html`. GitHub Pages ignores `_headers`; replicate the headers on other hosts.

The CSP allows scripts only from this site plus the SHA-256 hashes of the app's own inline scripts (`npm run sync` keeps them current). If your host rewrites HTML (minify, auto-injected analytics or "rocket" loaders), turn that off: a changed inline script no longer matches its hash and the page will not start.

## Release
1. Bump `version` in `package.json` (the only place a version is typed).
2. `npm run sync && npm test`.
3. Deploy `app/`. The new service-worker cache name makes clients refresh.

## three.js
Three.js r160 is self-hosted in `app/assets/` (`three.module.js`, `orbit-controls.js`, `room-environment.js`): nothing is fetched at run time. To update it:
`node tools/fetch-three.mjs` (needs internet once; or `--from <dir>` with an unpacked `three@0.160.0` npm package), then `npm run sync` — see `docs/UPDATING.md` recipe G.

## Docs
`docs/UPDATING.md` (how to change the app) · `docs/GUIDE.md` (how a module is built, the rules) · `docs/COMPONENTS.md` (control + Monitor reference) · `docs/MODULE-MAP.md` (generated) ·
`docs/QA.md` (test matrix) · `docs/DECISIONS.md` · `docs/PROGRESS.md` · `docs/AUDIT.md`.
