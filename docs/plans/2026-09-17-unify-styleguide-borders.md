# Unify Styleguide Borders Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply the `Message` component's ink-heavy border language to every visible border on the Colors, Panel, Tags, and Step Navigation styleguide pages.

**Architecture:** Keep the changes local to the four styleguide routes and their existing shared primitives. Reuse the Message hard-shadow value (`4px 4px 0 #121b23`) for framed samples; turn opacity-reduced separators into fully opaque Iron lines. Do not alter public component APIs or interaction behavior.

**Tech Stack:** React, TypeScript, Tailwind CSS, Node test runner, Playwright.

---

### Task 1: Define and prove the desired styleguide border recipe

**Files:**
- Modify: `apps/web/src/routes/StyleguideColorsPage.tsx`
- Modify: `apps/web/src/routes/StyleguidePanelPage.tsx`
- Modify: `apps/web/src/routes/StyleguideTagsPage.tsx`
- Modify: `apps/web/src/components/common/StepNavigation.tsx`
- Test: `apps/web/src/routes/StyleguidePanelPage.test.tsx`

**Step 1: Write the failing test**

Add a source-level regression assertion that the target styleguide examples use the shared Iron hard-edge recipe, avoiding assertions about unrelated layout classes.

**Step 2: Run test to verify it fails**

Run: `pnpm -C apps/web exec tsx --test src/routes/StyleguidePanelPage.test.tsx`

Expected: FAIL because the all-borders treatment has not yet been applied.

**Step 3: Write minimal implementation**

- Replace partial-opacity Iron borders on Colors palette swatches and structural separators with opaque `border-kac-iron`.
- Use the Message hard shadow for swatches and prominent framed examples.
- Ensure Panel and Tag examples retain their existing shared primitive behavior but use their heavy shared edge.
- Make Step Navigation node, connector, and focus-visible edges fully Iron, preserving their existing line widths and state colors.

**Step 4: Run test to verify it passes**

Run: `pnpm -C apps/web exec tsx --test src/routes/StyleguidePanelPage.test.tsx`

Expected: PASS.

### Task 2: Check the visual result on all four routes

**Files:**
- Verify: `apps/web/src/routes/StyleguideColorsPage.tsx`
- Verify: `apps/web/src/routes/StyleguidePanelPage.tsx`
- Verify: `apps/web/src/routes/StyleguideTagsPage.tsx`
- Verify: `apps/web/src/routes/StyleguideStepNavigationPage.tsx`

**Step 1: Run browser reconnaissance**

Use a headless Playwright script against the running Vite server. Load each affected route, wait for `networkidle`, and capture a full-page screenshot.

**Step 2: Verify border consistency**

Confirm each route has opaque Iron separators and the heavier hard-edged frame treatment, without clipped text, horizontal overflow, console errors, or changed tag/step interactions.

### Task 3: Verify repository health

**Files:**
- Verify: affected TypeScript files and test suite

**Step 1: Run targeted tests**

Run: `pnpm -C apps/web exec tsx --test src/routes/StyleguidePanelPage.test.tsx`

Expected: PASS with no failures.

**Step 2: Run repository typecheck wrapper**

Run: `pnpm check:agent`

Expected: exit code 0. Consult the generated `.agent-logs/` file for full output if needed.

**Step 3: Review the diff**

Run: `git diff -- apps/web/src/routes/StyleguideColorsPage.tsx apps/web/src/routes/StyleguidePanelPage.tsx apps/web/src/routes/StyleguideTagsPage.tsx apps/web/src/components/common/StepNavigation.tsx docs/plans/2026-09-17-unify-styleguide-borders.md`

Confirm the diff is restricted to the all-borders visual treatment and does not disturb existing user work.
