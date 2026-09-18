# Rules UI Card Parity Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Resolve every issue in [issues-in-ui.md](issues-in-ui.md): readable description icons, correctly aligned Actor layers, transparent Asset modifiers with correct title treatment, and a temporary hidden route comparing Components and Storyteller renderers.

**Architecture:** First expose the existing rendering paths in a development-only comparison page. Fix reusable card geometry and styling in `@mighty-decks/components`, then consume those fixes through narrow Storyteller adapters. Keep application callbacks and custom-card compatibility in Storyteller; do not introduce a second canonical renderer or patch installed/generated package files.

**Tech Stack:** React 18, TypeScript, Vite, CSS Modules, Tailwind, Node test runner through `tsx`, existing browser verification tooling.

---

## Scope and evidence

This is an implementation plan only. No runtime changes or live-browser reproduction have been performed while writing it. Findings below come from the supplied screenshots and source inspection on 2026-09-18; confirm them in the browser before choosing final geometry values.

Work directly in the current working copies; do not create a worktree. Preserve existing modifications, especially Storyteller's package manifests, lockfile, rules docs, and changelog. The sibling checkout at `D:/projects/mighty-decks-components` exists and has unrelated untracked files. Check its instructions and status before implementing there.

Relevant skills during execution: @mighty-decks-ui-patterns, @mighty-decks-vertical-slice, and @webapp-testing for reproducing these visual regressions. Use @mighty-decks-rules if a fixture or caption requires a rules decision. The installed package's `docs/en/mighty-decks-rulebook.md`, sections 9 and 10, is authoritative; do not restore a local rulebook mirror. The rules skill's `references/core-rules.md` still mentions a removed mirror and must not be followed on that point.

| Reported issue | Observed source path | Implementation implication |
| --- | --- | --- |
| Description icons too small | The first screenshot's Marksman is rendered by `ResolvedCard type="StuntCard" slug="marksman"` in `RulesIllustrations.tsx`, then package `GameCard` through `GameCardView.tsx`. Package `.actorIcons img` currently uses 13px; local Actor icons use 16px. | Cover both the pictured Stunt and Actor cards. CSS dimensions alone do not prove the cause: inspect SVG scaling, fitting, and surrounding text. |
| Minion standalone layer differs from assembled card | `RulesCardComposition.tsx` imports package `GameCard` for the three parts and local `ActorCard` for the assembly. | Compare the two actual rendering paths before fixing layout. Parts and assembly must use matching geometry. |
| Empowered has an opaque background and wrong title color | Local `AssetModifierCard.tsx` passes modifier art/title/effect as `imageUri`/`noun`/`nounEffect` to local `LayeredCard`, which paints paper and a border. | Render a modifier as an overlay with adjective/title/footer placement, not as a complete base card. |
| Need a comparison route | `App.tsx` already uses lazy routes and a shared Suspense boundary. | Add one unlisted, development-only route with matched fixtures and sizes. |

The sibling package source already exposes `transparent` on `LayeredCard`, and its `GameCard` selects it for Actor role/special and Asset modifier families. Do not assume the sibling checkout, installed package, and lockfile are identical. Record their revisions before deciding which changes are missing.

No gameplay, Socket.IO, server state, public DTO, or `spec/` contract changes are expected. The canonical examples retain their existing mechanics: Minion has 2 Toughness, melee 1 Injury, ranged 1 Injury at range 1–2; Fast adds movement only. Tools and Empowered contribute once each, giving 4 Effect on Success and 2 on Partial Success in the stated example.

## Acceptance criteria

1. Marksman and Actor description icons are legible at the sizes used on `/rules`; icons, counts, ranges, and text align without clipping or unexpected fitting shrinkage.
2. At equal card dimensions, standalone Minion and Fast content occupies the same positions, sizes, and colors as the corresponding content in the assembled Fast Minion. All part frames share the same top edge despite wrapped labels.
3. Standalone Empowered shows the surrounding surface through unprinted regions. It has no paper background or complete-card border. Its title uses the same ink color and adjective position as Empowered in the assembled Asset; its rule uses the modifier footer position.
4. Base Tools and assembled Empowered Tools retain their opaque paper background and correct rules. Transparency must not remove intended printed overlay artwork.
5. A direct development URL `/__dev/card-parity` compares package and app rendering, is absent from navigation, and is not registered in production.
6. The comparison page identifies the actual renderer used. If both sides delegate to the same package component after integration, disclose that; identical output is then an adapter smoke check, not independent renderer evidence.
7. `/rules`, `/rules/actors`, `/rules/assets`, and the affected Stunt reference remain usable on desktop, narrow screens, and print. No missing images, fonts, or console errors are introduced.

## Task 1: Establish a reproducible baseline

**Read in Storyteller:**

- `docs/plans/issues-in-ui.md` and its three linked screenshots.
- `docs/11-mighty-decks-rules.md`, `docs/19-contributor-styleguide.md`.
- `apps/web/src/components/rules/RulesCardComposition.tsx`.
- `apps/web/src/components/rules/RulesIllustrations.tsx`.
- `apps/web/src/components/adventure-module/GameCardView.tsx`.
- `apps/web/src/components/cards/{ActorCard,ActorCardTextWithIcons,AssetCard,AssetModifierCard,LayeredCard}.tsx`.
- `apps/web/src/main.tsx`, `apps/web/vite.config.ts`, and `pnpm-lock.yaml`.

**Read in Components:**

- `AGENTS.md`, `src/react/AGENTS.md`, `tests/AGENTS.md`.
- `src/react/index.tsx`, `src/react/cards.module.css`.
- `tests/standalone.test.ts`, `scripts/verify-actor-parity.mjs`, and `package.json`.

**Steps:**

1. Record `git status --short` in each checkout and the Components HEAD. Run `pnpm components:check` from Storyteller and inspect the lockfile's resolved Components revision. Do not refresh the dependency yet.
2. Reuse a running frontend or run `pnpm -C apps/web dev --host`. Open `/rules` and capture the reported figures at a desktop viewport and 390px width.
3. Record actual card widths, viewBox scale, icon bounding boxes, title/body positions, computed colors, font readiness, and loaded image URLs. Check whether font fitting or surrounding CSS changes the package-only result.
4. Store screenshots and concise measurements under `.agent-logs/rules-card-parity/`. Record which issue is reproduced and which renderer owns it. A source-level hypothesis is not a confirmed browser diagnosis.

**Expected result:** All three screenshots have a mapped fixture and a reproducible baseline, or an explicit note that the installed revision already fixes an issue.

## Task 2: Add the temporary comparison route

**Files:**

- Create `apps/web/src/routes/CardParityPage.tsx`.
- Create `apps/web/src/routes/CardParityPage.module.css`.
- Modify `apps/web/src/App.tsx`.

**Steps:**

1. Add a lazy route outside `RulesLayoutPage`, gated by `import.meta.env.DEV` at both declaration and route registration. Use the existing Suspense fallback. Do not add it to landing, rules tabs, or styleguide navigation.
2. Render labeled columns **Components package** and **Storyteller adapter/local renderer**. Use aliased package imports to make provenance unambiguous. Wrap each sample with `CardBoundary` so one failure does not hide the other samples.
3. Use the following fixed fixture matrix. Reuse real exported card components, not hand-authored imitations:

   | Fixture | Package side | Storyteller side |
   | --- | --- | --- |
   | Civilian base / Minion role / Fast special | `GameCard` for each respective family | Actual path used in `RulesCardComposition`; label package-delegated parts honestly |
   | Civilian + Minion, with and without Fast | Package `ActorCard` | Local `ActorCard` with identical slugs |
   | Marksman | `GameCard type="stunt" slug="marksman"` | `resolveGameCard` plus `GameCardView`, as used on `/rules` |
   | Tools | Package `AssetCard` | Local `AssetCard` |
   | Empowered overlay | Package `AssetModifierCard` using `slug="base_empowered"` | Local `AssetModifierCard` using `modifierSlug="base_empowered"` |
   | Empowered Tools | Package `AssetCard` with modifier | Local `AssetCard` with the same modifier |

4. Include the existing Actor and Asset composition figures below the matrix to expose parent-layout effects. Compare both full cards and parts at 204px native width and the current rules widths (11rem composition cards and 10rem Marksman). Shared fixtures must have identical dimensions on both sides; prevent unequal flex shrinking.
5. Put overlay samples over a checkerboard plus light and dark swatches, applied to the surrounding sample surface only. Keep labels outside the card coordinate frame and reserve equal label height. On small screens, stack each pair in reading order with clear provenance.
6. Add a short removal note in the page source: remove route/import/page/CSS once the package fixes are integrated and visual acceptance evidence is recorded. Avoid new environment variables or a general-purpose visual testing dashboard.
7. Open the direct URL, capture each pair, and verify no normal navigation link was added. Check a production preview later in Task 6 to confirm the route is absent; the SPA returning HTTP 200 alone does not establish route availability.

**Expected result:** The page exposes the existing differences without changing the sample card styling to conceal them. No new unit tests are needed for static sample layout.

## Task 3: Fix reusable Actor/Stunt icon sizing and layer geometry upstream

**Files in `D:/projects/mighty-decks-components`:**

- Modify `src/react/index.tsx` and `src/react/cards.module.css`.
- Extend `scripts/verify-actor-parity.mjs` where its browser harness can exercise layer alignment.
- Modify `tests/standalone.test.ts` only if rendering semantics change.
- Update the package's relevant release notes/docs according to its contributor instructions.

**Steps:**

1. Use Task 2 to distinguish package standalone-versus-package assembly differences from package-versus-local assembly differences. Check which layout users expect in the supplied assembled-card example. Do not force unrelated card families onto one geometry.
2. Add a focused browser reproduction for Minion alone versus the Minion region of Civilian + Minion and Civilian + Minion + Fast. Measure relative to the card's top-left, after fonts load and fitting settles. Corresponding roles should have matching title and rule positions at equal widths; allow at most one CSS pixel of measurement rounding.
3. Reuse the package's existing `ActorRules`, `ActorCardTextWithIcons`, and `LayeredCard` primitives. Define shared Actor title, rules-row, and footer geometry used by standalone role/special cards and the composition. Preserve the role and special columns, including empty rows needed for bonuses. Fix top-edge alignment in the Storyteller figure wrapper separately if needed.
4. Increase the shared icon size from its current 13px baseline toward the local Actor's 16px reference, then validate at real display widths. Adjust row height and spacing together so fitting does not shrink everything back. Determine the final value from the browser comparison rather than assuming 16px is sufficient.
5. Include Marksman, repeated effect icons, an attack range, and a special with a conditional or replacement bonus in visual checks. Keep token counts, accessible descriptions, fixed attack Effects, and rule text unchanged.
6. Render isolated Fast with the same art/title/footer coordinates as its contribution to the assembly. Verify standalone special fitting does not enlarge or reflow the text differently solely because other layers are absent.
7. If changing rendering semantics, add a behavioral test first and run `pnpm exec tsx --test tests/standalone.test.ts` before and after the fix. For visual-only changes, use browser evidence instead of class-name or source-regex assertions. Run `pnpm verify:actor-parity` if extending that harness; inspect the script first to distinguish export parity from the new layer-alignment checks.

**Expected result:** Package Actor parts and compositions share geometry, and Marksman/Actor icons remain readable without clipped counts, overlapping rows, or altered rules.

## Task 4: Use correct transparent Asset modifier rendering

**Files:**

- Components: `src/react/index.tsx`, `src/react/cards.module.css`, and, if needed, `tests/standalone.test.ts`.
- Storyteller: `apps/web/src/components/cards/AssetModifierCard.tsx`.
- Inspect consumers: `apps/web/src/routes/RulesAssetsPage.tsx` and `apps/web/src/components/rules/RulesCardComposition.tsx`.

**Steps:**

1. Verify package Empowered transparency before editing it; current source already selects the transparent modifier path. Inspect both SVG/background painting and artwork alpha. Fix the owning source only if the browser reproduction shows it is defective.
2. Replace the local full-card implementation with a thin adapter, preserving its existing caller API:

   ```tsx
   import { AssetModifierCard as PackageAssetModifierCard } from "@mighty-decks/components/react";

   // Keep the existing AssetModifierCardProps and typed modifierSlug.
   export const AssetModifierCard = ({ modifierSlug, className }: AssetModifierCardProps): JSX.Element => (
     <PackageAssetModifierCard slug={modifierSlug} className={className} />
   );
   ```

3. Ensure standalone and assembled modifier titles use the shared adjective ink treatment (the package currently uses `#121b23`), position, and size. Match the intended assembled title rather than adding an Empowered-only color override. Keep its effect in the modifier footer.
4. Ensure any necessary correction applies to other modifier examples, not just `base_empowered`. Check at least one additional existing modifier from the catalog, as well as a base-only and assembled Asset.
5. Capture the checkerboard and dark-surface comparisons. Confirm that transparency exposes the host through unprinted regions and that assembled Tools still provides paper beneath the overlay. CSS `background: transparent` is insufficient if an SVG rect or image paints the background.

**Expected result:** Both `/rules` and the Asset reference use a genuinely transparent modifier with consistent title and footer treatment.

## Task 5: Integrate the corrected package and align rules composition

**Files:**

- Modify `pnpm-lock.yaml`; inspect `apps/web/package.json` and `apps/server/package.json` without overwriting prior edits.
- Modify `apps/web/src/components/rules/RulesCardComposition.tsx`.
- Modify `apps/web/src/components/cards/ActorCard.tsx` and `AssetCard.tsx` only where delegation is compatible with existing props.
- Review `apps/web/src/components/adventure-module/GameCardView.tsx` and `apps/web/src/components/rules/RulesCardComposition.test.tsx`.

**Steps:**

1. Validate the upstream fix in its own checkout. Make it available through the project's normal Components distribution process before the durable consumer update; building the sibling checkout alone does not update Storyteller. Do not edit `node_modules`, permanently switch to a local file dependency, or claim integration while the installed revision is unchanged.
2. Once the corrected revision is available on the tracked branch, run `pnpm update --recursive --prod @mighty-decks/components`, then `pnpm install` and `pnpm components:check`. Review resolved revisions and retain unrelated manifest/lockfile changes. If upstream publication is not part of the execution authorization, report that dependency explicitly rather than silently substituting a different package.
3. Make the rules composition use the corrected package renderer for its parts and assembled generic cards. Prefer thin local adapters when their full prop surface maps correctly. If the local wrappers support incompatible custom/layout overrides, switch only the generic teaching figures to the package and keep custom paths intact; do not perform a repo-wide card migration in this fix.
4. Keep the comparison route's local samples meaningful during this transition. Identify which side now delegates and retain baseline screenshots to document what changed.
5. Align composition card tops with equal-height label regions. Preserve semantic lists, captions, responsive stacking, and 11rem card widths. Do not replace layer components with flattened screenshots.
6. Inspect existing composition tests before updating them: they currently inspect source strings. Preserve checks that the examples select the intended cards and explain contributions; do not add assertions for CSS classes, pixel values, or arbitrary nesting. Where imports change, update only affected semantic wiring expectations.
7. Run the focused existing tests:

   ```powershell
   pnpm -C apps/web exec tsx --test src/components/rules/RulesCardComposition.test.tsx src/components/rules/RulesIllustrations.test.ts src/data/rulesActors.test.ts
   ```

**Expected result:** The installed package revision contains the fixes; production rules examples render consistently while existing custom card callers retain their behavior.

## Task 6: Verify, document, and define route cleanup

**Files:**

- Update `docs/11-mighty-decks-rules.md` with renderer ownership and the temporary development URL/removal condition.
- Update `CHANGELOG.md` under `## [Unreleased]` with concise `Fixed` bullets for icons, Actor layer alignment, and Asset overlay appearance.
- Add a brief resolution checklist/link to `docs/plans/issues-in-ui.md` once implemented; preserve the original screenshots and report.
- Store verification evidence under `.agent-logs/rules-card-parity/`.

**Steps:**

1. Run Components `pnpm check` using its current scripts, plus the relevant browser parity check. Follow the package's distribution validation before publishing generated artifacts. Do not hand-edit generated assets or catalogs.
2. In Storyteller run `pnpm -C apps/web test`, `pnpm check:agent`, and `pnpm build:agent`. The frontend suite has no `:agent` wrapper; capture full output to a local log and report a concise summary. Use narrow reruns for failures. Server behavior tests are unnecessary unless implementation unexpectedly touches server behavior.
3. At 1440px and 390px viewport widths, verify `/__dev/card-parity`, `/rules`, `/rules/actors`, `/rules/assets`, and `/rules/stunts`. Wait for fonts and images before capturing screenshots. Compare the same fixtures and display widths used in the baseline.
4. Check print preview of the composition figures for clipping and backgrounds. Verify light/dark/checkerboard transparency, icon readability, matched title color, equal frame alignment, and one non-example modifier/Actor variant. Inspect console and failed resource requests.
5. Run `pnpm -C apps/web preview --host` against the production build. Confirm `/__dev/card-parity` does not render the comparison page and regular rules routes still work. A hidden route is a development aid, not an authentication mechanism.
6. Review the diff for scope and accidental rule/catalog changes. Describe what changed, commands to run (`pnpm -C apps/web dev --host`, then the development URL), and that there are no new environment variables. Record the exact package revision verified and any remaining limitation.
7. Leave the hidden route available for the requested review. Its cleanup trigger is acceptance of the corrected package integration and saved comparison evidence. A follow-up cleanup removes only the page/CSS, its lazy import/route, and the temporary URL documentation; durable upstream regression coverage remains.

**Completion gate:** Every acceptance criterion has evidence, the package dependency is reproducible from the lockfile, and relevant checks pass. Commit only task-owned changes in coherent increments if committing is part of execution; never stage unrelated working-copy changes wholesale.
