# Selective Rulebook Board Illustrations Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the seven spatially complex `/rules` teaching figures with the shared static-board stack and `/backgrounds/board.jpg`, while retaining direct canonical rendering for single cards and ordinary card rows.

**Architecture:** Extract the static `BoardProvider`/`BoardFrame`/`Board` composition already proven by `/styleguide/board` into one shared component. Keep rulebook fixture geometry pure and local, render a flat list of canonical pieces over an optional board texture, and leave captions and accessible sequence descriptions outside the transformed board.

**Tech Stack:** React 18, TypeScript, existing board controller/layout helpers, canonical Mighty Decks card/token components, CSS Modules/Tailwind, Node `tsx --test`, and Playwright through the repository browser-testing workflow.

**Design:** `docs/plans/2026-08-29-rules-board-illustrations-design.md`

**Implementation skills:** `@mighty-decks-ui-patterns`, `@mighty-decks-rules`, `@superpowers:test-driven-development`, and `@superpowers:verification-before-completion`; use `@webapp-testing` for the final responsive and print-oriented browser check.

**Workspace:** Work in the current directory. Preserve the unrelated existing change to `apps/server/output/adventure-artifacts/index.json`; do not create a worktree or change branches.

---

### Task 1: Extract the shared static-board figure and support a board texture

**Files:**
- Modify: `apps/web/src/components/board/Board.test.ts`
- Modify: `apps/web/src/components/board/Board.tsx`
- Create: `apps/web/src/components/board/StaticBoardFigure.test.ts`
- Create: `apps/web/src/components/board/StaticBoardFigure.tsx`
- Modify: `apps/web/src/routes/StyleguideBoardPage.test.ts`
- Modify: `apps/web/src/routes/StyleguideBoardPage.tsx`

**Step 1: Write failing shared-component tests**

Extend `Board.test.ts` with a source-level contract that requires an optional
background without changing the default transparent board:

```ts
test("Board can render an optional transformed surface image", () => {
  const source = readFileSync(new URL("./Board.tsx", import.meta.url), "utf8");

  assert.match(source, /backgroundImageUrl\?: string/);
  assert.match(source, /backgroundImage: backgroundImageUrl/);
  assert.match(source, /backgroundSize: "cover"/);
  assert.match(source, /backgroundPosition: "center"/);
});
```

Create `StaticBoardFigure.test.ts` and require the extracted component to:

```ts
test("StaticBoardFigure composes the non-interactive shared board stack", () => {
  const source = readFileSync(
    new URL("./StaticBoardFigure.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /<BoardProvider/);
  assert.match(source, /<BoardFrame[^>]*interactive=\{false\}/);
  assert.match(source, /<Board/);
  assert.match(source, /backgroundImageUrl=\{backgroundImageUrl\}/);
  assert.match(source, /renderItem=\{renderItem\}/);
});
```

Update `StyleguideBoardPage.test.ts` to require `StaticBoardFigure` instead of
requiring the page to own `BoardProvider`, `BoardFrame`, and `Board` directly.

**Step 2: Run the focused tests and verify they fail**

Run:

```powershell
pnpm -C apps/web exec tsx --test src/components/board/Board.test.ts src/components/board/StaticBoardFigure.test.ts src/routes/StyleguideBoardPage.test.ts
```

Expected: FAIL because `Board` has no surface-image prop and the shared static
wrapper does not exist.

**Step 3: Add the optional board surface**

Extend `BoardProps`:

```ts
interface BoardProps {
  className?: string;
  renderItem?: (item: BoardItemRecord) => ReactNode;
  backgroundImageUrl?: string;
}
```

Pass `backgroundImageUrl` into `Board` and extend `boardStyle` only when it is
present:

```ts
const boardStyle: CSSProperties = {
  width: boardSize.width,
  height: boardSize.height,
  transform: `translate(${-viewport.x * viewport.zoom}px, ${-viewport.y * viewport.zoom}px) scale(${viewport.zoom})`,
  transformOrigin: "0 0",
  transitionProperty: "transform",
  transitionDuration: `${transitionDurationMs}ms`,
  transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
  backgroundImage: backgroundImageUrl
    ? `url(${JSON.stringify(backgroundImageUrl)})`
    : undefined,
  backgroundPosition: "center",
  backgroundRepeat: "no-repeat",
  backgroundSize: "cover",
};
```

Do not make the wood texture a global `Board` or `BoardFrame` default. The
interactive `/board` and `/spaceship` labs must keep their current surfaces.

**Step 4: Extract `StaticBoardFigure`**

Create the shared component with the smallest reusable prop surface:

```tsx
interface StaticBoardFigureProps {
  boardSize: BoardSize;
  items: BoardItemInput[];
  ariaLabel: string;
  className?: string;
  backgroundImageUrl?: string;
  renderItem?: (item: BoardItemRecord) => ReactNode;
}

export const StaticBoardFigure = ({
  boardSize,
  items,
  ariaLabel,
  className,
  backgroundImageUrl,
  renderItem,
}: StaticBoardFigureProps): JSX.Element => (
  <BoardProvider boardSize={boardSize} initialItems={items}>
    <BoardFrame
      interactive={false}
      ariaLabel={ariaLabel}
      className={className}
    >
      <Board
        backgroundImageUrl={backgroundImageUrl}
        renderItem={renderItem}
      />
    </BoardFrame>
  </BoardProvider>
);
```

Keep captions, `figure`, and rulebook-specific copy out of this component.

**Step 5: Migrate `/styleguide/board` to the shared wrapper**

Delete the route-local `StaticBoardExample`. Import `StaticBoardFigure` and map
each example as:

```tsx
<StaticBoardFigure
  boardSize={example.boardSize}
  items={example.items}
  ariaLabel={ariaLabel}
  className="h-[18rem] w-full flex-none sm:h-[22rem]"
  renderItem={renderItem}
/>
```

Do not give styleguide examples the wood texture in this task; the styleguide
should continue demonstrating the neutral default and document that consumers
may opt into a surface.

**Step 6: Run the focused tests and web typecheck**

Run:

```powershell
pnpm -C apps/web exec tsx --test src/components/board/Board.test.ts src/components/board/StaticBoardFigure.test.ts src/routes/StyleguideBoardPage.test.ts
pnpm -C apps/web typecheck
```

Expected: PASS.

**Step 7: Commit the shared primitive**

```powershell
git add apps/web/src/components/board/Board.tsx apps/web/src/components/board/Board.test.ts apps/web/src/components/board/StaticBoardFigure.tsx apps/web/src/components/board/StaticBoardFigure.test.ts apps/web/src/routes/StyleguideBoardPage.tsx apps/web/src/routes/StyleguideBoardPage.test.ts
git commit -m "feat(web): share static board figures"
```

### Task 2: Define flat fixtures for exactly seven complex rules figures

**Files:**
- Create: `apps/web/src/components/rules/rulesBoardExamples.ts`
- Create: `apps/web/src/components/rules/rulesBoardExamples.test.ts`

**Step 1: Write the failing fixture contract**

Define the approved catalog in the test:

```ts
import { rulebookBoardExamples } from "./rulesBoardExamples";

const approvedIds = [
  "complete-table-setup",
  "core-action-loop",
  "actor-initiative",
  "zones-and-range",
  "catastrophe-flow",
  "status-thresholds",
  "fumble-branches",
] as const;

test("only complex rulebook examples receive board fixtures", () => {
  assert.deepEqual(Object.keys(rulebookBoardExamples), approvedIds);
});

test("rulebook board fixtures are flat, unique, and contained", () => {
  for (const example of Object.values(rulebookBoardExamples)) {
    assert.ok(example.items.length > 0);
    assert.equal(
      new Set(example.items.map((item) => item.id)).size,
      example.items.length,
    );
    for (const item of example.items) {
      assert.ok(item.x >= 0 && item.y >= 0);
      assert.ok(item.x + (item.width ?? 0) <= example.boardSize.width);
      assert.ok(item.y + (item.height ?? 0) <= example.boardSize.height);
    }
  }
});
```

Add representative semantic checks rather than coordinate snapshots:

- table setup contains Gate, Courtyard, Tower, Counter, Outcome deck/hand, and
  pieces for Mira, Aldren, and Tomas;
- Core Action Loop contains initial and refreshed hands, selected Outcome,
  discard, and deck;
- initiative item order communicates Mira, Guard, Wolf, Aldren, Bandit, Tomas;
- zones contain Mira at Gate and the Bandit at Tower;
- Catastrophe places the trigger after the replacement draw and consequences
  after the trigger;
- status thresholds contain both Distress and Injury terminal states;
- Fumble contains one source and two branches, with Bandit + Injury and Bow +
  Complication grouped in the costly-success branch.

**Step 2: Run the fixture test and verify it fails**

Run:

```powershell
pnpm -C apps/web exec tsx --test src/components/rules/rulesBoardExamples.test.ts
```

Expected: FAIL because the fixture module does not exist.

**Step 3: Add the typed fixture shape and conversion helper**

Use the shared board types and pure layout results:

```ts
export interface RulebookBoardExample {
  boardSize: BoardSize;
  items: BoardItemInput[];
}

const toBoardItems = (
  result: BoardLayoutResult,
): BoardItemInput[] =>
  result.placements.map((placement) => ({
    id: placement.id,
    kind: "card",
    x: placement.x,
    y: placement.y,
    width: placement.width,
    height: placement.height,
    zIndex: placement.zIndex,
    rotation: placement.rotation,
  }));
```

Use stable ids with these prefixes:

| Fixture | Required item-id families | Layout approach |
| --- | --- | --- |
| `complete-table-setup` | `setup-location-*`, `setup-counter`, `setup-outcome-deck`, `setup-*-hand-*`, `setup-*-stunt`, `setup-*-asset`, `setup-*-effect`, `setup-actor-*` | `flexLayout` for scene/player rows, `fanLayout` for hands, `stackLayout` for d4 overlays |
| `core-action-loop` | `loop-initial-*`, `loop-selected`, `loop-discard`, `loop-deck-*`, `loop-refreshed-*`, `loop-step-*` | `fanLayout` for hands, `deckLayout` for draw pile, `flexLayout` for sequence |
| `actor-initiative` | `initiative-mira`, `initiative-guard`, `initiative-wolf`, `initiative-aldren`, `initiative-bandit`, `initiative-tomas` | player slots from `flexLayout`, owned Actors from `stackLayout`/offset placements |
| `zones-and-range` | `zone-gate`, `zone-courtyard`, `zone-tower`, `zone-mira`, `zone-bandit`, `range-sword`, `range-throw`, `range-bow` | `flexLayout` for zones, direct flat overlays for reach |
| `catastrophe-flow` | `catastrophe-resolved`, `catastrophe-draw`, `catastrophe-fumble-*`, `catastrophe-trigger`, `catastrophe-consequence-*` | `flexLayout` for sequence, `fanLayout` for Fumbles, flat consequence fork |
| `status-thresholds` | `distress-*`, `injury-*`, `status-panicked`, `status-hopeless`, `status-taken-out` | two `flexLayout` lanes flattened together |
| `fumble-branches` | `fumble-source`, `fumble-miss`, `fumble-hit-but`, `fumble-bandit`, `fumble-injury`, `fumble-bow`, `fumble-complication` | source above two flat branch columns |

Choose tightly bounded virtual boards with at least 24 board pixels of outer
padding. Use explicit `zIndex` only for overlaps, tokens, dice, and connectors.
Do not import React, styleguide fixtures, CSS, or route modules.

**Step 4: Run fixture and layout-helper tests**

Run:

```powershell
pnpm -C apps/web exec tsx --test src/components/rules/rulesBoardExamples.test.ts src/lib/board/boardLayout.test.ts
```

Expected: PASS.

**Step 5: Commit the fixture layer**

```powershell
git add apps/web/src/components/rules/rulesBoardExamples.ts apps/web/src/components/rules/rulesBoardExamples.test.ts
git commit -m "feat(web): add rulebook board fixtures"
```

### Task 3: Render the seven complex examples with canonical board pieces

**Files:**
- Add existing asset: `apps/web/public/backgrounds/board.jpg`
- Create: `apps/web/src/components/rules/RulesBoardIllustrations.test.tsx`
- Create: `apps/web/src/components/rules/RulesBoardIllustrations.tsx`
- Modify: `apps/web/src/components/rules/RulesIllustrations.tsx`
- Modify: `apps/web/src/components/rules/RulesIllustrations.test.tsx`
- Modify: `apps/web/src/components/rules/RulesRulebookContent.test.tsx`
- Modify: `apps/web/src/routes/RulesIndexPage.test.tsx`

**Step 1: Write the failing selective-use tests**

In `RulesBoardIllustrations.test.tsx`, require the shared board wrapper and wood
asset:

```ts
test("complex rulebook figures use the static board and wood surface", () => {
  const source = readFileSync(
    new URL("./RulesBoardIllustrations.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /StaticBoardFigure/);
  assert.match(source, /const boardBackground = "\/backgrounds\/board\.jpg"/);
  assert.equal(
    (source.match(/backgroundImageUrl=\{boardBackground\}/g) ?? []).length,
    7,
  );
  assert.ok(
    existsSync(
      new URL("../../../public/backgrounds/board.jpg", import.meta.url),
    ),
  );
});
```

Require all seven exported components and canonical renderers. Preserve existing
semantic assertions for table contents, initiative order, range, Catastrophe,
thresholds, and Fumble consequences.

In `RulesIllustrations.test.tsx`, assert that simple examples remain direct:

```ts
for (const name of [
  "EffectEquation",
  "PhysicalAssetComposition",
  "RemainingToughness",
  "CounterTracking",
  "StuntCardIllustration",
  "AssetCardIllustration",
  "ConsumableCardIllustration",
]) {
  assert.match(simpleSource, new RegExp(`export const ${name}`));
}
assert.doesNotMatch(simpleSource, /StaticBoardFigure/);
```

Update registry tests so the seven complex keys resolve to imports from
`RulesBoardIllustrations`, while the seven simple examples continue resolving
inside `RulesIllustrations`.

**Step 2: Run the focused rulebook tests and verify they fail**

Run:

```powershell
pnpm -C apps/web exec tsx --test src/components/rules/RulesBoardIllustrations.test.tsx src/components/rules/RulesIllustrations.test.tsx src/components/rules/RulesRulebookContent.test.tsx src/routes/RulesIndexPage.test.tsx
```

Expected: FAIL because the complex figures still use their legacy layouts.

**Step 3: Add the shared rulebook board shell**

Inside `RulesBoardIllustrations.tsx`, keep one local wrapper around the shared
primitive and existing caption treatment:

```tsx
const boardBackground = "/backgrounds/board.jpg";

const RulebookBoardFigure = ({
  example,
  title,
  summary,
  ariaLabel,
  renderItem,
  children,
}: RulebookBoardFigureProps): JSX.Element => (
  <figure className="stack gap-3 py-3 print:break-inside-avoid">
    {children}
    <StaticBoardFigure
      boardSize={example.boardSize}
      items={example.items}
      ariaLabel={ariaLabel}
      backgroundImageUrl={boardBackground}
      className="h-[20rem] w-full flex-none sm:h-[26rem]"
      renderItem={renderItem}
    />
    <figcaption>
      <Text variant="note" color="iron-light">
        <strong className="text-kac-iron">{title}.</strong> {summary}
      </Text>
    </figcaption>
  </figure>
);
```

Allow an optional per-figure `className` only if browser verification shows one
bounded board needs a different height. Do not add configuration for individual
coordinates or texture settings.

**Step 4: Render canonical content by stable item id**

Add small helpers for resolved catalog cards and repeated labelled connectors,
then implement item renderers with these canonical components:

- `CompleteTableSetup`: three `LocationCard`s; `CounterCard` plus `DieMarker`;
  `OutcomeCard` deck back; resolved Outcome/Stunt/Effect cards; `AssetCard`;
  `ActorCard`; and player `Token`s/labels.
- `CoreActionLoop`: resolved Outcome cards for both hands and selected/discarded
  cards, an `OutcomeCard` deck back, and numbered `Label`s/connectors.
- `ActorInitiative`: player `Token`s, Guard/Wolf/Bandit `ActorCard`s, and visible
  connectors matching `Mira -> Guard -> Wolf -> Aldren -> Bandit -> Tomas`.
- `ZonesAndRange`: three `LocationCard`s, Mira/Bandit `Token`s, and labelled
  Sword/Throw/Bow reach overlays; retain `Sniper: anywhere in sight` outside the
  board as a note.
- `CatastropheFlow`: Success, a three-Fumble fan, an explicit Catastrophe label,
  and Injury/Complication/Boost cards after the trigger.
- `StatusThresholds`: Distress/Injury milestone cards and strong Panicked,
  Hopeless, and Taken Out labels; retain the recovery direction from Hopeless
  back to Panicked.
- `FumbleBranches`: one Fumble source, `MISS`, `HIT, BUT...`, Bandit + Injury,
  and Bow + Complication as separate groups.

All board items must remain direct children rendered by `Board`; connectors are
also flat items and `aria-hidden`. Preserve an ordered-list text equivalent as
the first child of every sequence/branch figure.

**Step 5: Register the new figures without moving simple examples**

Import and re-export the seven complex components from
`RulesBoardIllustrations.tsx`, then preserve this exact registry split:

```ts
export const rulebookIllustrationsBySectionId = {
  "what-you-need-to-play": CompleteTableSetup,
  effect: EffectEquation,
  "characters-expertise-stunts-assets": PhysicalAssetComposition,
  "core-action-loop": CoreActionLoop,
  actors: RemainingToughness,
  "turn-based-play": ActorInitiative,
  "locations-zones-movement-range": ZonesAndRange,
  catastrophe: CatastropheFlow,
  counters: CounterTracking,
} satisfies Readonly<Record<string, () => JSX.Element>>;

export const rulebookIllustrationsBySubsectionId = {
  "7-2-distress": StatusThresholds,
  "9-2-stunts": StuntCardIllustration,
  "9-3-assets": AssetCardIllustration,
  "9-4-consumables": ConsumableCardIllustration,
  "example-two-valid-fumbles": FumbleBranches,
} satisfies Readonly<Record<string, () => JSX.Element>>;
```

Do not wrap the Effect equation, Physical Asset composition, Remaining
Toughness, Counter tracking, or the three floated card examples in a board.

**Step 6: Run the focused tests and typecheck**

Run:

```powershell
pnpm -C apps/web exec tsx --test src/components/rules/rulesBoardExamples.test.ts src/components/rules/RulesBoardIllustrations.test.tsx src/components/rules/RulesIllustrations.test.tsx src/components/rules/RulesRulebookContent.test.tsx src/routes/RulesIndexPage.test.tsx
pnpm -C apps/web typecheck
```

Expected: PASS.

**Step 7: Commit the selective board figures and asset**

```powershell
git add apps/web/public/backgrounds/board.jpg apps/web/src/components/rules/rulesBoardExamples.ts apps/web/src/components/rules/rulesBoardExamples.test.ts apps/web/src/components/rules/RulesBoardIllustrations.tsx apps/web/src/components/rules/RulesBoardIllustrations.test.tsx apps/web/src/components/rules/RulesIllustrations.tsx apps/web/src/components/rules/RulesIllustrations.test.tsx apps/web/src/components/rules/RulesRulebookContent.test.tsx apps/web/src/routes/RulesIndexPage.test.tsx
git commit -m "feat(web): rebuild complex rulebook figures as boards"
```

### Task 4: Remove superseded complex-layout code and keep simple rows lean

**Files:**
- Modify: `apps/web/src/components/rules/RulesIllustrations.tsx`
- Modify: `apps/web/src/components/rules/RulesIllustrations.test.tsx`
- Modify: `apps/web/src/components/rules/RulesRulebookContent.module.css`

**Step 1: Add failing dead-code assertions**

Require removal of the superseded versions and their CSS-only diagram systems:

```ts
for (const legacyName of [
  "FumbleBranchesV2",
  "CatastropheFlowV2",
  "CoreActionLoopV2",
  "ComposedAssetEquation",
  "DistressCardIllustration",
]) {
  assert.doesNotMatch(simpleSource, new RegExp(`export const ${legacyName}`));
}

for (const legacyClass of [
  "tableSetupViewport",
  "tableSetupCanvas",
  "statusThresholds",
  "fumbleFork",
  "fumbleBranches",
]) {
  assert.doesNotMatch(rulebookStyles, new RegExp(`\\.${legacyClass}\\b`));
}
```

Keep assertions for `.cardFloat`, `.trackingGrid`, route prose, target state,
and print break behavior because the retained simple examples still use them.

**Step 2: Run the focused test and verify it fails**

Run:

```powershell
pnpm -C apps/web exec tsx --test src/components/rules/RulesIllustrations.test.tsx
```

Expected: FAIL while legacy exports and CSS remain.

**Step 3: Delete only superseded implementations**

Remove the old complex JSX implementations now replaced by
`RulesBoardIllustrations`. Also remove unused constants and imports that served
only those implementations. Retain:

- `RulebookFigure`, `ResolvedCard`, and `RulebookCardFloat`;
- Stunt, Asset, and Consumable floats;
- `EffectEquation`;
- `PhysicalAssetComposition`;
- `RemainingToughness`;
- `CounterTracking`;
- the two illustration registries and the imported complex figures.

Do not create a generalized diagram DSL or compatibility aliases for the old
`V2` export names; they are internal and have no public callers.

**Step 4: Remove orphaned CSS**

Delete styles used only by the legacy table setup, status lanes, and Fumble
fork, including their mobile and print overrides. Keep the route content,
prose, float, tracking-grid, target, and generic print rules.

**Step 5: Run focused tests and typecheck**

Run:

```powershell
pnpm -C apps/web exec tsx --test src/components/rules/RulesIllustrations.test.tsx src/components/rules/RulesBoardIllustrations.test.tsx src/routes/RulesIndexPage.test.tsx
pnpm -C apps/web typecheck
```

Expected: PASS.

**Step 6: Commit the cleanup**

```powershell
git add apps/web/src/components/rules/RulesIllustrations.tsx apps/web/src/components/rules/RulesIllustrations.test.tsx apps/web/src/components/rules/RulesRulebookContent.module.css
git commit -m "refactor(web): remove legacy rulebook diagrams"
```

### Task 5: Document and verify selective rulebook boards

**Files:**
- Modify: `docs/04-ui-components.md`
- Modify: `docs/11-mighty-decks-rules.md`
- Modify: `docs/23-board-view-prototype.md`
- Modify: `CHANGELOG.md`
- Test only: focused web tests and browser verification

**Step 1: Update component and route documentation**

In `docs/04-ui-components.md`:

- add `StaticBoardFigure` beside `BoardProvider`, `BoardFrame`, and `Board`;
- document `backgroundImageUrl` as an opt-in transformed surface;
- state that callers keep fixture data and captions local.

In `docs/11-mighty-decks-rules.md`:

- record that only the seven multi-part spatial/flow figures use static boards;
- list the direct examples that deliberately remain simple card/row layouts;
- record `/backgrounds/board.jpg` as decorative presentation, not rules content;
- preserve canonical Markdown as the source of rules meaning.

In `docs/23-board-view-prototype.md`:

- update the sentence that says the board surface is always transparent;
- document the optional surface-image behavior;
- add `/rules` as a production consumer of non-interactive static boards;
- repeat that compound layouts flatten before render.

**Step 2: Add the changelog entry**

Under `## [Unreleased]` and the existing `### Changed` heading, add or merge:

```md
- Web: rebuild complex `/rules` teaching figures as non-interactive tabletop boards with canonical components and a wood surface, while keeping simple card examples unframed.
```

**Step 3: Run all focused tests**

Run:

```powershell
pnpm -C apps/web exec tsx --test src/components/board/Board.test.ts src/components/board/BoardFrame.test.ts src/components/board/StaticBoardFigure.test.ts src/lib/board/boardLayout.test.ts src/routes/styleguideBoardExamples.test.ts src/routes/StyleguideBoardPage.test.ts src/components/rules/rulesBoardExamples.test.ts src/components/rules/RulesBoardIllustrations.test.tsx src/components/rules/RulesIllustrations.test.tsx src/components/rules/RulesRulebookContent.test.tsx src/routes/RulesIndexPage.test.tsx src/routes/RulesRoutes.test.ts
```

Expected: all tests PASS.

**Step 4: Run token-optimized repository validation**

Run:

```powershell
pnpm check:agent
```

Expected: PASS with full output stored under `.agent-logs/`.

Run a build because the change adds a public image and new React modules:

```powershell
pnpm build:agent
```

Expected: PASS with full output stored under `.agent-logs/`.

**Step 5: Verify `/rules` and `/styleguide/board` in a browser**

Read and follow `@webapp-testing`. At approximately 1440px, 768px, and 390px,
verify:

- exactly the seven approved complex examples use a wood board surface;
- the Stunt, Asset, Consumable, Effect equation, Physical Asset composition,
  Remaining Toughness, and Counter tracking examples remain direct and do not
  gain board frames;
- each complex figure remains contained and legible with no horizontal page
  overflow;
- wheel input over a figure scrolls the page and dragging does not pan;
- the wood texture covers the virtual board without stretching outside it;
- cards, tokens, dice, labels, and connectors preserve their intended z-order;
- Outcome hands use a fan only where it clarifies hand state;
- visible and screen-reader order match the canonical rulebook for the action
  loop, initiative, range, Catastrophe, thresholds, and Fumble branches;
- `/styleguide/board` still renders its examples through the extracted shared
  component with the neutral default surface;
- no broken images, fallback cards, console errors, or accessibility-name
  regressions appear.

Open print preview for `/rules` and confirm figures/captions avoid bad page
breaks and remain understandable if the browser omits decorative backgrounds.
Temporary screenshots may be captured for comparison but should not be
committed.

**Step 6: Review the scoped diff**

Run:

```powershell
git status --short
git diff --stat
git diff --check
```

Expected: no whitespace errors and no unintended files. Preserve the unrelated
`apps/server/output/adventure-artifacts/index.json` modification.

**Step 7: Commit documentation and changelog**

```powershell
git add docs/04-ui-components.md docs/11-mighty-decks-rules.md docs/23-board-view-prototype.md CHANGELOG.md
git commit -m "docs: document selective rulebook boards"
```
