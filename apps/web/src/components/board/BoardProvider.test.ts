import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("BoardProvider exposes controller state and item measurement through context", () => {
  const source = readFileSync(new URL("./BoardProvider.tsx", import.meta.url), "utf8");

  assert.match(source, /useReducer/);
  assert.doesNotMatch(source, /useState/);
  assert.match(source, /boardReducer/);
  assert.match(source, /dispatch/);
  assert.match(source, /createContext/);
  assert.match(source, /useBoard/);
  assert.match(source, /registerItemElement/);
  assert.match(source, /ResizeObserver/);
  assert.match(source, /isItemInViewport/);
  assert.match(source, /worldToFrame/);
  assert.match(source, /frameToWorld/);
});

test("BoardProvider measures item layout size without transform-scaled DOMRect loops", () => {
  const source = readFileSync(new URL("./BoardProvider.tsx", import.meta.url), "utf8");

  assert.match(source, /itemElements\.current\.get\(id\) === element/);
  assert.match(source, /offsetWidth/);
  assert.match(source, /offsetHeight/);
  assert.doesNotMatch(source, /getBoundingClientRect\(\)/);
});

test("BoardProvider exposes optional smooth transitions for API viewport changes", () => {
  const source = readFileSync(new URL("./BoardProvider.tsx", import.meta.url), "utf8");

  assert.match(source, /BoardTransitionOptions/);
  assert.match(source, /transitionDurationMs/);
  assert.match(source, /withTransition/);
  assert.match(source, /setViewport: \([\s\S]*viewport: BoardViewport,[\s\S]*options\?: BoardTransitionOptions,[\s\S]*\) => void/);
  assert.match(source, /panBy: \(delta: BoardPoint, options\?: BoardTransitionOptions\)/);
  assert.match(source, /zoomAt: \([\s\S]*framePoint: BoardPoint,[\s\S]*zoom: number,[\s\S]*options\?: BoardTransitionOptions,[\s\S]*\) => void/);
  assert.match(source, /fitBoard: \(options\?: BoardTransitionOptions\)/);
  assert.match(source, /fitItems: \(ids\?: string\[], options\?: BoardTransitionOptions\)/);
  assert.match(source, /focusItem: \(id: string, options\?: BoardTransitionOptions\)/);
});

test("BoardProvider exposes layout application through the reducer-backed controller", () => {
  const source = readFileSync(new URL("./BoardProvider.tsx", import.meta.url), "utf8");

  assert.match(source, /applyLayout/);
  assert.match(source, /applyFlexLayout/);
  assert.match(source, /getLayoutItems/);
  assert.match(source, /type: "apply-layout"/);
  assert.match(source, /boardRecordsToLayoutItems/);
  assert.match(source, /flexLayout/);
  assert.match(source, /if \(!existing\) \{\s*continue;/);
});
