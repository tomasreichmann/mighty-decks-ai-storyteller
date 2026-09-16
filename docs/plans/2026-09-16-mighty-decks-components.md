# Mighty Decks components Implementation Plan

> **For the implementing agent:** Use `superpowers:executing-plans` to implement this plan task by task. Work in the user's current working copy; do not create a worktree. Preserve unrelated changes. This document is a plan, not authorization to publish a package.

**Goal:** Create an English-first, reusable Mighty Decks components package in this repository, exposing self-contained React cards, generated CSV catalogs and static PNGs, a usage skill, and the two requested Markdown guides.

**Architecture:** One workspace package, `@mighty-decks/components`, in `packages/components`, with separate React, data, resource, and Node CLI entry points. Generate static cards from the same React components and normalized catalog used by consumers. Keep shared domain contracts in `spec/`, bundle only the required subset into the published package, and keep application/session orchestration outside it.

**Tech stack:** TypeScript, React 18 initially, the repository's Vite 6 toolchain, scoped CSS Modules and explicit styles, Node filesystem tooling, and pinned Playwright Chromium for export. React stays a peer dependency. Browser tooling is an optional exporter dependency, not part of the React runtime bundle.

## Accepted requirements and boundaries

- Product name: **Mighty Decks components**; proposed npm name: `@mighty-decks/components` (availability/publication to be checked only when publishing).
- English only in phase 1. Include language and content-version fields now and document future localization; do not implement a translation UI or translation pipeline.
- Use the supplied Exiles rulebook as the package's main rulebook and explicitly document its differences from this app's rulebook. This is the user's confirmed choice.
- The Effect is **Taken Out**, with canonical ID `taken-out`, not `Dying`. Use this consistently in React, CSV rows, PNG names/titles, guides and the usage skill.
- Ship React components, machine-readable CSVs, original artwork and fonts, generated PNGs, a usage `SKILL.md`, and standalone Markdown guides in the package tarball.
- React cards must look the same in a plain React app and in a Tailwind app using different colors, fonts, spacing, and base styles. No consumer Tailwind theme, plugin, source scanning, or runtime Tailwind dependency.
- Standard portrait PNG presets: `full/1024` = 629 × 1024, `full/512` = 315 × 512, `compact/256` = 157 × 256. Width rounds from 204:332. Layout and resolution remain separate options.
- Compact artwork is **50% smaller in both width and height** than the first Success compact example: a 90 × 90 region instead of 180 × 180 in the 204 × 332 coordinate system. This is one-quarter the former area. Center it horizontally near the top and reserve the lower region for up to three title lines.
- Use the existing PNG illustrations, overlays, symbols, and backgrounds. Do not regenerate artwork with AI.
- This phase includes custom card composition and Actor/Asset layers. It does not pre-render the Cartesian product of every combination or every possible Counter value.
- Print-ready PDFs, bleed/crop marks, translation packs, non-React adapters, and a public CDN are future work. PNG resolution alone is not a print specification.

## Findings that affect implementation

1. `LayeredCard.tsx` already defines a shared 204 × 332 card face, but depends on Tailwind utilities, host typography, root-relative images, and browser text fitting. Keeping HTML text inside SVG is acceptable for browser-to-PNG export; a portable native-SVG rewrite is unnecessary here.
2. `GameCardView.tsx` depends on `gameCardCatalogContext.tsx`, which includes authored Adventure content and Counter callbacks. Extract presentational rendering while leaving that adapter/context in the app.
3. Canonical Outcome/Effect/Stunt catalogs live in `spec/rulesCards.ts`; Actor/Asset details also live in `apps/web/src/data/`. `OutcomeCard.tsx` has a separate set of display descriptions. Inventory these differences and resolve shared catalog ownership before exporting.
4. The three existing `apps/web/src/data/*-en.csv` files are not reliable export sources. For example, their Fumble description is stale and its row has malformed quoting. Generate new CSVs from validated normalized records, not by copying those files.
5. The generated card reference currently lists 265 entries: 5 Outcomes, 11 Effects, 56 Stunts, 44 Actor bases, 16 Actor roles, 24 Actor specials, 69 Asset bases, 16 Asset modifiers, and 24 Counter icons. Derive actual release counts from live catalogs; do not hard-code 265 as a permanent invariant.
6. Existing `spec` is a private package and includes unrelated Adventure/server contracts. The distributable must not require consumers to install this private package, import application source, or have this workspace checked out.
7. The requested external guides exist, but the external rulebook differs from `docs/mighty-decks-rulebook.md`: notably, offered Stunts are capped at one per player per scene externally, while the current app permits multiple. The external prompt is a single-player/fast-session profile, not a universal replacement for core rules.
8. The live catalog and Effects CSV already use `taken-out` / `Taken Out`, but reference the legacy file `apps/web/public/effects/dying.png`. `spec/rulesCards.test.ts` currently asserts that old artwork path. Reuse that artwork, expose it in the package as `art/effects/taken-out.png`, and ensure no `Dying` Effect is generated. Preserve natural-language distinctions such as "Taken Out does not automatically mean dying" in the guides. Update path assertions only if app/spec path ownership changes; do not turn the legacy filename into another exported Effect.

## Styling decision

**Preferred:** Translate the finite set of card utility classes into explicit component styles and locally scoped CSS. Use inline styles for calculated dimensions/positions and visual values that must not inherit; use CSS Modules for selectors, focus/hover states, disabled states, font declarations, and print rules. Do not build a general-purpose Tailwind-to-inline-style compiler.

Each public card automatically renders an internal `CardStyleBoundary`. It sets its own font, size, line-height, color, box sizing, and local tokens. Scope resets for the actual elements used by cards (images, SVG, text, buttons, paragraphs); do not export a global reset or `:root` theme. Use package-specific font-family names such as `MightyDecksKalam` and `MightyDecksShantell` with bundled font files. Set the dimensions inside the card in card units/px, avoiding dependence on the host root's `rem` size.

Consumers import one package stylesheet, `@mighty-decks/components/styles.css`, once. They do not wrap cards in a provider or Theme component. `className` and `style` apply to the outer sizing/placement shell; internal typography and color changes use documented explicit props, not host utility names.

Alternatives considered:

- Compile a private, prefixed Tailwind stylesheet: less initial conversion, but retains utility/reset/variable complexity. Use only if an extraction spike proves manual conversion disproportionately expensive.
- Require a Theme wrapper: can supply defaults, but does not stop global CSS selectors or host resets. It is not sufficient isolation by itself.
- Shadow DOM: stronger isolation but complicates SSR, portals, font loading, and integration. Defer unless compatibility tests establish a concrete need.

The supported guarantee is appearance under normal host themes and resets, not arbitrary hostile `!important` overrides. Test host CSS loaded both before and after the package CSS. Tailwind Preflight does change borders, typography, and image display, so a scoped class name alone is insufficient. [Tailwind documentation](https://tailwindcss.com/docs/preflight)

## Proposed package surface

```text
packages/components/
  package.json
  README.md
  vite.config.ts
  tsconfig.json
  src/
    index.ts                    # React-free catalog/resource exports
    catalog.ts                  # Adapts the selected spec catalogs
    locales/en.ts               # English labels; stable locale boundary
    assets.ts                   # Generated static asset URL map
    react/
      index.ts
      CardStyleBoundary.tsx
      LayeredCard.tsx
      GameCard.tsx
      OutcomeCard.tsx
      EffectCard.tsx
      StuntCard.tsx
      ActorCard.tsx
      AssetCard.tsx
      AssetModifierCard.tsx
      CounterCard.tsx
      ActorCardTextWithIcons.tsx
      CompactCard.tsx
      SceneCardFrame.tsx
      LocationCard.tsx
      EncounterCard.tsx
      QuestCard.tsx
      cards.module.css
      fonts.css
  assets/                       # Card art, backgrounds, overlays, fonts, notices
  docs/en/                      # Usage, guide provenance and requested guides
  skills/mighty-decks-components/SKILL.md
  scripts/
    export.ts                   # Node-only CLI, options and orchestration
    build-resources.ts
    write-csv.ts
    enumerate-static-cards.ts
    copy-static.ts
  export-app/                   # Minimal private render harness
    index.html
    main.tsx
  tests/
  dist/                         # JS/declarations/CSS/art/fonts; ignored in Git
  generated/                    # CSV/PNG/manifest output; ignored in Git, packed
```

Proposed entry points:

| Entry | Contents |
| --- | --- |
| `@mighty-decks/components` | Catalog lookup, definitions, manifests and resource helpers; no React or browser imports |
| `@mighty-decks/components/react` | Presentational card components, composition and customization props |
| `@mighty-decks/components/styles.css` | Complete scoped card styles and local font definitions |
| `@mighty-decks/components/export` | Node-only static-export API; fails helpfully if exporter/browser tooling is absent |
| `@mighty-decks/components/art/*` | Original artwork and overlay resources |
| `@mighty-decks/components/csv/*` | Generated UTF-8 CSVs |
| `@mighty-decks/components/png/*` | Generated static PNG files |
| `@mighty-decks/components/docs/*` | Standalone Markdown guides and usage documentation |
| `@mighty-decks/components/skills/*` | Packaged skill and relative references |

Resource exports are real files, not a promise that npm paths are directly usable in Markdown. Provide `mighty-decks-components copy-static --out ./public/mighty-decks` to copy selected resources and preserve relative paths. Consumers can also extract the tarball without executing the React package.

Example intended API:

```tsx
import '@mighty-decks/components/styles.css';
import { GameCard, ActorCard } from '@mighty-decks/components/react';

<GameCard type="OutcomeCard" slug="success" locale="en" layout="full" />;
<GameCard type="OutcomeCard" slug="success" locale="en" layout="compact" />;
<ActorCard baseLayerSlug="guard_blue" tacticalRoleSlug="thug" />;
```

Retain current public terminology (`StuntCard`, not a new `SkillCard` alias). Preserve existing IDs and introduce namespaced IDs for caller-provided cards. Custom export input must be serializable, validated data rather than arbitrary JSX. UI-only ReactNode extension slots can exist but are outside the static-export contract.

## Catalog, layers, CSVs, and static enumeration

Create `spec/cardComponents.ts` for reusable data/export contracts and `spec/cardPresentation.ts` for pure Actor/Asset presentation records moved from web data. Keep app-specific Adventure DTOs outside the public surface. Build the npm package by bundling the selected spec implementation and its declarations; no unresolved `@mighty-decks/spec` references in shipped JS or `.d.ts`. If declaration bundling needs a build dependency, use a Vite-compatible declaration bundler and document why.

Use stable IDs, a `locale: "en"` field, schema/content versions, artwork IDs, and explicit layer ordering. Do not compute identity from translated titles. Avoid turning application state such as selected cards or Counter interaction callbacks into catalog data.

Generate separate normalized CSVs for Outcomes, Effects, Stunts, Actor bases, Actor roles, Actor specials, Asset bases, Asset modifiers, and Counter templates. Use UTF-8, documented headers, proper quoting/newline escaping, stable row order, and package-relative artwork paths. Represent structured Actor actions in a documented JSON column (or a clearly related actions CSV), rather than discarding structure into display strings. Round-trip CSV tests must cover commas, quotes, multiline copy, symbols, and empty fields. CSV and React must resolve to the same catalog text.

Define "all static cards" as:

- Every standard Outcome, Effect, and Stunt once per visual preset; deck quantity remains CSV metadata, not repeated image files.
- Every Asset base and modifier as its own reference card.
- Every Actor base, role, and special as its own explicitly labeled layer reference card. These are component references, not invented complete playable Actor profiles. Reuse canonical card rendering to show just that layer's real content.
- Every Counter icon as a named, read-only Counter template with an empty value field. Do not invent a default game value or enumerate arbitrary values.
- Named standard complete combinations only if there is an explicit catalog/preset record. Additional Actor/Asset combinations and custom cards are selected through an optional input manifest.
- Supported card backs if existing canonical implementations provide them. Track backs as separate manifest records without inventing missing backs.

Expose Location/Encounter/Quest React components too, as already-authored reusable card families. There is no global standard catalog for their adventure-specific instances: accept them through the custom input manifest and preserve their landscape ratio (332:204). The default batch must report that distinction rather than silently treating authored adventure content as global cards.

PNG path example: `png/en/outcome/success/full/1024.png`. Export manifest records ID, family, locale, layout, pixel dimensions, relative path, checksum, referenced layer IDs and package/content version. No absolute local paths or secrets. Include every catalog entry or fail with a specific missing-data/artwork error; never silently skip cards.

## React rendering and PNG generation

Refactor the current `LayeredCard`, Actor/Asset composition, icons, and sizing logic into the package without changing the full-size design. Keep browser text layout; it avoids maintaining a second typography renderer. PNG export runs the same public React components in a minimal harness with no app server, Socket.IO, OpenRouter, or API keys.

`CompactCard` reserves an approximately 90 × 90 art box near the top and a 180 × 140 title region below it. Start near a 36-unit title font, allow up to three centered lines, and fit down to an explicit readable minimum (24 card units, roughly 18.5 px at 256px high). Validate representative long catalog titles. If text still overflows, report the card and fail export rather than clipping or ellipsizing. For custom combinations, preserve the resolved full title and run the same fit check.

Use a generic node CLI with presets rather than one script per family:

```text
pnpm components:build
pnpm components:generate
pnpm components:generate -- --type outcome --id success
pnpm components:generate -- --layout compact --height 512
pnpm components:generate -- --input ./custom-cards.json
pnpm components:pack
```

Specify script argument forwarding precisely when implementing. `components:generate` defaults to every enumerated standard entry at all three accepted presets plus CSVs and manifest. `components:pack` builds, generates or verifies current outputs, and packs a versioned local tarball; it does not publish.

For every render:

1. Resolve and validate English data, layers, artwork and template geometry.
2. Render at the requested final pixel dimensions with deviceScaleFactor 1; do not screenshot all sizes from a 256px image.
3. Await font readiness, image decoding, and a component-specific text-fit completion signal. Font readiness alone does not mean a ResizeObserver fitting pass has completed.
4. Disable transitions/animation and remove interactive controls from export faces; assert no missing assets, console errors, overflow or external network dependencies.
5. Screenshot only the card with transparent rounded corners; check exact dimensions and save PNG.
6. Update the manifest and a contact-sheet/report for review. Use bounded concurrency and always close browser/server resources on failures.

Pin renderer/browser versions for reproducible builds; do not promise byte-identical PNGs across operating systems. Cache by content, layout, font, artwork and renderer hashes; never reuse output solely because a filename exists. Write to staging and publish the complete output set only after validation; clean only known package output paths. Full generation is an explicit command, not a postinstall action or a slow side effect of ordinary app development.

Bundle assets once as files, not base64 strings in every React component. Preserve static analyzable asset URLs and test resolution after a real tarball installation and under a non-root website base path. Account for Vite library-mode asset inlining: add explicit asset emission/copying and a generated URL module so a naive library build cannot inline the entire art catalog into JavaScript. Optional `assetBaseUrl` overrides must not be required for the default supported bundler setup.

## Guides and usage skill

Requested import sources (the trailing HTML space entity in the request is not part of the first filename):

```text
D:/projects/exiles-of-the-hungry-void/reference/mighty-decks/mighty-decks-fast-session-storyteller-system-prompt.md
D:/projects/exiles-of-the-hungry-void/reference/mighty-decks/mighty-decks-rulebook.md
```

Copy these into tracked `packages/components/docs/en/` sources during implementation; never read `D:/projects/...` during a package build or on a consumer machine. Record original path, source hash, import date, and intended play profile in `guide-provenance.md`. Preserve the originals as imported references; make any package adaptations explicit and inspect relative links, images, app-only routes, and custom JSX for standalone Markdown compatibility.

**Confirmed guide authority:** Use the supplied Exiles `mighty-decks-rulebook.md` as the package's main rulebook. Include the supplied storyteller prompt as a fast-session/single-player guide. Add `guide-differences.md` describing concrete differences from this app's current core rulebook, including the one-offered-Stunt-per-player-per-scene rule and the external guide's solo Stunt choices, persistent upgrades and expanded Storyteller advice. Do not silently change the app's canonical rulebook as part of extraction. Future package contributions use the packaged main rulebook for package documentation; this app continues to use its own documented core authority until explicitly migrated. Check generated card copy against both and report any material card-rule disagreement rather than making silent rules changes.

Create `skills/mighty-decks-components/SKILL.md` with portable relative links to packaged guides and usage examples. Cover:

- Working in this source repo versus consuming a released package/tarball.
- Installing/importing React and package CSS, choosing full/compact cards, and custom Actor/Asset layers.
- Catalog lookup, CSV schemas, copying PNGs into Markdown, supported MDX integration, and image alt text.
- Generating all cards or a selected custom manifest and interpreting export errors.
- English-only behavior, guide authority/profile differences, original-art reuse, and how to update catalogs without editing generated output.
- The fact that installing an npm package does not automatically install an agent skill; document copying/registering the packaged skill for the consuming agent environment. Do not change a user's global agent configuration automatically.

Use `skill-creator` and the applicable skill-writing guidance when authoring that skill. Do not package this repo's entire AGENTS.md, app runtime skills, private settings, or system prompts unrelated to the requested guides.

## Future language and print support

Record this roadmap in package README and `docs/en/localization-roadmap.md`:

- English is the only accepted locale in phase 1; unsupported locales produce a clear error instead of silently pretending to translate.
- Stable language-neutral IDs; locale-specific display text and output directories (`en/` now).
- Separate game data/numeric mechanics, labels, localized rules text, and artwork. Leave a catalog localization boundary even where English strings initially originate in spec data.
- Later support font glyph coverage, non-Latin scripts, RTL/direction, longer text, grammatical agreement and ordering of Asset/Actor modifier titles, localized alt text, and versioned locale completeness checks.
- Generate each locale from the same render pipeline; never translate text burned into a PNG. Do not pre-generate every combination of future locales/layers.
- Retain source-resolution artwork and card geometry for future print dimensions, bleed, safe areas, card backs, and PDF sheets. Do not advertise the phase-1 PNGs as press-ready output.

## Implementation tasks

### 1. Freeze the inventory and add package scaffolding

**Files:** `pnpm-workspace.yaml`, root `package.json`, `packages/components/package.json`, `tsconfig.json`, `vite.config.ts`, `README.md`; `spec/cardComponents.ts`, `spec/index.ts`, `spec/package.json`.

1. Enumerate current catalogs/artwork and document missing assets or duplicate IDs; inspect actual catalogs, not only the generated docs.
2. Add `packages/*` to the workspace and a package build/typecheck/test skeleton. Keep React 18 peers initially; broader support requires separate validation.
3. Define shared catalog, layer, custom export input, locale, preset and manifest contracts in spec, with runtime boundary validation using existing Zod.
4. Add contract tests for invalid family/layer references, duplicate IDs and unsupported locales, then implement validation.
5. Bundle selected spec dependencies and declarations. Verify the package's root is React-free and that no private workspace imports escape the build.

**Check:** targeted contract tests, package build, and inspection of emitted JS/declarations. Packaging succeeds locally without registry publication.

### 2. Normalize data and assets

**Files:** `spec/cardPresentation.ts`, existing `spec/*Cards.ts`, `apps/web/src/data/{actorCards,assetCards,counterCards,rulesComponents}.ts`, `packages/components/src/{catalog,assets}.ts`, `packages/components/src/locales/en.ts`, `packages/components/assets/`, `packages/components/scripts/build-resources.ts`.

1. Move shared Actor/Asset details into pure spec records; preserve web re-export adapters until migration is complete.
2. Establish one canonical record per card/layer; reconcile Outcome display variants without accidentally changing game rules.
   - Assert there is exactly one `taken-out` Effect titled `Taken Out`, no separate `dying` Effect row, and all PNG/resource paths use `taken-out`. Map legacy artwork filenames explicitly. If any existing app imports require the old ID, preserve that compatibility only at the app import boundary rather than exporting a duplicate catalog entry.
3. Copy/move only relevant card art, overlay art, symbols, backgrounds and licensed fonts into package ownership. Keep compatibility paths for existing app references during migration; do not remove unrelated public assets.
4. Build explicit artwork/font URL maps, asset manifests and third-party notices. Test referenced assets exist and resolve in packaged output.
5. Identify consumers of the old CSV files; replace stale inputs with generated catalog projections or retire them once unreferenced.

**Check:** catalog/source parity, all asset references present, no Google Fonts/network request required to render.

### 3. Extract full React cards and isolate styles

**Files:** existing `apps/web/src/components/cards/` implementations, existing `components/styleguide/{SceneCardFrame,LocationCard,EncounterCard,QuestCard}.tsx`, package `src/react/` files listed above, `packages/components/tests/rendering/`.

1. Start with Success/Fumble through `LayeredCard`; move presentation into the package and convert utility styles explicitly.
2. Add the automatic internal style boundary and packaged CSS/font entry. Avoid dynamic style-tag injection per card.
3. Move remaining families, Actor icon text, layers, custom card props, and scene card frames. Preserve original composition order, clipping and overlay opacity.
4. Separate face rendering from selected/disabled/hover/counter controls. Keep accessible names and keyboard interaction for interactive React use.
5. Add a small independent React consumer fixture with no Tailwind, then a different-theme fixture with Tailwind and reset styles. Exercise both CSS import orders and changed host root font size.

**Check:** representative visual comparisons against current cards, font/art readiness, SSR imports without browser globals, stable hydration IDs, keyboard/control behavior, and no style changes to surrounding host content. Do not assert brittle utility class strings.

### 4. Implement compact cards and multi-line titles

**Files:** `packages/components/src/react/CompactCard.tsx`, shared card props/types, `packages/components/tests/rendering/compact.spec.ts`.

1. Implement the 90 × 90 image region and reserved multi-line title area from the revised Success prototype.
2. Apply it to every portrait family using the resolved title/symbol/overlay. Omit body copy, deck labels, controls and corner duplicates.
3. Fit title after font loading with an explicit completion/overflow result; preserve spaces/word wrapping and full accessible text.
4. Verify actual long titles such as `Weapon Maintenance`, `Circle of Protection`, and `Oversized Weaponry`, plus a long custom composed title. Test compact/512 as well as compact/256 so geometry is independent of density.

**Check:** no title-art overlap, no clipped title, readable minimum, correct output geometry, and a deliberate failure for unrenderable custom input.

### 5. Generate CSVs and enumerate static cards

**Files:** `packages/components/scripts/{write-csv,enumerate-static-cards}.ts`, catalog tests and CSV round-trip tests, `packages/components/src/catalog.ts`.

1. Implement the nine catalog projections and stable CSV schemas.
2. Enumerate complete cards, standalone layer reference cards, Counter templates and supported backs explicitly.
3. Accept additional complete combinations/custom cards via the validated input manifest; resolve relative custom artwork against that input file.
4. Add coverage checks comparing the enumerated IDs with all current catalogs. Display counts before rendering and report missing art/data before launching Chromium.

**Check:** CSV parse/serialize round-trip; every standard entry accounted for; quantities not expanded into duplicate images; no Actor/Asset Cartesian explosion.

### 6. Build the static PNG exporter and resource copy CLI

**Files:** `packages/components/scripts/{export,copy-static}.ts`, `export-app/{index.html,main.tsx}`, package/root scripts, export integration tests.

1. Add optional, pinned Playwright exporter tooling and document Chromium setup. Reuse existing Vite for the isolated render harness; no app backend.
2. Implement preset selection, single-card filters, custom manifests, staging output, deterministic paths, cache invalidation and cleanup.
3. Implement font/image/fit readiness, overflow reporting, exact-size element screenshots, and manifest checksums.
4. Add copy-static filtering for PNG/CSV/docs/skill resources with predictable destination paths.
5. Generate the full English catalog, record total file count/size, and inspect contact sheets. Do not add lossy quantization merely to meet an invented file-size target.

**Check:** all three Success presets, layered Actor/Asset, multi-line Stunt, Counter template, a custom landscape card, failure on missing art, a clean rerun, and absence of external network requests. Raster screenshots are browser-based; no image-generation model.

### 7. Import guides, document usage, and author the skill

**Files:** package `docs/en/`, `README.md`, `skills/mighty-decks-components/SKILL.md`; repo `docs/19-contributor-styleguide.md` and relevant `AGENTS.md` package-ownership guidance.

1. Copy both requested files, use the supplied Exiles rulebook as the package's main guide, and record provenance and differences from this app in `guide-differences.md`.
2. Ensure packaged guides work as ordinary Markdown: resolve local assets/links and document any renderer-specific syntax rather than assuming this app's Markdown components exist elsewhere.
3. Document install/build/export/copy commands, React/MDX examples, static Markdown links, CSV fields, custom composition, fonts, supported host styling and export limitations.
4. Write and validate the portable usage skill with relative paths. Include source-repo contributor workflow separately from consumer workflow.
5. Add the localization/print roadmap and the explicit English-only API policy.

**Check:** every relative skill/doc link resolves inside the extracted tarball; no machine-specific path is a runtime dependency; guide identity and conflicts are explicit.

### 8. Make this app consume the package

**Files:** `apps/web/package.json`, `apps/web/src/styles.css` or the app entry stylesheet import, current card component wrappers, `GameCardView.tsx`, `markdownGameComponents.ts`, `gameCardCatalogContext.tsx`, styleguide card routes and `scripts/generate-card-components-doc.mjs` if its source changed.

1. Add the workspace dependency and package CSS import, then replace existing implementations with package imports or thin adapters.
2. Keep Adventure catalog resolution, session state, Counter callbacks and route-specific behavior in this app. Map them to presentational package props.
3. Preserve existing Markdown tokens/JSX and app import compatibility. Audit shared `className` overrides and replace internal styling overrides with supported props where needed.
4. Ensure `pnpm dev` and split web commands prepare spec/package builds in order. Provide a package watch workflow; normal app work must not generate all PNGs.
5. Run current tests for affected cards/resolvers and browser checks for rulebook, card styleguide, and one Actor/Asset/Counter interaction.

**Check:** no duplicate independent card implementation; no server contract regressions; existing full card appearance and interactions preserved.

### 9. Pack and verify independently

**Files:** package `files`/`exports`/CLI metadata, root scripts, `.gitignore`, package consumer fixtures and `CHANGELOG.md`.

1. Keep batch-generated files out of source Git by default, but include them explicitly in local release tarballs alongside JS, declarations, CSS, assets, CSVs, guides and skill.
2. `components:pack` rejects missing/stale resources, reports final counts/size and produces a `.tgz` under `output/`. Do not publish or add automatic skill installation.
3. Install the tarball in a clean fixture outside workspace resolution. Test React and types, a different Tailwind theme, CSS/art/font paths, a non-root website base, MDX, and copied images in plain Markdown.
4. Verify Node-only entry points do not leak into browser bundles and that plain catalog/CSV users do not require React or Playwright. Verify optional exporter tooling setup with a helpful missing-tool message.
5. Run `pnpm check:agent`, `pnpm build:agent`, targeted package tests and affected web tests. Use `pnpm test:agent` if shared spec changes affect server behavior. Add a capped `components:verify:agent` wrapper if this becomes the routine package verification command.
6. Update changelog and contributor docs with build/export commands and no new runtime secrets/env vars. List any new build/export dependencies and their purpose.

**Done when:** a fresh consumer can render matching cards without this app's Tailwind theme, access CSVs, embed all generated standard PNGs, use the packaged skill and guides, and regenerate the English artifacts from one documented command. The revised compact art size and multi-line titles must be verified across the catalog.

## Review checkpoints

1. Confirm the implemented inventory matches the defined scope before documentation/catalog migration; guide authority is already decided in favor of the supplied Exiles rulebook.
2. Demonstrate one full/compact Outcome and one layered Actor/Asset in both host-style fixtures before moving all families.
3. Review full-batch contact sheets and tarball size before treating the first release as ready.

No package implementation or publication is performed by this planning change. The compact Success prototype is updated now to illustrate the requested smaller image.
