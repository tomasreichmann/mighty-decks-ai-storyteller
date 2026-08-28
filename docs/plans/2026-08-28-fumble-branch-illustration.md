# Fumble Branch Illustration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the `/rules` Fumble illustration read as one cause branching into a narrow miss and a wider consequence outcome with connected lines and larger constant-size cards.

**Architecture:** Keep `FumbleBranchesV2` and all canonical card components in `RulesIllustrations.tsx`. Use one shared card-width constant and asymmetric 30/70 connector geometry in the existing rulebook CSS module, with a desktop Y-fork and a single-column mobile fallback.

**Tech Stack:** React, TypeScript, CSS Modules, Node test runner, Playwright.

---

### Task 1: Protect the branch structure

**Files:**
- Modify: `apps/web/src/components/rules/RulesIllustrations.test.tsx`
- Test: `apps/web/src/components/rules/RulesIllustrations.test.tsx`

1. Add assertions requiring a shared card-width constant, gap-aware connector geometry, and no miss pictogram.
2. Run the focused test and confirm it fails against the current mixed card widths and disconnected percentage endpoints.

### Task 2: Build the compact Y-fork

**Files:**
- Modify: `apps/web/src/components/rules/RulesIllustrations.tsx`
- Modify: `apps/web/src/components/rules/RulesRulebookContent.module.css`

1. Remove the decorative miss mark and apply one fixed card width to the source and four consequence cards.
2. Make the connector endpoints account for the branch gap and stack consequence pairs on narrow screens.
3. Run the focused test and confirm it passes.

### Task 3: Verify and commit

**Files:**
- Modify if needed: `CHANGELOG.md`

1. Inspect `/rules` at desktop and mobile widths with Playwright.
2. Run `pnpm check:agent` and `pnpm build:agent`.
3. Review the complete diff and commit every current edit on `master` in one commit, as requested.
