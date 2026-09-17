# Mighty Decks Git File Distribution Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Distribute locally built React components and rendered PNGs through ordinary Git commits, with no npm publication, release archives, or GitHub-side component builds.

**Architecture:** Keep source and a checked-in `distribution/` directory in `tomasreichmann/mighty-decks-components`. Build/render locally, push one coherent commit, and explicitly sync selected files at that commit into each consumer. Consumers commit their copies, so normal checkout, install, and deployment never need the components repository or a component build.

**Tech Stack:** Existing TypeScript/Vite/Playwright authoring tools; Git; Node standard-library sync script; existing pnpm workspaces for local module resolution.

**Status:** Proposed implementation plan; no dependencies, workflows, or external repositories changed by this planning task. Supersedes the npm/release-archive distribution direction in the September 16 separation plan and the existing release-tarball TODO. Preserve already completed extraction and app integration work.

## Decision and scope

Use **committed generated files plus explicit consumer vendoring**. npm stops being the Mighty Decks bridge completely. Keeping `package.json`, the existing import name, and pnpm for application dependencies does not publish or download Mighty Decks from npm: the component is a local workspace directory.

Three options considered:

| Option | Benefit | Cost | Decision |
| --- | --- | --- | --- |
| Commit generated files; copy selected files into consumers | No upstream network/build at consumer install; PNG-only works without Node; updates are ordinary reviewable diffs | Selected files live in more than one repo | Recommended |
| Pin a Git submodule | Native commit pin, no duplicate files in consumer history | Recursive checkout, static-path integration, and selective PNG retrieval complicate every consumer/deployment | Do not use initially |
| Install a Git dependency or release tarball | Keeps package-manager upgrade syntax | Keeps package preparation/download semantics and does not solve independent PNG updates | Retire |

This removes component generation on GitHub. Each React application still needs its normal application bundling/deployment; prebuilt component JS does not eliminate that. Source-only TSX distribution is possible but shifts component compilation and toolchain compatibility to every consumer, so ship built JS/types/CSS as well as authoring source.

No automatic cross-repo pushes, bots, new registry, CDN, LFS setup, or replacement release platform. A developer runs an update command in each consumer and commits the result.

## Current evidence, inspected September 17

| Repository | Current state | Migration consequence |
| --- | --- | --- |
| `D:/projects/mighty-decks-components` | Local manifest is `0.1.5`, private; `dist/`, `assets/`, `generated/` ignored | Current source pushes cannot deliver built files |
| Components `.github/workflows/ci.yml` | Linux checks/package builds plus Windows PNG smoke/build/consumer checks | Remove both build jobs under the requested zero-GitHub-build model |
| Components `.github/workflows/release.yml` | Full local-release gate repeated on GitHub, PNG generation, Git distribution staging, archives, draft/publish/verification | Delete workflow after local replacement is validated |
| Components `scripts/export.ts` | Can filter by type/id/layout/height; full run replaces PNG tree; filtered run writes a separate partial manifest | Incremental generation must maintain one complete catalogue manifest |
| Storyteller `apps/web/package.json` | `@mighty-decks/components: ^0.1.0` | Replace registry dependency with local workspace dependency |
| Storyteller `scripts/sync-rules-docs.mjs` | Resolves package through web workspace; records package version and document hashes | Preserve resolution, add upstream Git commit to provenance |
| `C:/Projects/exiles-of-the-hungry-void` | Root and web both depend on GitHub `v0.1.3/runtime.tgz`; `cards:prepare` downloads two PNG archives during dev/build | Replace both dependencies; remove network preparation from normal build/dev |
| Exiles `scripts/prepare-mighty-decks.mjs` | Hardcodes version/archive validation, copies runtime resources, extracts PNGs | Replace with explicit selected-file sync and offline verification |

These are local-checkout observations, not a claim that all local source has been pushed or that every remote release works. Previous inventory recorded 795 PNGs (~270 MB) and ~297 MB of assets; these are historical estimates. The inspected local PNG directory did not provide a fresh populated inventory. Measure the completed distribution before the first push.

## Ownership and layout

Authoritative source remains in the existing components repo. Apps retain Adventure/session/game behavior. Vendored copies are generated inputs: edit upstream, then sync.

```text
mighty-decks-components/
  src/, resources/, docs/, scripts/       # existing authoring sources
  distribution/                          # NEW, tracked in Git
    manifest.json                        # inventory, hashes, input fingerprints
    runtime/                             # ready-to-use local workspace package
      package.json                       # same name/exports; no lifecycle scripts
      dist/                              # JS, declarations, CSS, emitted assets
      assets/fonts/                      # preserve paths needed by CSS/CLI
      generated/csv/, generated/manifest.json
      docs/en/, skills/, LICENSE, NOTICE, LICENSES/
    public/mighty-decks/
      assets/                            # runtime art/fonts at existing URL paths
      generated/png/en/<family>/<slug>/<layout>/<height>.png
      LICENSE, NOTICE, LICENSES/
```

Keep current public URL shapes; do not duplicate PNGs into separate core/medieval directory trees. Store group membership in the manifest. Runtime files must contain every referenced resource, including declarations' imports and CSS font files. A React selection includes runtime plus its public assets; a PNG selection includes requested PNGs and notices, without React/runtime artwork dependencies. `both` is their union.

| Consumer mode | Tracked destination | Build requirements |
| --- | --- | --- |
| React | `vendor/mighty-decks/components/` + selected `apps/web/public/mighty-decks/assets/` | Host React build only |
| PNG | Selected `apps/web/public/mighty-decks/generated/png/` or a configured Markdown image directory | None for image files |
| Both | Union of the above, from one upstream SHA | Host React build only |

React dependencies remain peers; never bundle another React copy. Preserve required non-React dependencies after checking emitted imports. Do not blindly retain authoring-only dependencies in the vendored runtime manifest.

## Producer workflow: build here, push files

Proposed new command, not yet implemented:

```powershell
# In D:/projects/mighty-decks-components
pnpm distribution:prepare
pnpm distribution:check
git diff --stat
# Stage the intended source files and their distribution outputs together.
git add <intended-source-paths> distribution
git commit -m "Update Mighty Decks cards and generated distribution"
git push origin main
git rev-parse HEAD
```

One source-plus-output commit is the release. Consumers pin its full SHA; optional human-readable tags are labels only. No mandatory version bump, tag, GitHub Release, archive, npm publish, second distribution branch, or remote job. Preserve existing immutable tags/releases for old consumers during migration.

Git reuses objects it already has; a push transfers new objects, rather than re-uploading a monolithic archive. Do not promise binary delta compression for PNGs: a changed PNG can cost approximately its full compressed size. A common visual change may legitimately change every PNG.

Make generation deterministic: fixed renderer/browser/font inputs, sorted manifests, stable paths, no timestamps/absolute machine paths or per-card release version fields. Record stable toolchain identity once. Use SHA-256 of relevant source inputs, not the containing commit SHA, inside the producer manifest to avoid a self-referential commit hash. The consumer lock records the final upstream SHA.

First implementation may run the existing small JS build whenever runtime inputs change. Skip the entire build when its input fingerprint is unchanged. PNG fingerprints combine normalized card data, referenced art, shared renderer/CSS/fonts, export dimensions, and pinned rendering toolchain. Shared renderer/font/style changes invalidate all affected cards; uncertain dependencies conservatively invalidate all. Do not use `git diff` alone: it misses uncommitted edits and removed inputs.

Reuse valid existing PNGs; render changed/missing entries only; remove retired entries; merge filtered results into one complete manifest. Do not launch Chromium for a no-op run. Prepare in staging, verify completeness, then reconcile the tracked distribution. A failed render leaves the previous complete distribution intact.

## Consumer workflow: explicit update, offline thereafter

Each consumer gets `mighty-decks.config.json`, `mighty-decks.lock.json`, and a small checked-in `scripts/sync-mighty-decks.mjs`. Maintain the canonical script/template in the components repo and copy it to consumers; do not remotely execute a downloaded script. No standalone updater package.

Example configuration:

```json
{
  "repository": "https://github.com/tomasreichmann/mighty-decks-components.git",
  "mode": "both",
  "groups": ["core", "medieval"],
  "runtimeDestination": "vendor/mighty-decks/components",
  "publicDestination": "apps/web/public/mighty-decks"
}
```

Allow explicit card IDs/layouts/sizes as optional filters; omission means all entries in selected groups. Lock schema records full commit SHA, manifest digest, selection, and owned destination paths with SHA-256 hashes. Source/output records must distinguish manifest paths from destination paths.

Proposed commands:

```powershell
node scripts/sync-mighty-decks.mjs --ref <full-upstream-commit-sha>
node scripts/sync-mighty-decks.mjs --check
git diff --stat
# Commit config/lock, selected vendored/static files, and integration changes.
```

The updater uses a persistent ignored `.cache/mighty-decks/` partial Git clone (`--filter=blob:none --no-checkout`), fetches and verifies the exact SHA, reads its manifest, then obtains only selected paths. Use non-cone sparse patterns or explicit Git blob retrieval for exact PNG subsets; a broad cone over all PNGs would download everything. Request distribution paths only; authoring originals are unnecessary. Preserve the cache between updates so unchanged blobs are reused. If a server does not support filtering, report the fallback transfer instead of claiming selective download.

Fetch/stage/verify before applying changes. Reject traversal, absolute paths, symlinks, case-colliding destinations, and any deletion outside configured owned roots. Refuse to overwrite locally edited owned files. Delete only previously owned files removed by the new selection/manifest. Write only changed bytes, retain unchanged files, and update lock last. Keep a recoverable backup/journal for interrupted application; `--check` must detect any partial update. Network/hash failures must leave the prior usable copy and pin intact.

`--check` is local and read-only: verify lock and managed files without contacting GitHub. Running an update twice at the same SHA produces no diff. Roll back by reverting the consumer update commit, restoring lock and files together, without upstream availability.

Keep `@mighty-decks/components` imports unchanged through `workspace:*` and an explicit `vendor/mighty-decks/components` entry in each `pnpm-workspace.yaml`. Consumer `.gitignore` rules need exceptions for vendored `dist/`; Exiles must stop ignoring its selected public Mighty Decks files. Prove files are tracked with `git ls-files`, not merely present locally.

## Implementation sequence

### 1. Record the baseline and distribution inventory

**Files:** Components `package.json`, `src/cli.ts`, `src/catalog.ts`, `vite.config.ts`, `resources/artwork-manifest.json`, `scripts/export.ts`, `docs/maintenance.md`; consumer manifests/configs named above.

1. Inspect applicable AGENTS instructions and working-tree changes in all three repos; preserve unrelated changes. Work in current checkouts, without worktrees.
2. List runtime exports, emitted imports, font/art paths, canonical CSV/rules sources, and all static entries with groups. Include core/medieval Outcomes, Effects, Assets, Actors, Counters, and Stunts currently supported.
3. Measure total/per-file bytes and inventory required notices. Existing upstream README states MIT code, CC BY 4.0 content/art/docs, and OFL fonts; preserve these instead of reopening obsolete npm-era identity gates.
4. Record current consumer commits/lockfiles for first-migration rollback. Find existing archive tests and docs so retirement removes stale assertions too.

**Done when:** Every distribution file has an owner/purpose, and no consumer requirement is lost. Suggested commit: `docs: define Git file distribution contract`.

### 2. Produce a tracked, self-contained distribution locally

**Create:** Components `scripts/prepare-distribution.mjs`, `scripts/verify-distribution.mjs`, `tests/distribution.test.ts`, `distribution/manifest.json` and tree above.
**Modify:** Components `.gitignore`, `.gitattributes`, `package.json`, `docs/maintenance.md`.

1. Add a failing fixture test for missing exported JS/type/CSS targets or required static assets.
2. Reuse current build/data/asset commands, then copy allowlisted outputs directly to distribution staging; do not pack/unpack a tarball as an intermediate.
3. Emit script-free runtime metadata, inventory hashes, group selections, and relevant input fingerprints. Track only final distribution, not output caches. Normalize generated text to LF and mark PNG/font files binary.
4. Expose `distribution:prepare` and `distribution:check`; the latter validates all files/hashes and source fingerprints without rendering or building. Include new tests in the existing explicit test list.
5. Verify exports, `copy-static` if retained, CSS fonts, runtime URLs, CSVs, docs, and React peer resolution using a local workspace fixture without archives or sibling source access.

**Run locally:** `pnpm distribution:prepare`, `pnpm distribution:check`, `pnpm exec tsx --test tests/distribution.test.ts` (new commands/test). Existing `pnpm typecheck` must pass. Suggested commit: `feat: commit ready-to-use component distribution`.

### 3. Make local PNG refresh incremental

**Modify:** Components `scripts/export.ts`, `scripts/prepare-distribution.mjs`.
**Create:** Components `tests/incremental-export.test.ts`.

1. Add focused tests for a no-op, one card change, shared CSS/font change, removed card, and interrupted render.
2. Compute fingerprints before starting browser; merge unchanged entries and update the complete inventory after filtered renders. Preserve existing geometry/font/image-load validation.
3. Skip unchanged runtime generation too, and compare output bytes before replacing tracked files.
4. Run one baseline full render locally; run preparation again and confirm zero browser renders and zero tracked diff. Change one card's text and verify only its applicable PNG variants/data/runtime outputs change; test deletion and shared-style invalidation.

**Run locally:** `pnpm exec tsx --test tests/incremental-export.test.ts`, `pnpm distribution:prepare`, `pnpm distribution:check`. Record timings/counts/bytes instead of inventing a speed target. Suggested commit: `perf: regenerate only affected card outputs`.

### 4. Add the explicit file sync template

**Create:** Components `consumer/sync-mighty-decks.mjs`, `consumer/mighty-decks.config.example.json`, `tests/consumer-sync.test.ts`.

1. Use a temporary local Git fixture to test React-only, PNG-only, both, and an exact PNG subset before implementing synchronization.
2. Implement manifest selection, cached Git access, hash validation, changed-file copying, safe deletion, lock/provenance, recovery, and offline `--check` as described above, using Node and Git only.
3. Test second-update no-op, removed upstream file, dirty owned file refusal, malicious path refusal, failed fetch/hash, interruption recovery, and rollback. Do not build a generic plugin/config framework.
4. Test actual GitHub partial retrieval against the first pushed distribution SHA and measure fetched objects/bytes. Confirm a PNG-only sync does not download runtime art, and React-only does not download PNGs.

**Run locally:** `pnpm exec tsx --test tests/consumer-sync.test.ts` (new). Suggested commit: `feat: sync selected distribution files by Git commit`.

### 5. Migrate Storyteller

**Modify:** `apps/web/package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `.gitignore`, root `package.json`, `scripts/sync-rules-docs.mjs`, `docs/rules-source.json`, `docs/19-contributor-styleguide.md`, `docs/TODO.md`, `CHANGELOG.md`.
**Create:** `scripts/sync-mighty-decks.mjs`, `mighty-decks.config.json`, `mighty-decks.lock.json`, `vendor/mighty-decks/components/`, selected `apps/web/public/mighty-decks/` files.

1. Sync React mode at the verified upstream commit; preserve unrelated in-progress RulesIllustrations work.
2. Add explicit vendor workspace, switch web dependency to `workspace:*`, regenerate lockfile with `pnpm install`. Preserve existing imports and adapters.
3. Adapt rule-doc provenance to include locked Git SHA while retaining document hashes. Run `pnpm docs:rules` to refresh mirrors and commit actual changes.
4. Add explicit `components:update` convenience command and offline `components:verify`. Normal dev/build may verify but must never fetch/build/render components.
5. Run `pnpm components:verify`, `pnpm docs:rules:check`, `pnpm check:agent`, `pnpm build:agent`; verify representative `/rules` and full/compact/composed cards with loaded art/fonts in browser.
6. Confirm a clean checkout needs no upstream components repository/archive/npm package. Inspect lockfile to ensure component resolution is local.

**Suggested commit:** `refactor: consume checked-in Mighty Decks files`.

### 6. Migrate Exiles and demonstrate PNG-only use

**Modify in Exiles:** Root/web `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `.gitignore`, `scripts/prepare-mighty-decks.mjs`, `scripts/audit-mighty-decks.mjs`, relevant README/docs and archive-dependent tests.
**Create:** Same config/lock/sync/vendor destinations as Storyteller, selecting `both` with core/medieval coverage.
**Retire:** `scripts/mighty-decks-release.json` and archive download/extraction logic after replacing every caller.

1. Sync both mode; switch both existing dependency declarations to local workspace resolution (remove a declaration only if its callers no longer need it).
2. Replace `cards:prepare` in dev/build with offline verification or remove the hook; adapt audits to the new manifest. Update/remove `components:copy` if redundant with tracked static files.
3. Ensure public PNGs/assets and vendor JS/types are tracked; retain current image URLs where possible.
4. Run existing `pnpm cards:audit`, `pnpm typecheck`, `pnpm build`, `pnpm test`. Check representative Markdown PNGs and MDX React cards in the host browser.
5. Make a small temporary PNG-only Markdown fixture using just Git + Node updater. Verify selected files/notices are sufficient without package installation, React, Playwright, or a component build. Document copying selected PNG files manually as an equally valid option.

**Suggested commit:** `refactor: replace Mighty Decks release downloads with vendored files`.

### 7. Retire release machinery and finish acceptance

**Delete in components:** `.github/workflows/release.yml`, `.github/workflows/ci.yml` under the requested no-GitHub-build policy.
**Modify:** `package.json`, `README.md`, `docs/maintenance.md`, release guidance and tests.
**Retire after caller audit:** `scripts/pack-runtime.mjs`, `scripts/stage-git-package.mjs`, `scripts/publish-git-distribution.mjs`, `scripts/package-runtime-assets.mjs`, `scripts/package-pngs.mjs`, `scripts/verify-release.mjs`, and archive-only verification helpers/tests. Retain reusable local rendering/consumer verification rather than deleting coverage blindly.

1. Validate the local replacement first; then remove workflow jobs, obsolete script entries, mandatory release hooks, and npm/archive instructions. Do not move the old multi-build release pipeline into a mandatory push hook.
2. Inspect branch protection/required status checks and remove references to deleted jobs so merges do not wait forever. Keep unrelated security/review settings.
3. Push source and distribution together; verify no component build/release workflow starts. No registry action is required; leave published versions available for rollback.
4. Update each consumer to one subsequent upstream change; demonstrate changed-file-only diffs and a repeated no-op sync. Revert that update to demonstrate rollback.
5. Mark the superseded TODOs resolved only after both consumers pass. Keep a short local checklist for producer tests and visual verification; with remote jobs removed, these checks are explicitly the author's responsibility.

**Suggested commit:** `chore: remove remote component build and release pipeline`.

## Acceptance criteria

- A local card edit can be prepared, reviewed, committed and pushed with ordinary Git; no npm or GitHub Release operation is involved.
- Source and generated files come from one upstream commit. No stale/missing generated outputs pass local verification.
- No-op preparation changes no tracked files and launches no PNG browser; no-op sync changes no consumer files.
- React, PNG, and both consumers retrieve only their selected distribution content on explicit update, with deletion and failure behavior tested.
- Existing React imports, artwork URLs, PNG paths, font loading, and rule-document provenance work.
- Clean consumer installs/builds make no requests for Mighty Decks packages, archives, or Git refs; ordinary third-party dependency installation still applies.
- There is no component compilation/rendering/packaging on GitHub. Consumer app builds remain normal app builds.
- Consumer rollback is an ordinary Git revert of files and lock together.

## Practical limits and references

Committing PNGs trades release complexity for Git storage. First sync must transfer all selected files; binary changes grow repository history, including consumer history. Avoid unnecessary sizes/variants and PNG re-encoding. Measure total distribution size, largest file, and actual changed bytes in Task 1; do not promise forever-small repos. GitHub blocks ordinary Git files above 100 MiB and recommends repositories ideally below 1 GB and strongly below 5 GB. If measured growth approaches those recommendations, revisit image storage separately rather than quietly adding LFS/archive infrastructure to this plan. [GitHub large-file guidance](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github).

Sparse checkout controls working-tree paths; partial clone filters blob retrieval. Both are needed to avoid fetching the whole image/source library. See [Git clone documentation](https://git-scm.com/docs/git-clone) and [Git sparse-checkout documentation](https://git-scm.com/docs/git-sparse-checkout). GitHub is the source transport, not the runtime image CDN: consumers serve their checked-in images through their own application/static hosting.
