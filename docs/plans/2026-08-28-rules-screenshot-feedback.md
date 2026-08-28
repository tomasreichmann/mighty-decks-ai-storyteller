# Rules Screenshot Feedback Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the remaining `/rules` screenshot feedback by removing production-only copy, correcting misleading instructional flows, replacing decorative cards with legible teaching diagrams, and improving long-form readability without changing Mighty Decks mechanics.

**Architecture:** Keep `docs/mighty-decks-rulebook.md` authoritative for public prose and keep all visuals additive through the existing section/subsection illustration registries. Extend the rulebook-local diagram catalog with one compact “diagram mode” card and CSS/SVG flow compositions; continue using full shared cards only where physical card construction matters. Scope typography and halftone changes to `/rules`, with no `spec`, server, route, or generated-art changes.

**Tech Stack:** React 18, TypeScript, `react-markdown`, Tailwind, CSS Modules, existing Mighty Decks card/common components, Node `tsx --test`, and Playwright through the repo's `webapp-testing` workflow.

---

## Scope and design decisions

- Treat the supplied screenshot comments as the approved design brief. The existing orange H2, blue H3/example, parchment-card, pale-page, and blue Rules-callout language stays intact.
- Implement all P0, P1, and P2 comments in this plan. Prioritize source cleanup and the Catastrophe/Fumble geometry before presentation polish.
- Do not change gameplay wording except to remove editorial labels/briefs and renumber Quick Reference from 29 to 28.
- Do not add atmospheric generated art. Reuse the existing Gate, Courtyard, Tower, card, token, and actor assets.
- Use compact diagram cards only when the full card's small rules copy would be unreadable. Preserve full cards for the Effect equation and physical Asset/Modifier composition.
- Use the minimal long-form typography option: retain the current fonts, but increase `/rules` body line-height and paragraph rhythm. Do not change the shared `Text` typography globally.
- Reduce the global edge halftone only while `/rules` is mounted; do not alter the site-wide default.
- Follow `@mighty-decks-rules` for rules fidelity, `@mighty-decks-ui-patterns` for composition, `@webapp-testing` for responsive verification, and `@superpowers:verification-before-completion` before claiming completion.

### Task 1: Remove production notes and renumber Quick Reference

**Files:**
- Modify: `docs/mighty-decks-rulebook.md`
- Modify: `apps/web/src/lib/rulebookDocument.ts`
- Modify: `apps/web/src/lib/rulebookDocument.test.ts`
- Modify: `docs/11-mighty-decks-rules.md`

**Step 1: Add failing public-source regression assertions**

Extend `rulebookDocument.test.ts` with one test that checks the canonical Markdown and parsed public document, not only the renderer:

```ts
test("publishes only reader-facing rulebook copy and numbers Quick Reference as 28", () => {
  const document = parseRulebookDocument(canonicalRulebook);
  const renderedSource = document.sections.map((section) => section.body).join("\n");

  assert.doesNotMatch(canonicalRulebook, /Layout callout/);
  assert.doesNotMatch(canonicalRulebook, /Show a base Asset card/);
  assert.doesNotMatch(canonicalRulebook, /Show two cards side by side/);
  assert.doesNotMatch(canonicalRulebook, /Recommended Instructional Illustrations/);
  assert.doesNotMatch(renderedSource, /Illustration\s+[—-]/i);
  assert.match(canonicalRulebook, /^## 28\. Quick Reference$/m);
  assert.doesNotMatch(canonicalRulebook, /^## 29\./m);
  assert.equal(document.sections.find((section) => section.id === "quick-reference")?.title, "28. Quick Reference");
});
```

Update the existing inventory assertion so it no longer treats section 28 as excluded production content.

**Step 2: Run the focused parser test and verify it fails**

Run:

```powershell
pnpm -C apps/web exec tsx --test src/lib/rulebookDocument.test.ts
```

Expected: FAIL on the leaked labels/briefs and the `29. Quick Reference` heading.

**Step 3: Clean the canonical Markdown**

In `docs/mighty-decks-rulebook.md`:

- replace the Effect quote with only `> **Outcome determines the amount of Effect. Fiction determines what that Effect means.**`;
- delete every inline production-only `Illustration` brief, including the Stacking Modifiers, Catastrophe, Toughness, Hidden Actors, Zones/Range, and Counter briefs;
- delete the complete `## 28. Recommended Instructional Illustrations` production section;
- rename `## 29. Quick Reference` to `## 28. Quick Reference`;
- leave all actual rules prose and examples unchanged.

The already-implemented visual plans preserve the historical illustration intent, so do not move the deleted briefs to another public document.

**Step 4: Update the parser inventory**

Change the Quick Reference `sourceHeading` in `rulebookSectionDefinitions` to `## 28. Quick Reference`. Keep `normalizeBody` as a defensive boundary, but make it strip an entire contiguous `> **Illustration...` block rather than only its first line, so a future editorial brief cannot leak its continuation lines.

Do not add section 28 as a second definition; after renumbering, Quick Reference is the only section 28.

**Step 5: Update the route documentation**

Revise `docs/11-mighty-decks-rules.md` to say the canonical Markdown itself contains reader-facing copy only, Quick Reference is section 28, and the parser also rejects/strips production illustration briefs as defense in depth.

**Step 6: Re-run the parser test**

Expected: PASS with all public sections in source order and no production strings in either source or parsed output.

**Step 7: Commit**

```powershell
git add docs/mighty-decks-rulebook.md docs/11-mighty-decks-rules.md apps/web/src/lib/rulebookDocument.ts apps/web/src/lib/rulebookDocument.test.ts
git commit -m "fix(web): remove rulebook production notes"
```

### Task 2: Add compact diagram cards and a recognizable d4 marker

**Files:**
- Create: `apps/web/src/components/rules/RulebookDiagramCard.tsx`
- Create: `apps/web/src/components/rules/RulebookDiagramCard.test.tsx`
- Create: `apps/web/src/components/rules/DieMarker.module.css`
- Modify: `apps/web/src/components/rules/DieMarker.tsx`
- Modify: `apps/web/src/components/rules/DieMarker.test.ts`

**Step 1: Write the failing compact-card contract test**

Create a render-level test using `renderToStaticMarkup`. Require a compact card to expose the real card title, art, and a caller-supplied large mechanic badge, while omitting the full rules paragraph:

```tsx
const html = renderToStaticMarkup(
  <RulebookDiagramCard
    type="OutcomeCard"
    slug="success"
    badge="+2 Effect"
  />,
);

assert.match(html, /Success/);
assert.match(html, /\+2 Effect/);
assert.match(html, /img/);
assert.match(html, /aria-label=/);
```

Also cover Effect cards and an explicit `title`/`imageUrl` override for diagram-only concepts such as `Enemy Boost`.

**Step 2: Extend the failing d4 contract test**

In `DieMarker.test.ts`, require:

- a dedicated CSS module rather than a flat clipped warning triangle;
- distinct face, left-edge, and right-edge elements/classes;
- a centered value;
- a subtle shadow;
- `showTypeLabel` (or equivalent) for the first explanatory use;
- existing `aria-label`, removed-marker, and non-interactive behavior.

Do not assert exact pixel values; the browser review owns visual tuning.

**Step 3: Run the focused tests and verify they fail**

```powershell
pnpm -C apps/web exec tsx --test src/components/rules/RulebookDiagramCard.test.tsx src/components/rules/DieMarker.test.ts
```

Expected: FAIL because the compact component and physical d4 styling do not exist.

**Step 4: Implement `RulebookDiagramCard`**

Build a rulebook-local, non-interactive figure primitive that:

- resolves Outcome, Effect, and Stunt title/art through `resolveGameCard`;
- accepts explicit title/art overrides for Actors, Assets, and abstract consequences;
- renders only art, title, type cue, and one large badge such as `+2 Effect`, `+1`, `3/4`, or `MISS`;
- uses a compact fixed instructional size that can grow on mobile but never exposes unreadable full rules copy;
- has a complete `aria-label` and decorative image alt handling;
- returns a small accessible fallback if resolution fails instead of throwing.

Do not add a new shared card system or change `GameCardView`.

**Step 5: Rebuild the d4 as a shaded tetrahedron**

Move the marker geometry into `DieMarker.module.css`. Use a triangular face with two visible internal/edge lines, a mild light-to-shadow face gradient, and a card-overlap shadow. Preserve the crossed-out removed state. Add an optional tiny `d4` label used only in the first explanatory Counter/Toughness figure.

**Step 6: Re-run the focused tests**

Expected: PASS.

**Step 7: Commit**

```powershell
git add apps/web/src/components/rules/RulebookDiagramCard.tsx apps/web/src/components/rules/RulebookDiagramCard.test.tsx apps/web/src/components/rules/DieMarker.tsx apps/web/src/components/rules/DieMarker.module.css apps/web/src/components/rules/DieMarker.test.ts
git commit -m "feat(web): add legible rulebook diagram cards"
```

### Task 3: Correct the P0 Fumble and Catastrophe flows

**Files:**
- Modify: `apps/web/src/components/rules/RulesIllustrations.tsx`
- Modify: `apps/web/src/components/rules/RulesRulebookContent.module.css`
- Modify: `apps/web/src/components/rules/RulesIllustrations.test.tsx`
- Modify: `apps/web/src/routes/RulesIndexPage.test.tsx`

**Step 1: Write failing semantic-flow tests**

Add focused assertions for the exact readable orders:

```text
Action resolves -> Draw -> Fumble + Fumble + Fumble -> CATASTROPHE
CATASTROPHE -> Injury | Bow Complication | Enemy Boost
```

For Fumble, require one centered Fumble source, two branch labels (`MISS` and `HIT, BUT...`), and two separate hit-but consequence groups:

```text
Bandit + Injury
Bow + Complication
```

Reject the old single `Injury / Asset Complication / Enemy Boost` box. Keep tests semantic; do not lock exact class strings or connector coordinates.

**Step 2: Run the focused illustration tests and verify they fail**

```powershell
pnpm -C apps/web exec tsx --test src/components/rules/RulesIllustrations.test.tsx src/routes/RulesIndexPage.test.tsx
```

Expected: FAIL because both diagrams are currently linear/disconnected and Catastrophe lacks an explicit state.

**Step 3: Rebuild `CatastropheFlow` as one sequence plus one consequence fork**

- Use a numbered/labelled `Action resolves` step, then `Draw replacement`, then a grouped three-Fumble hand, then an explicit high-contrast `CATASTROPHE` node.
- Place the consequence fork after Catastrophe, not under the initial Success.
- Render three equal compact consequence cards: `Injury`, `Bow Complication`, and `Enemy Boost`.
- Use CSS/SVG connectors marked `aria-hidden`; preserve an ordered textual equivalent for assistive technology.
- On mobile, stack the main sequence vertically and place the three consequences below Catastrophe without any arrow pointing to empty space.

**Step 4: Rebuild `FumbleBranches` as a centered Y-fork**

- Center the full Fumble card above the split.
- Put `MISS` and `HIT, BUT...` in equal columns below it.
- Under `MISS`, show the wide arrow/no Effect result.
- Under `HIT, BUT...`, use two subgroups: a Bandit diagram card paired with Injury, and a Bow card paired with Complication.
- Keep the existing canonical prose immediately above the diagram; do not restate or shorten it in TypeScript.
- On mobile, preserve source-first then two-branch reading order and replace decorative fork lines with clear vertical connectors.

**Step 5: Re-run the focused tests**

Expected: PASS.

**Step 6: Commit**

```powershell
git add apps/web/src/components/rules/RulesIllustrations.tsx apps/web/src/components/rules/RulesRulebookContent.module.css apps/web/src/components/rules/RulesIllustrations.test.tsx apps/web/src/routes/RulesIndexPage.test.tsx
git commit -m "fix(web): correct rulebook failure flows"
```

### Task 4: Replace Distress decoration and clean up Toughness states

**Files:**
- Modify: `apps/web/src/components/rules/RulesIllustrations.tsx`
- Modify: `apps/web/src/components/rules/RulesRulebookContent.module.css`
- Modify: `apps/web/src/components/rules/RulesRulebookContent.test.tsx`
- Modify: `apps/web/src/components/rules/RulesIllustrations.test.tsx`

**Step 1: Write failing threshold and state assertions**

Replace the test expectation for `DistressCardIllustration` with `StatusThresholds` registered at `7-2-distress`. Require these accessible sequences:

```text
Distress: 0 -> 1 -> 2 -> 3 PANICKED -> 4 HOPELESS
Injury: 0 -> 1 -> 2 -> 3 -> 4 TAKEN OUT
```

For Toughness, require three state captions as separate items and the sequence:

```text
3 — Starting -> 1 — After 2 Injury -> Taken Out — after 1 Distress
```

Reject visible `0 Toughness` copy in the Taken Out state.

**Step 2: Run focused tests and verify they fail**

Run the Task 3 test command plus `RulesRulebookContent.test.tsx`.

Expected: FAIL because Distress is still a floated full card and Toughness captions are unbounded text rows.

**Step 3: Implement `StatusThresholds`**

- Remove `DistressCardIllustration` and its float registration.
- Render two horizontal threshold strips using repeated compact Effect thumbnails, numeric ticks, arrows, and large terminal state labels.
- Give `PANICKED`, `HOPELESS`, and `TAKEN OUT` stronger contrast than intermediate counts.
- Keep the strips within one semantic figure and expose both sequences as ordered lists.
- At the phone breakpoint, allow each strip to scroll internally or wrap into a labelled two-row sequence; never create page-level horizontal overflow.

**Step 4: Rebuild `RemainingToughness`**

- Use a three-column grid with the same fixed card/caption width for every state.
- Put arrows between state columns on desktop and vertical arrows between rows on mobile.
- Keep the d4 at 3 and 1; use only the crossed-out removed d4 for Taken Out.
- Change the final visible caption to `Taken Out — after 1 Distress`; do not print `0 Toughness` when the removed marker already explains it.
- Enable the tiny `d4` convention label on the first state only.

**Step 5: Re-run focused tests**

Expected: PASS.

**Step 6: Commit**

```powershell
git add apps/web/src/components/rules/RulesIllustrations.tsx apps/web/src/components/rules/RulesRulebookContent.module.css apps/web/src/components/rules/RulesRulebookContent.test.tsx apps/web/src/components/rules/RulesIllustrations.test.tsx
git commit -m "feat(web): teach status thresholds visually"
```

### Task 5: Show a complete physical table and a distinct Asset composition example

**Files:**
- Modify: `apps/web/src/components/rules/RulesIllustrations.tsx`
- Modify: `apps/web/src/components/rules/RulesRulebookContent.module.css`
- Modify: `apps/web/src/routes/RulesIndexPage.test.tsx`

**Step 1: Write failing content contracts**

For `CompleteTableSetup`, require all three player names (`Mira`, `Aldren`, `Tomas`), all three central Locations (`Castle Gate`, `Courtyard`, `Tower`), and visible labels/aria text for Outcome hand, Stunt, Asset, Effect, Actor, Counter, and d4.

For section 9, replace `ComposedAssetEquation` assertions with `PhysicalAssetComposition`. Require `Throwing Knife`, `Returning`, and a Stunt, and reject `5 Effect`, `base_tools`, and the duplicated Safecracker equation inside that figure.

**Step 2: Run the route test and verify it fails**

```powershell
pnpm -C apps/web exec tsx --test src/routes/RulesIndexPage.test.tsx
```

Expected: FAIL because the current table has one generic lane and section 9 repeats section 6.

**Step 3: Rebuild `CompleteTableSetup` as a flat top-down composition**

- Put Gate, Courtyard, and Tower across the center as the shared scene.
- Arrange Mira, Aldren, and Tomas lanes around the scene using one responsive CSS grid, not nested Panels.
- Give every lane a compact Outcome hand, Stunt, Asset, and Effect indicator.
- Place Guard/Wolf under Mira and Bandit under Aldren so Actor ownership also reinforces initiative.
- Place one Counter with a physical d4 in the shared center.
- Use diagram-mode cards for small instructional items and full cards only where card construction must be recognizable.
- On narrow screens, order content as shared scene, Mira lane, Aldren lane, Tomas lane; retain labels so the top-down relationship survives stacking.

**Step 4: Replace section 9 with physical Asset composition**

- Rename `ComposedAssetEquation` to `PhysicalAssetComposition` and keep it registered only at `characters-expertise-stunts-assets`.
- Render a full custom `AssetCard` with noun `Throwing Knife`, modifier `Returning`, the existing dagger art, and concise example descriptions. The layered card should visually read as base card plus modifier/sleeve.
- Place one relevant Stunt card beside it (use the existing `sharpshooter` card unless the canonical catalog gains a more exact thrown-weapon Stunt before implementation).
- Do not include an Outcome card, arithmetic symbols, or an Effect total; section 6 remains the only equation.

**Step 5: Re-run the route test**

Expected: PASS.

**Step 6: Commit**

```powershell
git add apps/web/src/components/rules/RulesIllustrations.tsx apps/web/src/components/rules/RulesRulebookContent.module.css apps/web/src/routes/RulesIndexPage.test.tsx
git commit -m "feat(web): show complete rulebook table setup"
```

### Task 6: Add real range overlays and explicit initiative progression

**Files:**
- Modify: `apps/web/src/components/rules/RulesIllustrations.tsx`
- Modify: `apps/web/src/components/rules/RulesRulebookContent.module.css`
- Modify: `apps/web/src/components/rules/RulesIllustrations.test.tsx`
- Modify: `apps/web/src/routes/RulesIndexPage.test.tsx`

**Step 1: Write failing semantic assertions**

For Zones and Range, require overlay labels for Sword, Throw, and Bow anchored from Mira, plus the note `Sniper: anywhere in sight`. Reject a legend-only implementation.

For initiative, require one visible sequence matching:

```text
Mira ↓ Guard ↓ Wolf → Aldren ↓ Bandit → Tomas
```

Require Wolf to use an animal/beast base layer rather than `guard_blue`.

**Step 2: Run focused tests and verify they fail**

Use the Task 3 test command.

Expected: FAIL because range is currently a detached legend, initiative has no visible connectors, and Wolf reuses Guard art.

**Step 3: Overlay reach on the Location row**

- Keep the existing Castle Gate, Courtyard, and Tower art.
- Add a responsive SVG overlay whose origin is Mira at Gate: a Sword ring around Gate, a Throw arrow ending at Courtyard, and a Bow arrow ending at Tower.
- Put short labels directly on or immediately beside each overlay so the diagram answers reach without the caption.
- Keep `Sniper: anywhere in sight` as the only small note below the locations.
- Supply an ordered text equivalent for assistive technology and a vertical SVG/path arrangement for phone layouts.

**Step 4: Make initiative progression visible**

- Keep player-to-Actor grouping, but add arrows within each slot and between player slots.
- Render Guard with the existing guard configuration, Wolf with an existing animal/beast base layer and a compatible tactical role, and Bandit with the existing humanoid card.
- Ensure the visible DOM order and the screen-reader ordered list both match the canonical sequence.

**Step 5: Re-run focused tests**

Expected: PASS.

**Step 6: Commit**

```powershell
git add apps/web/src/components/rules/RulesIllustrations.tsx apps/web/src/components/rules/RulesRulebookContent.module.css apps/web/src/components/rules/RulesIllustrations.test.tsx apps/web/src/routes/RulesIndexPage.test.tsx
git commit -m "fix(web): clarify range and initiative diagrams"
```

### Task 7: Make the Core Action Loop one numbered card movement sequence

**Files:**
- Modify: `apps/web/src/components/rules/RulesIllustrations.tsx`
- Modify: `apps/web/src/components/rules/RulesRulebookContent.module.css`
- Modify: `apps/web/src/routes/RulesIndexPage.test.tsx`

**Step 1: Write failing action-loop assertions**

Require visible step numbers `1` through `5`, a three-card starting hand, a selected Success in a separate played/discard position, a deck stack, and a replacement card entering the refreshed hand. Require the existing ordered-list text equivalent.

Do not test transform coordinates; those belong to visual verification.

**Step 2: Run the route test and verify it fails**

Run the Task 5 test command.

Expected: FAIL because the current figure is a hand plus an unrelated row of labels.

**Step 3: Rebuild `CoreActionLoop`**

- Number the five steps: choose, play/resolve, discard, draw replacement, check Catastrophe.
- Show the Success leaving the initial hand into a played position, then a discard position.
- Add a small layered deck stack at `Draw replacement` and show a new card moving toward the refreshed hand.
- Use full compact Outcome cards where physical movement matters and diagram cards for labels/badges.
- Use one connected desktop flow. At the phone breakpoint, switch to a vertical timeline with visible connectors; do not hide connectors without replacement.
- Respect `prefers-reduced-motion`: the figure may use static transforms only; do not add looping animation.

**Step 4: Re-run the route test**

Expected: PASS.

**Step 5: Commit**

```powershell
git add apps/web/src/components/rules/RulesIllustrations.tsx apps/web/src/components/rules/RulesRulebookContent.module.css apps/web/src/routes/RulesIndexPage.test.tsx
git commit -m "fix(web): connect the rulebook action loop"
```

### Task 8: Calm route decoration and improve long-form reading rhythm

**Files:**
- Modify: `apps/web/src/routes/RulesIndexPage.tsx`
- Modify: `apps/web/src/components/rules/RulesRulebookContent.tsx`
- Modify: `apps/web/src/components/rules/RulesRulebookContent.module.css`
- Modify: `apps/web/src/styles.css`
- Modify: `apps/web/src/routes/RulesIndexPage.test.tsx`

**Step 1: Add route-scope assertions**

Add a stable `data-rules-page` marker assertion and verify `RulesRulebookContent` applies a route-local body-text class. Do not add brittle assertions for exact opacity, line-height, or DOM spacing.

**Step 2: Run the route test and verify it fails**

Run the Task 5 test command.

Expected: FAIL because the route has no styling marker and body prose only uses the shared global variant.

**Step 3: Apply route-local long-form typography**

- Pass `className={styles.bodyText}` to Markdown body `Text` nodes.
- Increase body line-height modestly (target roughly `1.75–1.8`) and add a little more paragraph separation inside `.prose`.
- Match ordered/unordered list line-height to body copy.
- Keep headings, examples, card text, labels, and callouts on their existing expressive fonts and sizes.
- Do not modify `Text.tsx` or the global Tailwind font families.

**Step 4: Reduce edge halftone only on `/rules`**

- Add `data-rules-page` to the `RulesIndexPage` root.
- In `styles.css`, use the mounted marker to lower the edge mask/dot opacity by about 40% for the fixed `.halftone-vignette` only on this route.
- Prefer a CSS-scoped selector such as `body:has([data-rules-page])`; verify support in the project's Chromium browser target. If browser support is unacceptable, use a tiny route lifecycle helper that adds/removes a body class with cleanup.
- Do not change the default `.halftone-vignette` values used by other routes.

**Step 5: Re-run the route test**

Expected: PASS.

**Step 6: Commit**

```powershell
git add apps/web/src/routes/RulesIndexPage.tsx apps/web/src/routes/RulesIndexPage.test.tsx apps/web/src/components/rules/RulesRulebookContent.tsx apps/web/src/components/rules/RulesRulebookContent.module.css apps/web/src/styles.css
git commit -m "fix(web): improve rulebook reading rhythm"
```

### Task 9: Document and verify the completed `/rules` pass

**Files:**
- Modify: `docs/11-mighty-decks-rules.md`
- Modify: `CHANGELOG.md`
- Test only: existing focused web tests and browser verification

**Step 1: Finish the route documentation**

In `docs/11-mighty-decks-rules.md`, document:

- compact diagram cards are allowed for instructional figures where full card rules would be unreadable;
- full shared cards remain the source for physical card-composition examples;
- the visual set now also includes status thresholds, complete table setup, physical Asset composition, Catastrophe consequences, and overlaid range reach;
- rulebook typography/halftone adjustments are route-scoped.

**Step 2: Add concise changelog entries**

Under `## [Unreleased]`:

```md
### Changed

- Web: rebuild `/rules` instructional figures for status thresholds, table setup, card composition, range, initiative, the action loop, Fumbles, and Catastrophes, with compact diagram cards where full card text would be unreadable.
- Web: improve `/rules` long-form reading rhythm and reduce its edge halftone without changing shared site typography.

### Fixed

- Docs: remove production illustration notes from the public rulebook and renumber Quick Reference to section 28.
```

Merge these with existing related bullets if that reads more cleanly; do not add duplicates.

**Step 3: Run all focused tests**

```powershell
pnpm -C apps/web exec tsx --test src/lib/rulebookDocument.test.ts src/components/rules/RulebookDiagramCard.test.tsx src/components/rules/DieMarker.test.ts src/components/rules/RulesIllustrations.test.tsx src/components/rules/RulesRulebookContent.test.tsx src/routes/RulesIndexPage.test.tsx src/routes/RulesRoutes.test.ts
```

Expected: all tests PASS.

**Step 4: Run token-optimized repository validation**

```powershell
pnpm check:agent
pnpm build:agent
```

Expected: both commands exit 0. If a wrapper reports a failure, inspect and summarize its full log under `.agent-logs/`; do not immediately dump an uncapped build into context.

**Step 5: Inspect `/rules` in a real browser**

Read and follow `@webapp-testing`. Check approximately 1440px, 768px, and 390px widths. Verify:

- none of the three reported production strings—or any other Illustration brief—appears;
- the TOC and page heading say `28. Quick Reference`, with working anchors;
- Catastrophe reads left-to-right/top-to-bottom as action, draw, three Fumbles, Catastrophe, then three consequences;
- Fumble is visibly the parent of two equal branches and Injury is grouped with Bandit, not Mira;
- Distress/Injury threshold strips are readable at a glance and do not overflow the page;
- Toughness captions stay under their own fixed-width cards and Taken Out has no visible zero value;
- the complete table shows all three player lanes around Gate/Courtyard/Tower, with Counter and d4 in the center;
- section 9 shows Throwing Knife + Returning + Stunt and does not repeat the Effect equation;
- Sword/Throw/Bow reach is drawn over the locations and the mobile version stays understandable;
- visible initiative arrows match `Mira -> Guard -> Wolf -> Aldren -> Bandit -> Tomas`, and Wolf has creature art;
- d4s read as physical tetrahedra, with one tiny explanatory `d4` label;
- the selected Success visibly leaves the action-loop hand and a replacement comes from a deck stack;
- compact diagram cards have readable titles/badges while physical-composition examples retain full cards;
- body prose is easier to scan, the heading hierarchy is unchanged, and the halftone is quieter only on `/rules`;
- no horizontal page overflow, broken images, missing-card fallbacks, console errors, or accessibility-name regressions appear.

Capture temporary screenshots for comparison, but do not commit them unless requested.

**Step 6: Review the scoped diff**

```powershell
git status --short
git diff --stat
git diff --check
```

Expected: only files listed in this plan are changed aside from unrelated pre-existing user work; `git diff --check` reports no whitespace errors.

**Step 7: Final commit if checkpoints were deferred**

```powershell
git add docs/mighty-decks-rulebook.md docs/11-mighty-decks-rules.md CHANGELOG.md apps/web/src/lib/rulebookDocument.ts apps/web/src/lib/rulebookDocument.test.ts apps/web/src/components/rules apps/web/src/routes/RulesIndexPage.tsx apps/web/src/routes/RulesIndexPage.test.tsx apps/web/src/styles.css
git commit -m "feat(web): finish rulebook comprehension pass"
```
