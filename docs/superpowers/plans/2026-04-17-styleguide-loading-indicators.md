# Styleguide Loading Indicators Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated styleguide lab for the shared loading indicators and surface it from the main styleguide overview and navigation.

**Architecture:** Keep the feature as a narrow vertical slice in the web app only. Add one new styleguide route that showcases the shared circular progress ring and the pending-dot indicator, then wire that page into the existing styleguide nav, overview cards, and route registration. Reuse existing shared primitives instead of introducing new loading-specific components.

**Tech Stack:** React, TypeScript, React Router, existing shared UI primitives, node:test assertions.

---

### Task 1: Add the loading lab route and page

**Files:**
- Create: `apps/web/src/routes/StyleguideLoadingPage.tsx`
- Modify: `apps/web/src/App.tsx`
- Test: `apps/web/src/routes/StyleguideLoadingPage.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("StyleguideLoadingPage showcases the shared loading primitives", () => {
  const source = readFileSync(
    new URL("./StyleguideLoadingPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /LoadingIndicator/);
  assert.match(source, /PendingIndicator/);
  assert.match(source, /Loading/);
  assert.match(source, /pending/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -C apps/web test -- StyleguideLoadingPage.test.ts`
Expected: fail because the new page file is missing.

- [ ] **Step 3: Write minimal implementation**

```tsx
// Create the new route page and register it in App.tsx.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -C apps/web test -- StyleguideLoadingPage.test.ts`
Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/routes/StyleguideLoadingPage.tsx apps/web/src/routes/StyleguideLoadingPage.test.ts apps/web/src/App.tsx
git commit -m "feat: add styleguide loading lab"
```

### Task 2: Surface the loading lab in the styleguide shell

**Files:**
- Modify: `apps/web/src/components/styleguide/StyleguideSectionNav.tsx`
- Modify: `apps/web/src/routes/StyleguideIndexPage.tsx`
- Modify: `apps/web/src/routes/StyleguideIndexPage.test.ts`
- Modify: `apps/web/src/routes/StyleguideRoutes.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// Update the existing route and overview tests to expect the new loading lab.
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm -C apps/web test -- StyleguideIndexPage.test.ts StyleguideRoutes.test.ts`
Expected: fail until the nav, overview, and app route are updated.

- [ ] **Step 3: Write minimal implementation**

```tsx
// Add the loading nav item and overview card, and update route assertions.
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm -C apps/web test -- StyleguideIndexPage.test.ts StyleguideRoutes.test.ts`
Expected: pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/styleguide/StyleguideSectionNav.tsx apps/web/src/routes/StyleguideIndexPage.tsx apps/web/src/routes/StyleguideIndexPage.test.ts apps/web/src/routes/StyleguideRoutes.test.ts
git commit -m "feat: surface loading lab in styleguide"
```

### Task 3: Update repository notes

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Add an unreleased changelog bullet**
- [ ] **Step 2: Re-run the targeted web tests**
- [ ] **Step 3: Commit the documentation update**

