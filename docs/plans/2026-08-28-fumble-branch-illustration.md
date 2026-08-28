# Fumble Branch Illustration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the `/rules` Fumble illustration read as one cause branching into two balanced, compact outcomes.

**Architecture:** Keep `FumbleBranchesV2` and all canonical card components in `RulesIllustrations.tsx`. Move its unique geometry into the existing rulebook CSS module, using a desktop Y-fork and a single-column mobile fallback.

**Tech Stack:** React, TypeScript, CSS Modules, Node test runner, Playwright.

---

### Task 1: Protect the branch structure

**Files:**
- Modify: `apps/web/src/components/rules/RulesIllustrations.test.tsx`
- Test: `apps/web/src/components/rules/RulesIllustrations.test.tsx`

1. Add assertions requiring dedicated fork, branch, and consequence-group styles.
2. Run the focused test and confirm it fails because those styles are absent.

### Task 2: Build the compact Y-fork

**Files:**
- Modify: `apps/web/src/components/rules/RulesIllustrations.tsx`
- Modify: `apps/web/src/components/rules/RulesRulebookContent.module.css`

1. Replace the inline grid in `FumbleBranchesV2` with semantic source, fork, branch, and consequence groups.
2. Add scoped CSS for the connector geometry, equal branch columns, paired cards, and mobile stacking.
3. Run the focused test and confirm it passes.

### Task 3: Verify and commit

**Files:**
- Modify if needed: `CHANGELOG.md`

1. Inspect `/rules` at desktop and mobile widths with Playwright.
2. Run `pnpm check:agent` and `pnpm build:agent`.
3. Review the complete diff and commit every current edit on `master` in one commit, as requested.
