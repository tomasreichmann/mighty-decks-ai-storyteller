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
    const locationCards = example.items.filter((item) =>
      item.id?.startsWith("setup-location-") ?? false,
    );
    const portraitCards = example.items.filter(
      (item) =>
        item.kind === "card" && !(item.id?.startsWith("setup-location-") ?? false),
    );
    const locationSizes = new Set(
      locationCards.map((item) => `${item.width}x${item.height}`),
    );
    const portraitSizes = new Set(
      portraitCards.map((item) => `${item.width}x${item.height}`),
    );

    assert.equal(locationSizes.size, 1);
    assert.equal(portraitSizes.size, 1);
    assert.equal(locationCards[0]?.width, portraitCards[0]?.height);
    assert.equal(locationCards[0]?.height, portraitCards[0]?.width);
  }

  assert.ok("coreActionLoopBoard" in fixtures);
  assert.ok("coreActionLoopMobileBoard" in fixtures);
  for (const example of [
    fixtures.coreActionLoopBoard,
    fixtures.coreActionLoopMobileBoard,
  ]) {
    const cardSizes = new Set(
      example.items
        .filter((item) => item.kind === "card")
        .map((item) => `${item.width}x${item.height}`),
    );

    assert.equal(cardSizes.size, 1);
    assert.ok(example.items.some((item) => item.id === "loop-selected"));
    assert.ok(example.items.some((item) => item.id === "loop-deck"));
    assert.ok(example.items.some((item) => item.id === "loop-refreshed-first"));
  }

  assert.ok("actorInitiativeBoard" in fixtures);
  assert.ok("actorInitiativeMobileBoard" in fixtures);
  for (const example of [
    fixtures.actorInitiativeBoard,
    fixtures.actorInitiativeMobileBoard,
  ]) {
    const itemIds = example.items.map((item) => item.id);
    assert.equal(new Set(itemIds).size, itemIds.length);
    for (const item of example.items) {
      assert.ok(item.x >= 0 && item.y >= 0);
      assert.ok(item.x + (item.width ?? 0) <= example.boardSize.width);
      assert.ok(item.y + (item.height ?? 0) <= example.boardSize.height);
    }
    for (const itemId of [
      "initiative-mira",
      "initiative-guard",
      "initiative-wolf",
      "initiative-aldren",
      "initiative-bandit",
      "initiative-tomas",
    ]) {
      assert.ok(itemIds.includes(itemId));
    }
    const cardSizes = new Set(
      example.items
        .filter((item) => item.kind === "card")
        .map((item) => `${item.width}x${item.height}`),
    );
    assert.equal(cardSizes.size, 1);
  }

  assert.ok("zonesAndRangeBoard" in fixtures);
  assert.ok("zonesAndRangeMobileBoard" in fixtures);
  for (const example of [fixtures.zonesAndRangeBoard, fixtures.zonesAndRangeMobileBoard]) {
    const itemIds = example.items.map((item) => item.id);
    assert.equal(new Set(itemIds).size, itemIds.length);
    for (const itemId of ["zone-gate", "zone-courtyard", "zone-tower", "zone-mira", "zone-bandit", "range-sword", "range-throw", "range-bow"]) {
      assert.ok(itemIds.includes(itemId));
    }
    for (const item of example.items) {
      assert.notEqual(item.width, undefined, `${item.id} has a width`);
      assert.notEqual(item.height, undefined, `${item.id} has a height`);
      const itemWidth = item.width ?? 0;
      const itemHeight = item.height ?? 0;
      assert.ok(item.x >= 0 && item.y >= 0, `${item.id} starts inside the board`);
      assert.ok(
        item.x + itemWidth <= example.boardSize.width && item.y + itemHeight <= example.boardSize.height,
        `${item.id} stays inside the board`,
      );
    }
    const cardSizes = new Set(example.items.filter((item) => item.kind === "card").map((item) => `${item.width}x${item.height}`));
    assert.equal(cardSizes.size, 1);
  }

  assert.ok("catastropheFlowBoard" in fixtures);
  assert.ok("catastropheFlowMobileBoard" in fixtures);
  for (const example of [fixtures.catastropheFlowBoard, fixtures.catastropheFlowMobileBoard]) {
    const itemIds = example.items.map((item) => item.id);
    assert.equal(new Set(itemIds).size, itemIds.length);
    for (const itemId of [
      "catastrophe-resolved",
      "catastrophe-draw",
      "catastrophe-fumble-first",
      "catastrophe-fumble-second",
      "catastrophe-fumble-third",
      "catastrophe-trigger",
      "catastrophe-consequence-injury",
      "catastrophe-consequence-complication",
      "catastrophe-consequence-boost",
    ]) {
      assert.ok(itemIds.includes(itemId));
    }
    for (const item of example.items) {
      assert.ok(item.x >= 0 && item.y >= 0, `${item.id} starts inside the board`);
      assert.ok(
        item.x + (item.width ?? 0) <= example.boardSize.width &&
          item.y + (item.height ?? 0) <= example.boardSize.height,
        `${item.id} stays inside the board`,
      );
    }
    const cardSizes = new Set(
      example.items
        .filter((item) => item.kind === "card")
        .map((item) => `${item.width}x${item.height}`),
    );
    assert.equal(cardSizes.size, 1);
  }

  assert.ok("statusThresholdsBoard" in fixtures);
  assert.ok("statusThresholdsMobileBoard" in fixtures);
  for (const example of [fixtures.statusThresholdsBoard, fixtures.statusThresholdsMobileBoard]) {
    const itemIds = example.items.map((item) => item.id);
    assert.equal(new Set(itemIds).size, itemIds.length);
    for (const itemId of [
      "distress-ok",
      "distress-three",
      "status-panicked",
      "distress-four",
      "status-hopeless",
      "injury-ok",
      "injury-four",
      "status-taken-out",
    ]) {
      assert.ok(itemIds.includes(itemId));
    }
    for (const item of example.items) {
      assert.ok(item.x >= 0 && item.y >= 0, `${item.id} starts inside the board`);
      assert.ok(
        item.x + (item.width ?? 0) <= example.boardSize.width &&
          item.y + (item.height ?? 0) <= example.boardSize.height,
        `${item.id} stays inside the board`,
      );
    }
    const cardSizes = new Set(
      example.items
        .filter((item) => item.kind === "card")
        .map((item) => `${item.width}x${item.height}`),
    );
    assert.equal(cardSizes.size, 1);
  }

  assert.ok("fumbleBranchesBoard" in fixtures);
  assert.ok("fumbleBranchesMobileBoard" in fixtures);
  for (const example of [fixtures.fumbleBranchesBoard, fixtures.fumbleBranchesMobileBoard]) {
    const itemIds = example.items.map((item) => item.id);
    assert.equal(new Set(itemIds).size, itemIds.length);
    for (const itemId of [
      "fumble-source",
      "fumble-miss",
      "fumble-hit-but",
      "fumble-bandit",
      "fumble-injury",
      "fumble-bow",
      "fumble-complication",
    ]) {
      assert.ok(itemIds.includes(itemId));
    }
    for (const item of example.items) {
      assert.ok(item.x >= 0 && item.y >= 0, `${item.id} starts inside the board`);
      assert.ok(
        item.x + (item.width ?? 0) <= example.boardSize.width &&
          item.y + (item.height ?? 0) <= example.boardSize.height,
        `${item.id} stays inside the board`,
      );
    }
    const cardSizes = new Set(
      example.items
        .filter((item) => item.kind === "card")
        .map((item) => `${item.width}x${item.height}`),
    );
    assert.equal(cardSizes.size, 1);
  }
});
