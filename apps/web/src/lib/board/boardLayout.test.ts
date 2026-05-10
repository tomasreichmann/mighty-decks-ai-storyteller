import test from "node:test";
import assert from "node:assert/strict";
import {
  boardRecordsToLayoutItems,
  flexLayout,
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
