# Local Default Port Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Change the zero-config local default port from `8080` to `8081` without affecting explicit env overrides or Render deployment behavior.

**Architecture:** The server continues to honor `process.env.PORT`, but its fallback default changes to `8081`. The web app's local Vite heuristic changes to the same port so split local development remains zero-config. Docs and the changelog are updated in the same slice.

**Tech Stack:** TypeScript, Node.js, Fastify, Vite, Socket.IO, node:test, tsx

---

### Task 1: Add regression tests for the new default

**Files:**
- Create: `apps/server/test/envDefaults.test.ts`
- Create: `apps/web/src/lib/socket.test.ts`

**Step 1: Write the failing server test**

Assert that the env parser defaults `PORT` to `8081` when unset.

**Step 2: Run test to verify it fails**

Run: `pnpm -C apps/server test`

Expected: a failure showing the current default is still `8080`.

**Step 3: Write the failing web test**

Assert that local Vite development resolves the server URL to `http://127.0.0.1:8081` or `http://<host>:8081` when no override exists.

**Step 4: Run test to verify it fails**

Run: `node .\\apps\\web\\node_modules\\tsx\\dist\\cli.mjs --test apps\\web\\src\\lib\\socket.test.ts`

Expected: a failure showing the client still assumes `8080`.

### Task 2: Implement the minimal code changes

**Files:**
- Modify: `apps/server/src/config/env.ts`
- Modify: `apps/web/src/lib/socket.ts`

**Step 1: Change the server fallback port**

Update the Zod default for `PORT` from `8080` to `8081`.

**Step 2: Change the web local-dev fallback**

Update the local-dev server URL resolution so split Vite development assumes `8081`.

**Step 3: Run targeted tests**

Run:
- `pnpm -C apps/server test`
- `node .\\apps\\web\\node_modules\\tsx\\dist\\cli.mjs --test apps\\web\\src\\lib\\socket.test.ts`

Expected: both pass.

### Task 3: Update docs and changelog

**Files:**
- Modify: `.env.example`
- Modify: `README.md`
- Modify: `CHANGELOG.md`

**Step 1: Update env example**

Change the example `PORT` to `8081`.

**Step 2: Update contributor docs**

Replace the documented local split-dev assumptions from `8080` to `8081`.

**Step 3: Update changelog**

Add a concise `Changed` entry under `## [Unreleased]`.

### Task 4: Verify the full slice

**Files:**
- Verify current diff only

**Step 1: Run verification**

Run:
- `pnpm -C apps/server test`
- `node .\\apps\\web\\node_modules\\tsx\\dist\\cli.mjs --test apps\\web\\src\\lib\\socket.test.ts`
- `pnpm typecheck`

**Step 2: Review diff**

Run: `git diff -- docs/plans/2026-03-16-local-default-port-design.md docs/plans/2026-03-16-local-default-port.md apps/server/src/config/env.ts apps/server/test/envDefaults.test.ts apps/web/src/lib/socket.ts apps/web/src/lib/socket.test.ts .env.example README.md CHANGELOG.md`

Expected: only the planned port-default and documentation changes appear.
