import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

test("the complete table board is flat, labelled, and contained", async () => {
  const fixtureUrl = new URL("./rulesBoardExamples.ts", import.meta.url);

  assert.ok(existsSync(fixtureUrl));
  const fixtures = await import("./rulesBoardExamples");
  const { completeTableSetupBoard } = fixtures;
  const itemIds = completeTableSetupBoard.items.map((item) => item.id);

  assert.equal(new Set(itemIds).size, itemIds.length);
  for (const item of completeTableSetupBoard.items) {
    assert.ok(item.x >= 0 && item.y >= 0);
    assert.ok(item.x + (item.width ?? 0) <= completeTableSetupBoard.boardSize.width);
    assert.ok(item.y + (item.height ?? 0) <= completeTableSetupBoard.boardSize.height);
  }

  for (const itemId of [
    "setup-location-gate",
    "setup-location-courtyard",
    "setup-location-tower",
    "setup-counter",
    "setup-actor-guard",
    "setup-outcome-deck",
    "setup-mira-token",
    "setup-aldren-token",
    "setup-tomas-token",
  ]) {
    assert.ok(itemIds.includes(itemId));
  }

  assert.ok("completeTableSetupMobileBoard" in fixtures);
  const completeTableSetupMobileBoard = fixtures.completeTableSetupMobileBoard;
  assert.ok(
    completeTableSetupMobileBoard.items.some(
      (item) => item.id === "setup-mobile-player-label",
    ),
  );
  for (const item of completeTableSetupMobileBoard.items) {
    assert.ok(item.x >= 0 && item.y >= 0);
    assert.ok(
      item.x + (item.width ?? 0) <= completeTableSetupMobileBoard.boardSize.width,
    );
    assert.ok(
      item.y + (item.height ?? 0) <= completeTableSetupMobileBoard.boardSize.height,
    );
  }

  for (const example of [
    completeTableSetupBoard,
    completeTableSetupMobileBoard,
  ]) {
    const cardSizes = new Set(
      example.items
        .filter((item) => item.kind === "card")
        .map((item) => `${item.width}x${item.height}`),
    );

    assert.equal(cardSizes.size, 1);
  }
});
