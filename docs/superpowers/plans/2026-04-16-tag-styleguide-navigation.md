# Tag and Styleguide Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `Tag`, `Tags`, and `ConnectionStatusPill` share one reusable chip primitive, then reorganize `/styleguide` into smaller subpages with secondary navigation and clearer component scoping.

**Architecture:** Keep the shared chip logic in `apps/web/src/components/common/Tag.tsx` and have `Tags` plus `ConnectionStatusPill` compose it instead of duplicating the chip chrome. Add a small styleguide navigation component and split the current dense index into focused pages for overview, cards, tags, and controls while leaving the existing detailed card/session pages intact.

**Tech Stack:** React 18, TypeScript, React Router, existing Tailwind utility classes, `node:test`, Vite

---

### Task 1: Make `Tag` the reusable chip primitive

**Files:**
- Modify: `apps/web/src/components/common/Tag.tsx`
- Modify: `apps/web/src/components/common/Tags.tsx`
- Modify: `apps/web/src/components/common/ConnectionStatusPill.tsx`
- Test: `apps/web/src/components/common/Tag.test.ts` or a new source-based test file in the same folder

- [ ] **Step 1: Capture the new chip contract in a test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Tag exposes a reusable chip surface", () => {
  const source = readFileSync(new URL("./Tag.tsx", import.meta.url), "utf8");

  assert.match(source, /export const Tag/);
  assert.match(source, /className.*tag/);
  assert.match(source, /leading|trailing|contentClassName/);
});
```

- [ ] **Step 2: Run the focused test and confirm it fails before the implementation**

Run: `pnpm -C apps/web exec tsx --test src/components/common/Tag.test.ts`
Expected: fail because the reusable chip API is not present yet.

- [ ] **Step 3: Implement the reusable chip surface**

```tsx
export interface TagProps extends PropsWithChildren {
  tone?: TagTone;
  size?: "sm" | "md";
  leading?: ReactNode;
  trailing?: ReactNode;
  contentClassName?: string;
  className?: string;
}
```

The root element must begin with the component name class token, e.g. `tag`, and `Tags` / `ConnectionStatusPill` must use the shared primitive instead of hand-building their own chip shell.

- [ ] **Step 4: Re-run the focused test and confirm it passes**

Run: `pnpm -C apps/web exec tsx --test src/components/common/Tag.test.ts`
Expected: pass.

- [ ] **Step 5: Commit the shared chip refactor**

```bash
git add apps/web/src/components/common/Tag.tsx apps/web/src/components/common/Tags.tsx apps/web/src/components/common/ConnectionStatusPill.tsx apps/web/src/components/common/Tag.test.ts
git commit -m "refactor: share the common tag chip surface"
```

### Task 2: Add scoped styleguide pages and secondary navigation

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/routes/StyleguideIndexPage.tsx`
- Create: `apps/web/src/routes/StyleguideCardsPage.tsx`
- Create: `apps/web/src/routes/StyleguideTagsPage.tsx`
- Create: `apps/web/src/routes/StyleguideControlsPage.tsx`
- Create: `apps/web/src/components/styleguide/StyleguideSectionNav.tsx`
- Modify: `apps/web/src/routes/StyleguideRoutes.test.ts`
- Test: `apps/web/src/routes/StyleguideCardsPage.test.ts` and `apps/web/src/routes/StyleguideTagsPage.test.ts` and `apps/web/src/routes/StyleguideControlsPage.test.ts`

- [ ] **Step 1: Add route coverage for the new subpages**

```ts
assert.match(source, /StyleguideCardsPage/);
assert.match(source, /StyleguideTagsPage/);
assert.match(source, /StyleguideControlsPage/);
assert.match(source, /path="\/styleguide\/cards"/);
assert.match(source, /path="\/styleguide\/tags"/);
assert.match(source, /path="\/styleguide\/controls"/);
```

- [ ] **Step 2: Verify the route assertions fail before the route changes**

Run: `pnpm -C apps/web exec tsx --test src/routes/StyleguideRoutes.test.ts`
Expected: fail until the new pages and route entries are added.

- [ ] **Step 3: Build the styleguide shell and the new subpages**

```tsx
// StyleguideSectionNav.tsx should render the secondary navigation.
// StyleguideIndexPage.tsx becomes the overview.
// StyleguideCardsPage.tsx groups the card labs.
// StyleguideTagsPage.tsx showcases Tag, Tags, and ConnectionStatusPill together.
// StyleguideControlsPage.tsx groups ToggleButton, ButtonRadioGroup, and RockerSwitch.
```

Each page should keep the root class name convention by beginning the root class list with the component/page name token.

- [ ] **Step 4: Re-run the route tests and confirm they pass**

Run: `pnpm -C apps/web exec tsx --test src/routes/StyleguideRoutes.test.ts src/routes/StyleguideCardsPage.test.ts src/routes/StyleguideTagsPage.test.ts src/routes/StyleguideControlsPage.test.ts`
Expected: pass.

- [ ] **Step 5: Commit the styleguide split**

```bash
git add apps/web/src/App.tsx apps/web/src/routes/StyleguideIndexPage.tsx apps/web/src/routes/StyleguideCardsPage.tsx apps/web/src/routes/StyleguideTagsPage.tsx apps/web/src/routes/StyleguideControlsPage.tsx apps/web/src/components/styleguide/StyleguideSectionNav.tsx apps/web/src/routes/StyleguideRoutes.test.ts apps/web/src/routes/StyleguideCardsPage.test.ts apps/web/src/routes/StyleguideTagsPage.test.ts apps/web/src/routes/StyleguideControlsPage.test.ts
git commit -m "feat: split the styleguide into scoped subpages"
```

### Task 3: Update docs, changelog, and verification

**Files:**
- Modify: `docs/04-ui-components.md`
- Modify: `docs/17-ui-style-system-penpot-mcp.md`
- Modify: `docs/19-contributor-styleguide.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Add the root-class naming rule to the contributor style guide**

```md
- When a component renders a root element with a className, start the class list with a component-name token (kebab-case is preferred) so the root is easy to search and consistent across the codebase.
```

- [ ] **Step 2: Update the styleguide documentation to describe the new section pages**

```md
- `/styleguide` is now an overview plus secondary navigation
- `/styleguide/cards` groups the card labs
- `/styleguide/tags` showcases `Tag`, `Tags`, and `ConnectionStatusPill`
- `/styleguide/controls` groups the toggle and rocker controls
```

- [ ] **Step 3: Add an unreleased changelog note**

```md
- Added:
  - Reorganized `/styleguide` into scoped component subpages with secondary navigation.
  - Made `Tag` the shared chip primitive for tag-like components.
```

- [ ] **Step 4: Run the final verification commands**

Run:

```bash
pnpm -C apps/web exec tsx --test src/routes/StyleguideRoutes.test.ts src/routes/StyleguideCardsPage.test.ts src/routes/StyleguideTagsPage.test.ts src/routes/StyleguideControlsPage.test.ts
pnpm -C apps/web typecheck
pnpm -C apps/web build
```

Expected: all commands exit cleanly.

- [ ] **Step 5: Commit the docs pass**

```bash
git add docs/04-ui-components.md docs/17-ui-style-system-penpot-mcp.md docs/19-contributor-styleguide.md CHANGELOG.md
git commit -m "docs: document the new styleguide structure"
```
