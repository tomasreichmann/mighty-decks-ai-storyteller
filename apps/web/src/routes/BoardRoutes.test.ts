import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("App registers the hidden board route in the no-header full-screen shell", () => {
  const source = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

  assert.match(source, /BoardPage/);
  assert.match(source, /path="\/board"/);
  assert.match(
    source,
    /<Route element=\{<NoHeaderFitScreenLayout \/>\}>[\s\S]*path="\/board"[\s\S]*<RouteShellBoundary>[\s\S]*<BoardPage \/>[\s\S]*<\/RouteShellBoundary>/,
  );
});

test("BoardPage exposes and cleans up the browser-global board controller", () => {
  const source = readFileSync(new URL("./BoardPage.tsx", import.meta.url), "utf8");

  assert.match(source, /board-page/);
  assert.match(source, /window\.mightyDecksBoard/);
  assert.match(source, /delete window\.mightyDecksBoard/);
  assert.match(source, /addItem/);
  assert.match(source, /fitItems/);
  assert.match(source, /focusItem/);
  assert.match(source, /applyLayout/);
  assert.match(source, /applyFlexLayout/);
  assert.match(source, /applyStackLayout/);
  assert.match(source, /applyDeckLayout/);
  assert.match(source, /applyPileLayout/);
  assert.match(source, /applyFanLayout/);
  assert.match(source, /getLayoutItems/);
});

test("BoardPage focuses newly added items without delayed state choreography", () => {
  const source = readFileSync(new URL("./BoardPage.tsx", import.meta.url), "utf8");

  assert.match(source, /controller\.focusItem\(id, \{ smooth: true \}\)/);
  assert.doesNotMatch(source, /setTimeout/);
});

test("BoardPage offers demo controls for flex row and column layouts", () => {
  const source = readFileSync(new URL("./BoardPage.tsx", import.meta.url), "utf8");

  assert.match(source, /applyDemoFlexLayout/);
  assert.match(source, /applyDemoFlexLayout\("row"\)/);
  assert.match(source, /applyDemoFlexLayout\("column"\)/);
  assert.match(source, /Flex row/);
  assert.match(source, /Flex column/);
});

test("BoardPage offers demo controls for stack, deck, pile, and token stack layouts", () => {
  const source = readFileSync(new URL("./BoardPage.tsx", import.meta.url), "utf8");

  assert.match(source, /applyDemoPeekStack/);
  assert.match(source, /applyDemoDeck/);
  assert.match(source, /applyDemoPile/);
  assert.match(source, /applyDemoTokenOnCard/);
  assert.match(source, /Header stack/);
  assert.match(source, /Deck/);
  assert.match(source, /Pile/);
  assert.match(source, /Token stack/);
  assert.doesNotMatch(source, /applyDemoDeck[\s\S]*offset: \{ x: 4, y: 4 \}/);
});

test("BoardPage offers a demo control for fan layout", () => {
  const source = readFileSync(new URL("./BoardPage.tsx", import.meta.url), "utf8");

  assert.match(source, /applyDemoFan/);
  assert.match(source, /applyFanLayout/);
  assert.match(source, /Fan/);
});
