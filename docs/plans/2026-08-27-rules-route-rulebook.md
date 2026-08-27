# Rules Route Rulebook Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the `/rules` landing stub with a complete, navigable Mighty Decks rulebook sourced from `docs/mighty-decks-rulebook.md`, illustrated with existing game components, and presented with session-style `Message` examples for player actions.

**Architecture:** Keep `/rules` as one canonical long-form reading page with stable fragment links and a responsive table of contents. Import the rulebook Markdown as raw text, split it into a small typed document model, and render ordinary prose with the existing Markdown stack while substituting curated React components for action examples and instructional illustrations. Preserve `/rules/outcomes`, `/rules/effects`, `/rules/stunts`, `/rules/assets`, and `/rules/ship-combat` as supporting component-reference tabs.

**Tech Stack:** React 18, TypeScript, React Router, `react-markdown`, `remark-gfm`, Tailwind, CSS Modules, existing Mighty Decks `Heading`, `Text`, `Message`, card, token, and scene components, Node test runner with `tsx`, Playwright for final browser verification.

---

## Product and content decisions

- Treat `docs/mighty-decks-rulebook.md` as the canonical prose source. Do not copy all 44 KB of text into TSX.
- Render sections 1–27, section 29 (Quick Reference), and the closing Design Philosophy. Do not render section 28, “Recommended Instructional Illustrations,” as reader-facing rules; use it as the implementation brief for the composed illustrations.
- Omit the opening “Draft rules text” editorial note from the public page.
- Keep the rulebook on one route so browser find, printing, copying, and direct fragment links work naturally.
- Add a `Rulebook` tab pointing to `/rules` with exact matching. Existing component-library and ship-combat routes remain unchanged.
- Group the table of contents into eight scannable topics while retaining a stable anchor for every numbered section:
  1. Start Here (1–4)
  2. Outcomes & Effect (5–8)
  3. Characters & Components (9–11)
  4. Scenes & Turns (12–14)
  5. Conflict & Recovery (15–19)
  6. Counters & Storytelling (20–25)
  7. Optional Rules & Storyteller (26–27)
  8. Quick Reference (29 and Design Philosophy)
- Use a sticky left-side contents rail on wide screens and the same links inside a compact `<details>` jump menu above the article on small screens. Use native anchors and `scroll-margin` rather than adding scroll-spy state in the first slice.
- Present example exchanges with the same `Message` vocabulary used by `/styleguide/session-chat-player`: player messages use the player/fire treatment and align right; Storyteller messages use gold and align left; mechanical resolution notes use cloth and align left.
- Illustrations must be DOM compositions of existing components, not new generated images or screenshots.

## Alternatives considered

1. **Recommended: one Markdown-backed rulebook with curated component overrides.** It preserves a single prose source, supports direct anchors, and limits bespoke TSX to examples and illustrations.
2. **Split chapters into nested routes.** This reduces page length but makes browser find, printing, and cross-section reading worse, and would expand the existing route/tab hierarchy substantially.
3. **Rewrite the entire rulebook as TSX.** This gives total layout control but duplicates the source text and makes future rules edits easy to miss.

## Proposed file map

- Modify: `apps/web/src/routes/RulesLayoutPage.tsx`
- Replace: `apps/web/src/routes/RulesIndexPage.tsx`
- Create: `apps/web/src/routes/RulesIndexPage.test.tsx`
- Create: `apps/web/src/components/rules/RulesTableOfContents.tsx`
- Create: `apps/web/src/components/rules/RulesActionExample.tsx`
- Create: `apps/web/src/components/rules/RulesIllustrations.tsx`
- Create: `apps/web/src/components/rules/RulesRulebookContent.tsx`
- Create: `apps/web/src/components/rules/RulesRulebookContent.module.css`
- Create: `apps/web/src/lib/rulebookDocument.ts`
- Create: `apps/web/src/lib/rulebookDocument.test.ts`
- Modify: `apps/web/src/routes/RulesRoutes.test.ts`
- Modify: `docs/11-mighty-decks-rules.md`
- Modify: `CHANGELOG.md`
- Source/add to version control: `docs/mighty-decks-rulebook.md`

### Task 1: Lock the document model and public section inventory

**Files:**
- Create: `apps/web/src/lib/rulebookDocument.ts`
- Create: `apps/web/src/lib/rulebookDocument.test.ts`

**Step 1: Write the failing parser tests**

Cover these behaviors with the actual raw Markdown fixture:

- all expected numbered sections except 28 are returned in source order;
- section 29 and Design Philosophy remain present after excluding section 28;
- each public section has a unique stable `id` and a navigation group;
- `### Example` and `### Tiny Example` subsections are separately addressable;
- editorial illustration blockquotes and the opening draft note are excluded from ordinary prose;
- a missing or renamed required heading throws a descriptive development-time error instead of silently dropping content.

Use an explicit inventory rather than generating IDs only from heading text:

```ts
export interface RulebookSectionDefinition {
  sourceHeading: string;
  id: string;
  navGroup: RulebookNavGroupId;
  includeInNavigation: boolean;
}
```

**Step 2: Run the targeted test and confirm it fails**

Run:

```powershell
pnpm -C apps/web exec tsx --test src/lib/rulebookDocument.test.ts
```

Expected: FAIL because the parser and inventory do not exist.

**Step 3: Implement the minimal parser**

- Import `docs/mighty-decks-rulebook.md?raw` from the route/content layer; keep the parser itself pure by accepting a string.
- Split on Markdown headings while preserving the body Markdown for `ReactMarkdown`.
- Normalize only editorial material; do not rewrite rules wording in code.
- Export the typed section inventory and the parsed public document.
- Use fixed IDs such as `core-action-loop`, `outcome-cards`, `catastrophe`, `turn-based-play`, `defense`, `counters`, and `quick-reference` so external links survive wording changes.

**Step 4: Run the targeted test and confirm it passes**

Run the command from Step 2.

Expected: PASS with the full public section inventory and no section 28 content.

**Step 5: Commit**

```powershell
git add apps/web/src/lib/rulebookDocument.ts apps/web/src/lib/rulebookDocument.test.ts
git commit -m "feat(web): parse canonical rulebook content"
```

### Task 2: Add responsive, stable rulebook navigation

**Files:**
- Create: `apps/web/src/components/rules/RulesTableOfContents.tsx`
- Modify: `apps/web/src/routes/RulesLayoutPage.tsx`
- Modify: `apps/web/src/routes/RulesRoutes.test.ts`

**Step 1: Write failing navigation assertions**

Extend the route tests to require:

- `{ to: "/rules", label: "Rulebook", end: true }` as the first tab;
- an `aria-label="Rulebook sections"` table of contents;
- links to representative anchors from every group;
- one source list driving both the desktop rail and mobile jump menu;
- the existing Outcomes, Effects, Stunts, Assets, and Ship Combat tabs remaining registered.

**Step 2: Run the targeted tests and confirm they fail**

```powershell
pnpm -C apps/web exec tsx --test src/routes/RulesRoutes.test.ts
```

Expected: FAIL because `/rules` is not yet an exact-match tab and the contents component does not exist.

**Step 3: Implement the table of contents**

- Derive links from the typed section inventory rather than duplicating anchors.
- Render a compact `<details>` menu for small screens and a sticky `<nav>` rail for large screens.
- Use plain fragment links (`href="#catastrophe"`) so keyboard navigation, copy-link behavior, and browser history work without custom routing code.
- Keep the layout unframed; use spacing, `Label`, and typography instead of nesting multiple `Panel` components.
- Add a visually clear `:target` treatment and `scroll-margin-top` on section wrappers.

**Step 4: Add the Rulebook tab and update route introduction copy**

Change the subtitle from “markdown authoring” language to reader-facing rules language while leaving specialized reference pages available.

**Step 5: Re-run the targeted tests**

Expected: PASS.

**Step 6: Commit**

```powershell
git add apps/web/src/components/rules/RulesTableOfContents.tsx apps/web/src/routes/RulesLayoutPage.tsx apps/web/src/routes/RulesRoutes.test.ts
git commit -m "feat(web): add rulebook section navigation"
```

### Task 3: Render formatted rulebook prose from Markdown

**Files:**
- Create: `apps/web/src/components/rules/RulesRulebookContent.tsx`
- Create: `apps/web/src/components/rules/RulesRulebookContent.module.css`
- Replace: `apps/web/src/routes/RulesIndexPage.tsx`
- Create: `apps/web/src/routes/RulesIndexPage.test.tsx`

**Step 1: Write the failing render tests**

Assert that the page:

- imports the canonical Markdown with `?raw`;
- renders the responsive contents component and an `<article>`;
- creates semantic section wrappers with stable IDs;
- maps paragraphs, lists, tables, strong text, code, links, and blockquotes through the existing visual system;
- does not expose “Draft rules text” or “Recommended Instructional Illustrations”;
- includes Quick Reference and Design Philosophy.

Prefer render assertions for user-visible headings and links over brittle Tailwind-class snapshots.

**Step 2: Run the targeted test and confirm it fails**

```powershell
pnpm -C apps/web exec tsx --test src/routes/RulesIndexPage.test.tsx
```

Expected: FAIL because `/rules` still renders the stub.

**Step 3: Implement the article renderer**

- Use `ReactMarkdown` with `remarkGfm` for the stored section bodies.
- Render section titles outside Markdown with `Heading`/`Text`, using the parsed heading level and a wrapping `<section id="…">`.
- Map Markdown paragraphs to `Text`, tables to a horizontally scrollable semantic table, blockquotes to `Message` or `Text variant="quote"` according to their content, and inline code to the established code styling.
- Use one route-level reading surface; do not wrap every chapter in `Panel`.
- Constrain prose measure to roughly 65–75 characters while allowing illustrations and tables to use the full article column.
- Add print styles that hide tabs/contents, remove decorative shadows, keep cards from breaking across pages where practical, and preserve headings with following content.

**Step 4: Compose the route**

`RulesIndexPage` should create the two-column rulebook layout, render `RulesTableOfContents`, and pass the parsed document into `RulesRulebookContent`.

**Step 5: Re-run the targeted test**

Expected: PASS.

**Step 6: Commit**

```powershell
git add apps/web/src/components/rules/RulesRulebookContent.tsx apps/web/src/components/rules/RulesRulebookContent.module.css apps/web/src/routes/RulesIndexPage.tsx apps/web/src/routes/RulesIndexPage.test.tsx
git commit -m "feat(web): render the Mighty Decks rulebook"
```

### Task 4: Convert action examples to session-style Message exchanges

**Files:**
- Create: `apps/web/src/components/rules/RulesActionExample.tsx`
- Modify: `apps/web/src/components/rules/RulesRulebookContent.tsx`
- Modify: `apps/web/src/routes/RulesIndexPage.test.tsx`

**Step 1: Write failing example tests**

Require representative examples—Basic Action, Partial Success, Effect Is Impact, Defense, Catastrophe, and Counter progress—to render with `Message`. Verify player, Storyteller, and Rules labels and that the player entry is aligned to the end while Storyteller/Rules entries align to the start.

**Step 2: Run the targeted render test and confirm it fails**

Use the Task 3 test command.

Expected: FAIL because examples are still plain Markdown.

**Step 3: Implement a reusable example transcript**

Define a small presentational model:

```ts
type RuleExampleTurn = {
  speaker: "player" | "storyteller" | "rules";
  label: string;
  body: ReactNode;
};
```

- Render `Message` directly, matching `/styleguide/session-chat-player` tone and alignment conventions.
- Keep card names and Effect totals formatted inside message bodies; embed existing `GameCardView` only when the source example explicitly shows a played card.
- Keep examples static and non-interactive. Do not reuse the full scrolling `CampaignSessionTranscriptFeed`, which would add session state and scroll behavior to a rulebook callout.
- Use a keyed override map for example subsections; ordinary prose continues to come from Markdown.
- Cover every example involving a player action, not just examples containing quoted Storyteller dialogue.

**Step 4: Re-run the targeted render test**

Expected: PASS.

**Step 5: Commit**

```powershell
git add apps/web/src/components/rules/RulesActionExample.tsx apps/web/src/components/rules/RulesRulebookContent.tsx apps/web/src/routes/RulesIndexPage.test.tsx
git commit -m "feat(web): present rule examples as table messages"
```

### Task 5: Build instructional illustrations from existing components

**Files:**
- Create: `apps/web/src/components/rules/RulesIllustrations.tsx`
- Modify: `apps/web/src/components/rules/RulesRulebookContent.tsx`
- Modify: `apps/web/src/components/rules/RulesRulebookContent.module.css`
- Modify: `apps/web/src/routes/RulesIndexPage.test.tsx`

**Step 1: Write failing illustration tests**

Assert that the rulebook mounts named illustrations at the relevant sections and that the illustration module imports existing components such as `OutcomeCard`/`GameCardView`, `AssetCard`, `CounterCard`, `ActorCard`, `LocationCard`, `Token`, and `CardBoundary` rather than introducing parallel card markup.

**Step 2: Run the targeted render test and confirm it fails**

Expected: FAIL because instructional compositions do not exist.

**Step 3: Implement the eight rulebook compositions**

Build these static, responsive figures from the existing component catalog:

1. **Complete table setup** near “What You Need to Play”: compact player lanes with Outcome hands, Stunts, Assets, Effects, shared Locations, an Actor, and a Counter/Toughness marker.
2. **Composed Asset / total Effect equation** near Assets: base Asset + modifier + Stunt + Success, ending in `4 Effect`.
3. **Actor initiative** near Actor Turns: player positions, Actor cards/tokens, and a clear turn-order path.
4. **Zones and range** near Range: three Location cards with Actor tokens and melee/thrown/ranged reach annotations.
5. **Remaining Toughness** near Actors: the same Actor shown at 3, 1, and 0/Taken Out with Injury and Distress labels.
6. **Counter tracking** near Counters: a `3/4` Counter beside an Actor with `1` remaining Toughness, clarifying that the marker meaning comes from the card.
7. **Catastrophe flow** near Catastrophe: resolved Success, replacement draw, three Fumbles, then Injury/Asset Complication/enemy Boost branches.
8. **Effect equation** as a compact reusable strip where Effect stacking is explained; reuse the same primitive from the composed Asset figure instead of duplicating markup.

Implementation constraints:

- Resolve canonical game cards through `resolveGameCard` and wrap them in `CardBoundary`.
- Use existing artwork and component data only; do not add image-generation work or new dependencies.
- Render figures with `<figure>`/`<figcaption>` and a concise accessible summary. Decorative arrows should be hidden from assistive technology.
- On narrow screens, convert horizontal flows to stacked sequences and keep card text readable; do not solve overflow by shrinking cards below legibility.
- Keep the compositions read-only and separate from draggable `/board` state.

**Step 4: Re-run the targeted tests**

Expected: PASS.

**Step 5: Commit**

```powershell
git add apps/web/src/components/rules/RulesIllustrations.tsx apps/web/src/components/rules/RulesRulebookContent.tsx apps/web/src/components/rules/RulesRulebookContent.module.css apps/web/src/routes/RulesIndexPage.test.tsx
git commit -m "feat(web): illustrate the rulebook with game components"
```

### Task 6: Reconcile documentation and changelog

**Files:**
- Source/add: `docs/mighty-decks-rulebook.md`
- Modify: `docs/11-mighty-decks-rules.md`
- Modify: `CHANGELOG.md`

**Step 1: Remove the duplicate rules-authority ambiguity**

- Keep `docs/mighty-decks-rulebook.md` as the full canonical rulebook.
- Replace the stale duplicated prose in `docs/11-mighty-decks-rules.md` with a short pointer to the canonical rulebook plus a note that `/rules` renders the public subset and `/rules/ship-combat` remains a separate prototype reference.
- Do not silently merge ship-combat prototype rules into the canonical core rulebook unless the product owner explicitly asks for that rules change.

**Step 2: Add the changelog entry**

Under `## [Unreleased]` → `### Added`, add a concise Web bullet for the full anchored rulebook, component-composed illustrations, and Message-based examples.

**Step 3: Review the diff for unintended edits**

```powershell
git diff -- docs/mighty-decks-rulebook.md docs/11-mighty-decks-rules.md CHANGELOG.md
```

Expected: only canonical-source documentation and the new changelog bullet differ.

**Step 4: Commit**

```powershell
git add docs/mighty-decks-rulebook.md docs/11-mighty-decks-rules.md CHANGELOG.md
git commit -m "docs: establish the canonical Mighty Decks rulebook"
```

### Task 7: Validate behavior, accessibility, responsiveness, and build health

**Files:**
- Test only; create a temporary Playwright script under the OS temp directory if needed.

**Step 1: Run focused rulebook tests**

```powershell
pnpm -C apps/web exec tsx --test src/lib/rulebookDocument.test.ts src/routes/RulesIndexPage.test.tsx src/routes/RulesRoutes.test.ts
```

Expected: all focused tests PASS.

**Step 2: Run the token-optimized repository checks**

```powershell
pnpm check:agent
pnpm build:agent
```

Expected: both commands exit 0. Refer to the generated `.agent-logs/` files if either wrapper reports a failure.

**Step 3: Perform browser verification using `webapp-testing`**

First inspect the helper usage:

```powershell
python .codex/skills/webapp-testing/scripts/with_server.py --help
```

Then run the Vite app through the helper and a headless Chromium script. Verify:

- `/rules` renders all eight navigation groups and the opening rulebook content;
- clicking `#catastrophe`, `#defense`, `#counters`, and `#quick-reference` updates the URL fragment and places the target heading in view;
- the Rulebook tab is active only on `/rules`, while existing child tabs remain active on their own routes;
- player action examples visibly use player/Storyteller/Rules `Message` treatments;
- illustrations contain readable existing cards at desktop and phone widths;
- mobile contents use the compact jump menu and do not cause horizontal page overflow;
- browser console has no errors or missing-asset warnings;
- print preview omits navigation chrome and keeps the article readable.

Capture one desktop and one phone-width screenshot under `.agent-logs/` for review.

**Step 4: Inspect the final diff and workspace state**

```powershell
git status --short
git diff --check
```

Expected: no whitespace errors; unrelated adventure-artifact changes remain untouched.

**Step 5: Final commit for verification-only fixes, if needed**

```powershell
git add apps/web/src docs CHANGELOG.md
git commit -m "fix(web): polish rulebook reading layout"
```

Skip this commit if verification required no edits.

## Acceptance criteria

- `/rules` is a complete reader-facing rulebook, not a stub or authoring-only card catalog.
- All public rules content comes from `docs/mighty-decks-rulebook.md`; section 28 and draft/layout notes are not exposed.
- Every numbered public section has a stable, keyboard-accessible fragment link.
- Navigation is sticky and scannable on desktop and compact on mobile.
- Every example involving player action is presented with the existing `Message` component language from the player session chat.
- Instructional figures are compositions of existing cards, tokens, locations, and boundaries, with no new generated art.
- Existing rules reference routes continue to work.
- Focused tests, `pnpm check:agent`, `pnpm build:agent`, and browser verification all pass.
- Docs and `CHANGELOG.md` identify the canonical rulebook and the new public route behavior.
