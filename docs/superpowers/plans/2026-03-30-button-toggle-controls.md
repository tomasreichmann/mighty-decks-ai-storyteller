# Button Toggle Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add shared `ToggleButton` and `ButtonRadioGroup` primitives with non-tilted grouped-button styling, then showcase them on `/styleguide`.

**Architecture:** Keep the existing `Button` intact for current surfaces and add two new common primitives that reuse the repo's palette, typography, and tactile depth without the tilted silhouette. Cover the new API and styleguide additions with lightweight source-based `node:test` tests that match the current web test strategy.

**Tech Stack:** React 18, TypeScript, Tailwind, node:test, Vite

---

## File Map

- Modify: `docs/superpowers/specs/2026-03-30-button-toggle-controls-design.md`
- Create: `apps/web/src/components/common/ToggleButton.tsx`
- Create: `apps/web/src/components/common/ButtonRadioGroup.tsx`
- Create: `apps/web/src/components/common/ToggleButton.test.ts`
- Modify: `apps/web/src/routes/StyleguideIndexPage.tsx`
- Modify: `apps/web/src/routes/StyleguideRoutes.test.ts`
- Modify: `docs/04-ui-components.md`
- Modify: `docs/17-ui-style-system-penpot-mcp.md`
- Modify: `CHANGELOG.md`

### Task 1: Lock the approved API in docs

**Files:**
- Modify: `docs/superpowers/specs/2026-03-30-button-toggle-controls-design.md`

- [ ] Update the spec terminology from `pressed` to `active`.
- [ ] Confirm the doc still states that grouped controls avoid the tilted primary button silhouette.

### Task 2: Write failing tests for the new shared controls

**Files:**
- Create: `apps/web/src/components/common/ToggleButton.test.ts`

- [ ] Add source-based tests that assert `ToggleButton.tsx` exposes an `active` prop and sets `aria-pressed`.
- [ ] Add source-based tests that assert `ButtonRadioGroup.tsx` uses `role="radiogroup"` and radio-style option state.
- [ ] Run only the new test file first and confirm it fails because the components do not exist yet.

### Task 3: Implement the shared grouped-button primitives

**Files:**
- Create: `apps/web/src/components/common/ToggleButton.tsx`
- Create: `apps/web/src/components/common/ButtonRadioGroup.tsx`

- [ ] Implement a non-tilted `ToggleButton` with `gold|fire|monster|cloth|bone|curse` and `s|m|l`.
- [ ] Implement `ButtonRadioGroup` on top of `ToggleButton` with one active option and a typed option API.
- [ ] Re-run the new control tests and make them pass.

### Task 4: Add failing styleguide coverage

**Files:**
- Modify: `apps/web/src/routes/StyleguideRoutes.test.ts`

- [ ] Extend the existing styleguide route test to assert the new toggle/radio showcase copy is present in `StyleguideIndexPage.tsx`.
- [ ] Run the styleguide route test and confirm it fails before editing the page.

### Task 5: Add the `/styleguide` showcase

**Files:**
- Modify: `apps/web/src/routes/StyleguideIndexPage.tsx`

- [ ] Import the new shared controls into the styleguide page.
- [ ] Add a new internal section demonstrating active/inactive toggle states, radio-group selection, the six supported colors, and the three sizes.
- [ ] Re-run the styleguide route test and make it pass.

### Task 6: Update shared docs and changelog

**Files:**
- Modify: `docs/04-ui-components.md`
- Modify: `docs/17-ui-style-system-penpot-mcp.md`
- Modify: `CHANGELOG.md`

- [ ] Add the new shared primitives to the UI/component docs.
- [ ] Document the non-tilted grouped-control pattern in the style-system doc.
- [ ] Add a concise unreleased changelog entry for the new controls and `/styleguide` showcase.

### Task 7: Verify the slice

**Files:**
- Test: `apps/web/src/components/common/ToggleButton.test.ts`
- Test: `apps/web/src/routes/StyleguideRoutes.test.ts`

- [ ] Run the focused `node --test` command for the new and updated tests.
- [ ] Run `pnpm typecheck`.
- [ ] Confirm all verification output is clean before reporting completion.

## Self-Review

- Spec coverage: the plan covers the shared primitives, the `active` prop rename, the `/styleguide` presentation, tests, docs, and changelog updates required by the approved spec.
- Placeholder scan: no `TODO` or unresolved placeholders remain.
- Type consistency: the plan uses `active` consistently and keeps the scope limited to web shared primitives and docs.
