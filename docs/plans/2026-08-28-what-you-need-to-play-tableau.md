# What You Need to Play Tableau Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Keep the approved `/rules` “What You Need to Play” tableau responsive while giving every portrait-format card one consistent size.

**Architecture:** Keep the change inside the existing rulebook illustration module and its CSS module. Apply one shared 9rem class to every portrait-format card and mirror that width in the Outcome deck and hand grid; retain the landscape Location width. Keep the minimum-width canvas inside its horizontal-scroll viewport so narrow rulebook columns cannot squash cards or widen the page.

**Tech Stack:** React, TypeScript, CSS Modules, Tailwind utility classes, Node test runner with `tsx`.

---

### Task 1: Lock the required tableau contents with a focused test

**Files:**
- Modify: `apps/web/src/components/rules/RulesIllustrations.test.tsx:34-46`

**Step 1: Replace the old CompleteTableSetup assertions**

Require the source slice for `CompleteTableSetup` to contain:

```ts
assert.match(completeTable, /<LocationCard/);
assert.match(completeTable, /title="Castle Gate"/);
assert.match(completeTable, /title="Reinforcements Coming"/);
assert.match(completeTable, /baseLayerSlug="guard_blue"/);
assert.match(completeTable, /tacticalRoleSlug="brute"/);
assert.match(completeTable, /<OutcomeCard card="success" face="back"/);
for (const slug of ["success", "fumble", "chaos"]) {
  assert.match(completeTable, new RegExp(`type="OutcomeCard" slug="${slug}"`));
}
assert.match(completeTable, /type="EffectCard" slug="injury"/);
assert.match(completeTable, /type="StuntCard" slug="marksman"/);
assert.match(completeTable, /noun="Throwing Knife" modifier="Returning"/);
assert.match(completeTable, /<DieMarker sides=\{4\} value=\{2\}/);
assert.match(completeTable, /<DieMarker sides=\{4\} value=\{3\}/);
assert.doesNotMatch(completeTable, /\["Mira", "Aldren", "Tomas"\]/);
assert.doesNotMatch(completeTable, /slug="safecracker"/);
assert.doesNotMatch(completeTable, /slug="boost"/);
```

Also require the responsive wrappers:

```ts
assert.match(completeTable, /className=\{styles\.tableSetupViewport\}/);
assert.match(completeTable, /className=\{styles\.tableSetupCanvas\}/);
```

**Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm exec tsx --test apps/web/src/components/rules/RulesIllustrations.test.tsx
```

Expected: FAIL because the current figure still renders three locations and three repeated player lanes.

**Step 3: Commit the test**

```bash
git add apps/web/src/components/rules/RulesIllustrations.test.tsx
git commit -m "test(web): specify rules setup tableau"
```

### Task 2: Build the responsive canonical-card tableau

**Files:**
- Modify: `apps/web/src/components/rules/RulesIllustrations.tsx:1-29,132-151`
- Modify: `apps/web/src/components/rules/RulesRulebookContent.module.css:1-10,150-164`

**Step 1: Import the canonical Outcome card**

Add:

```ts
import { OutcomeCard } from "../cards/OutcomeCard";
```

Remove `locationExamples`, which is no longer used.

**Step 2: Replace CompleteTableSetup**

Build one `tableSetupViewport` wrapper containing a `tableSetupCanvas` with
three rows:

```tsx
<div className={styles.tableSetupViewport}>
  <div className={styles.tableSetupCanvas}>
    <div className={styles.tableSetupShared} aria-label="Shared scene components">
      {/* Castle Gate; tracked Reinforcements Coming; tracked Guard / Brute */}
    </div>
    <div className={styles.tableSetupOutcomes} aria-label="Outcome deck and hand">
      {/* stacked face-down Outcome cards; Success, Fumble, Chaos */}
    </div>
    <div className={styles.tableSetupPlayer} aria-label="Player components">
      {/* Injury; Marksman; Returning Throwing Knife */}
    </div>
  </div>
</div>
```

Use the existing custom Asset payload exactly:

```tsx
<AssetCard
  kind="custom"
  noun="Throwing Knife"
  modifier="Returning"
  nounDescription="A light thrown weapon."
  adjectiveDescription="Returns after a throw."
  iconUrl="/assets/medieval/dagger.png"
  overlayUrl="/assets/base/empowered.png"
  className="w-[9rem]"
/>
```

Use relative wrappers for Counter and Actor marker overlays so each `DieMarker`
sits at the card's upper-right edge without affecting grid sizing.

**Step 3: Add protected-width and overflow styles**

Add component-local classes that:

- set `width: 100%`, `max-width: 100%`, `overflow-x: auto`, and
  `overscroll-behavior-inline: contain` on `.tableSetupViewport`;
- give `.tableSetupCanvas` `min-width: 46rem`, a three-row grid, and stable gaps;
- use explicit grid columns and centered alignment for the shared, Outcome, and
  player rows;
- prevent every direct card wrapper from shrinking;
- add bottom padding and a styled scrollbar so overflow remains discoverable;
- under `@media print`, remove scrolling and scale the canvas to the printable
  width without clipping.

**Step 4: Run the focused test and verify it passes**

Run:

```bash
pnpm exec tsx --test apps/web/src/components/rules/RulesIllustrations.test.tsx
```

Expected: PASS.

**Step 5: Run web typechecking**

Run:

```bash
pnpm -C apps/web typecheck
```

Expected: PASS.

**Step 6: Commit the implementation**

```bash
git add apps/web/src/components/rules/RulesIllustrations.tsx apps/web/src/components/rules/RulesRulebookContent.module.css
git commit -m "feat(web): update rules setup tableau"
```

### Task 3: Record and visually verify the player-facing update

**Files:**
- Modify: `CHANGELOG.md` under `## [Unreleased]`

**Step 1: Add a concise changelog bullet**

Add under the existing web changes:

```md
- Web: update the rulebook’s “What You Need to Play” figure to show a readable, horizontally scrollable tabletop of canonical Locations, Counters, Actors, Outcomes, Effects, Stunts, and Assets.
```

**Step 2: Run repository validation**

Run:

```bash
pnpm check:agent
```

Expected: PASS; full output is stored under `.agent-logs/`.

**Step 3: Verify `/rules` in a browser**

Use the `webapp-testing` skill. Confirm at desktop and narrow viewport widths:

- the visual ordering matches the approved mockup;
- all card faces remain readable and unsquashed;
- the narrow figure scrolls horizontally inside its own viewport;
- the rulebook page itself has no horizontal overflow;
- no construction labels or arrows appear.

**Step 4: Commit the changelog**

```bash
git add CHANGELOG.md
git commit -m "docs: note rules setup tableau"
```
