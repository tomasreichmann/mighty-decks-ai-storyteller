import test from "node:test";
import assert from "node:assert/strict";
import {
  boardRecordsToLayoutItems,
  deckLayout,
  fanLayout,
  flexLayout,
  pileLayout,
  stackLayout,
  type BoardLayoutResult,
} from "./boardLayout";
import type { BoardItemRecord } from "./boardController";

test("flexLayout places equal-size items in a row by default", () => {
  const layout = flexLayout([
    { id: "a", width: 100, height: 80 },
    { id: "b", width: 100, height: 80 },
    { id: "c", width: 100, height: 80 },
  ]);

  assert.deepEqual(layout, {
    placements: [
      { id: "a", x: 0, y: 0, width: 100, height: 80 },
      { id: "b", x: 100, y: 0, width: 100, height: 80 },
      { id: "c", x: 200, y: 0, width: 100, height: 80 },
    ],
    bounds: { x: 0, y: 0, width: 300, height: 80 },
  });
});

test("flexLayout places items in a column with a gap", () => {
  const layout = flexLayout(
    [
      { id: "a", width: 80, height: 50 },
      { id: "b", width: 120, height: 70 },
    ],
    { direction: "column", gap: 12, x: 40, y: 30 },
  );

  assert.deepEqual(layout, {
    placements: [
      { id: "a", x: 40, y: 30, width: 80, height: 50 },
      { id: "b", x: 40, y: 92, width: 120, height: 70 },
    ],
    bounds: { x: 40, y: 30, width: 120, height: 132 },
  });
});

test("flexLayout uses the largest cross-axis item size per wrapped line", () => {
  const layout = flexLayout(
    [
      { id: "wide-short", width: 90, height: 40 },
      { id: "tall", width: 60, height: 110 },
      { id: "next-line", width: 70, height: 50 },
    ],
    { columnGap: 10, rowGap: 20, wrapLimit: 170 },
  );

  assert.deepEqual(layout.placements, [
    { id: "wide-short", x: 0, y: 0, width: 90, height: 40 },
    { id: "tall", x: 100, y: 0, width: 60, height: 110 },
    { id: "next-line", x: 0, y: 130, width: 70, height: 50 },
  ]);
  assert.deepEqual(layout.bounds, { x: 0, y: 0, width: 160, height: 180 });
});

test("flexLayout applies row and column gaps independently", () => {
  const rowLayout = flexLayout(
    [
      { id: "a", width: 40, height: 30 },
      { id: "b", width: 40, height: 30 },
      { id: "c", width: 40, height: 30 },
    ],
    { columnGap: 8, rowGap: 18, wrapLimit: 90 },
  );

  assert.deepEqual(rowLayout.placements, [
    { id: "a", x: 0, y: 0, width: 40, height: 30 },
    { id: "b", x: 48, y: 0, width: 40, height: 30 },
    { id: "c", x: 0, y: 48, width: 40, height: 30 },
  ]);

  const columnLayout = flexLayout(
    [
      { id: "a", width: 40, height: 30 },
      { id: "b", width: 40, height: 30 },
      { id: "c", width: 40, height: 30 },
    ],
    { direction: "column", columnGap: 8, rowGap: 18, wrapLimit: 80 },
  );

  assert.deepEqual(columnLayout.placements, [
    { id: "a", x: 0, y: 0, width: 40, height: 30 },
    { id: "b", x: 0, y: 48, width: 40, height: 30 },
    { id: "c", x: 48, y: 0, width: 40, height: 30 },
  ]);
});

test("flexLayout returns an empty zero-size result for no items", () => {
  assert.deepEqual(flexLayout([], { x: 20, y: 30 }), {
    placements: [],
    bounds: { x: 20, y: 30, width: 0, height: 0 },
  });
});

test("flexLayout does not preserve stale pile rotations", () => {
  const layout = flexLayout([
    { id: "a", width: 100, height: 80, rotation: -8 },
    { id: "b", width: 100, height: 80, rotation: 11 },
  ]);

  assert.deepEqual(layout.placements, [
    { id: "a", x: 0, y: 0, width: 100, height: 80 },
    { id: "b", x: 100, y: 0, width: 100, height: 80 },
  ]);
});

test("flexLayout treats nested layout results as boxes and flattens placements", () => {
  const nested: BoardLayoutResult = flexLayout(
    [
      { id: "nested-a", width: 30, height: 20 },
      { id: "nested-b", width: 40, height: 20 },
    ],
    { x: 100, y: 50, gap: 5 },
  );

  const parent = flexLayout(
    [
      { layout: nested },
      { id: "outer", width: 80, height: 50 },
    ],
    { x: 10, y: 20, gap: 12 },
  );

  assert.deepEqual(parent.placements, [
    { id: "nested-a", x: 10, y: 20, width: 30, height: 20 },
    { id: "nested-b", x: 45, y: 20, width: 40, height: 20 },
    { id: "outer", x: 97, y: 20, width: 80, height: 50 },
  ]);
  assert.deepEqual(parent.bounds, { x: 10, y: 20, width: 167, height: 50 });
});

test("boardRecordsToLayoutItems uses measured sizes before configured hints", () => {
  const records: BoardItemRecord[] = [
    {
      id: "a",
      kind: "note",
      x: 0,
      y: 0,
      width: 100,
      height: 80,
      measuredWidth: 120,
      measuredHeight: 90,
      zIndex: 2,
    },
    {
      id: "b",
      kind: "card",
      x: 0,
      y: 0,
      width: 140,
      height: 110,
      zIndex: 3,
    },
  ];

  assert.deepEqual(boardRecordsToLayoutItems(records, ["b", "missing", "a"]), [
    { id: "b", width: 140, height: 110, zIndex: 3 },
    { id: "a", width: 120, height: 90, zIndex: 2 },
  ]);
});

test("stackLayout offsets same-size cards by a header height", () => {
  const layout = stackLayout(
    [
      { id: "a", width: 240, height: 160 },
      { id: "b", width: 240, height: 160 },
      { id: "c", width: 240, height: 160 },
    ],
    { x: 100, y: 80, offset: { x: 0, y: 34 }, zIndexStart: 8 },
  );

  assert.deepEqual(layout.placements, [
    { id: "a", x: 100, y: 80, width: 240, height: 160, zIndex: 8 },
    { id: "b", x: 100, y: 114, width: 240, height: 160, zIndex: 9 },
    { id: "c", x: 100, y: 148, width: 240, height: 160, zIndex: 10 },
  ]);
  assert.deepEqual(layout.bounds, { x: 100, y: 80, width: 240, height: 228 });
});

test("stackLayout does not preserve stale pile rotations unless requested", () => {
  const layout = stackLayout(
    [
      { id: "a", width: 180, height: 250, rotation: -12 },
      { id: "b", width: 180, height: 250, rotation: 9 },
    ],
    { x: 20, y: 30, offset: { x: 0, y: 36 } },
  );

  assert.deepEqual(layout.placements, [
    { id: "a", x: 20, y: 30, width: 180, height: 250, zIndex: 0 },
    { id: "b", x: 20, y: 66, width: 180, height: 250, zIndex: 1 },
  ]);
});

test("stackLayout applies explicit rotations when requested", () => {
  const layout = stackLayout(
    [
      { id: "a", width: 180, height: 250 },
      { id: "b", width: 180, height: 250 },
    ],
    { rotations: { a: -4, b: 6 } },
  );

  assert.deepEqual(
    layout.placements.map((placement) => placement.rotation),
    [-4, 6],
  );
});

test("stackLayout aligns different-size items to a side before offsetting", () => {
  const layout = stackLayout(
    [
      { id: "wide", width: 240, height: 120 },
      { id: "small", width: 80, height: 60 },
    ],
    { x: 50, y: 40, align: "bottom-right", offset: { x: -12, y: 18 } },
  );

  assert.deepEqual(layout.placements, [
    { id: "wide", x: 50, y: 40, width: 240, height: 120, zIndex: 0 },
    { id: "small", x: 198, y: 118, width: 80, height: 60, zIndex: 1 },
  ]);
  assert.deepEqual(layout.bounds, { x: 50, y: 40, width: 240, height: 138 });
});

test("stackLayout supports arbitrary item offsets for token-on-card placement", () => {
  const layout = stackLayout(
    [
      { id: "card", width: 260, height: 180 },
      { id: "token", width: 48, height: 48 },
    ],
    {
      x: 300,
      y: 220,
      itemOffsets: {
        token: { x: 174, y: 62 },
      },
    },
  );

  assert.deepEqual(layout.placements, [
    { id: "card", x: 300, y: 220, width: 260, height: 180, zIndex: 0 },
    { id: "token", x: 474, y: 282, width: 48, height: 48, zIndex: 1 },
  ]);
  assert.deepEqual(layout.bounds, { x: 300, y: 220, width: 260, height: 180 });
});

test("deckLayout makes a compact same-card deck with minimal offsets", () => {
  const layout = deckLayout(
    [
      { id: "a", width: 180, height: 250 },
      { id: "b", width: 180, height: 250 },
      { id: "c", width: 180, height: 250 },
    ],
    { x: 20, y: 30 },
  );

  assert.deepEqual(layout.placements, [
    { id: "a", x: 20, y: 30, width: 180, height: 250, zIndex: 0 },
    { id: "b", x: 20, y: 28, width: 180, height: 250, zIndex: 1 },
    { id: "c", x: 20, y: 26, width: 180, height: 250, zIndex: 2 },
  ]);
  assert.deepEqual(layout.bounds, { x: 20, y: 26, width: 180, height: 254 });
});

test("fanLayout lays items left to right with overlap and arc rotations", () => {
  const layout = fanLayout(
    [
      { id: "a", width: 100, height: 140 },
      { id: "b", width: 100, height: 140 },
      { id: "c", width: 100, height: 140 },
    ],
    { x: 10, y: 20, overlap: 40, arcAngle: 30, zIndexStart: 5 },
  );

  assert.deepEqual(
    layout.placements.map((placement) => ({
      id: placement.id,
      x: placement.x,
      width: placement.width,
      height: placement.height,
      zIndex: placement.zIndex,
      rotation: placement.rotation,
    })),
    [
      { id: "a", x: 10, width: 100, height: 140, zIndex: 5, rotation: -15 },
      { id: "b", x: 70, width: 100, height: 140, zIndex: 6, rotation: 0 },
      { id: "c", x: 130, width: 100, height: 140, zIndex: 7, rotation: 15 },
    ],
  );
  assert.equal(layout.placements[1].y, 20);
  assert.ok(layout.placements[0].y > layout.placements[1].y);
  assert.equal(layout.placements[0].y, layout.placements[2].y);
  assert.equal(layout.bounds.x, 10);
  assert.equal(layout.bounds.y, 20);
  assert.equal(layout.bounds.width, 220);
  assert.ok(layout.bounds.height > 140);
});

test("fanLayout keeps a single item unrotated at the origin", () => {
  const layout = fanLayout([{ id: "solo", width: 100, height: 140 }], {
    x: 30,
    y: 40,
    overlap: 80,
    arcAngle: 45,
  });

  assert.deepEqual(layout, {
    placements: [
      {
        id: "solo",
        x: 30,
        y: 40,
        width: 100,
        height: 140,
        zIndex: 0,
        rotation: 0,
      },
    ],
    bounds: { x: 30, y: 40, width: 100, height: 140 },
  });
});

test("fanLayout treats nested layout results as boxes and flattens placements", () => {
  const nested = stackLayout(
    [
      { id: "nested-a", width: 80, height: 120 },
      { id: "nested-b", width: 80, height: 120 },
    ],
    { x: 200, y: 100, offset: { x: 0, y: 24 } },
  );
  const layout = fanLayout(
    [{ layout: nested }, { id: "outer", width: 90, height: 130 }],
    { x: 10, y: 20, overlap: 20, arcAngle: 20 },
  );

  assert.deepEqual(
    layout.placements.map((placement) => placement.id),
    ["nested-a", "nested-b", "outer"],
  );
  assert.deepEqual(
    layout.placements.map((placement) => placement.rotation),
    [-10, -10, 10],
  );
});

test("pileLayout stacks cards face-up with bounded deterministic rotations", () => {
  const layout = pileLayout(
    [
      { id: "discard-a", width: 180, height: 250 },
      { id: "discard-b", width: 180, height: 250 },
      { id: "discard-c", width: 180, height: 250 },
    ],
    { x: 70, y: 90, maxRotation: 15 },
  );

  assert.deepEqual(
    layout.placements.map((placement) => ({
      id: placement.id,
      x: placement.x,
      y: placement.y,
      width: placement.width,
      height: placement.height,
      zIndex: placement.zIndex,
    })),
    [
      { id: "discard-a", x: 70, y: 90, width: 180, height: 250, zIndex: 0 },
      { id: "discard-b", x: 70, y: 90, width: 180, height: 250, zIndex: 1 },
      { id: "discard-c", x: 70, y: 90, width: 180, height: 250, zIndex: 2 },
    ],
  );
  assert.equal(layout.bounds.width, 180);
  assert.equal(layout.bounds.height, 250);
  assert.ok(
    layout.placements.every(
      (placement) =>
        placement.rotation !== undefined &&
        placement.rotation >= -15 &&
        placement.rotation <= 15,
    ),
  );
  assert.deepEqual(
    layout.placements.map((placement) => placement.rotation),
    pileLayout(
      [
        { id: "discard-a", width: 180, height: 250 },
        { id: "discard-b", width: 180, height: 250 },
        { id: "discard-c", width: 180, height: 250 },
      ],
      { x: 70, y: 90, maxRotation: 15 },
    ).placements.map((placement) => placement.rotation),
  );
});
