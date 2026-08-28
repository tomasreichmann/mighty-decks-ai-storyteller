---
name: mighty-decks-ui-patterns
description: Use when modifying Mighty Decks web UI, route shells, styleguide pages, shared components, cards, panels, controls, board/table surfaces, /board, /spaceship, or visual layout behavior.
---

# Mighty Decks UI Patterns

Use this skill before changing UI so new work reuses the existing tactile style system instead of creating one-off shells.

## Default Approach

1. Inspect the closest route, styleguide page, and shared component before adding UI.
2. Compose with shared primitives first.
3. Use `Panel` only for major framed surfaces, not every subsection.
4. Keep player/session views narration-first and transcript/table-first, not dashboard-heavy.
5. Promote repeated styled wrappers only after the same pattern appears in 2+ views.
6. For board/tabletop work, keep rendered board items flat and use pure layout helpers.

## Existing Card Components

Use the existing card implementations for cards shown in product UI or teaching figures; do not build miniature look-alike card shells with hand-authored art, titles, or rules text.

| Need | Use |
| --- | --- |
| Catalog-backed Outcome, Effect, Stunt, Actor, Counter, or Asset | `resolveGameCard` with `GameCardView`, wrapped in `CardBoundary` |
| Authored or layered Asset example | `AssetCard` |
| Actor with selected base/tactical layers | `ActorCard` |
| Adjustable/read-only tracked Counter | `CounterCard` |
| Scene or zone card | `LocationCard` |

- Scale an existing card with its `className` and compose labels or arrows around it; keep the card itself canonical.
- Use `GameCardView` for a known catalog entry so its artwork, type treatment, and card copy stay in sync with the rest of the app.
- Use local CSS only for layout, stacking, movement, or marker overlays around a real card—not to recreate a card face.

## References

- Read `references/shared-components.md` before choosing UI primitives.
- Read `references/panel-and-layout-rules.md` before adding frames, page sections, or custom wrappers.
- Read `references/board-patterns.md` for `/board`, `/spaceship`, table, card stack, token, and layout work.
- Read `references/styleguide-map.md` to find the live route or component lab that should guide the change.
