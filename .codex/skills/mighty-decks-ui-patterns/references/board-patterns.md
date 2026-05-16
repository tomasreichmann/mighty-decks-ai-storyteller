# Board Patterns

Use these rules for `/board`, `/spaceship`, and future tabletop/table surfaces.

## Board Architecture

- Use `BoardProvider` for board state/controller.
- Use `BoardFrame` for viewport measurement, pan, wheel zoom, clipping, and dot-grid texture.
- Use `Board` for rendering board items.
- Keep route-level controls outside the board transform.
- Keep board item rendering in `renderItem` or item-specific components, not nested layout containers.

## Flat Item Model

- Board layout helpers return placements; they do not create React components or grouped DOM nodes.
- Rendered board items stay direct absolutely positioned children.
- Use item ids and measured item boxes for fitting, focusing, and layout calculations.
- Do not introduce wrapper DOM groups to represent rows, hands, stacks, ships, or rooms.
- Compose nested layouts as calculations, then flatten final placements.

## Available Layouts

| Layout | Use case |
| --- | --- |
| `flexLayout` | Rows, columns, wrapping tabletop groups, ship rows, crew rows |
| `stackLayout` | Header-peek stacks, tokens on cards, effect piles, aligned overlays |
| `deckLayout` | Compact face-down/same-size decks |
| `pileLayout` | Face-up discard piles with deterministic bounded rotation |
| `fanLayout` | Hands or shallow arc presentations |

## Spaceship Rules

- `/spaceship` is a hidden full-screen visual lab, not a persisted multiplayer feature.
- Treat `/starship` references as `/spaceship`.
- Ship content is board-positioned: ship backgrounds, headers, Devices, Location cards, effect cards, energy tokens, actor tokens, and actor cards are all board items.
- Tokens render above cards.
- Most recently dragged item wins within its band.
- Location effect cards tuck behind the owning Location and stack upward.
- Device cards sit above Location cards.
- Actor effect cards tuck behind actor cards with header peeks.
- The energy token stack is a source/sink, not an ordinary draggable card.
- Avoid exact-coordinate tests; prefer behavior-level tests for layout helpers, item creation, focus APIs, drag/drop state, and z-order rules.

## Interaction Rules

- Pointer drag and wheel zoom should stay immediate.
- Disable wheel zoom while item drag is active.
- Smooth transitions are opt-in for fit/focus/layout settle behavior.
- Keep local prototype state local unless a task explicitly moves board behavior into shared contracts or session persistence.
