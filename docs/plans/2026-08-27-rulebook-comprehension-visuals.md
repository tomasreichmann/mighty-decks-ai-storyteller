# Rulebook Comprehension Visuals Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Preserve every canonical rule example on `/rules` and add the five highest-value component-based instructional visuals: Core Action Loop, Fumble branches, Actor initiative, Toughness/Counter dice, and medieval Zones and Range.

**Architecture:** Keep `docs/mighty-decks-rulebook.md` authoritative and make all React visuals additive. `RulesRulebookContent` always renders each Markdown block, then looks up an optional section- or subsection-level figure. Rulebook-local visual primitives compose the existing cards, tokens, and location components without changing shared contracts or server behavior.

**Tech Stack:** React 18, TypeScript, `react-markdown`, Tailwind, CSS Modules, existing Mighty Decks card/common components, Node `tsx --test`, image generation for three static location illustrations, and Playwright via the repo's `webapp-testing` workflow.

---

## Scope guardrails

- Implement only the approved comprehension-first slice documented in `docs/plans/2026-08-27-rulebook-comprehension-visuals-design.md`.
- Do not change global fonts, H2/H3 styling, TOC numbering, rulebook numbering, active-section tracking, or unrelated examples.
- Do not add or change `spec` contracts, server routes, or adventure artifact APIs.
- Store the three new location images under `apps/web/public/rules/locations/`; do not modify `apps/server/output/adventure-artifacts/index.json` for static web assets.
- Follow `@mighty-decks-rules` for rules fidelity, `@mighty-decks-ui-patterns` for component composition, `@imagegen` for the three location images, and `@superpowers:verification-before-completion` before claiming completion.

### Task 1: Prevent structured examples from replacing canonical Markdown

**Files:**
- Modify: `apps/web/src/lib/rulebookDocument.test.ts`
- Modify: `apps/web/src/routes/RulesIndexPage.test.tsx`
- Modify: `apps/web/src/components/rules/RulesRulebookContent.tsx`
- Delete: `apps/web/src/components/rules/RulesActionExample.tsx`

**Step 1: Add the content-loss regression test**

In `rulebookDocument.test.ts`, locate the `example-two-valid-fumbles` subsection's parent section and assert that its canonical body still includes all three essential outcomes:

```ts
test("preserves both canonical Fumble resolutions in public prose", () => {
  const document = parseRulebookDocument(canonicalRulebook);
  const outcomeCards = document.sections.find(
    (section) => section.id === "outcome-cards",
  );

  assert.ok(outcomeCards);
  assert.match(outcomeCards.body, /The arrow flies wide/);
  assert.match(outcomeCards.body, /normal 1 Injury/);
  assert.match(outcomeCards.body, /bowstring snaps/);
  assert.match(outcomeCards.body, /cannot be fired again until Mira repairs it/);
});
```

In `RulesIndexPage.test.tsx`, replace the existing `Message`-example assertions with renderer invariants:

```ts
test("canonical Markdown blocks are never replaced by visual enhancements", () => {
  const content = readFileSync(
    new URL("../components/rules/RulesRulebookContent.tsx", import.meta.url),
    "utf8",
  );

  assert.match(content, /markdown=\{block\}/);
  assert.doesNotMatch(content, /ruleExampleById/);
  assert.doesNotMatch(content, /if \(example\)/);
});
```

**Step 2: Run the focused tests and verify the renderer test fails**

```powershell
pnpm -C apps/web exec tsx --test src/lib/rulebookDocument.test.ts src/routes/RulesIndexPage.test.tsx
```

Expected: the new parser assertions pass against the canonical document, while the renderer invariant fails because `RulesRulebookContent` still substitutes `RulesActionExample`.

**Step 3: Make Markdown rendering unconditional**

In `RulesRulebookContent.tsx`:

- remove the `RulesActionExample` and `ruleExampleById` imports;
- remove the `if (example) return ...` branch;
- always return `RulebookMarkdown` for each subsection block;
- retain the parsed subsection ID on the Markdown heading so existing fragments remain stable.

The loop should have this baseline shape before adding enhancements:

```tsx
return (
  <RulebookMarkdown
    key={id ?? `${section.id}-${index}`}
    markdown={block}
    subsectionId={id}
  />
);
```

Add the `index` parameter to the `.map` callback so pre-heading prose blocks have stable unique keys. Delete `RulesActionExample.tsx`; do not preserve its duplicated example data elsewhere.

**Step 4: Re-run the focused tests**

Run the command from Step 2.

Expected: PASS, with the canonical Fumble alternatives protected and no replacement path remaining.

**Step 5: Review the focused diff and checkpoint**

```powershell
git diff -- apps/web/src/lib/rulebookDocument.test.ts apps/web/src/routes/RulesIndexPage.test.tsx apps/web/src/components/rules/RulesRulebookContent.tsx apps/web/src/components/rules/RulesActionExample.tsx
```

Optional checkpoint commit:

```powershell
git add apps/web/src/lib/rulebookDocument.test.ts apps/web/src/routes/RulesIndexPage.test.tsx apps/web/src/components/rules/RulesRulebookContent.tsx apps/web/src/components/rules/RulesActionExample.tsx
git commit -m "fix(web): preserve canonical rulebook examples"
```

### Task 2: Add additive subsection illustrations and the Fumble branch diagram

**Files:**
- Modify: `apps/web/src/routes/RulesIndexPage.test.tsx`
- Modify: `apps/web/src/components/rules/RulesIllustrations.tsx`
- Modify: `apps/web/src/components/rules/RulesRulebookContent.tsx`
- Modify: `apps/web/src/components/rules/RulesRulebookContent.module.css`

**Step 1: Add failing assertions for additive subsection figures**

Extend the route test to require:

```ts
assert.match(illustrations, /export const FumbleBranches/);
assert.match(illustrations, /rulebookIllustrationsBySubsectionId/);
assert.match(illustrations, /"example-two-valid-fumbles": FumbleBranches/);
assert.match(illustrations, /MISS/);
assert.match(illustrations, /HIT, BUT/);
assert.match(illustrations, /Broken String/);
assert.match(illustrations, /1 Injury/);
assert.match(illustrations, /Action to repair/);
assert.match(content, /rulebookIllustrationsBySubsectionId/);
```

Also assert that `RulesRulebookContent` renders both `RulebookMarkdown` and the subsection enhancement in the same map iteration.

**Step 2: Run the test and confirm it fails**

```powershell
pnpm -C apps/web exec tsx --test src/routes/RulesIndexPage.test.tsx
```

Expected: FAIL because there is no subsection registry or Fumble branch component.

**Step 3: Implement `FumbleBranches` using existing components**

In `RulesIllustrations.tsx`:

- render the Fumble with `ResolvedCard type="OutcomeCard" slug="fumble"`;
- render two compact branch columns, labeled `MISS` and `HIT, BUT...`;
- render Injury with `ResolvedCard type="EffectCard" slug="injury"` so it flows through `resolveGameCard` and `GameCardView`;
- show the Bow with `ResolvedCard type="AssetCard" slug="medieval_hunting_bow"`, followed by `ResolvedCard type="EffectCard" slug="complication"` and the local annotation `Broken String — Action to repair`;
- keep arrows decorative with `aria-hidden="true"`;
- wrap the diagram in the existing semantic `RulebookFigure`.

Export the registry:

```tsx
export const rulebookIllustrationsBySubsectionId: Readonly<
  Record<string, () => JSX.Element>
> = {
  "example-two-valid-fumbles": FumbleBranches,
};
```

Do not copy the full Fumble prose into this component; the Markdown rendered immediately before it owns the explanation.

**Step 4: Mount subsection enhancements after Markdown**

Update the subsection loop to return a keyed fragment:

```tsx
const Enhancement = id
  ? rulebookIllustrationsBySubsectionId[id]
  : undefined;

return (
  <Fragment key={id ?? `${section.id}-${index}`}>
    <RulebookMarkdown markdown={block} subsectionId={id} />
    {Enhancement ? <Enhancement /> : null}
  </Fragment>
);
```

Import `Fragment` from React. Add only the responsive layout rules needed by the branch figure to `RulesRulebookContent.module.css`; keep shared card styling inside existing card components.

**Step 5: Re-run the focused test**

Expected: PASS.

**Step 6: Checkpoint**

```powershell
git add apps/web/src/components/rules/RulesIllustrations.tsx apps/web/src/components/rules/RulesRulebookContent.tsx apps/web/src/components/rules/RulesRulebookContent.module.css apps/web/src/routes/RulesIndexPage.test.tsx
git commit -m "feat(web): illustrate both valid Fumble outcomes"
```

### Task 3: Add the Core Action Loop figure

**Files:**
- Modify: `apps/web/src/routes/RulesIndexPage.test.tsx`
- Modify: `apps/web/src/components/rules/RulesIllustrations.tsx`
- Modify: `apps/web/src/components/rules/RulesRulebookContent.module.css`

**Step 1: Add failing figure assertions**

Require a named `CoreActionLoop` export, its registration at `core-action-loop`, and the six visible steps:

```ts
for (const label of [
  "Choose card",
  "Resolve Effect",
  "Discard",
  "Draw replacement",
  "Catastrophe check",
]) {
  assert.match(illustrations, new RegExp(label));
}
assert.match(illustrations, /"core-action-loop": CoreActionLoop/);
```

Also require at least three `ResolvedCard` Outcome cards in the hand composition.

**Step 2: Run the route test and verify it fails**

Use the Task 2 test command.

Expected: FAIL because the figure is not implemented.

**Step 3: Implement the responsive sequence**

Add `CoreActionLoop` to `RulesIllustrations.tsx`:

```tsx
export const CoreActionLoop = (): JSX.Element => (
  <RulebookFigure
    title="Core Action Loop"
    summary="Choose an Outcome, resolve it, refill the hand, then check the new hand for Catastrophe."
  >
    {/* Three-card hand -> Choose -> Resolve -> Discard -> Draw -> Check */}
  </RulebookFigure>
);
```

Implementation details:

- use `success`, `partial-success`, and `fumble` Outcome cards for the visible hand;
- visually lift or outline the selected Success without adding interactivity;
- use short text steps rather than more heavy panels;
- expose a concise ordered-list equivalent to assistive technology;
- stack the sequence vertically below the small-screen breakpoint.

Register it in `rulebookIllustrationsBySectionId` as `"core-action-loop": CoreActionLoop` so it appears before the section prose.

**Step 4: Re-run the focused test**

Expected: PASS.

**Step 5: Checkpoint**

```powershell
git add apps/web/src/components/rules/RulesIllustrations.tsx apps/web/src/components/rules/RulesRulebookContent.module.css apps/web/src/routes/RulesIndexPage.test.tsx
git commit -m "feat(web): add the rulebook action loop"
```

### Task 4: Rebuild Actor initiative around physical table placement

**Files:**
- Modify: `apps/web/src/routes/RulesIndexPage.test.tsx`
- Modify: `apps/web/src/components/rules/RulesIllustrations.tsx`
- Modify: `apps/web/src/components/rules/RulesRulebookContent.module.css`

**Step 1: Replace the old initiative assertions with the canonical sequence**

Assert that `ActorInitiative` contains the labels `Mira`, `Guard`, `Wolf`, `Aldren`, `Bandit`, and `Tomas`, in source order, and includes explanatory copy equivalent to `Actors act immediately after the player they sit in front of`. Require two Actor cards in Mira's slot and one in Aldren's slot.

**Step 2: Run the route test and confirm it fails**

Expected: FAIL because the current figure is only `Mira -> Actor -> Aldren` and its caption implies a separate Actor phase.

**Step 3: Implement the top-down/table-ring composition**

Replace `ActorInitiative` with a semantic sequence and a visual placement layer:

```ts
const initiativeSlots = [
  { player: "Mira", actors: ["Guard", "Wolf"] },
  { player: "Aldren", actors: ["Bandit"] },
  { player: "Tomas", actors: [] },
] as const;
```

- render each player as a shared `Token`;
- render Guard, Wolf, and Bandit with existing `ActorCard` variants;
- place Actor cards immediately after/in front of their player slot in the visual layout;
- render the readable sequence `Mira -> Guard -> Wolf -> Aldren -> Bandit -> Tomas`;
- change the caption so it explicitly says multiple Actors may share a slot and all act after that player;
- keep the layout flat and static rather than importing board drag/layout state.

**Step 4: Re-run the focused test**

Expected: PASS.

**Step 5: Checkpoint**

```powershell
git add apps/web/src/components/rules/RulesIllustrations.tsx apps/web/src/components/rules/RulesRulebookContent.module.css apps/web/src/routes/RulesIndexPage.test.tsx
git commit -m "fix(web): clarify Actor initiative placement"
```

### Task 5: Put physical die markers on Toughness and Counter cards

**Files:**
- Create: `apps/web/src/components/rules/DieMarker.tsx`
- Create: `apps/web/src/components/rules/DieMarker.test.ts`
- Modify: `apps/web/src/routes/RulesIndexPage.test.tsx`
- Modify: `apps/web/src/components/rules/RulesIllustrations.tsx`
- Modify: `apps/web/src/components/rules/RulesRulebookContent.module.css`

**Step 1: Write the failing DieMarker contract test**

Use a focused source-level component test consistent with the existing web tests:

```ts
test("DieMarker exposes marker semantics without interaction", () => {
  const source = readFileSync(new URL("./DieMarker.tsx", import.meta.url), "utf8");

  assert.match(source, /sides: 4 \| 6 \| 8 \| 12/);
  assert.match(source, /value: number/);
  assert.match(source, /aria-label/);
  assert.match(source, /Dice track values; they are not rolled/);
  assert.doesNotMatch(source, /onClick|Math\.random|button/);
});
```

Extend `RulesIndexPage.test.tsx` to require three Toughness markers (`3`, `1`, `0`), a marker directly over each Actor wrapper, `Ice Storm`, `3 / 4`, and a Bandit marker showing `1`.

**Step 2: Run focused tests and confirm failure**

```powershell
pnpm -C apps/web exec tsx --test src/components/rules/DieMarker.test.ts src/routes/RulesIndexPage.test.tsx
```

Expected: FAIL because `DieMarker.tsx` does not exist and the figures use captions instead of overlaid dice.

**Step 3: Implement the rulebook-local marker**

Create a non-interactive component with this public API:

```ts
export interface DieMarkerProps {
  sides: 4 | 6 | 8 | 12;
  value: number;
  className?: string;
  label?: string;
}
```

- validate display values with a safe clamp to `0..sides`;
- use a d4-shaped CSS treatment for `sides={4}` and leave room for future shapes without adding a dependency;
- set `aria-label={label ?? `d${sides} marker showing ${value}`}`;
- include visually hidden text clarifying that the die tracks a value and is not rolled;
- accept `className` so a parent can position the marker partly over a card.

**Step 4: Rebuild `RemainingToughness`**

For each `3 -> 1 -> 0` state:

- wrap `ActorCard` in `relative inline-flex`;
- position `DieMarker sides={4}` partly over the upper card surface;
- annotate `3` as starting Toughness, `1` as after 2 Injury, and `0` as after 1 Distress / Taken Out;
- ensure both Injury and Distress are named because only those Effects reduce Toughness by default.

**Step 5: Rebuild `CounterTracking`**

- use an Ice Storm Counter at `3 / 4` with a d4 showing `3` over the Counter card;
- place a Bandit Actor beside it with a d4 showing `1`;
- caption the different meanings: `Counter value: 3/4` and `Remaining Toughness: 1`;
- end with `Dice track values; they are not rolled.`

The `CounterCard` may continue displaying `3 / 4` in its own header; the physical die overlay is the instructional point and must visibly sit on the card.

**Step 6: Run focused tests**

Expected: PASS.

**Step 7: Checkpoint**

```powershell
git add apps/web/src/components/rules/DieMarker.tsx apps/web/src/components/rules/DieMarker.test.ts apps/web/src/components/rules/RulesIllustrations.tsx apps/web/src/components/rules/RulesRulebookContent.module.css apps/web/src/routes/RulesIndexPage.test.tsx
git commit -m "feat(web): show physical rulebook value markers"
```

### Task 6: Replace sci-fi Zones with a medieval mini-adventure

**Files:**
- Create: `apps/web/public/rules/locations/castle-gate.png`
- Create: `apps/web/public/rules/locations/courtyard.png`
- Create: `apps/web/public/rules/locations/tower.png`
- Modify: `apps/web/src/routes/RulesIndexPage.test.tsx`
- Modify: `apps/web/src/components/rules/RulesIllustrations.tsx`
- Modify: `apps/web/src/components/rules/RulesRulebookContent.module.css`

**Step 1: Add failing medieval-world and range assertions**

Update the illustration test to reject the current sci-fi imports and require the new content:

```ts
for (const obsolete of ["Docking Bay", "Cargo Hold", "Crew Quarters"]) {
  assert.doesNotMatch(illustrations, new RegExp(obsolete));
}
for (const required of [
  "Castle Gate",
  "Courtyard",
  "Tower",
  "Sword: same zone",
  "Throw: +1 zone",
  "Bow: +2 zones",
  "Sniper: anywhere in sight",
]) {
  assert.match(illustrations, new RegExp(required.replace(/[+]/g, "\\+")));
}
```

Also assert the three `/rules/locations/*.png` paths are referenced and that no server output image is imported by this figure.

**Step 2: Run the route test and confirm it fails**

```powershell
pnpm -C apps/web exec tsx --test src/routes/RulesIndexPage.test.tsx
```

Expected: FAIL because the current composition imports Docking Bay, Cargo Hold, and Crew Quarters artwork.

**Step 3: Generate the three consistent static images**

Use `@imagegen` once per location or as a tightly controlled variant set. Keep composition, palette, and camera consistent. Base prompt:

```text
Muted medieval fantasy instructional card illustration, warm parchment and ink palette,
slightly top-down readable environment, no people in close-up, no text, no labels,
no logo, clear silhouette, designed for the Mighty Decks LocationCard crop.
Location: [Castle Gate | Courtyard | Tower].
```

Inspect the generated images before accepting them. Reject outputs containing text, sci-fi elements, mismatched aspect ratios, or inconsistent visual style. Save the selected files at the exact paths above. Because they are static web assets, do not register them in `apps/server/output/adventure-artifacts/index.json`.

**Step 4: Rebuild `ZonesAndRange`**

Replace `locationExamples` with:

```ts
const locationExamples = [
  { title: "Castle Gate", imageUrl: "/rules/locations/castle-gate.png" },
  { title: "Courtyard", imageUrl: "/rules/locations/courtyard.png" },
  { title: "Tower", imageUrl: "/rules/locations/tower.png" },
] as const;
```

- place Mira's Token at Castle Gate and a medieval Guard/Bandit Actor at Tower;
- keep Courtyard visually empty so the connected-zone relationship reads clearly;
- remove `Melee`, `Thrown`, and `Ranged` from Location descriptions;
- add a thin legend or arrow row below the cards with the four exact reach rules;
- stack cards and legend cleanly on small screens.

**Step 5: Re-run the route test and check asset existence**

```powershell
pnpm -C apps/web exec tsx --test src/routes/RulesIndexPage.test.tsx
Get-Item apps/web/public/rules/locations/castle-gate.png,apps/web/public/rules/locations/courtyard.png,apps/web/public/rules/locations/tower.png
```

Expected: the test passes and all three assets exist with non-zero lengths.

**Step 6: Checkpoint**

```powershell
git add apps/web/public/rules/locations apps/web/src/components/rules/RulesIllustrations.tsx apps/web/src/components/rules/RulesRulebookContent.module.css apps/web/src/routes/RulesIndexPage.test.tsx
git commit -m "feat(web): illustrate medieval zones and range"
```

### Task 7: Document the rulebook rendering invariant

**Files:**
- Modify: `docs/11-mighty-decks-rules.md`
- Modify: `CHANGELOG.md`

**Step 1: Update the rules-route documentation**

Add a concise paragraph to `docs/11-mighty-decks-rules.md`:

```md
Canonical Markdown remains authoritative for all reader-facing prose and examples.
Component-composed diagrams are additive enhancements keyed to public section or
subsection anchors; they must not replace or shorten the matching Markdown block.
```

Document that the focused visual set covers the Core Action Loop, two valid Fumbles, Actor initiative, Toughness/Counter markers, and Zones/Range.

**Step 2: Add one changelog bullet**

Under `## [Unreleased]` -> `### Changed`, add:

```md
- Web: preserve complete canonical examples on `/rules` and add clearer component-based diagrams for the action loop, Fumbles, Actor initiative, Toughness and Counter dice, and medieval Zones and Range.
```

Do not add a rule-change entry: this slice changes presentation and fixes omitted content but does not alter gameplay.

**Step 3: Review and checkpoint**

```powershell
git diff -- docs/11-mighty-decks-rules.md CHANGELOG.md
git add docs/11-mighty-decks-rules.md CHANGELOG.md
git commit -m "docs: record additive rulebook illustrations"
```

### Task 8: Verify focused behavior, responsiveness, and build health

**Files:**
- Test only; do not commit temporary browser scripts or screenshots unless explicitly requested.

**Step 1: Run all focused rulebook tests**

```powershell
pnpm -C apps/web exec tsx --test src/lib/rulebookDocument.test.ts src/components/rules/DieMarker.test.ts src/routes/RulesIndexPage.test.tsx src/routes/RulesRoutes.test.ts
```

Expected: all tests PASS.

**Step 2: Run token-optimized repository validation**

```powershell
pnpm check:agent
pnpm build:agent
```

Expected: both commands exit 0. If either wrapper reports a failure, inspect and summarize its corresponding log under `.agent-logs/` rather than rerunning an uncapped command immediately.

**Step 3: Verify `/rules` in a real browser**

Use `@webapp-testing` because this change affects responsive visual behavior. Read its `SKILL.md`, start the local app through its helper, and inspect at approximately 1280px and 390px viewport widths.

Verify:

- the canonical Fumble prose contains both the miss and hit-with-consequence resolutions;
- the Fumble diagram appears after that prose rather than replacing it;
- the action loop order is obvious and becomes vertical on mobile;
- Actor cards physically follow the correct player slots, including Guard and Wolf after Mira;
- the Toughness d4 visibly overlaps each Actor card at `3`, `1`, and `0`;
- the Ice Storm and Bandit dice visibly sit on their respective cards and their meanings are distinct;
- Castle Gate, Courtyard, and Tower images load with no sci-fi art or baked-in text;
- all four range annotations remain readable without horizontal page overflow;
- existing section anchors and print-oriented layout remain intact;
- the browser console contains no errors or missing-asset warnings.

**Step 4: Review the complete scoped diff**

```powershell
git status --short
git diff --stat
git diff --check
```

Expected: only the files listed in this plan are changed, aside from unrelated pre-existing user changes; `git diff --check` reports no whitespace errors.

**Step 5: Final checkpoint**

If commits were intentionally deferred during execution, create one scoped commit only after all verification passes:

```powershell
git add apps/web/src/components/rules apps/web/src/lib/rulebookDocument.test.ts apps/web/src/routes/RulesIndexPage.test.tsx apps/web/public/rules/locations docs/11-mighty-decks-rules.md CHANGELOG.md
git commit -m "feat(web): improve rulebook instructional visuals"
```
