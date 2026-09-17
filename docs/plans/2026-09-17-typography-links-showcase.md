# Typography Links Showcase Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a reusable-link showcase to the typography styleguide.

**Architecture:** Render a `Links` panel inside the existing typography route. Use native inline anchors for prose and the shared ghost `Button` component for action/navigation examples; no new primitives or application behavior are required.

**Tech Stack:** React 18, TypeScript, React Router, Tailwind, `node:test`, React Test Renderer.

---

### Task 1: Cover the typography link showcase

**Files:**

- Create: `apps/web/src/routes/StyleguideTypographyPage.test.tsx`

**Step 1: Write the failing test**

Render `StyleguideTypographyPage` inside a memory router and assert that the `Links` section contains a prose anchor and the expected ghost-link examples.

**Step 2: Run test to verify it fails**

Run: `pnpm -C apps/web exec tsx --test src/routes/StyleguideTypographyPage.test.tsx`

Expected: FAIL because the Links showcase has not been rendered.

### Task 2: Render the showcase

**Files:**

- Modify: `apps/web/src/routes/StyleguideTypographyPage.tsx`

**Step 1: Implement the minimal route change**

Import `Button` and add a `Panel` titled `Links`. Include a plain inline anchor and shared ghost buttons linking to nearby styleguide routes in gold, cloth, and fire.

**Step 2: Run test to verify it passes**

Run: `pnpm -C apps/web exec tsx --test src/routes/StyleguideTypographyPage.test.tsx`

Expected: PASS.

### Task 3: Document and verify

**Files:**

- Modify: `docs/04-ui-components.md`
- Modify: `CHANGELOG.md`

**Step 1: Update reference documentation**

State that the typography lab includes inline and shared ghost-link examples.

**Step 2: Record the visible styleguide addition**

Add a concise Unreleased changelog bullet.

**Step 3: Run focused and type validation**

Run: `pnpm -C apps/web test` and `pnpm check:agent`.

Expected: both exit successfully.
