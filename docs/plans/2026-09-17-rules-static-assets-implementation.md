# Rules static assets implementation plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make `/rules` serve its static board and Outcome backface images in local development.

**Architecture:** Vite owns files in `apps/web/public`; the local API proxy must not intercept that namespace. A source-level regression test protects the proxy boundary.

**Tech Stack:** Vite, TypeScript, Node test runner.

---

### Task 1: Guard and remove the static-path proxy

**Files:**
- Create: `apps/web/src/vite.config.test.ts`
- Modify: `apps/web/vite.config.ts`

**Step 1:** Add a test asserting the local proxy configuration does not claim `/backgrounds`.

**Step 2:** Run `pnpm -C apps/web exec tsx --test src/vite.config.test.ts`; it must fail because `/backgrounds` is still proxied.

**Step 3:** Remove the `/backgrounds` proxy entry only.

**Step 4:** Re-run the focused test; it must pass.

### Task 2: Verify and review the complete worktree

**Files:**
- Review: all staged and unstaged tracked/untracked files

**Step 1:** Run focused web/server tests, typecheck, and build checks appropriate to changed packages.

**Step 2:** Confirm `/rules` returns 200 for board and Outcome-backface images and renders them.

**Step 3:** Review the complete diff, fix material findings, and create one commit containing the reviewed change set.
