# Rulebook Card Clarifications Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Clarify the public rules and improve `/rules` with compact, reusable card illustrations and consistent heading highlights.

**Architecture:** Keep all rules prose in `docs/mighty-decks-rulebook.md`. Extend the existing additive illustration registry in `RulesIllustrations.tsx`, compose existing card/token components, and add a small rulebook-local float wrapper. Make heading-highlight defaults semantic in the shared `Heading` primitive, so Markdown headings inherit the styleguide mapping.

**Tech Stack:** React 18, TypeScript, react-markdown, Tailwind, CSS Modules, Node test runner, existing Mighty Decks card components.

---

### Task 1: Cover semantic heading highlights with a regression test

**Files:**
- Modify: `apps/web/src/components/common/Heading.test.tsx`
- Modify: `apps/web/src/components/common/Heading.tsx`

**Step 1: Write the failing test**

Assert the component's default `Highlight` color is gold for H1, fire for H2, and cloth for H3.

**Step 2: Run the focused test to verify it fails**

Run: `pnpm -C apps/web test -- Heading.test.tsx`

Expected: FAIL because the component currently leaves the highlight color at its generic default.

**Step 3: Write the minimal implementation**

Add a typed `HeadingLevel -> HighlightProps["color"]` map and merge it as the default before caller-provided `highlightProps`, so explicit colors still win.

**Step 4: Run the focused test to verify it passes**

Run: `pnpm -C apps/web test -- Heading.test.tsx`

Expected: PASS.

**Step 5: Commit**

```powershell
git add apps/web/src/components/common/Heading.tsx apps/web/src/components/common/Heading.test.tsx
git commit -m "feat(web): set heading highlights by level"
```

### Task 2: Make the canonical rulebook terminology and Defense timing explicit

**Files:**
- Modify: `docs/mighty-decks-rulebook.md`
- Test: `apps/web/src/lib/rulebookDocument.test.ts`

**Step 1: Write the failing test**

Assert the parsed document includes the finalized Defense timing sentence and the no-counterattack example, while no longer including the Open Timing Note text or the `ST` abbreviation.

**Step 2: Run the focused test to verify it fails**

Run: `pnpm -C apps/web test -- rulebookDocument.test.ts`

Expected: FAIL because the note and abbreviated terminology remain.

**Step 3: Write the minimal prose update**

Replace `ST` with `Storyteller`; rename all remaining Dying card/component references to Taken Out; remove the unresolved timing note; state one Outcome card on a player's turn and unlimited legal Defenses during a round; and add the named punch-first Defense example that requires an explicit Stunt.

**Step 4: Run the focused test to verify it passes**

Run: `pnpm -C apps/web test -- rulebookDocument.test.ts`

Expected: PASS.

**Step 5: Commit**

```powershell
git add docs/mighty-decks-rulebook.md apps/web/src/lib/rulebookDocument.test.ts
git commit -m "docs: clarify defense timing and terminology"
```

### Task 3: Add right-floated existing card illustrations

**Files:**
- Modify: `apps/web/src/components/rules/RulesIllustrations.tsx`
- Modify: `apps/web/src/components/rules/RulesRulebookContent.tsx`
- Modify: `apps/web/src/components/rules/RulesRulebookContent.module.css`
- Test: `apps/web/src/components/rules/RulesRulebookContent.test.tsx`

**Step 1: Write the failing test**

Assert the Distress, Stunts, Assets, and Consumables subsections receive registered card-component enhancements, and that each uses the shared float wrapper.

**Step 2: Run the focused test to verify it fails**

Run: `pnpm -C apps/web test -- RulesRulebookContent.test.tsx`

Expected: FAIL because no subsection illustrations are registered.

**Step 3: Write the minimal implementation**

Add a `RulebookCardFloat` composition that wraps `ResolvedCard` instances for representative existing Effect, Stunt, Asset, and Consumable cards. Render registered enhancements immediately after their Markdown subsection. Use CSS float-right with a bounded desktop width and clear/normal-flow behavior below the mobile breakpoint.

**Step 4: Run the focused test to verify it passes**

Run: `pnpm -C apps/web test -- RulesRulebookContent.test.tsx`

Expected: PASS.

**Step 5: Commit**

```powershell
git add apps/web/src/components/rules/RulesIllustrations.tsx apps/web/src/components/rules/RulesRulebookContent.tsx apps/web/src/components/rules/RulesRulebookContent.module.css apps/web/src/components/rules/RulesRulebookContent.test.tsx
git commit -m "feat(web): add rulebook card illustrations"
```

### Task 4: Correct Toughness, Counters, and Location visual details

**Files:**
- Modify: `apps/web/src/components/rules/RulesIllustrations.tsx`
- Modify: `apps/web/src/components/rules/DieMarker.tsx`
- Test: `apps/web/src/components/rules/RulesIllustrations.test.tsx`

**Step 1: Write the failing test**

Assert that Taken Out uses a crossed-out removed d4 marker instead of a `0` marker, Counter comparison cards use equal-width classes, and the location illustration supplies distinct centered player/enemy token content.

**Step 2: Run the focused test to verify it fails**

Run: `pnpm -C apps/web test -- RulesIllustrations.test.tsx`

Expected: FAIL because the visual currently renders d4 zero, unequal card widths, and tokens outside Location cards.

**Step 3: Write the minimal implementation**

Extend `DieMarker` with an accessible removed state that draws the d4 silhouette and a red X. Reuse equal card widths in Counter tracking. Supply the player and enemy tokens as centered Location-card content, using visually distinct symbols and labels.

**Step 4: Run the focused test to verify it passes**

Run: `pnpm -C apps/web test -- RulesIllustrations.test.tsx`

Expected: PASS.

**Step 5: Commit**

```powershell
git add apps/web/src/components/rules/RulesIllustrations.tsx apps/web/src/components/rules/DieMarker.tsx apps/web/src/components/rules/RulesIllustrations.test.tsx
git commit -m "fix(web): clarify rulebook tracking visuals"
```

### Task 5: Remove excess Rules-panel padding and verify the finished page

**Files:**
- Modify: the Rules-page panel owner found via `rg -n "RulesRulebookContent|Mighty Decks rulebook" apps/web/src`
- Modify: `CHANGELOG.md`
- Test: existing Rules route tests

**Step 1: Write the failing test**

If the panel component exposes a class-name assertion, add a focused source test that verifies the Rules-specific content class removes vertical padding without changing shared Panel defaults.

**Step 2: Run the focused test to verify it fails**

Run the relevant web test chosen in Step 1.

Expected: FAIL because the page retains its oversized top/bottom panel padding.

**Step 3: Write the minimal implementation**

Override only the `/rules` panel's vertical content padding. Add concise Unreleased changelog entries for public rules clarifications and instructional visual improvements.

**Step 4: Verify**

Run: `pnpm check:agent`

Run the focused web tests from Tasks 1–5. Start the web app and inspect `/rules` and `/styleguide/typography` at desktop and phone widths using `@webapp-testing`; verify wrapped text, card readability, heading colors, no zero d4, and no console errors.

**Step 5: Commit**

```powershell
git add CHANGELOG.md <rules-page-files> <tests>
git commit -m "fix(web): tighten rulebook layout"
```
