# Mighty Decks components package separation implementation plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Publish an independently buildable public components package that Storyteller and Exiles install from npmjs.com, with the full PNG catalogue available separately.

**Architecture:** Extract the reusable renderer, export contracts, and normalized presentation catalogue into a standalone repository. Ship runtime assets through npm and the generated PNG catalogue through an immutable GitHub Release. Keep application state, gameplay orchestration, editor documents, and callbacks in their consumers.

**Tech stack:** TypeScript, React 18, Vite 6, Zod, pnpm, Node test runner/tsx, Playwright, GitHub Actions, npm trusted publishing.

**Status:** Superseded. The Git-file distribution plan replaces this plan's npm publication, release-archive, and GitHub-side build direction. The remaining release and migration acceptance gates below are retired; retain this document only as historical context. See [`docs/TODO.md`](../TODO.md#historical-plans).

## Current implementation state (verified 2026-09-17)

- [x] A standalone checkout exists at `D:/projects/mighty-decks-components`; its public identity is `tomasreichmann/mighty-decks-components`, it has an MIT license, and it contains CI/release workflows.
- [x] `@mighty-decks/components@0.1.0` is published on npm and is the current `latest` tag. Storyteller's lockfile resolves it through the public registry with an integrity hash rather than a workspace link.
- [~] Storyteller's working tree changes point the web app at `^0.1.0`, remove the local `packages/components/` source, and replace the local package scripts. These changes are uncommitted and have not passed Task 9/11 validation.
- [~] Exiles has uncommitted package-integration work, including its adapter, stylesheet import, and static-copy command. Its own migration notes report that the published `0.1.0` package lacks the required artwork archive, so visual acceptance remains blocked.
- [ ] The published release has not been evidenced as meeting G3/G4: versioned runtime/PNG archive inventory, checksums, clean packed-consumer installation, CLI checks, and browser/style-isolation verification.
- [ ] Storyteller still lacks the Task 9 `components:copy` lifecycle integration and the required catalogue comparison check; its current `components:check` only shows the resolved dependency.
- [ ] G5/G6 have not been evidenced: provenance/release verification, a complete immutable artwork archive, clean independent consumer builds, browser evidence, and rollback commits.

Do not treat the local source retirement as accepted until the outstanding checks above pass. The standalone repository's working tree also contains unrelated/uncommitted follow-up work, so its current source state must not be substituted for a released, verified artifact.

## Scope and working conventions

This implements the [planning handoff](./2026-09-16-mighty-decks-components-package-separation-handoff.md). Work in the current working copies; do not create a Git worktree. Preserve unrelated changes and stage only each task's files. Commit instructions below are suggested implementation checkpoints, not actions performed while planning.

Use these path aliases throughout:

| Alias | Location |
| --- | --- |
| `S` | `D:/projects/mighty-decks-ai-storyteller` |
| `E` | `D:/projects/exiles-of-the-hungry-void` |
| `P` | Proposed standalone checkout `D:/projects/mighty-decks-components`; confirm it is available before creating it |
| `OWNER/REPO` | Public GitHub identity to be supplied by the maintainer; proposed repository basename `mighty-decks-components` |
| `VERSION` | Maintainer-selected initial public release `0.1.0`; verify availability under `@mighty-decks` |

Commands use PowerShell unless marked as CI commands. Commands for new scripts are acceptance interfaces to implement in the named task, not existing capabilities. Stop after a failed command; do not infer success from a subsequent command. Long validation commands should write full output to local `.agent-logs/` and return a concise result.

No changes to Adventure events, Socket.IO handlers, server authority, or game mechanics are needed. Use the repo's vertical-slice and UI guidance when executing consumer work, and webapp-testing for browser checks. Do not install/register the packaged agent skill.

## Evidence collected on 2026-09-16

- `S/packages/components/package.json` is `@mighty-decks/components@0.1.0`. It exports `.`, `./react`, `./styles.css`, `./export`, `./csv/*`, `./png/*`, and the `mighty-decks-components` executable.
- `src/catalog.ts` imports six private spec modules. `spec/rulesCards.ts` also imports `outcomeDeck.ts`; both reach `adventureState.ts` for an outcome type. `cardPresentation.ts` imports `assetCards.ts`. Do not copy that graph wholesale.
- `scripts/generate.ts` copies nine directories from `apps/web/public`, deletes/recreates generated output, and adds a Taken Out artwork alias. `vite.config.ts` aliases the private spec; `tsconfig.json` extends the root config. All three need standalone replacements.
- `scripts/write-types.ts` handwrites declarations. Its `./export` declaration advertises `enumerateStaticCards`, which `src/export.ts` does not export; its custom-card type is narrower than the source schema. Add source-derived declarations and packed-consumer checks during extraction.
- Storyteller imports the package stylesheet in `apps/web/src/main.tsx`. `GameCardView.tsx` uses packaged Outcome/Effect/Stunt visuals with `assetBaseUrl=""`; Actor/Asset/Counter behavior still uses app components. Preserve that behavior during dependency migration.
- Exiles pins `pnpm@10.29.3`, uses React 18/Vite 6 and plain CSS, and has no components dependency. `apps/web/src/cards.tsx` owns card rendering and editing; `EncounterEditor.tsx` owns the data-only MDX descriptor. Root `pnpm-lock.yaml` is authoritative.
- Public registry lookup `npm view @mighty-decks/components version --registry=https://registry.npmjs.org --json` returned E404. This establishes no publicly readable package at lookup time, not ownership or permission to publish under `@mighty-decks`.

The existing `S/output/mighty-decks-components-0.1.0.tgz` was inspected without regenerating it:

| Measurement | Bytes | Meaning |
| --- | ---: | --- |
| Compressed tarball | 565,279,683 | About 539 MiB downloaded |
| Sum of unpacked regular files | 569,937,294 | About 544 MiB installed |
| `generated/png` | 270,298,042 | 795 PNGs |
| `assets` | 297,148,358 | 323 files; artwork dominates |
| Everything except generated PNGs | 299,639,252 | Still about 286 MiB unpacked |

The working assets directory also contains app logos, scenes, maps, button backgrounds, and rule illustrations. Its inventory differs from the existing tarball. Build a fresh allowlist; neither the old tarball nor the current directory is a release inventory.

## Decisions and acceptance gates

| Gate | Owner | Required evidence | Blocks on failure |
| --- | --- | --- | --- |
| G1: identity | Tomáš Reichmann/npm scope administrator | Name `@mighty-decks/components`, initial version `0.1.0` approved; exact GitHub identity, scope permissions and version availability still to verify | Final metadata, remote creation, publishing |
| G2: rights | Tomáš Reichmann | Artwork ownership confirmed by the owner (`tomasreichmann@gmail.com`); code/text/artwork license terms still to select; preserve font notices and review the inventory | Any public source/history, tarball, or archive containing uncleared material |
| G3: size and visuals | Package maintainer | Report compressed/unpacked runtime and archive sizes; meet applicable host limits; all required artwork and PNG entries resolve; visual review accepted | Release on host-limit, missing-content, or visual failures; no arbitrary size cap |
| G4: standalone/API | Implementer | Clean source checkout build; packed installation/type checks; CLI and browser checks; no app/private imports | Release candidate |
| G5: publishing | Release maintainer | Working first-publication procedure, exact trusted-publisher identity, provenance, tag/version agreement, complete immutable archive | Consumer release and consumer upgrades |
| G6: consumers | Each consumer maintainer | Registry install in isolation, host checks/browser evidence, recorded rollback commit | Retiring the local workspace package |

There is no user-imposed artifact-size budget. Measure and report runtime/archive sizes and size changes; exclude unnecessary files without sacrificing required content. Enforce applicable registry/host limits. GitHub documents a per-release-file limit below 2 GiB; recheck limits at publication. No authoritative numeric npm ceiling was established in the original inspection. [GitHub release limits](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)

Prefer two English PNG archives per version, grouped as `core` and `medieval`. Use explicit catalogue membership, not filename guessing. Every standard Outcome, Effect, Asset base/modifier (including medieval packs), Actor base/role/special (including medieval content), Counter, and Stunt (base and medieval) must be represented. Compare the requested inventory with the existing catalogue and add missing entries before claiming completeness. A single combined archive is acceptable if grouping creates unnecessary complexity; record that choice. Keep React 18 peers; React 19 support is separate work.

The initial stable public version is `0.1.0`, as requested. An optional candidate may use `0.1.0-rc.1` on `next`; stable uses `latest`. Explain the PNG export change from the unpublished local artifact in release notes rather than raising the initial stable version. If `0.1.0` is unavailable, resolve the conflict with the maintainer instead of silently choosing another version.

Tomáš Reichmann (`tomasreichmann@gmail.com`) confirms ownership of the artwork and new package/repository. Use `@mighty-decks/components` on npmjs.com. Exact GitHub account identity and npm scope permissions remain setup details. Public code/text/artwork license terms still need selection. The package is the source of truth for components and reusable presentation data; applications own their behavior and state.

The two supported authoring workflows are static PNG images in Markdown and React components in MDX. Document installation, stylesheet loading, asset copying, and concrete examples for each. Exiles must keep its existing safe, data-only MDX editor contract.


## Ownership and compatibility

| Location | Owns | Consumers |
| --- | --- | --- |
| `P/src/data/catalog.en.json` | Canonical reusable presentation records, with stable IDs/slugs/content version | Package renderers, CSV generation, PNG export |
| `P/src/contracts/cardExport.ts` | Pure custom-card export schema copied from `S/spec/cardComponents.ts` | Public package export API |
| npm runtime | JS, source-derived declarations, CSS, optimized required art, fonts/notices, CSVs, guides, skill, CLI | Storyteller and Exiles |
| GitHub Release | `mighty-decks-components-VERSION-png-en-core.tar.gz`, `mighty-decks-components-VERSION-png-en-medieval.tar.gz`, `release-manifest.json`, validated npm tarball | Markdown/static-image users and release verification |
| Storyteller `spec/` | Gameplay definitions and application contracts | Storyteller server and web |
| Exiles documents/server catalogue | Existing document format and editor data | Exiles editor and persistence |

Bootstrap normalized records once from the current catalogue, with stable ordering and a source commit in `docs/migration-baseline.md`. Do not retain a build-time spec adapter in P. Shared presentation changes start as a package PR; accompanying consumer changes update app-owned rules/projections when needed. Storyteller's comparison check must detect differences in overlapping published fields, while permitting intentionally app-only records. This is a documented cross-repository compatibility check, not an automatic overwrite of gameplay data. Retire the bootstrap exporter when extraction is accepted; keep the comparison check.

Preserve `.`, `./react`, `./styles.css`, `./export` runtime exports and `./csv/*`. Fix declarations to describe actual runtime exports. Remove `./png/*` and document the breaking change. Runtime installation never downloads PNG archives or runs a browser.

Keep `copy-static --out <directory>` offline and idempotent: it copies runtime `assets`, CSVs/manifests, docs, and skill under `<directory>/mighty-decks`. It succeeds without PNGs. Existing asset path spellings stay stable; optimize bytes in place without changing URL suffixes. PNG users download the matching archive explicitly and extract it into the same destination. The archive root is `mighty-decks/generated/png/en/...`, with group manifests at `mighty-decks/generated/png-manifest-core.json` and `mighty-decks/generated/png-manifest-medieval.json`.

## Task 1: record release identity, rights, and baseline

**Dependencies:** None. G1/G2 may remain blockers while local preparation proceeds.

**Files:** Create `S/docs/plans/2026-09-16-components-release-decisions.md`; later copy its approved public subset to `P/docs/migration-baseline.md`. Read `packages/components/assets/THIRD-PARTY-NOTICES.md` and both `assets/fonts/OFL-*.txt` files.

1. Record `git rev-parse HEAD` and `git status --short` in S and E. Record tarball sizes above, registry response, proposed identities, and named owners for G1/G2.
2. Inventory code/text/artwork provenance. Request missing rights evidence from the maintainer during implementation. Keep confidential evidence local; publish a redistribution summary and required notices only.
3. Resolve first publication with the npm administrator. Official trusted-publisher setup starts in an existing package's settings; the checked documentation does not establish a tokenless bootstrap procedure for an absent package. Do not invent one or publish a placeholder. If a manual authenticated bootstrap is necessary, obtain a separately authorized procedure and version, validate its exact tarball first, and reserve the consumer version for subsequent OIDC publishing with provenance.
4. Verify by inspecting the decision record: every unknown has an owner and blocked task; no license is inferred from an app asset being public on disk.
5. Suggested commit in S: `docs: record components extraction release gates`.

Current npm documentation requires Node >=22.14.0 and npm >=11.5.1, cloud-hosted runners, and matching package/repository/workflow identities. For this plan use GitHub-hosted runners and explicitly allow `npm publish` in the trusted publisher; newer configurations may default to staged publishing only. GitHub OIDC publication of a public package from public source produces provenance automatically. [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/)

## Task 2: create the standalone catalogue and build

**Dependencies:** Task 1 inventory; G2 before anything becomes public.

**Files:** Copy `S/packages/components/{src,scripts,export-app,tests,docs,skills,index.html,README.md,vite.config.ts,package.json}` to equivalent paths in P. Create `P/src/data/catalog.en.json`, `src/contracts/cardExport.ts`, `tsconfig.json`, `tsconfig.build.json`, `pnpm-lock.yaml`, `.gitignore`, `.node-version`, `tests/standalone.test.ts`, and `tests/fixtures/catalog-baseline.json`. Modify `src/catalog.ts`, `src/export.ts`, and `src/index.ts`. Remove the copied `scripts/write-types.ts`. Create a temporary local `S/packages/components/scripts/snapshot-catalog.ts` for export, then remove it before the S commit.

1. Capture the current normalized `cardCatalog`, `contentVersion`, and all static entry IDs into the baseline fixture. It contains presentation data only; G2 applies to its text too.
2. Write `standalone.test.ts`: compare all normalized records/IDs with the fixture and reject production imports/config references escaping P. Run `pnpm exec tsx --test tests/standalone.test.ts`; the copied implementation must fail on its private imports.
3. Replace catalogue projection imports with local normalized data. Copy only the pure export schema; do not copy `rulesCards`, `outcomeDeck`, or `adventureState`. Inline the root compiler options into P's standalone config, remove the Vite spec alias, and retain React externalization and relative CSS/font URLs.
4. Generate declarations with `tsc -p tsconfig.build.json` rather than string templates. Configure declaration output beside the public JS layout; ensure relative declaration imports work with both Bundler and NodeNext resolution. Add an extension-rewrite step if emitted declaration imports require it; cover it in Task 6 rather than maintaining handwritten API signatures.
5. Pin an exact supported Node 22 patch >=22.14.0 and npm >=11.5.1 at implementation time; record the exact values in the release decisions and CI. Retain pnpm 10.0.0 for P initially and Playwright 1.60.0. Use explicit `--prod=false` when installing build dependencies because the local environment has a production-install setting.
6. In P: `pnpm install --prod=false`, `pnpm typecheck`, `pnpm test`, `pnpm build`. Then repeat `pnpm install --frozen-lockfile --prod=false` and these checks in a fresh source checkout with no sibling repositories. Expected: all pass without private spec resolution.
7. Suggested commit in P: `refactor: make component catalogue and build standalone`.

After that commit, verify source isolation with the following commands. This is an ordinary disposable clone, not a Git worktree. Later repeat the same check at the release commit, including Tasks 5–6 checks; do not treat uncommitted source as verified by cloning HEAD.

```powershell
$sourceFixture = Join-Path ([System.IO.Path]::GetTempPath()) ('components-source-' + [guid]::NewGuid().ToString('N'))
git clone --no-local D:/projects/mighty-decks-components $sourceFixture
pnpm -C $sourceFixture install --frozen-lockfile --prod=false --store-dir "$sourceFixture/.pnpm-store"
pnpm -C $sourceFixture typecheck
pnpm -C $sourceFixture test
pnpm -C $sourceFixture build
```

## Task 3: select and prepare runtime artwork

**Dependencies:** Task 2; G2 for redistribution and any resizing rights.

**Files:** Create `P/resources/artwork-manifest.json`, `scripts/prepare-assets.ts`, `tests/runtime-assets.test.ts`; copy only approved originals into `P/resources/originals/`. Generate `P/assets/`. Modify `P/package.json`, `src/react/cards.module.css` only if necessary for font output. Preserve required font licenses and add the approved artwork notice to `assets/THIRD-PARTY-NOTICES.md`.

1. Write tests requiring every standard catalogue `artworkPath`, Actor/Asset overlay, inline icon, corner type icon, and renderer background to exist in prepared assets. Also reject unrelated app logos, maps, scenes, rule illustrations, and button art.
2. Run `pnpm exec tsx --test tests/runtime-assets.test.ts`; expect failure before asset preparation.
3. Build the explicit manifest from catalogue paths plus renderer-required paths, including `/art/effects/taken-out.png`, `/backgrounds/paper-with-image-shadow.png`, and font files. Inspect all branches of `src/react/index.tsx`; custom consumer-supplied URLs are not bundled assets.
4. Measure the selected originals first. If size or host constraints justify optimization, resize runtime PNGs to at most 1024 pixels on the longest edge without upscaling, preserving alpha and path names. Use a pinned `sharp` dev dependency for this reproducible build operation if needed; it must not be a runtime dependency. Keep originals for future authoring/export. Review representative full/compact output before accepting any quality reduction.
5. Add `assets:prepare` invoking `tsx scripts/prepare-assets.ts`. The script cleans only its validated generated output directory and writes a source/output checksum inventory. Run `pnpm assets:prepare` and the test. Expected: all referenced files exist, no app-only files remain, font notices survive, deterministic output hashes on repeat under the pinned toolchain.
6. Suggested commit: `build: prepare only required runtime artwork`.

## Task 4: split runtime generation, packing, and PNG copying

**Dependencies:** Tasks 2–3.

**Files:** Modify `P/package.json`, `scripts/generate.ts`, `scripts/export.ts`, `src/cli.ts`, `README.md`, `docs/en/README.md`, `skills/mighty-decks-components/SKILL.md`; create `tests/static-copy.test.ts` and `tests/package-surface.test.ts`.

1. Test `copy-static` in a temporary destination with only runtime resources, repeat it, and require identical copied hashes. Test invalid CLI arguments, missing required assets, CSV access, and absence of generated PNGs in the runtime tarball.
2. Run `pnpm exec tsx --test tests/static-copy.test.ts tests/package-surface.test.ts`; expect failures for the old broad package allowlist/PNG contract.
3. Make `generate:runtime` run asset preparation and CSV/manifest generation; make `generate:png` run the browser exporter separately. Runtime generation must not delete PNG output. Preserve `generate` as an author-only full-generation command if useful, never an install lifecycle hook.
4. Set the package `files` allowlist to `dist`, `assets`, `generated/csv`, `generated/manifest.json`, `docs`, `skills`, and notices. Exclude originals, tests, export app, PNGs, and staging directories. Remove `./png/*`. Keep `./export` declarations/runtime aligned and document its actual API.
5. In P run `pnpm generate:runtime`, `pnpm build`, then the focused tests. Expected: CSVs match the baseline, copy works offline without PNGs, and package JS has no browser-exporter dependency. No install/prepare/postinstall hook may build package source or fetch resources.
6. Suggested commit: `feat: separate runtime resources from the PNG catalogue`.

## Task 5: build versioned archives and enforce size gates

**Dependencies:** Task 4.

**Files:** Create `P/scripts/pack-runtime.mjs`, `scripts/package-pngs.mjs`, `scripts/verify-artifacts.mjs`, `tests/artifacts.test.ts`, `release-policy.json`; modify `scripts/export.ts` to record package/content version and toolchain in its manifest.

1. Write tests with small synthetic fixtures for configured host-limit violations, forbidden runtime PNG entries, manifest/version mismatch, missing entries, checksum mismatch, and an archive path escaping its root. Run `pnpm exec tsx --test tests/artifacts.test.ts`; expect failure before helpers exist.
2. Implement `pack:runtime` to run `npm pack --json --pack-destination output`, save its metadata, and copy the resulting file to `output/runtime.tgz` for stable verification commands. Save SHA-256 and npm integrity; never repack after validation. Inspect actual archive entries, not only source folders.
3. Implement `archive:png` to create `output/mighty-decks-components-VERSION-png-en-core.tar.gz` and `output/mighty-decks-components-VERSION-png-en-medieval.tar.gz` with the documented root layout; their union must cover the requested inventory, with no accidental omissions or conflicting paths. Use sorted entries and fixed archive metadata; render with a pinned Playwright browser/OS, fonts loaded, fixed viewport/density. Require the catalogue's complete current enumeration (baseline 795), not a hardcoded count after intentional catalogue updates.
4. Write `output/release-manifest.json`: package name/version, content version, source commit, toolchain versions, runtime/archive names, compressed/unpacked byte counts, SHA-256/integrity, and per-PNG paths/hashes/dimensions/group membership. Give each archive its own group-specific PNG manifest so extracting both cannot overwrite a different manifest. Require the union of group entries to equal the full inventory. The release policy records applicable host limits, with no invented project size budgets. Do not claim byte-identical PNG regeneration across different operating systems.
5. Define scripts `verify:artifacts` and `archive:png`. In P run:

   ```powershell
   pnpm generate:runtime
   pnpm build
   pnpm exec playwright install chromium
   pnpm generate:png
   pnpm pack:runtime
   pnpm archive:png
   pnpm verify:artifacts
   ```

   Expected: G3 passes on fresh artifacts; the report includes both byte counts and inventories. If a host limit or coverage check fails, revisit preparation/grouping; do not remove requested content. Size alone has no project-specific failure threshold.
6. Suggested commit: `build: verify versioned runtime and PNG release artifacts`.

## Task 6: verify the installed package and style isolation

**Dependencies:** Task 5.

**Files:** Create `P/tests/consumer/{package.json,index.html,main.tsx,host.css,tsconfig.json,tsconfig.nodenext.json,usage.mdx,usage.md}`, `scripts/verify-consumer.mjs`, and `scripts/verify-browser.ts`. Add package scripts `verify:consumer` and `verify:browser`.

1. Create a fixture using only public package imports. Include an authored MDX fixture importing and rendering package React components, compiled with a pinned MDX compiler in fixture dev dependencies only. Include a Markdown fixture using the extracted PNG paths from both groups. Do not enable arbitrary MDX execution in Exiles. Compile custom-card schema types including scene families and optional text; import every runtime symbol promised by each declaration, especially `./export`. Fail on missing runtime symbols or private imports.
2. Make `verify:consumer` create a fresh OS-temp directory outside P, copy the fixture, install the absolute `output/runtime.tgz` with React peers and fixture build tools, and run import/CSV/CLI/typecheck/Vite production-build checks. Use a fresh package store/cache and empty registry config. Test installation with scripts disabled, then normal installation; neither may fetch the PNG archive.
3. Run `pnpm verify:consumer -- --tarball output/runtime.tgz`. Before fixes, expect the known declaration mismatch to be caught; after Tasks 2/4, expect all exports/types and `copy-static` checks to pass. Run both Bundler and NodeNext TypeScript checks.
4. Browser fixture: render full/compact Outcome, Effect, Stunt, composed Actor/Asset, Counter, and custom scene cards. Use hostile host typography and broad SVG/button styles; compare with an isolated control. Verify fonts load, no resource requests fail, text/artwork are visible, cards fit a narrow viewport, and host controls retain their styling. Exercise default `/mighty-decks/assets` and custom `/cards/assets` bases.
5. `verify:browser` starts/stops its own Vite preview and browser in `finally`, saves screenshots under `output/verification`, and fails on missing assets/browser exceptions. Run `pnpm verify:browser -- --tarball output/runtime.tgz`. Inspect screenshots; do not use brittle class-name snapshots as proof of rendering.
6. Suggested commit: `test: verify packed consumers and host style isolation`.

## Task 7: add public metadata and release workflow

**Dependencies:** Tasks 1–6; G1/G2 must pass before remote creation/push.

**Files:** Create `P/LICENSE`, `CHANGELOG.md`, `docs/releasing.md`, `.github/workflows/ci.yml`, `.github/workflows/release.yml`, `scripts/verify-release.mjs`; modify `package.json`. Record approved remote settings in `docs/releasing.md`.

1. Fill exact `license`, `repository.url` (`git+https://github.com/OWNER/REPO.git`), `homepage`, `bugs.url`, and `publishConfig: { access: "public", registry: "https://registry.npmjs.org/" }`. Include separate asset/text notices as required by G2. Verify no unresolved placeholder remains before publication.
2. Implement ordinary PR CI with no publishing permissions. Pin Actions by reviewed full commit SHA and pin Node/npm/pnpm/browser versions. Run frozen installs, typecheck, tests, runtime generation, build, packing, artifact and packed-browser checks.
3. Implement tag-driven `release.yml` on `v*`, rejecting version mismatch and tags outside the reviewed release branch. Use concurrency per tag with no cancellation of active publication. The GitHub-hosted release workflow validates the full PNG set as well as the exact runtime tarball.
4. Separate permissions: validation has `contents: read`; the npm publication job gets `id-token: write` and `contents: read`; release upload gets `contents: write`. Bind npm's trusted publisher to exact owner/repo, `release.yml`, and the chosen `npm-release` environment. Do not put `NODE_AUTH_TOKEN` or an npm write token in repository secrets.
5. Configure tag rules, reviewed release-environment access, and immutable GitHub releases. These are implementation-time external actions, after the source and settings are concrete and authorization is established. Attach all files to a draft release before making it immutable. [GitHub immutable release setup](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/establish-provenance-and-integrity/prevent-release-changes)
6. Release workflow order: verify all artifacts → upload exact tarball/archive/manifest to a draft → verify uploaded hashes → finalize immutable release → publish the same validated tarball through OIDC → verify registry integrity/provenance. Use `npm publish output/runtime.tgz --access public --tag next` for prereleases and `--tag latest` for stable releases, only inside the authorized publication job.
7. Exercise a nonpublishing workflow run on the reviewed commit. `npm publish --dry-run` is a packaging check only; it does not prove OIDC authorization. G5 stays open until an actual authorized candidate passes Task 8.
8. Suggested commit: `ci: release verified components artifacts through npm OIDC`.

## Task 8: publish and verify a consumer candidate

**Dependencies:** G1–G4 passed, Task 7 ready, bootstrap resolved, publication authorized.

**Files:** Modify `P/package.json`, `pnpm-lock.yaml`, `CHANGELOG.md`; record evidence in `docs/releases/VERSION.md` after publication, without changing the tagged source.

1. Select the available candidate version, update changelog/version/lockfile, run Tasks 5–6 checks, and commit `chore: prepare components VERSION`. The maintainer creates/pushes the matching release tag only after reviewing this result.
2. Let `release.yml` publish. In a fresh OS-temp npm fixture install `@mighty-decks/components@VERSION` from the public registry with no credentials. Commands from that fixture:

   ```powershell
   npm install --save-exact @mighty-decks/components@VERSION react@18.3.1 react-dom@18.3.1 --registry=https://registry.npmjs.org/
   npm audit signatures
   npm view @mighty-decks/components@VERSION repository dist.integrity dist.attestations --json --registry=https://registry.npmjs.org/
   ```

3. Implement `node scripts/verify-release.mjs --version VERSION --repository OWNER/REPO` in P to compare registry integrity to the saved tarball, require this package's attestation (not just an aggregate audit count), and check its source repository, commit, and workflow identity. Signature verification uses `npm audit signatures`; inspect the linked attestation identity too. [npm provenance verification](https://docs.npmjs.com/generating-provenance-statements/)
4. Verify unauthenticated static-image use in a new directory:

   ```powershell
   Invoke-WebRequest 'https://github.com/OWNER/REPO/releases/download/vVERSION/release-manifest.json' -OutFile release-manifest.json
   Invoke-WebRequest 'https://github.com/OWNER/REPO/releases/download/vVERSION/mighty-decks-components-VERSION-png-en-core.tar.gz' -OutFile pngs.tar.gz
   Get-FileHash -Algorithm SHA256 pngs.tar.gz
   New-Item -ItemType Directory -Path public
   tar -xzf pngs.tar.gz -C public
   ```

   Compare the archive hash to the manifest before extracting. The archive checker must reject unsafe paths. Confirm `public/mighty-decks/generated/png/en/outcome/success/full/1024.png` exists and renders in a Markdown preview. Repeat the download/hash/extraction steps for `mighty-decks-components-VERSION-png-en-medieval.tar.gz` to obtain medieval coverage. Both archives must extract together without conflicting files. These downloads are optional for React-only consumers.
5. Record package URL, tag/commit, workflow run, checksums, size report, provenance result, and screenshots. Only then mark G5 passed. Stable publication repeats the same pipeline with a new stable version; do not reuse the prerelease version.

Partial failure policy: if draft upload fails, rerun before finalization. If immutable release exists but npm publication failed, retrieve/verify its exact tarball and retry that version only if absent from npm. If npm already contains the version, verify identical integrity and provenance and skip publication. Any mismatch stops the release; changed files require a new version/tag. Never overwrite finalized assets, move tags, or unpublish a version to retry.

## Task 9: migrate Storyteller to the verified stable package

**Dependencies:** Task 8 stable release verified. Can proceed independently of Task 10.

**Files:** Modify `S/apps/web/package.json`, `pnpm-lock.yaml`, `apps/web/src/components/adventure-module/GameCardView.tsx`, `package.json`, `docs/19-contributor-styleguide.md`, `CHANGELOG.md`; preserve existing CSS import in `apps/web/src/main.tsx`. Create `scripts/check-components-catalog.ts` and `scripts/check-components-catalog.test.ts`.

1. Record the pre-migration commit and lockfile. Add a comparison test that projects overlapping gameplay records into the public catalogue shape and reports differing IDs/fields without rewriting app data. Run `pnpm exec tsx --test scripts/check-components-catalog.test.ts`; demonstrate a changed fixture fails, then the matched baseline passes.
2. Set the web dependency to `^VERSION` for the verified stable version. Run from S `pnpm install --prod=false`; inspect `pnpm-lock.yaml` and `pnpm --filter @mighty-decks/web why @mighty-decks/components` to confirm a registry version/integrity rather than `link:../../packages/components`.
3. Add web `components:copy` script `mighty-decks-components copy-static --out public`, called by existing `predev`/`prebuild` after spec preparation. Use the default package asset base for packaged cards so they use copied release resources. Keep local Actor/Asset/Counter callbacks and visuals intact. Ignore only generated `apps/web/public/mighty-decks` package output after checking it does not contain tracked app-owned files.
4. Add root `components:check` invoking the comparison script. Run `pnpm components:check`, `pnpm check:agent`, `pnpm build:agent`. If spec contracts change unexpectedly, stop and revisit ownership; this dependency migration should not require server contracts to change.
5. Browser-check an existing module containing Outcome/Effect/Stunt cards and app-owned interactive cards; verify full/compact styles, no missing font/art requests, and unchanged editor/counter behavior. Run a clean checkout install/build with no local components source available.
6. Update docs/changelog with install/build instructions and no new environment variables. Suggested commit: `refactor: consume released Mighty Decks components`.

## Task 10: integrate the package in Exiles without changing documents

**Dependencies:** Task 8 stable release verified. Read E's `AGENTS.md` and `docs/local-editor.md` before editing.

**Files:** Modify `E/apps/web/package.json`, `pnpm-lock.yaml`, `apps/web/src/main.tsx`, `apps/web/src/cards.tsx`, `apps/web/src/styles.css`, `apps/web/e2e/editor.spec.ts`, `docs/local-editor.md`; add `apps/web/src/componentCardAdapter.ts` and `apps/web/src/componentCardAdapter.test.ts`. Update E's changelog if present; otherwise include the migration note in `docs/local-editor.md`.

1. Record pre-migration commit/lockfile. Add adapter cases for known Outcome/Effect/Stunt, modified Asset, Counter, Actor data, title overrides, and unknown slugs. Preserve `CardDisplay`, `createGameCardEditor`, `CardProperties`, and the data-only `<GameCard type="..." slug="..." title="..." modifierSlug="..." />` contract. Never evaluate MDX expressions.
2. Run the focused adapter test with E's existing tsx: `pnpm --filter @exiles/web exec tsx --test src/componentCardAdapter.test.ts`; expect failure before the adapter exists. Inspect `src/api.ts` DTO and server `loadCatalog.ts`: Actor information is flattened, so do not pretend it contains composition layers. Use catalogue lookup where lossless; retain an explicit text fallback for records lacking enough data.
3. From E run `pnpm --filter @exiles/web add @mighty-decks/components@^VERSION`. Add the package stylesheet in `apps/web/src/main.tsx`. Add `components:copy` and hook it into the web's existing dev/build preparation without removing existing steps. Serve copied assets from the default base.
4. Render standard and composed cards through the adapter; keep editing controls outside the card visual. Scope the host's broad `.game-card` styling to its editor wrapper so it does not override package internals. Unknown slugs remain visibly unresolved and preserve their original document data.
5. Extend `e2e/editor.spec.ts` to verify Tinkerer rendering, title editing, modified assets, counters, unresolved cards, and unchanged serialized Markdown after save/reload. Use temporary fixture workspaces as E requires.
6. From E run:

   ```powershell
   pnpm typecheck
   pnpm test
   pnpm build
   pnpm --filter @exiles/web test:e2e e2e/editor.spec.ts
   pnpm --filter @exiles/web test:e2e
   ```

   Expected: editor behavior and narrow layouts pass; no private-source dependency or missing art/font requests. Existing Playwright setup starts loopback services on 3001/5173. Avoid reusing unrelated running servers; use fixture-backed services.
7. In a fresh checkout with a fresh pnpm store and no S/P sibling, run `pnpm install --frozen-lockfile --prod=false`, `pnpm build`, and the focused editor test. Update local-editor docs with install/copy steps and no new environment variables. Suggested commit: `feat: render Exiles cards with released components`.

## Task 11: retire the workspace source and document upgrades

**Dependencies:** Tasks 9–10 accepted; G6 passed for both consumers.

**Files:** Remove `S/packages/components/`; modify `S/package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` only if its `packages/*` glob becomes unused, `docs/19-contributor-styleguide.md`, `AGENTS.md` package-specific guidance, `CHANGELOG.md`. Update active references found by the search below; keep historical plans as history.

1. From S run `rg -n 'packages/components|components:build|components:generate|components:pack|workspace:\*' package.json pnpm-workspace.yaml apps docs scripts AGENTS.md`. Classify active workflow references before removal. Keep app-owned spec files, public art still used elsewhere, and unrelated workspace packages.
2. Retire the local source only after confirming the resolved absolute deletion target is exactly `S/packages/components`. Remove obsolete root build/generate/pack wrappers; retain `components:check` and document the external source repository/release workflow.
3. Run `pnpm install --prod=false`, `pnpm check:agent`, `pnpm build:agent`, and `pnpm components:check`; repeat the reference search. Expected: no active dependency/build path requires the retired directory.
4. Document upgrades: package PR and changelog → versioned OIDC release → independent consumer PRs with lockfiles, compatibility report, copy/build and browser checks. Never edit generated CSV/PNG output manually.
5. Suggested commit: `chore: retire the components workspace source`.

## Rollback and completion

For a later regression, restore each consumer's previously accepted manifest and lockfile, pin the prior released version exactly, rerun its static copy/build, and verify rendering. Do not change existing package versions or archives.

For the first migration, no previous npm release is assumed: revert the specific consumer migration commit(s). In S, also revert the retirement commit to restore the workspace package, root scripts, and lockfile together. In E, restore its prior renderer/dependency/lockfile. Use reviewed `git revert` commits, not destructive resets; preserve unrelated work. Run the same host checks after rollback.

The implementation is done when G1–G6 have evidence, both applications install/build independently from the public registry, rendering/editor behavior passes, optional PNG copying works by version and checksum, provenance matches the released source, and Storyteller no longer needs the local package. A written plan alone satisfies none of these release gates.
