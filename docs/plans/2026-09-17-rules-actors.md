# Generic Actor Cards Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add `/rules/actors` as a readable reference for generic core Actor bases, tactical roles, and tactical specials. Medieval Actor support is deferred until the package publishes a canonical catalog.

**Architecture:** Build a static core-Actor reference page inside the existing Rules layout, using the pinned `@mighty-decks/components` catalog and card renderer. Reuse the existing Actor composition figure. Keep canonical card content and reusable rendering in the components package; the app owns grouping, navigation, and reader-facing context. Defer medieval Actors until the package exports their canonical catalog.

**Tech Stack:** React, TypeScript, React Router, existing Tailwind/shared UI primitives, `@mighty-decks/components`, Node test runner via `tsx`.

**Status:** Implement core catalog reference. Medieval Actor content is deferred in `docs/TODO.md` until the package publishes a canonical roster with grouping metadata. Work in the current directory; no worktree required.

---

## Findings and scope

Verified against the installed package and consumer source on 2026-09-17:

- `apps/web/src/App.tsx` and `RulesLayoutPage.tsx` have no Actors child route or tab.
- The package exports `cardCatalog`, `CatalogCard`, `getCard`, and React `GameCard`.
- Its Actor catalog contains 44 `actor-base`, 16 `actor-role`, and 24 `actor-special` entries. These entries do not currently expose `deck` metadata.
- There are no medieval Actor entries in the installed catalog. Medieval Assets are a different card type and cannot stand in for Actors; track this package prerequisite in `docs/TODO.md`.
- `RulesCardComposition.tsx` already renders `ActorCompositionFigure` using canonical package part cards and the local assembled `ActorCard`.
- `resolveGameCard("ActorCard", ...)` resolves module-authored Actors; it does not resolve generic catalog parts. Use the package `GameCard` directly for these parts, as the existing figure does, with `CardBoundary` around each card.
- The canonical rules are imported from `@mighty-decks/components/docs/en/mighty-decks-rulebook.md`. Despite stale guidance in the rules skill, this repository no longer contains a local rulebook mirror or a `docs:rules:check` command.

Assumption: “generic Actor cards” means a browsable card reference, rather than a new Actor editor or every possible base/role/special combination.

## Proposed experience

Add an **Actors** tab before Assets. The page begins with “Actor Cards,” a short explanation, a link to `/rules#building-an-actor-card`, and the existing composition figure.

Provide anchor links to three sections:

1. **Core — Base:** illustration/background cards; no invented combat stats.
2. **Core — Tactical Role:** cards supplying the role title and mechanics.
3. **Core — Tactical Special:** optional modifiers, shown as their actual cards.

Use the same responsive grid and restrained framing as adjacent Rules pages. Show all unique catalog entries once; retain color variants as distinct cards. Give cards readable names and descriptions where the source provides them, including accessible text for icon-heavy mechanics. Keep card proportions and use `CardBoundary` so an isolated render failure does not remove the catalog.

Explain that base + role forms a complete Actor and special is optional. NPC Actors use fixed Effects. Link to the canonical rulebook for details instead of creating a competing rules explanation.

### Approach selection

- **Recommended: static grouped catalog plus the existing composition example.** Covers the request with existing components and minimal state.
- **Interactive composer plus catalog:** useful for trying combinations, but adds selection state and testing beyond the requested reference page. Defer.
- **Pre-rendered image gallery:** possible, but introduces image sizing/loading concerns and less accessible card text. Prefer the existing React renderer unless measurement identifies a performance problem.

No new server events, persistence, shortcode formats, authoring callbacks, search/filter system, or dependencies are needed for the proposed page.

## Task 1: Defer medieval Actor content

The package currently provides no canonical medieval Actor cards or grouping metadata. Do not add a placeholder section or infer content from medieval Assets. Record the dependency in `docs/TODO.md` and add the reference section only when the package exposes a canonical medieval Actor roster.

## Task 2: Project the package catalog into reference sections

**Create:**
- `apps/web/src/data/rulesActors.ts`
- `apps/web/src/data/rulesActors.test.ts`

1. Define three ordered page groups using `CatalogCard` entries. Keep grouping and short section descriptions here; keep card rules and artwork in the package.
2. Select core cards by their package families and, once introduced, explicit set metadata. Preserve canonical catalog ordering within each group. Use `card.id` as the stable identity, since family slugs can overlap.
3. Add focused tests proving every core Actor entry appears exactly once and unrelated families are excluded. The current core baseline is 44/16/24; revise only for intentional upstream changes.
4. Run `rtk pnpm -C apps/web exec tsx --test src/data/rulesActors.test.ts` and verify the assertions pass.

Only add shared `spec` contracts if the upstream work actually changes shared consumer contracts. A page-local projection alone does not require a server or spec change.

## Task 3: Build the page and wire navigation

**Create:** `apps/web/src/routes/RulesActorsPage.tsx`

**Modify:**
- `apps/web/src/App.tsx`
- `apps/web/src/routes/RulesLayoutPage.tsx`

**Reuse:**
- `apps/web/src/components/rules/RulesCardComposition.tsx` — `ActorCompositionFigure`
- `apps/web/src/components/common/CardBoundary.tsx`
- `apps/web/src/components/common/Text.tsx`
- Package `GameCard` from `@mighty-decks/components/react`

1. Render the intro, composition example, and section anchor navigation.
2. Render the three catalog sections from Task 2. Pass each entry's family and slug to `GameCard`; give its boundary a stable reset key and a meaningful failure label.
3. Use actual section headings and labelled anchor navigation. Ensure card titles and source descriptions remain available to readers of assistive technology; inspect the package's accessible output before adding duplicate labels.
4. Add a lazy `RulesActorsPage` import matching neighboring routes, then `<Route path="actors" element={<RulesActorsPage />} />` under the Rules parent.
5. Add `{ to: "/rules/actors", label: "Actors" }` before Assets in `rulesTabs`.

Keep rendering presentational. Do not add module authoring controls or invent generic `@actor` shortcodes, because those currently identify module Actors.

## Task 4: Validate the complete route

1. Run the focused catalog test from Task 2.
2. Run `rtk pnpm check:agent`, then `rtk pnpm build:agent`. Confirm both succeed; inspect detailed `.agent-logs/` output only if needed.
3. Use the browser/webapp-testing skill during implementation to open `/rules/actors` directly and through the Actors tab. Verify direct reload, tab active state, and navigation to/from sibling Rules pages.
4. Check desktop and narrow mobile widths: all three sections, working anchors, readable cards, no horizontal overflow, and no broken artwork or console errors. Inspect at least one base, role, and special card closely.
5. Verify the illustration still shows Civilian + Minion + optional Fast correctly. Check keyboard access and heading/navigation semantics.

Add automated route/render tests only for meaningful behavior supported by the existing harness. Avoid brittle class-name, source-regex, or DOM-shape tests for the grid. No server test run is needed for a page-only change; broaden validation if upstream/shared contracts change.

## Task 5: Document the delivered behavior

**Modify:**
- `docs/11-mighty-decks-rules.md` — add `/rules/actors` to the component references and identify its content ownership.
- `CHANGELOG.md` — concise `Added` bullet under `[Unreleased]` for the new reference page and covered sets.

If shared `spec` card catalogs change, run `rtk pnpm docs:cards` and commit the regenerated `docs/mighty-decks-card-components.md`. Do not regenerate it merely to describe a new route; it is generated from spec exports.

Review the final diff for unintended lockfile/catalog changes. Handoff notes should state the route, verified core deck counts, checks run, that medieval Actors are deferred in `docs/TODO.md`, and that no environment variables were added.

## Definition of done

- `/rules/actors` loads directly and appears in Rules navigation.
- All 44 current core bases, 16 roles, and 24 specials are represented once.
- Canonical cards, artwork, and mechanics come from the shared package; composition teaching reuses the existing figure. Medieval Actor support remains a documented package prerequisite.
- Responsive layout, accessibility, direct navigation, and card asset loading are verified.
- Relevant checks pass and route documentation/changelog are updated.

Medieval Actor support is intentionally deferred until the shared package exports a canonical roster and grouping metadata.
