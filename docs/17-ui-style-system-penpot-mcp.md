# 17 - UI Style System for Penpot MCP

This document is the canonical visual style contract for the web app and the Penpot MCP handoff payload.

It complements `docs/04-ui-components.md` (structural composition) with concrete style tokens and reusable visual patterns.

## 1. Purpose and Scope

Goals:

- Document current style truth from implementation.
- Define canonical usage guidance for future UI work.
- Provide machine-readable token payload for Penpot MCP recreation.

In scope:

- Colors, spacing, typography, surfaces, borders, shadows, motion, z-index.
- Primitive component style contracts.
- Reusable pattern recipes.
- Drift registry (current mismatches and canonical decisions).

Out of scope:

- Runtime UI refactors.
- Tailwind config changes.
- Spec/runtime event contract changes in `/spec`.

## 2. Source of Truth Order

Primary sources:

1. `apps/web/tailwind.config.ts`
2. `apps/web/src/styles.css`
3. `apps/web/src/components/common/*`
4. Active route/component usage under `apps/web/src/components/*` and `apps/web/src/routes/*`

Secondary legacy reference:

- `docs/ux-design/tailwind.config.cjs`

Canonicalization rule:

- If implementation and legacy reference differ, implementation is canonical for this phase.
- Legacy values remain `legacy-reference` only.

## 3. Token Taxonomy

Machine-readable payload files:

- `docs/ux-design/penpot-mcp-tokens.schema.json`
- `docs/ux-design/penpot-mcp-tokens.current.json`

### Color tokens

| Token group | Explicit values | Status | Source |
| --- | --- | --- | --- |
| `palette.core` | `kac-steel-light #f3f3f4`, `kac-iron #121b23`, `kac-iron-dark #090f15`, `kac-blood-light #e3132c`, `kac-fire-light #f88b00`, `kac-bone-light #e4ceb3`, `kac-gold #ffd23b`, `kac-gold-dark #f59d20`, `kac-cloth-light #80a0bc`, `kac-curse #f20170`, `kac-monster-dark #1aa62b`, `special #d99600`, `success #1aa62b`, `partial #65738b`, `chaos #f20170`, `fumble #090f15`, `ink #111827`, `paper #f8fafc` | `canonical` | `apps/web/tailwind.config.ts` |
| `literals.current` | `#fffdf5`, `#f8efd8`, `#fffaf0`, `#d6c1a1`, `#9f8a6d`, `255 210 59` | `current-only` | common components + message css module |

Usage rule:

- Prefer `kac-*` and outcome utility tokens over hardcoded literals.
- Do not introduce new hardcoded color literals without documenting them in token payload.

### Spacing tokens

| Token group | Explicit values | Status | Source |
| --- | --- | --- | --- |
| `scale.tailwind-used` | `0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 10, 12` | `canonical` | shared primitives |
| `layout.shell` | `max-width 1120px`, `padding 1.25rem` | `canonical` | `apps/web/src/styles.css` |
| `exceptions` | `panelFrame 4px`, `fadeMask 14px`, `halftoneGrid 10px`, `paperShadowInset -10px -20px` | `current-only` | panel/transcript/framed-image styles |

Usage rule:

- New layouts should use Tailwind spacing scale first.
- Exception values are reserved for visual effects and must stay component-local.

### Typography tokens

| Token group | Explicit values | Status | Source |
| --- | --- | --- | --- |
| `families` | `md-body: Shantell Sans`, `md-heading: Kalam`, `md-title: Passion One`, `md-logo: Kalam` | `canonical` | tailwind + global css |
| `sizes` | `2xs: 0.6/0.75`, `3xs: 0.5/0.6` | `canonical` | tailwind config |
| `textVariants` | `h1/h2/h3`, `body`, `quote`, `note`, `emphasised` (exact class strings in payload) | `canonical` | `Text.tsx` |
| `legacy.title-effects` | `drop.title`, `drop.emboss` | `legacy-reference` | legacy ux tailwind config |

Usage rule:

- Headings and stickers use `md-heading` family.
- Body and controls use `md-body` family.
- Use `Text` primitive variants instead of reauthoring type classes in route components.
- Use `Heading` for semantic title blocks, `Label` for sticker/tag surfaces, and the shared `sm`/`md`/`lg` control ladder for `Button`, `TextField`, `TextArea`, `DepressedInput`, `ToggleButton`, `RockerSwitch`, and `ButtonRadioGroup`.
- `Label` tone coverage now includes `gold`, `fire`, `blood`, `bone`, `steel`, `skin`, `cloth`, `curse`, and `monster`; validate the full sticker palette in `/styleguide/typography` and `/styleguide/tags`.
- `Heading` highlight accent color is allowed to vary by section tone instead of staying fixed to one highlight color across the app; the semantic heading palette resolves to lighter tones for the base highlight colors (`gold`, `fire`, `blood`, `bone`, `steel`, `skin`, `cloth`, `curse`, `monster`) so title underlines stay readable, and the typography styleguide includes those supported tones as live examples.

## 4. Semantic Alias Map

Semantic aliases are additive and do not rename implementation tokens.

Core aliases in payload:

- `surface.base`
- `surface.panel`
- `surface.callout`
- `text.primary`
- `text.muted`
- `action.primary`
- `action.secondary`
- `status.success`
- `status.partial`
- `status.chaos`
- `status.fumble`

Usage rule:

- Design tooling and Penpot libraries should consume semantic aliases first, then raw tokens only when needed.

## 5. Typography and Spacing Rhythm

Typography rhythm:

- Display hierarchy: `h1` > `h2` > `h3`.
- Narrative copy: `quote` for scene prose, `body` for regular text.
- Helper text: `note` with reduced emphasis.

Spacing rhythm:

- Page sections: `gap-4` baseline.
- Card internals: `gap-2` baseline.
- Field groups: `gap-1` baseline.
- Controls: use `px-3/4/5` and `py-1.5/2/2.5` from existing button sizing.

Exceptions:

- Halftone, frame skew, and mask fade values are effect-only and should not become layout defaults.

## 6. Surface, Border, Radius, Shadow, Motion

Surface rules:

- Use Panel gradients (`bone`, `gold`, `cloth`, `fire`) for framed containers.
- Use Message gradients for semantic callouts.
- Treat `Panel` as the framed surface and validate its density and tone choices in `/styleguide/panel` before reusing it broadly.

Border rules:

- Primary control border width is `2px`.
- Input depth borders (`3px` + `6px`) are current-only style behavior.
- Panel frame `4px` border remains pattern-specific.

Radius rules:

- `rounded-sm` for framed rectangular controls/cards.
- `rounded-full` for circular controls and toggle track.

Shadow rules:

- Keep tactile hard shadows for controls.
- Keep inset dual shadows for panel and toggle depth.

Motion rules:

- Use configured Tailwind animations for generic states.
- Keep component-local keyframes (`pendingDotBounce`, highlight strokes, message pulse) where currently used.

## 7. Component Style Contracts

Canonical contracts are defined for:

- `Button`
- `ToggleButton`
- `RockerSwitch`
- `ButtonRadioGroup`
- `CTAButton`
- `Panel`
- `Heading`
- `Text`
- `Label`
- `Message`
- `Tag`
- `ConnectionStatusPill`
- `TextField`
- `TextArea`
- `Toggle`
- `DepressedInput`

Tag family note:

- `Tag` is the shared chip shell for read-only labels and status pills.
- `Tags` composes `Tag` for editable chip rows instead of reimplementing the shell.
- `ConnectionStatusPill` composes `Tag` for live status readouts and a leading dot.

Primitive API notes:

- `Button` solid is the neutral default for standard and grouped actions.
- `CTAButton` owns the skewed, highlighted solo-action treatment, and its hover highlight resolves to a darker matching tone for the washed-out gold, steel, and monster buttons.
- `Label` uses `color` and `size` props rather than dynamic text-class composition.
- `Heading` uses `level` instead of a variant prop so the semantic title level is explicit at the call site.
- Shared field and control shells use the same `sm`/`md`/`lg` size ladder so rows with adjacent controls can match height.

Source of truth for variant maps:

- `docs/ux-design/penpot-mcp-tokens.current.json` -> `components`.

Usage rule:

- New views must reuse these primitives before introducing one-off styled wrappers.

## 8. Pattern Catalog and Layout Conventions

Canonical patterns:

1. `framed-panel`
2. `sticker-label`
3. `highlight-heading`
4. `tactile-control`
5. `callout-card`
6. `narrative-stack`
7. `phase-shell`
8. `cta-highlight-button`
9. `status-pill-with-dot`
10. `grouped-toggle-row`

Current route chrome note:

- The top navigation in `Page.tsx` and `Page.module.css` now uses explicit per-link comic panel background assets (`monster` for Home, `gold` for Modules, `fire` for Campaigns, `cloth` for Rules, `curse` for Image Lab, and `grey` for Workflow) instead of hue-rotating a shared image.
- When adding or revising top-level nav items, assign a specific background asset in the nav item config rather than recoloring a single shared background in CSS.

Campaign/session alignment note:

- Session-facing campaign screens should borrow Adventure-mode discipline:
  - one dominant surface for the main storytelling task
  - transcript-first hierarchy
  - roster/status/debug regions expressed with lighter wrappers before another framed panel
- Join entry should use one compact CTA-width action, not stretched full-width buttons whose hover skew/rotation becomes visually noisy.
- Status summaries should prefer `Tag` and `ConnectionStatusPill` near the section title before introducing another content surface.
- `Panel` remains the right choice for primary story surfaces, summary cards, and major route blocks, but it should not become the default wrapper for every inner subsection, roster item, or form cluster on session screens.

Grouped-control note:

- Use `ToggleButton` and `ButtonRadioGroup` for compact stateful choices that need to sit side-by-side.
- These controls intentionally avoid the main `Button` solid variant's tilt and skew so grouped rows stay aligned and readable.
- Emphasis should come from accent color and depth changes between inactive and active states, not from irregular rotation.
- Use `RockerSwitch` when a binary choice should feel more toy-like or mechanical than a flat toggle button. It can carry an optional left-side `Label` that uses the same shared size ladder and sits slightly underneath the switch like a tucked tag.

Each pattern in payload includes:

- `useWhen`
- `avoidWhen`
- `recipe`
- `tokenRefs`
- `source`

Usage rule:

- Pattern recipes are intended to be directly recreated in Penpot component sets.

## 9. Drift Registry

Tracked implementation drifts:

1. Button taxonomy mismatch (`solid|ghost|circle` vs docs naming).
2. Undefined `AdventureHeader` color classes.
6. `Panel` disabled pseudo behavior mismatch.
7. `Text` h1 transform class syntax risk.
8. Penpot token payload does not yet encode the Page nav's per-route background art assignments.
9. Grouped toggle controls remain a separate control family from the main `Button` variant taxonomy by design.

Canonical decision policy:

- Keep runtime unchanged in this task.
- Record drift in payload and this doc.
- Apply fixes only in dedicated implementation tasks.

## 10. Penpot MCP Usage Guide

Project setup guide:

- `docs/ux-design/penpot-mcp-setup.md`

Default workflow:

1. Run Penpot MCP setup (`mcp-prod` default).
2. Connect plugin and MCP endpoint.
3. Load this style doc and the token payload.
4. Build Penpot components from `components` and `patterns` sections.

## 11. Maintenance and Validation Workflow

When style code changes:

1. Update token payload first (`penpot-mcp-tokens.current.json`).
2. Update semantic aliases if meaning changed.
3. Update this doc tables/rules.
4. Re-run JSON schema validation.
5. Add or update drift entries when mismatches are discovered.

Validation command:

```bash
npx -y ajv-cli@5 validate --spec=draft2020 -s docs/ux-design/penpot-mcp-tokens.schema.json -d docs/ux-design/penpot-mcp-tokens.current.json
```

Validation result:

- 2026-02-28: `docs/ux-design/penpot-mcp-tokens.current.json` validates successfully against `docs/ux-design/penpot-mcp-tokens.schema.json` using the command above.
- Note: the schema initially used `format: date-time` for `generatedAt`; it was replaced with an explicit ISO-8601 UTC pattern for ajv-cli compatibility.

## 12. Authoring Wireframe Annotation Convention

For Adventure Module authoring wireframes in Penpot, use a fixed side-annotation rail.

Scope:

- Penpot page: `Adventure Module Authoring - Flow v1`
- Frame inventory and copy source: `docs/ux-design/adventure-module-authoring-flow-v1-frames.md`
- Import-ready frame pack: `docs/ux-design/penpot/adventure-module-authoring-flow-v1/`

Side rail rules:

- Place the rail to the right of the viewport, outside main frame content.
- Keep heading order consistent in all frames.
- Do not replace the canonical heading labels.

Required heading labels:

- `Purpose`
- `Primary actions`
- `Validation`
- `Autosave`
- `Visibility/publish rules`

Wireframe intent:

- Keep structure-first and low-fidelity.
- Reuse existing style primitives and token conventions from this document.
- Avoid adding visual details that imply final production styling.
