# 23 - Board View Prototype

The hidden `/board` route is a frontend-local lab for a reusable tabletop board
viewer. It is not connected to adventure sessions, campaign state, Socket.IO, or
server persistence.

The hidden `/spaceship` visual lab consumes the same board primitives for a real
prototype surface: ship metadata, Devices, Location cards, effect cards, token
rows, actor cards, and actor consequence cards are
all direct board items placed by pure layout helpers. Its route adds `Show All`,
`Focus Ally Ship`, and `Focus Enemy Ship` controls that call the board fit APIs
with pane-specific item IDs.

## Purpose

- Show a large virtual board inside a full-screen frame.
- Let users pan by dragging the frame and zoom with the wheel or route controls.
- Fit the whole board, all visible items, or a specific inserted item into the
  frame.
- Expose the same board controller through React context and a browser global so
  local scripts can place content by coordinate.

## Coordinate Model

- Board coordinates are CSS pixels in a fixed virtual board space.
- The current viewport is `{ x, y, zoom }`.
- `x` and `y` are the board coordinates at the frame origin.
- The board transform is `translate(${-x * zoom}px, ${-y * zoom}px) scale(zoom)`.
- Item descriptors use board-space `x` and `y` positions.

## Controller API

On `/board`, the route registers `window.mightyDecksBoard` with:

- `addItem(input)`
- `upsertItem(input)`
- `removeItem(id)`
- `clear()`
- `fitBoard()`
- `fitItems(ids?)`
- `focusItem(id)`
- `setViewport(viewport)`
- `panBy(delta)`
- `zoomAt(framePoint, zoom)`
- `applyLayout(layout, options?)`
- `applyFlexLayout(input, options?)`
- `applyStackLayout(input, options?)`
- `applyDeckLayout(input, options?)`
- `applyPileLayout(input, options?)`
- `applyFanLayout(input, options?)`
- `getLayoutItems(ids?)`
- `getSnapshot()`
- `subscribe(listener)`

Supported v1 item kinds are `note`, `card`, and `image`. Each item requires
`kind`, `x`, and `y`; it may also provide `id`, `width`, `height`, `title`,
`body`, `imageUrl`, `zIndex`, and `rotation`.

The board measures rendered item size with `ResizeObserver`. Provided
`width`/`height` values are initial layout hints; measured dimensions are used
for later fit and focus operations.

The React provider keeps board state in a reducer so frame size, viewport, focus
mode, item registry, measured item sizes, and transition timing update through a
single controller dispatch path.

## Layout Helpers

Board layouts are pure calculations over item boxes. They do not create React
components, wrapper elements, or grouped DOM nodes. The rendered board keeps
items as direct absolutely positioned children so later dragging and animated
movement between layouts can update item `x`/`y` positions directly. The board
surface itself is transparent and `overflow-visible`; frame clipping remains the
viewport boundary.

The first helper is `flexLayout`, a CSS-flex-inspired row/column layout:

- `direction` is `"row"` by default and can be `"column"`.
- `x` and `y` set the layout origin in board coordinates.
- `gap`, `rowGap`, and `columnGap` set item and line spacing.
- `wrapLimit` wraps to a new line/column when the main-axis size would overflow.
- Items can have different sizes; each line uses the largest cross-axis size.

Stacked helpers use the same flat placement model:

- `stackLayout` layers items at one origin, supports side/center alignment for
  mixed sizes, can offset each next item, and can apply per-item offsets for
  cases like a token placed on top of a card.
- `deckLayout` is a compact stack preset for same-size cards, normally face
  down, with a minimal upward offset and no horizontal drift to read as card
  thickness.
- `pileLayout` is a face-up discard pile preset with no positional offset and
  deterministic bounded rotations, defaulting to +/-15 degrees.
- `fanLayout` places items from left to right on a shallow arc, with
  configurable `overlap` and total `arcAngle`; each item remains a direct
  absolute-positioned board child with its own rotation.

`getLayoutItems(ids?)` returns current board item boxes using measured dimensions
where available. `applyLayout(layout, options?)` applies flat placement results
to matching board items and ignores missing ids. `applyFlexLayout(input,
options?)`, `applyStackLayout(input, options?)`, `applyDeckLayout(input,
options?)`, `applyPileLayout(input, options?)`, and `applyFanLayout(input,
options?)` are browser-global convenience paths for external scripts.

Nested layouts are supported by treating a prior layout result as a parent box in
another layout calculation. The final result is still a flat list of item
placements, not a DOM hierarchy.

Future layout helpers should use the same box/result/apply model.

The spaceship board layout follows that model by composing nested `flexLayout`
and `stackLayout` results, then flattening them into direct item placements.
Those exact coordinates are not a stable contract; use behavior-level tests for
item creation and focus helper APIs rather than locking card positions.

The frame owns the dot-grid texture. Its background position and size are driven
from the current viewport so the grid pans and zooms with user actions while
remaining visible behind transparent board content. Below each half-scale zoom
level, such as 50%, 25%, and 12.5%, the grid scale wraps back into a readable
range so zoomed-out views do not collapse the pattern into rendering artifacts.

## Smooth Transitions

Viewport-changing controller methods accept optional transition options:

```ts
{ smooth?: boolean; durationMs?: number }
```

For example:

```ts
window.mightyDecksBoard?.fitBoard({ smooth: true });
window.mightyDecksBoard?.zoomAt({ x: 600, y: 400 }, 1.25, {
  smooth: true,
  durationMs: 160,
});
window.mightyDecksBoard?.applyFlexLayout({
  direction: "row",
  x: 180,
  y: 160,
  gap: 32,
  wrapLimit: 1100,
}, { smooth: true });
window.mightyDecksBoard?.applyStackLayout({
  x: 180,
  y: 160,
  offset: { x: 0, y: 42 },
}, { smooth: true });
window.mightyDecksBoard?.applyDeckLayout({
  x: 180,
  y: 160,
}, { smooth: true });
window.mightyDecksBoard?.applyPileLayout({
  x: 380,
  y: 260,
  maxRotation: 15,
}, { smooth: true });
window.mightyDecksBoard?.applyFanLayout({
  x: 180,
  y: 220,
  overlap: 96,
  arcAngle: 42,
}, { smooth: true });
```

Transitions only apply when the caller opts in. Pointer drag and wheel zoom use
the same controller methods without transition options, so direct mouse
interaction remains immediate. Layout transitions animate item `left`/`top`
changes; they do not add a timeline system.

## Resize And Focus Behavior

The frame remembers the last fit target: whole board, all/specific items, or a
single item. When the frame size changes, that focus target is recomputed. If
the user manually pans or zooms, the view switches to manual mode and preserves
the current world-space center across resize.

## Non-goals

- No shared `/spec` contracts.
- No server routes or Socket.IO events.
- No persistence.
- No arbitrary HTML injection from external scripts.
- No production session-table replacement yet.
- No 3D deck perspective or z-axis thickness model yet.
