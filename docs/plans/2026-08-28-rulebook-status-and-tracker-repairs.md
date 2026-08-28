# Rulebook Status and Tracker Repairs Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the affected `/rules` teaching figures accurately show status thresholds, complete card compositions, and readable on-card d4 trackers.

**Architecture:** Keep all card data canonical in `spec/rulesCards.ts` and its mirrored CSV source, then compose only existing `GameCardView`, `AssetCard`, `ActorCard`, `CounterCard`, and `DieMarker` components in the rulebook figures. Use small figure-specific layout classes for milestone lanes and top-aligned tracking grids; do not introduce another card shell.

**Tech Stack:** React, TypeScript, Tailwind CSS, CSS modules, Node test runner, shared `@mighty-decks/spec` card catalogs.

---

### Task 1: Rename the canonical Dying card to Taken Out

**Files:**
- Modify: `apps/web/src/data/effects-en.csv`
- Modify: `spec/rulesCards.ts`
- Test: `spec/rulesCards.test.ts`

**Step 1: Write the failing catalog test**

Assert that `rulesEffectCardsBySlug["taken-out"]` has title `Taken Out`, reuses `/mighty-decks/effects/dying.png`, and that no `dying` slug remains.

**Step 2: Run the focused test and verify it fails**

Run: `pnpm -C spec test -- rulesCards.test.ts`

Expected: FAIL because the catalog still exports `dying` / `Dying`.

**Step 3: Rename the catalog entry**

Change the CSV and embedded spec row to:

```csv
"taken-out","Taken Out","/mighty-decks/effects/dying.png","4x Injury: You are Taken Out. You cannot act until the fiction and recovery rules allow it.──Heal your Injuries to discard.",1,"base"
```

Keep the existing image URI so no new raster asset is introduced.

**Step 4: Re-run the focused test**

Expected: PASS.

### Task 2: Make d4 values and removal visible

**Files:**
- Modify: `apps/web/src/components/rules/DieMarker.tsx`
- Modify: `apps/web/src/components/rules/DieMarker.module.css`
- Test: `apps/web/src/components/rules/DieMarker.test.ts`

**Step 1: Write failing source/render assertions**

Require the visible value/X span to use `styles.value`, require active and removed labels, and require the removed style to produce a high-contrast X above the face.

**Step 2: Run the focused test and verify it fails**

Run: `pnpm -C apps/web test -- DieMarker.test.ts`

Expected: FAIL because the value span has no foreground class and is painted below `.face`.

**Step 3: Fix the marker layer order**

Render the face/edges first and the following foreground span afterward:

```tsx
<span aria-hidden="true" className={styles.value}>
  {removed ? "×" : displayedValue}
</span>
```

Keep `.value` positioned above the face and strengthen `.removed .value` with the blood color and a larger X.

**Step 4: Re-run the focused test**

Expected: PASS.

### Task 3: Rebuild the status threshold illustration

**Files:**
- Modify: `apps/web/src/components/rules/RulesIllustrations.tsx`
- Modify: `apps/web/src/components/rules/RulesRulebookContent.module.css`
- Test: `apps/web/src/components/rules/RulesIllustrations.test.tsx`
- Test: `apps/web/src/components/rules/RulesRulebookContent.test.tsx`

**Step 1: Write failing threshold assertions**

Require real `distress`, `panicked`, `hopeless`, `injury`, and `taken-out` Effect cards; require the accessible sequences `0–2 OK -> 3 Distress + Panicked -> 4 Distress + Hopeless` and `0–3 OK -> 4 Injury + Taken Out`; reject the current five-copy mapping.

**Step 2: Run focused tests and verify they fail**

Run: `pnpm -C apps/web test -- RulesIllustrations.test.tsx RulesRulebookContent.test.tsx`

Expected: FAIL because the current component repeats Distress/Injury cards and never renders terminal cards.

**Step 3: Implement two milestone lanes**

Use one full-width lane per track. Each milestone is a compact group of catalog-backed cards and a clear count label. Show `Panicked`, `Hopeless`, and `Taken Out` as actual `ResolvedCard` instances. Add a backward recovery cue between the Distress terminal milestones and keep the complete ordered sequence in screen-reader text.

**Step 4: Add responsive figure-specific layout**

Use CSS-module classes for the lane, milestone group, paired cards, and recovery cue. Wrap at phone widths without page-level horizontal overflow.

**Step 5: Re-run the focused tests**

Expected: PASS.

### Task 4: Repair the Physical Asset and tracking figures

**Files:**
- Modify: `apps/web/src/components/rules/RulesIllustrations.tsx`
- Modify: `apps/web/src/components/rules/RulesRulebookContent.module.css`
- Test: `apps/web/src/components/rules/RulesIllustrations.test.tsx`

**Step 1: Write failing composition assertions**

Require the Physical Asset figure to render `marksman`, require tracking figures to use the dedicated top-aligned grid class, and require markers to use an overlapping upper-right position rather than `-right-2 -top-2`.

**Step 2: Run the focused test and verify it fails**

Run: `pnpm -C apps/web test -- RulesIllustrations.test.tsx`

Expected: FAIL for the unavailable `sharpshooter` slug and generic centered layout.

**Step 3: Repair the figures**

- Replace `sharpshooter` with `marksman`.
- Wrap Remaining Toughness states in an equal-column top-aligned grid.
- Wrap Counter tracking in a two-column top-aligned grid.
- Place each d4 over the card's upper-right corner with an inside offset and sufficient z-index.
- Keep the removed marker as the sole zero-state marker; the visible caption remains `Taken Out — after 1 Distress`.

**Step 4: Re-run the focused test**

Expected: PASS.

### Task 5: Document and verify the repair

**Files:**
- Modify: `CHANGELOG.md`

**Step 1: Add an Unreleased changelog entry**

Add a concise `Fixed` bullet covering the completed rulebook threshold, card-composition, and tracker visuals.

**Step 2: Run focused and repository validation**

Run:

```powershell
pnpm -C spec test -- rulesCards.test.ts
pnpm -C apps/web test -- DieMarker.test.ts RulesIllustrations.test.tsx RulesRulebookContent.test.tsx
pnpm check:agent
```

Expected: all commands pass; full logs remain under `.agent-logs/` where applicable.

**Step 3: Inspect the live page**

Use `webapp-testing` to inspect `/rules` at desktop and phone widths. Confirm real terminal cards, readable milestone order, complete Physical Asset composition, visible d4 values/X, on-card markers, top-aligned tracking cards, and no horizontal page overflow.

**Step 4: Review the final diff**

Run `git diff --check` and inspect only the files in this plan. Preserve all pre-existing unrelated working-tree changes; do not stage or commit overlapping user edits without explicit approval.
