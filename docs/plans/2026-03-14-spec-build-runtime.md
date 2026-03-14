# Spec Build Runtime Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build `spec` to JS plus declarations, start the server with plain Node in production, and narrow Render installs to deploy-relevant workspaces.

**Architecture:** The shared `spec` workspace becomes a real built package with `dist` exports. Server production runtime consumes built JS through normal package exports, while local dev/test scripts ensure `spec` is built before runtime execution. Render installs only the `web`, `server`, and `spec` workspaces and starts built server output with `node`.

**Tech Stack:** PNPM workspaces, TypeScript, Vite, Node.js, Render

---

### Task 1: Add failing runtime smoke tests

**Files:**
- Create: `apps/server/test/buildRuntime.test.ts`

**Step 1: Write the failing test**

- Add one test that imports built `@mighty-decks/spec/imageGeneration` from plain Node and expects `imageProviderSchema` to exist.
- Add one test that imports built `apps/server/dist/image/registerImageRoutes.js` from plain Node and expects the module to load.

**Step 2: Run test to verify it fails**

Run: `pnpm -C apps/server exec tsx --test test/buildRuntime.test.ts`

Expected: FAIL because `spec/dist` exports or built server runtime import path are not ready.

**Step 3: Write minimal implementation**

- Make `spec` emit build output and export built files.
- Ensure server build/runtime can resolve built spec output.

**Step 4: Run test to verify it passes**

Run: `pnpm -C apps/server exec tsx --test test/buildRuntime.test.ts`

Expected: PASS

### Task 2: Build `spec` as a distributable workspace package

**Files:**
- Modify: `spec/package.json`
- Create: `spec/tsconfig.build.json`

**Step 1: Add build output configuration**

- Add a `build` script for `spec`.
- Configure build output to `dist/` with JS and declaration emission.
- Update package exports to point to built JS and declaration files.

**Step 2: Verify build output**

Run: `pnpm -C spec build`

Expected: `spec/dist/*.js` and `spec/dist/*.d.ts` are emitted.

### Task 3: Update workspace scripts for built `spec`

**Files:**
- Modify: `package.json`
- Modify: `apps/server/package.json`
- Modify: `apps/web/package.json`

**Step 1: Make local scripts resilient**

- Ensure local dev/test/build commands that depend on runtime `spec` output build `spec` first.
- Keep `tsx` only for development and test flows.

**Step 2: Verify key local commands**

Run: `pnpm -C spec build`

Expected: exit 0

### Task 4: Switch production runtime and Render config

**Files:**
- Modify: `render.yaml`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

**Step 1: Remove accidental root dependency**

- Remove root `playwright` dependency and update lockfile.

**Step 2: Narrow Render install and runtime**

- Use filtered PNPM install for `web`, `server`, and their dependencies.
- Build `spec`, `server`, and `web`.
- Start production with plain `node apps/server/dist/index.js`.

**Step 3: Verify Render-oriented commands locally**

Run: `pnpm --filter @mighty-decks/web... --filter @mighty-decks/server... list --depth 0`

Expected: no root package entry with `playwright`

### Task 5: Update docs and changelog

**Files:**
- Modify: `docs/10-render-single-service.md`
- Modify: `AGENTS.md`
- Modify: `CHANGELOG.md`

**Step 1: Document new build/runtime expectations**

- Update local workflow notes if scripts change.
- Update Render docs to describe filtered install and plain Node runtime.
- Add a concise `CHANGELOG.md` entry under `## [Unreleased]`.

**Step 2: Final verification**

Run:
- `pnpm -C spec build`
- `pnpm -C apps/server build`
- `pnpm -C apps/web build`
- `pnpm -C apps/server test`
- `pnpm -C apps/server exec tsx --test test/buildRuntime.test.ts`

Expected: all pass
