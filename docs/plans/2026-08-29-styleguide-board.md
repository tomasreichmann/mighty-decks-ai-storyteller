# Styleguide Board Route Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a static `/styleguide/board` teaching route that demonstrates how to build reusable board and rules illustrations from the real board primitives, layout helpers, canonical cards, tokens, and selected spaceship surfaces.

**Architecture:** Keep every example frontend-local and read-only. Add an opt-in non-interactive mode to `BoardFrame`, build route-adjacent fixtures with the existing pure layout helpers, and render those flat items through `BoardProvider` and `Board`; use canonical component renderers for game pieces and reuse exported spaceship surfaces only in the worked spaceship example.

**Tech Stack:** React 18, TypeScript, React Router, Tailwind CSS, existing board controller/layout modules, existing card/token components, Node test runner with `tsx`.

**Design:** `docs/plans/2026-08-29-styleguide-board-design.md`

**Implementation skills:** `@mighty-decks-ui-patterns`, `@superpowers:test-driven-development`, `@superpowers:verification-before-completion`; use `@webapp-testing` only for the final responsive/non-interactive browser check.

---

### Task 1: Give `BoardFrame` an opt-in static mode

**Files:**
- Modify: `apps/web/src/components/board/BoardFrame.test.ts`
- Modify: `apps/web/src/components/board/BoardFrame.tsx`

**Step 1: Write the failing read-only behavior test**

Add a focused source-level test alongside the existing interaction tests:

```ts
test("BoardFrame can render a static illustration without owning page input", () => {
  const source = readFileSync(new URL("./BoardFrame.tsx", import.meta.url), "utf8");

  assert.match(source, /interactive\?: boolean/);
  assert.match(source, /interactive = true/);
  assert.match(source, /if \(!interactive\) \{\s*return;/);
  assert.match(source, /onPointerDown=\{interactive \? handlePointerDown : undefined\}/);
  assert.match(source, /role=\{interactive \? "application" : "group"\}/);
});
```

Keep the existing tests for immediate pointer pan, wheel zoom, drag-time wheel
suppression, measurement, and grid alignment unchanged.

**Step 2: Run the focused test and verify it fails**

Run:

```bash
pnpm exec tsx --test apps/web/src/components/board/BoardFrame.test.ts
```

Expected: FAIL because `BoardFrameProps` does not yet expose `interactive` and
the frame always installs its interaction behavior.

**Step 3: Implement the minimal static mode**

Extend the props without changing the current default:

```ts
interface BoardFrameProps {
  children: ReactNode;
  className?: string;
  disableWheelZoom?: boolean;
  interactive?: boolean;
  ariaLabel?: string;
}
```

Default `interactive` to `true` and `ariaLabel` to `undefined`. In the wheel
effect, return before registering the listener when `interactive` is false:

```ts
useEffect(() => {
  if (!interactive) {
    return;
  }

  const frame = frameRef.current;
  // Keep the existing wheel handler and cleanup unchanged.
}, [disableWheelZoom, interactive, viewport.zoom, zoomAt]);
```

Guard `handlePointerDown` before pointer capture, and only bind pointer handlers
in interactive mode:

```tsx
onPointerDown={interactive ? handlePointerDown : undefined}
onPointerMove={interactive ? handlePointerMove : undefined}
onPointerUp={interactive ? handlePointerUp : undefined}
onPointerCancel={interactive ? handlePointerUp : undefined}
role={interactive ? "application" : "group"}
aria-label={
  ariaLabel ?? (interactive ? "Interactive board frame" : "Static board illustration")
}
```

Apply `touch-none select-none` only in interactive mode. Keep frame measurement,
clipping, dot-grid texture, and visual styling shared by both modes. Do not reuse
`disableWheelZoom` for this feature: that existing flag intentionally consumes
the wheel during a different drag, while a static styleguide frame must allow
normal page scrolling.

**Step 4: Run the focused test and verify it passes**

Run:

```bash
pnpm exec tsx --test apps/web/src/components/board/BoardFrame.test.ts
```

Expected: PASS.

**Step 5: Commit the board primitive change**

```bash
git add apps/web/src/components/board/BoardFrame.tsx apps/web/src/components/board/BoardFrame.test.ts
git commit -m "feat(web): support static board frames"
```

### Task 2: Build pure fixtures for the teaching examples

**Files:**
- Create: `apps/web/src/routes/styleguideBoardExamples.ts`
- Create: `apps/web/src/routes/styleguideBoardExamples.test.ts`

**Step 1: Write failing fixture tests**

Define the intended exported shape in the test:

```ts
import {
  canonicalBoardExample,
  layoutRecipeExamples,
  rulesIllustrationExample,
  spaceshipCompositionExample,
} from "./styleguideBoardExamples";
```

Add behavior-level assertions:

```ts
test("styleguide board recipes cover every shared layout helper", () => {
  assert.deepEqual(
    layoutRecipeExamples.map((example) => example.layout),
    ["flex", "stack", "deck", "pile", "fan"],
  );
  for (const example of layoutRecipeExamples) {
    assert.ok(example.items.length > 0);
    assert.equal(new Set(example.items.map((item) => item.id)).size, example.items.length);
  }
});

test("worked examples remain flat and inside their virtual boards", () => {
  for (const example of [
    canonicalBoardExample,
    spaceshipCompositionExample,
    rulesIllustrationExample,
  ]) {
    for (const item of example.items) {
      assert.ok(item.x >= 0 && item.y >= 0);
      assert.ok(item.x + item.width <= example.boardSize.width);
      assert.ok(item.y + item.height <= example.boardSize.height);
    }
  }
});

test("spaceship composition layers effects, owners, devices, and tokens", () => {
  const byId = new Map(
    spaceshipCompositionExample.items.map((item) => [item.id, item]),
  );
  assert.ok(byId.get("spaceship-effect")!.zIndex! < byId.get("spaceship-location")!.zIndex!);
  assert.ok(byId.get("spaceship-location")!.zIndex! < byId.get("spaceship-device")!.zIndex!);
  assert.ok(byId.get("spaceship-location")!.zIndex! < byId.get("spaceship-energy-token")!.zIndex!);
});
```

Avoid a full coordinate snapshot. The layout helper suites already own exact
geometry; this test should protect the teaching contract, containment, flatness,
and representative z-order.

**Step 2: Run the fixture test and verify it fails**

Run:

```bash
pnpm exec tsx --test apps/web/src/routes/styleguideBoardExamples.test.ts
```

Expected: FAIL because the fixture module does not exist.

**Step 3: Implement the route-adjacent fixture module**

Use the existing board types and every existing layout helper:

```ts
import type { BoardItemInput, BoardSize } from "../lib/board/boardController";
import {
  deckLayout,
  fanLayout,
  flexLayout,
  pileLayout,
  stackLayout,
  type BoardLayoutItemBox,
  type BoardLayoutResult,
} from "../lib/board/boardLayout";

export interface StyleguideBoardExample {
  id: string;
  boardSize: BoardSize;
  items: BoardItemInput[];
}

export interface StyleguideLayoutRecipe extends StyleguideBoardExample {
  layout: "flex" | "stack" | "deck" | "pile" | "fan";
  useWhen: string;
  keyOptions: string;
}
```

Add a small conversion helper that maps a `BoardLayoutResult` to flat
`BoardItemInput[]`, copying `id`, `x`, `y`, `width`, `height`, `zIndex`, and
`rotation`. Titles and short bodies may be assigned by item id so the default
`Board` renderer makes the five layout recipes self-explanatory.

Build and export:

- `layoutRecipeExamples`: one result each from `flexLayout`, `stackLayout`,
  `deckLayout`, `pileLayout`, and `fanLayout`;
- `canonicalBoardExample`: placements for a Location, catalog card, Actor,
  Counter, and Token;
- `spaceshipCompositionExample`: flat placements with stable ids
  `spaceship-effect`, `spaceship-location`, `spaceship-device`,
  `spaceship-energy-token`, `spaceship-actor-token`, and
  `spaceship-actor-card`;
- `rulesIllustrationExample`: a compact Location + Counter + Actor + Outcome
  hand composition suitable for a captioned rulebook figure.

Use `flexLayout` to compose rows and `stackLayout` for ownership overlays and
header peeks, then append their placements into one flat array. Give each
example a tightly bounded virtual board with modest outer padding so the
provider can refit it responsively. Do not import React, spaceship persistence,
drag state, or server DTOs.

**Step 4: Run the fixture and existing layout tests**

Run:

```bash
pnpm exec tsx --test apps/web/src/routes/styleguideBoardExamples.test.ts apps/web/src/lib/board/boardLayout.test.ts
```

Expected: PASS.

**Step 5: Commit the pure fixture layer**

```bash
git add apps/web/src/routes/styleguideBoardExamples.ts apps/web/src/routes/styleguideBoardExamples.test.ts
git commit -m "feat(web): add board teaching fixtures"
```

### Task 3: Build the static `/styleguide/board` page

**Files:**
- Create: `apps/web/src/routes/StyleguideBoardPage.test.ts`
- Create: `apps/web/src/routes/StyleguideBoardPage.tsx`

**Step 1: Write the failing page contract test**

Read the new route source and require the approved sections and real component
imports:

```ts
test("StyleguideBoardPage teaches static board composition", () => {
  const source = readFileSync(
    new URL("./StyleguideBoardPage.tsx", import.meta.url),
    "utf8",
  );

  for (const heading of [
    "Board anatomy",
    "Layout recipes",
    "Canonical game components",
    "Spaceship-derived composition",
    "Rules illustration recipe",
  ]) {
    assert.match(source, new RegExp(heading));
  }

  assert.match(source, /<BoardProvider/);
  assert.match(source, /<BoardFrame[^>]*interactive=\{false\}/);
  assert.match(source, /<Board/);
  assert.match(source, /GameCardView/);
  assert.match(source, /CardBoundary/);
  assert.match(source, /LocationCard/);
  assert.match(source, /ActorCard/);
  assert.match(source, /CounterCard/);
  assert.match(source, /<Token/);
  assert.match(source, /ShipLocationCardSurface/);
  assert.match(source, /ShipEffectCardSurface/);
  assert.match(source, /EnergyToken/);
  assert.match(source, /ActorToken/);
  assert.doesNotMatch(source, /spaceshipBoardStateApi/);
  assert.doesNotMatch(source, /mightyDecksSpaceship/);
});
```

This test intentionally checks component selection and teaching content, not
Tailwind classes or exact DOM nesting.

**Step 2: Run the focused page test and verify it fails**

Run:

```bash
pnpm exec tsx --test apps/web/src/routes/StyleguideBoardPage.test.ts
```

Expected: FAIL because the route component does not exist.

**Step 3: Add the reusable local static-example wrapper**

Inside `StyleguideBoardPage.tsx`, add a route-local wrapper rather than a new
shared abstraction:

```tsx
const StaticBoardExample = ({
  example,
  ariaLabel,
  renderItem,
}: {
  example: StyleguideBoardExample;
  ariaLabel: string;
  renderItem?: (item: BoardItemRecord) => ReactNode;
}): JSX.Element => (
  <BoardProvider boardSize={example.boardSize} initialItems={example.items}>
    <BoardFrame
      interactive={false}
      ariaLabel={ariaLabel}
      className="h-[18rem] w-full sm:h-[22rem]"
    >
      <Board renderItem={renderItem} />
    </BoardFrame>
  </BoardProvider>
);
```

Keep this helper route-local until a second production page needs the identical
wrapper. The shared capability is `BoardFrame`'s static mode, not a speculative
illustration framework.

**Step 4: Render canonical pieces through the board item renderer**

Add a small `ResolvedBoardCard` helper that calls `resolveGameCard`, returns
`null` when the fixture slug is invalid, and otherwise renders:

```tsx
<CardBoundary label={`${gameCard.type} board example failed`}>
  <GameCardView gameCard={gameCard} className="w-full" />
</CardBoundary>
```

Implement renderers keyed by the stable fixture item ids. Use:

- `LocationCard` for the generic/rules Location;
- `GameCardView` for known catalog Effect, Asset, Stunt, and Outcome examples;
- `ActorCard` and `CounterCard` for tracked pieces;
- `Token` for generic actor/table markers;
- `ShipLocationCardSurface`, `ShipEffectCardSurface`, the existing Device
  `AssetCard` surface, `EnergyToken`, `ActorToken`, and
  `SpaceshipActorCardSurface` for the spaceship worked example.

Source the spaceship component props from a small, read-only slice of the local
`spaceshipScene` fixture or an equivalent typed local object. Do not render
`SpaceshipBoard`, `SpaceshipBoardItem`, drag surfaces, dispensers, save/restore
controls, or the card library.

**Step 5: Compose the approved teaching page**

Follow the existing styleguide route shell:

```tsx
<div className="styleguide-board-page app-shell stack gap-8 py-8">
  <StyleguideSectionNav />
  {/* Heading and introduction */}
  {/* Board anatomy */}
  {/* Layout recipes */}
  {/* Canonical game components */}
  {/* Spaceship-derived composition */}
  {/* Rules illustration recipe and checklist */}
  <StyleguideBackLink />
</div>
```

Use `Heading` and `Text` for hierarchy and copy. Use ordinary semantic
`section`/layout wrappers around the already-heavy board frames; reserve one
`Panel` for the final authoring checklist rather than nesting every example in
another frame.

For each layout recipe, show `useWhen`, `keyOptions`, and one common mistake.
The board anatomy copy must explicitly state that route controls remain outside
the transformed board. The rules recipe must explain captions, responsive
fitting, canonical component reuse, and flat placements.

**Step 6: Run the focused page test and web typecheck**

Run:

```bash
pnpm exec tsx --test apps/web/src/routes/StyleguideBoardPage.test.ts
pnpm -C apps/web typecheck
```

Expected: both PASS.

**Step 7: Commit the page**

```bash
git add apps/web/src/routes/StyleguideBoardPage.tsx apps/web/src/routes/StyleguideBoardPage.test.ts
git commit -m "feat(web): add board styleguide page"
```

### Task 4: Register and document the route

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/routes/StyleguideRoutes.test.ts`
- Modify: `apps/web/src/components/styleguide/StyleguideSectionNav.tsx`
- Modify: `apps/web/src/components/styleguide/StyleguideSectionNav.test.ts`
- Modify: `docs/04-ui-components.md` in the `/styleguide` section
- Modify: `docs/23-board-view-prototype.md` near the route overview and interaction model
- Modify: `CHANGELOG.md` under `## [Unreleased]`

**Step 1: Extend the route and navigation tests first**

In `StyleguideRoutes.test.ts`, require the lazy page symbol, route path, and
route boundary:

```ts
assert.match(source, /StyleguideBoardPage/);
assert.match(source, /path="\/styleguide\/board"/);
assert.match(
  source,
  /path="\/styleguide\/board"[\s\S]*<RouteShellBoundary>[\s\S]*<StyleguideBoardPage \/>[\s\S]*<\/RouteShellBoundary>/,
);
```

In `StyleguideSectionNav.test.ts`, add:

```ts
assert.match(source, /\/styleguide\/board/);
assert.match(source, /Board/);
```

**Step 2: Run the registration tests and verify they fail**

Run:

```bash
pnpm exec tsx --test apps/web/src/routes/StyleguideRoutes.test.ts apps/web/src/components/styleguide/StyleguideSectionNav.test.ts
```

Expected: FAIL because the page is not yet reachable or linked.

**Step 3: Register the lazy route**

Add the lazy import beside the other styleguide pages:

```ts
const StyleguideBoardPage = lazy(async () => ({
  default: (await import("./routes/StyleguideBoardPage")).StyleguideBoardPage,
}));
```

Register `/styleguide/board` inside the normal page layout, using the same
`RouteShellBoundary` as other styleguide routes. Do not place it in the
headerless full-screen layout used by `/board` and `/spaceship`.

**Step 4: Add the styleguide navigation item**

Add a `Board` entry after `Cards` so component surfaces and board composition
remain adjacent:

```ts
{
  to: "/styleguide/board",
  label: "Board",
  activePaths: ["/styleguide/board"],
},
```

**Step 5: Update documentation and changelog**

In `docs/04-ui-components.md`:

- add `StyleguideBoardPage`, `BoardProvider`, `BoardFrame`, and `Board` to the
  relevant styleguide component inventory;
- document `/styleguide/board` as the read-only board composition reference;
- note that examples use local fixtures and canonical components.

In `docs/23-board-view-prototype.md`:

- add `/styleguide/board` beside `/board` and `/spaceship`;
- distinguish the static teaching route from the interactive labs;
- record `interactive={false}` as the supported illustration mode and repeat
  the flat-item/layout-helper rule.

Add under `CHANGELOG.md` `## [Unreleased]`:

```md
- Web: add a read-only `/styleguide/board` reference for composing board and rulebook illustrations from shared layouts, canonical cards, tokens, and spaceship surfaces.
```

**Step 6: Run focused route, navigation, page, fixture, and board tests**

Run:

```bash
pnpm exec tsx --test apps/web/src/components/board/BoardFrame.test.ts apps/web/src/routes/styleguideBoardExamples.test.ts apps/web/src/routes/StyleguideBoardPage.test.ts apps/web/src/routes/StyleguideRoutes.test.ts apps/web/src/components/styleguide/StyleguideSectionNav.test.ts
```

Expected: PASS.

**Step 7: Run repository validation**

Run:

```bash
pnpm check:agent
```

Expected: PASS; full output is stored under `.agent-logs/`.

Run a root build only if the check exposes a build-only concern:

```bash
pnpm build:agent
```

Expected: PASS; full output is stored under `.agent-logs/`.

**Step 8: Verify the route in a browser**

Use the `webapp-testing` skill against `/styleguide/board`. Verify at desktop
and a narrow mobile viewport:

- all five approved teaching sections render;
- every board example remains contained and legible;
- wheel input over an example scrolls the page instead of zooming the board;
- dragging over an example does not pan or capture the pointer;
- canonical cards and tokens keep their normal appearance;
- the spaceship example visibly demonstrates effect-behind-owner,
  device-above-Location, and token-above-card layering;
- the page has no horizontal overflow and no console errors.

During this check, also note whether the pre-existing `/spaceship` maximum
update-depth warning remains reproducible. Do not fix it in this feature unless
the new static route causes the same warning; report it separately if it is
unrelated.

**Step 9: Commit route registration and documentation**

```bash
git add apps/web/src/App.tsx apps/web/src/routes/StyleguideRoutes.test.ts apps/web/src/components/styleguide/StyleguideSectionNav.tsx apps/web/src/components/styleguide/StyleguideSectionNav.test.ts docs/04-ui-components.md docs/23-board-view-prototype.md CHANGELOG.md
git commit -m "docs: register board styleguide reference"
```

**Step 10: Confirm the worktree contains no unintended changes**

Run:

```bash
git status --short
```

Expected: only changes that predated this implementation remain. In the current
workspace, preserve the unrelated modification to
`apps/server/output/adventure-artifacts/index.json`; do not stage or alter it as
part of this feature.
