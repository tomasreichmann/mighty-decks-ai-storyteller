# Actor and Asset Card Composition Implementation Plan

> **Execution:** Use superpowers:executing-plans to implement this plan task by task. Work in the current working copy and preserve unrelated changes. This is a plan only; no implementation, publication, deployment, or changes to the components repository are authorized by this document.

**Goal:** Enable a new reader to assemble and interpret an Actor and an Asset using illustrated parts, assembled cards, and plain-language rules grounded in repository sources.

**Architecture:** Add composition subsections to the package-owned rulebook, consume reproducible copies of the package's English documents in this repository, and attach teaching figures through the existing rulebook enhancement maps. Reuse the Asset figure on `/rules/assets`; retain existing card renderers and catalog data rather than inventing card faces or a rules engine.

**Tech stack:** React, TypeScript, existing card components, Markdown, Node test runner with tsx, pnpm, existing responsive styles.

**Status:** Partially implemented. The composition figures, Asset-reader integration, and supporting documentation landed in `ae0827e`. The local rulebook-mirror and `docs:rules` workflow proposed in Task 2 were retired in `4588c51` when `/rules` began importing the package rulebook directly. Treat that task and its mirror-specific acceptance criteria as historical; any remaining upstream rulebook-copy work belongs in the components repository.

## Scope and source authority

The user's instruction that `mighty-decks-components` owns the rules supersedes the current local documentation convention. Today, `RulesIndexPage.tsx` directly imports `docs/mighty-decks-rulebook.md`; `docs/11-mighty-decks-rules.md` and the rules skill call that file authoritative. The planned relationship is **components English rulebook → versioned package → checked, generated local copy → `/rules`**. Local mirrors must not become independent editable rulebooks.

The request to update two files in the components repository is recorded here as a concrete upstream documentation handoff, not performed now: the same request explicitly says plan only and do not modify that repository. The eventual upstream documentation update is separate from both this consumer implementation and the Actor PNG task. Until that update is available in a consumable package artifact, the final source-of-truth migration remains a documented dependency; do not present a local-only draft as upstream-approved rules.

Read-only upstream targets:

- `D:/projects/mighty-decks-components/docs/en/mighty-decks-rulebook.md`
- `D:/projects/mighty-decks-components/docs/en/mighty-decks-fast-session-storyteller-system-prompt.md`

All three supplied live URLs failed to open with the browsing tool on 2026-09-17. Findings below come from local implementations, not a successful live visual audit. The referenced Actor route is an authored record: its current persisted contents were not verified. Use explicit teaching selections rather than relying on a mutable `test/primary-actor` record.

## Findings and mechanical evidence

Paths in this table are relative to this repository unless prefixed `components/`, which means the read-only sibling repository. Symbol names and section headings are durable evidence locators.

| Topic | Verified source and finding | Teaching consequence |
| --- | --- | --- |
| Actor parts | `spec/actorCards.ts` catalogs Civilian, Minion and Fast; `AdventureModuleActorEditor.tsx` selects a symbolic base, tactical role and optional special; `ActorCard.tsx` composes them | Base supplies the illustrated identity; role supplies its title and mechanical rows; special supplies a title, overlay and extra rule text |
| Minion | `apps/web/src/data/actorCards.ts`, `actorTacticalRoleMap.minion`: two Toughness icons, one speed icon, melee 1 Injury, ranged 1 Injury at range 1–2 | Explain each printed row without inventing a damage roll or extra attack |
| Fast | Same file, `actorTacticalSpecialMap.fast`: speed bonus and “Moves an extra zone per turn”; no attack/Toughness bonus | Read its bottom description; do not turn speed into extra attacks |
| Rendering distinction | `ActorCard.tsx`, `getLayeredActorCardProps`: role Toughness/actions left, special bonuses aligned right, special description below. Neither role nor special `speed` is rendered by this local function | Do not point at a nonexistent speed row in the local assembled card. Explain movement in prose and verify the actual figure |
| Toughness | Both rulebooks, §10.1: Injury and Distress reduce remaining Toughness by default; other Effects do not unless a special rule says otherwise; zero means Taken Out | Two Toughness is not two armor or automatic death |
| Actor timing | Both rulebooks, §13.2: NPCs use fixed Effects, not Outcome hands; act after the player their card sits in front of | Keep Actor attacks separate from player Outcome calculations |
| Attack counts | Local role data: Skirmisher has `count: 2` with 1 Injury per attack; Commando's ranged row has `count: 3`. `components/src/data/catalog.en.json`, `actor-role:skirmisher`, explicitly says two attacks, one Injury each | Count before the attack symbol differs from amount of Effect; distribution/Defense details remain unresolved below |
| Repeated icons | `ActorCardTextWithIcons.tsx` expands a numeric suffix into repeated icons; object actions render `amount` icons | Two Injury symbols mean 2 Injury, not two attacks |
| Addition | Local special `burning` and package `actor-special:burning`: primary attack also deals +1 Burning | Minion primary melee becomes 1 Injury plus 1 Burning; the footer repeats the rule, not another bonus |
| Replacement | Local `fiery` has secondary `[replace][burning]` and “instead”; package `actor-special:fiery` agrees | Minion secondary changes from 1 Injury to 1 Burning, not both |
| Conditional bonus | Local `charging` and package `actor-special:charging`: primary adds 2 Injury when entering a zone | Preserve the trigger; do not treat parenthesized +2 as unconditional |
| Range | Both rulebooks, §14: one Move normally reaches an adjacent Zone; cards can override range; an out-of-range action is normally impossible | Read Minion's explicit range 1–2 as one or two Zones away; same-Zone melee uses the rulebook default |
| Splash | Both rulebooks, §17: full listed Effect to every valid target in affected Zone; not divided; adjacent Zones unaffected unless stated | Use Brute's secondary melee row (1 Injury, Splash) as a small additional example; do not invent friendly-fire exclusions |
| Asset composition | Both rulebooks, §9.3: physical Assets can have a base plus one or more modifiers. Current `AssetCard`/`RulesAssetsContent` accept one optional modifier | Teach the supported base-plus-optional-modifier example without declaring a universal one-modifier rule |
| Tools | `spec/assetCards.ts` title; `spec/cardPresentation.ts`, `base_tools`: +1 Effect on an action while using a tool to work; package `asset-base:base_tools` agrees | Use Tools as the unmodified example |
| Empowered | Same files, `base_empowered`: +1 Effect on Success or better; package `asset-modifier:base_empowered` agrees | Use Tools + Empowered → Empowered Tools, preserving both conditions |
| Outcome arithmetic | Both rulebooks §§5–6 and §9: Success +2; Partial Success +1; relevant modifiers stack unless otherwise stated | Relevant Tools work with Success: 2 + 1 + 1 = 4 Effect. Partial Success: 1 + 1 = 2; Empowered does not trigger |
| Asset art/text | `AssetCard.tsx`: base illustration/title/effect retained; modifier image overlays it and supplies adjective/title and its own effect. `AssetModifierCard.tsx` already presents the modifier separately | Reuse these three real card views; do not imply the modifier replaces all base rules |

Additional inspected sources: `RulesAssetsPage.tsx`, `RulesIndexPage.tsx`, all four `Rules*` files under `components/rules`, `RulesLayoutPage.tsx`, `rulebookDocument.ts`, `spec/rulesCards.ts`, `apps/web/src/data/assetCards.ts` (a re-export), package manifests, and the upstream overlay plan. `spec/rulesCards.ts` is not the tactical-role mechanics source; Actor mechanics currently reside in the web data file and the package catalog.

## Recommended placement and alternatives

**Recommend inline teaching in `/rules`, with reuse on `/rules/assets`.** Add `### Building an Asset card` and `### Reading a combined Asset card` after §9.3, before Consumables. Add `### Building an Actor card` and `### Reading Actor attacks and specials` before §10.1. Preserve the existing numbered section headings and anchors. Proposed new fragments are `building-an-asset-card`, `reading-a-combined-asset-card`, `building-an-actor-card`, and `reading-actor-attacks-and-specials`.

Add visible nested links under Characters & Components in both desktop and mobile TOCs, derived from parsed subsections. Add an “Actor cards” link to `/rules#building-an-actor-card` in the Assets page introduction and a “Browse Asset cards” link to `/rules/assets` in the Asset explanation. No new Actor route or top-level tab is needed for this bounded change.

Alternatives considered:

- Dedicated `/rules/actors`: good for a future full catalog, but adds routing and duplicates foundational explanation.
- A single interactive card builder: exploratory, but hides the separate parts and requires controls to learn the basics. Keep all teaching examples visible without interaction; retain the existing Asset modifier selector for exploration.

`RulesIllustrations.tsx` already maps section/subsection IDs to figures. Its current `PhysicalAssetComposition` is a custom Returning Throwing Knife, not an exploded verified catalog example. Replace that composition figure with the verified Tools example at the new subsection rather than showing redundant lessons. Preserve unrelated Effect equations and the existing Actor Toughness demonstration.

`RulesAssetsContent` is also embedded in `CampaignStorytellerSessionShell.tsx`. Add an explicit presentation mode, defaulting to current authoring behavior, and have `RulesAssetsPage` request reader mode. In reader mode, put the short lesson and figure before the catalog, omit shortcodes/storage explanations and copy fields, and retain the modifier controls. Preserve authoring selection callbacks and shortcode workflow in the existing embedded use.

## Draft player-facing copy

The following is proposed copy for the upstream rulebook and the site's reader presentation. Source locators, implementation fields and dependency notes elsewhere in this plan do not belong in the lesson.

### Building an Actor card

An Actor card combines a **base**, a **tactical role**, and, optionally, a **tactical special**. Read the parts together as one Actor.

1. **Base — Civilian.** The base provides the background and illustration or symbol: what the Actor looks like. It does not supply this example's Toughness or attacks.
2. **Tactical role — Minion.** The role provides the role title and its mechanics. This Minion has **2 Toughness**, a **melee attack for 1 Injury**, and a **ranged attack for 1 Injury at range 1–2**.
3. **Tactical special — Fast.** The optional special adds its title, visual overlay and extra rules. Read the bottom description: **“Moves an extra zone per turn.”**

**Civilian + Minion + Fast = a Fast Minion with the Civilian illustration.** It keeps the Minion's Toughness and attacks and gains Fast's extra movement. Fast does not add Toughness, Injury or attacks. Without a special, the base and role still make a complete Actor.

Toughness is how much Injury and Distress an Actor can sustain before being Taken Out. Track what remains with a die; at zero, the Actor is Taken Out. Taken Out does not necessarily mean dead. Other Effects do not directly reduce Toughness unless a special rule says so.

### Reading Actor attacks and specials

Read each attack row from its attack type through its Effects, then check its range, Splash and any special rule that changes it. NPC Actors use the listed fixed Effects; they do not play Outcome cards.

| What you see | How to read it |
| --- | --- |
| Melee | An attack in the same Zone by default; a card can extend its reach |
| Ranged, range 1–2 | A ranged attack against a target one or two Zones away |
| Injury symbols | The amount of Injury: two symbols mean 2 Injury |
| `2×` before an attack | Two attacks, with the listed Effect for each. For example, Skirmisher lists two attacks for 1 Injury each |
| Splash | Every valid target in the affected Zone receives the full listed Effect; do not divide it between targets |
| A bonus beside a row | Read the special's description to learn which attack it changes and when |

The primary attack is the first listed attack; the secondary attack is the second. Check the attack symbol: the first attack is not always melee. Ranger, for example, lists its ranged attack first.

**Added Effect — Burning:** a Burning Minion's primary attack deals its normal **1 Injury plus 1 Burning**.

**Replacement Effect — Fiery:** a Fiery Minion's secondary attack deals **1 Burning instead of 1 Injury**. “Instead” replaces the Effect; it does not add another one.

**Conditional Effect — Charging:** its primary attack adds **2 Injury when entering a zone**. Keep that condition attached to the bonus; it is not a permanent increase.

The bonus next to an attack and the special's bottom description explain the **same rule**. Apply that rule once. A printed +1 Burning and a sentence saying the attack also deals Burning do not give +2 Burning.

For a Splash example, Brute's second attack lists **melee, 1 Injury, Splash**. Every valid target in its affected Zone receives 1 Injury before any applicable Defense; the Injury is not shared between them.

**Editorial gate:** The counted-attacks sentence accurately transcribes the catalog, but does not settle targeting or Defense timing. Confirm the “primary/secondary = first/second row” convention with the rules owner before publishing it as a general rule; the existing renderer's bonus indexing supports that reading. Do not expose this editorial note in the final player lesson.

### Building an Asset card

An Asset can be used on its own or combined with a modifier. Start with the base Asset, then read any modifier alongside it.

**Base — Tools.** The base supplies the illustration, the name **Tools**, and its rule: **+1 Effect on an action while using a tool to work.** This is a complete Asset without a modifier.

**Optional modifier — Empowered.** The modifier adds its overlay, the name **Empowered**, and its rule: **+1 Effect on Success or better.**

**Tools + Empowered = Empowered Tools.** The combined card keeps the Tools illustration and rule, with Empowered's overlay, name and additional rule. Read both descriptions and check when each applies.

### Reading a combined Asset card

When you use Empowered Tools to work and play **Success**, start with **2 Effect**, add **1 for Tools**, and add **1 for Empowered**: **4 Effect** before any other relevant modifiers.

With **Partial Success**, start with **1 Effect** and add **1 for Tools**: **2 Effect**. Empowered requires Success or better, so it adds nothing here. For these examples, the action involves using the tools to work and no other modifiers apply.

Each rule contributes once. The assembled card shows the same rules as its parts; assembling it does not give you another copy of either bonus. Some modifiers change a rule rather than adding a number, so always read their wording.

These examples show one optional modifier. Physical Assets can have more than one modifier in a sleeve; apply their actual rules rather than assuming this example limits all Assets to one.

## Presentation and component reuse

- Actor figure: four labeled positions in reading order: Civilian base + Minion role + Fast special → assembled Actor. Keep all parts visible. Place the sum/result on a second row when width is constrained. Explain that the displayed assembled title is Fast Minion; Civilian identifies its illustration, not an additional printed role title.
- For the three isolated Actor parts, prefer package `GameCard` with `type="actor-base"`, `"actor-role"`, and `"actor-special"`, wrapped in local `CardBoundary`. The inspected upstream `src/react/index.tsx` already exposes these families and transparent overlays. Use the existing local `ActorCard` for the assembled icon-bearing result. Verify the installed artifact actually includes the complete descriptions before choosing a version; sibling working-copy code is not proof of released capability.
- Do not pretend a normal full `ActorCard` is a role-only card: it requires both a base and a role. If the installed package lacks complete part renderers, record a package-artifact prerequisite. Do not hand-draw substitute cards or make this task regenerate PNGs.
- Asset figure: `AssetCard(baseAssetSlug="base_tools")` + `AssetModifierCard(modifierSlug="base_empowered")` → `AssetCard(baseAssetSlug="base_tools", modifierSlug="base_empowered")`. Label the first card “Tools — complete without a modifier.” Reuse exactly this component on both routes.
- Wrap real cards with numbered labels, captions and arrows. No screenshots of the authored test Actor, generated illustrations, or developer metadata are needed. Existing local illustration files for Civilian, Fast, Tools and Empowered are present.
- Keep body copy at normal reading size. At 320–390 px, stack the parts and result vertically with full readable cards; at tablet widths use two columns; at wide widths show the equation across the available content width only if cards remain legible. Do not shrink four cards to thumbnail text sizes or require horizontal scrolling.
- Use semantic figures/captions and ordered part labels. Give the figure an accessible name and a visible text equivalent of every mechanical symbol, including Toughness, melee, ranged, Injury, Burning, range, Splash and replacement. The current icon images are intentionally hidden from assistive technology; the figure must therefore carry complete readable descriptions, not rely on icon alt text.
- Mark redundant decorative arrows/art as hidden from assistive technology. Do not use color, hover, dragging, or animation as the only explanation. Preserve a coherent DOM reading order, keyboard focus styles, headings, print layout, and 200% zoom reflow.
- In reader-mode modifier controls, use a fieldset/legend, a labeled checkbox, named radio choices, visible focus on the radio's visual wrapper, and a text summary of the applied modifier. Do not announce every card in a large live region when selection changes.

## Unresolved rules and dependencies

1. **Counted attacks:** sources establish two attacks at 1 Injury each, but inspected rulebooks do not specify whether repeated attacks may share/split targets, their Defense resolution, or exactly how they consume an Actor turn. Do not extrapolate that every printed row fires every turn. The rules owner must clarify this before a complete attack-execution tutorial can be accepted; the composition lesson can accurately show the counts meanwhile.
2. **Primary/secondary:** row indexing strongly indicates first/second; no explicit general definition was found in the rulebooks. Seek confirmation and add the definition upstream, not just a web-only inference.
3. **Charging timing:** preserve “when entering a zone.” Whether it includes forced movement, when the bonus expires, and how it interacts with multiple attacks are unspecified. Do not add a “first attack after any movement” rule.
4. **Elemental:** prose says attacks “can deal Freezing or Burning”; the local bonus strings use plus signs. Addition versus replacement is unresolved. Exclude it from the teaching examples and request an upstream ruling; do not silently normalize it.
5. **Splash scope:** “valid target” is not permission to invent immunity for allies. Show the canonical definition without extending it.
6. **Multi-modifier Assets:** rulebook supports one or more; UI stores one optional modifier. This plan does not change the data model or stacking conflict rules.
7. **Package documents:** inspected package version is 0.1.2; `files` includes `docs/en`, but `exports` has no Markdown subpath. Do not assume an import like `@mighty-decks/components/docs/en/...` works. Use the deterministic copy approach below, without requiring an upstream export-map change.
8. **Actor overlays:** sibling `docs/plans/2026-09-17-actor-overlay-generation.md` separately plans corrected transparent Role/Special PNGs with complete descriptions. This plan uses React figures and existing art, so it does not require those PNGs. It does require complete isolated Actor part rendering in the selected package artifact. If PNG illustrations are chosen later, explicitly depend on verified full overlays; do not use reduced-detail thumbnails or regenerate them here.
9. **Version drift:** upstream English rulebook contains additional guidance absent locally. Import its full released document; review the diff and preserve parser heading compatibility. Do not overwrite upstream additions with the older local file or assume the fast-session prompt is a verbatim core rulebook.

## Implementation tasks and exact file map

### Task 1 — Prepare upstream documentation handoff (separate execution)

**External files, not to edit in this repository task:** the two absolute English document paths listed above.

1. Propose the player-facing copy above for rulebook §§9 and 10, keeping existing numbered headings stable. Resolve the editorial gates with the rules owner and record accepted wording.
2. Propose the following insertion in the fast-session prompt's `# Assets` section, plus a new `# Actor cards` section after Assets:

   > For a composed Asset, retain the base's rules and apply the modifier's stated changes and conditions once. Tools grant +1 Effect while using a tool to work; Empowered adds +1 only on Success or better. Do not treat assembling the parts as another bonus. Use the English Mighty Decks rulebook's card-composition sections for the complete rules.

   > Build a generic Actor from a base, tactical role and optional tactical special. The base provides its illustrated identity; the role provides Toughness and listed attacks; the special provides its stated changes. Civilian + Minion + Fast has Toughness 2, melee 1 Injury, ranged 1 Injury at range 1–2, and moves an extra zone per turn. NPCs use fixed Effects, not Outcome hands. Read added, replacement and conditional Effects according to their wording. A bonus beside an attack and its explanatory footer are one rule, not two bonuses. Do not invent unspecified targeting or timing rules.

3. Link the prompt to `mighty-decks-rulebook.md` and make clear any fast-session overrides remain specific to that mode. Leave its unrelated pacing guidance intact.
4. Obtain a package artifact containing the accepted documents and complete Actor part descriptions through a separately authorized release/handoff. Do not publish from this task. Record its actual version and document hashes; do not guess a future version.

### Task 2 — Make the Storyteller depend on package-owned rules

**Create:**

- `scripts/sync-rules-docs.mjs`
- `scripts/sync-rules-docs.test.mjs`
- `docs/rules-source.json`
- `docs/mighty-decks-fast-session-storyteller-system-prompt.md` (generated mirror)

**Modify:**

- `package.json` — `docs:rules` and `docs:rules:check` commands
- `apps/web/package.json`, `pnpm-lock.yaml` — pin the verified components artifact/version
- `docs/mighty-decks-rulebook.md` — generated mirror of upstream, not hand-edited copy
- `docs/11-mighty-decks-rules.md`
- `.codex/skills/mighty-decks-rules/SKILL.md`
- `.codex/skills/mighty-decks-rules/references/core-rules.md`
- `.codex/skills/mighty-decks-rules/references/adventure-examples.md`

1. Write Node tests using temporary package fixtures for exact two-file copying, check-only mismatch, missing docs, incorrect package identity and hash/version metadata. Missing sources must fail loudly without partial updates.
2. Implement package lookup from the web workspace: resolve its installed public package entry, walk to the owning manifest, verify the package name, then read the two fixed `docs/en` paths. Do not depend on an absolute sibling checkout, network request, or unexported package.json subpath.
3. Copy exact UTF-8 document bytes after validating both inputs. Keep provenance/version/SHA-256 hashes in `docs/rules-source.json`, outside player-facing Markdown. `--check` compares copies and metadata without modifying files.
4. Add `pnpm docs:rules` (sync) and `pnpm docs:rules:check` (check). Run check in web `prebuild` and `pretypecheck` alongside existing spec preparation so stale sources cannot silently ship. Keep builds offline after dependencies are installed; do not auto-download documentation.
5. Keep the existing raw import path in `RulesIndexPage.tsx`; it now reads a verified mirror. Explain this deliberately in contributor docs and rules skills. The fast-session prompt mirror is a documented reference, not automatically injected into server prompts by this change.
6. Verify a clean install/build needs no `D:/projects/mighty-decks-components` checkout. The package is the dependency, not the developer's filesystem layout.

### Task 3 — Add readable composition figures

**Create:**

- `apps/web/src/components/rules/RulesCardComposition.tsx`
- `apps/web/src/components/rules/RulesCardComposition.test.tsx`

**Modify:**

- `apps/web/src/components/rules/RulesIllustrations.tsx`
- `apps/web/src/components/rules/RulesRulebookContent.module.css`

1. Verify installed `@mighty-decks/components/react` exports/rendering for isolated Actor parts; use its full layout and existing scoped styles. Match selected part descriptions against the local assembled Actor.
2. Implement `ActorCompositionFigure` and `AssetCompositionFigure` with the real components described above and `CardBoundary` around each card. Read titles and printed rules from existing data/components; avoid a parallel mechanics catalog.
3. Add visible symbol-reading captions and the addition/replacement/conditional examples. Keep arithmetic in prose; do not build a generalized attack calculator or rewrite local Actor stats.
4. Register figures at `building-an-actor-card` and `building-an-asset-card`; remove the old section-level `PhysicalAssetComposition` registration and its now-unused custom figure. Retain the Toughness section figure.
5. Add focused component tests for required part selections, complete text equivalents, Fast's bottom rule, unmodified Tools, and assembled Tools with Empowered. Test semantic content and data selection, not Tailwind class strings or exact DOM nesting.

**Reuse without modifying:** `ActorCard.tsx`, `ActorCardTextWithIcons.tsx`, `AssetCard.tsx`, `AssetModifierCard.tsx`, `LayeredCard.tsx`, `apps/web/src/data/actorCards.ts`, `apps/web/src/data/assetCards.ts`, `spec/actorCards.ts`, `spec/assetCards.ts`, `spec/cardPresentation.ts`, and `spec/rulesCards.ts`. If evidence reveals a mechanical discrepancy, record it for an explicit correction rather than hiding it in tutorial copy.

### Task 4 — Integrate navigation and the Asset reader

**Modify:**

- `apps/web/src/routes/RulesIndexPage.tsx` — pass the parsed document to the TOC
- `apps/web/src/components/rules/RulesTableOfContents.tsx` — add selected composition subsection links in both layouts
- `apps/web/src/routes/RulesAssetsPage.tsx` — reader/authoring presentation mode, shared figure, links, accessible modifier controls

**Create:**

- `apps/web/src/lib/rulebookDocument.test.ts`
- `apps/web/src/routes/RulesAssetsPage.test.tsx`

1. Test parsing the package-owned mirrored rulebook: all required section headings remain, new subsection IDs are unique, and the four teaching anchors resolve. Keep the current parser unless actual upstream headings require an inventory correction.
2. Derive TOC subsection links from the document; do not duplicate heading text in several components. Keep links under their parent sections.
3. Add reader presentation to `RulesAssetsPage`, shared figure and contextual links. Use a clearly labeled summary for the active modifier; improve radio focus visibility.
4. Test reader mode excludes authoring shortcodes/fields, defaults to unmodified cards, enables and changes modifiers, and removes them again. Test default authoring mode still offers its callbacks and selected modifier to the host.
5. Verify `CampaignStorytellerSessionShell.tsx` continues to receive the existing authoring presentation without changing that file unless integration requires an explicit prop. No change to `App.tsx` or `RulesLayoutPage.tsx` is expected because no route/tab is added.

### Task 5 — Verify and document the implementation

**Modify:** `CHANGELOG.md`, `docs/11-mighty-decks-rules.md`, `docs/19-contributor-styleguide.md`.

1. Run `node --test scripts/sync-rules-docs.test.mjs`; expect all fixture-based sync/check tests to pass.
2. Run `pnpm docs:rules:check`; expect matching package version, two mirrors and hashes, with no writes.
3. Run `pnpm -C spec build`, then `pnpm -C apps/web exec tsx --test src/lib/rulebookDocument.test.ts src/components/rules/RulesCardComposition.test.tsx src/routes/RulesAssetsPage.test.tsx`. These use the existing Node/tsx testing tools; no new test framework is needed. Read the raw Markdown with filesystem APIs in parser tests rather than requiring Node to understand Vite `?raw` imports.
4. Run `pnpm check:agent` and `pnpm build:agent`. Expected: successful web/server/spec checking and build. Keep full logs in `.agent-logs/`. Do not run the entire server suite for this docs/UI slice unless server behavior becomes involved.
5. Use the webapp-testing skill for actual navigation, modifier interaction and rendering verification. Check `/rules`, all four anchors, `/rules/assets`, and the embedded Asset picker at mobile 360 px, tablet 768 px and desktop 1280 px; also check 320 px, 200% zoom and print preview for overflow/readability. Record screenshots as implementation evidence, not as substitute card artwork.
6. Check keyboard-only navigation, focus visibility, accessibility tree/text equivalents, broken images, console errors, and reload/deep links. Verify Fast's full footer and all isolated role/special text are readable. Check a local configured Actor preview against the same Civilian/Minion/Fast selections without modifying the user's test module record.
7. Add a concise Unreleased entry for the teaching sections and package-owned rules synchronization. Document how to update/sync/verify the source package, new commands, and that there are no new environment variables or server contracts.

## Acceptance criteria

- A reader can identify the three Actor parts separately and point to their contributions on the assembled Civilian + Minion + Fast card.
- The assembled Actor demonstrably shows Toughness 2, both listed 1-Injury attacks, ranged 1–2 and Fast's complete movement description. No bonus is silently pre-applied and then counted again.
- A reader distinguishes two attacks at 1 Injury each from one attack at 2 Injury, and knows the lesson does not imply all attack rows fire in a turn. Unresolved attack timing/targeting questions have an explicit upstream disposition before claiming the tutorial fully explains execution.
- A reader correctly interprets Burning as added, Fiery as replacement and Charging as conditional; points to the condition rather than treating it as a permanent bonus; applies each special once.
- A reader explains Splash as the full listed Effect per valid target in the affected Zone and range as a permission limit, without inventing adjacent-Zone damage or ally immunity.
- A reader can assemble Empowered Tools and identify the base's art/name/rule and the modifier's overlay/name/rule. They recognize unmodified Tools as a complete Asset.
- In a short teach-back with a reader unfamiliar with Mighty Decks, ask them to assemble both examples, explain the Minion rows and Fast footer, and calculate Empowered Tools on Success and Partial Success. Expected answers: 4 and 2 Effect respectively under the stated conditions. Record misunderstandings and revise copy; automated rendering checks alone do not prove learnability.
- Composition is discoverable from both desktop/mobile `/rules` navigation and `/rules/assets`; all figures remain readable without hover or interaction, and complete symbol meanings are available as text.
- Player explanations contain no slugs, storage fields, export paths or shortcode implementation instructions. Authoring functionality remains available in its existing context.
- Both upstream document updates are tracked as the separate handoff; generated local mirrors match the chosen package artifact, with documented provenance and no dependency on a sibling checkout.
- The PNG-overlay task remains independent. No components repository file, generated PNG, release, deployment or application implementation was changed while preparing this plan.
