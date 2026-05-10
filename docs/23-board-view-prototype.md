# 23 - Board View Prototype

The hidden `/board` route is a frontend-local lab for a reusable tabletop board
viewer. It is not connected to adventure sessions, campaign state, Socket.IO, or
server persistence.

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
- `getLayoutItems(ids?)`
- `getSnapshot()`
- `subscribe(listener)`

Supported v1 item kinds are `note`, `card`, and `image`. Each item requires
`kind`, `x`, and `y`; it may also provide `id`, `width`, `height`, `title`,
`body`, `imageUrl`, and `zIndex`.

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
movement between layouts can update item `x`/`y` positions directly.

The first helper is `flexLayout`, a CSS-flex-inspired row/column layout:

- `direction` is `"row"` by default and can be `"column"`.
- `x` and `y` set the layout origin in board coordinates.
- `gap`, `rowGap`, and `columnGap` set item and line spacing.
- `wrapLimit` wraps to a new line/column when the main-axis size would overflow.
- Items can have different sizes; each line uses the largest cross-axis size.

`getLayoutItems(ids?)` returns current board item boxes using measured dimensions
where available. `applyLayout(layout, options?)` applies flat placement results
to matching board items and ignores missing ids. `applyFlexLayout(input,
options?)` is the browser-global convenience path for external scripts.

Nested layouts are supported by treating a prior layout result as a parent box in
another layout calculation. The final result is still a flat list of item
placements, not a DOM hierarchy.

Future `fan`, `deck`, and `stack` helpers should use the same box/result/apply
model.

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
- No fan, deck, or stack helpers in the first layout slice.
