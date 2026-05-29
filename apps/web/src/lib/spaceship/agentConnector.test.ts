import test from "node:test";
import assert from "node:assert/strict";
import { spaceshipBoardItemId } from "./board/geometry";
import { createSpaceshipDragState } from "./drag/state";
import { spaceshipScene } from "./scene/data";
import {
  applySpaceshipAgentOperations,
  resolveSpaceshipAgentPane,
} from "./agentConnector";

test("resolveSpaceshipAgentPane resolves Exiles ship aliases to the player pane", () => {
  const scene = structuredClone(spaceshipScene);
  const pane = resolveSpaceshipAgentPane(scene, "Exiles ship");

  assert.equal(pane?.paneId, "pane-player");
});

test("applySpaceshipAgentOperations adds a Shield Location with attached energy tokens", () => {
  const scene = structuredClone(spaceshipScene);
  const dragState = createSpaceshipDragState(scene);
  const result = applySpaceshipAgentOperations({
    scene,
    dragState,
    operations: [
      {
        type: "add-location",
        pane: "Exiles Corvette",
        title: "Shields",
        locationType: "shield-generator",
        level: 1,
        energyTokenCount: 2,
      },
    ],
  });

  assert.equal(result.errors.length, 0);
  const playerPane = result.scene.panes[0];
  const addedLocation = playerPane.locations.find(
    (location) => location.title === "Shields",
  );
  assert.ok(addedLocation);
  assert.equal(addedLocation.locationId, "player-shields");
  assert.equal(addedLocation.row, "bottom");
  assert.equal(addedLocation.device?.type, "shields");

  const locationItemId = spaceshipBoardItemId.location(addedLocation.locationId);
  const bottomRow = result.dragState.layouts.locationRows.find(
    (layout) => layout.layoutId === "spaceship:location-row:pane-player:bottom",
  );
  assert.ok(bottomRow?.itemIds.includes(locationItemId));
  assert.ok(
    result.dragState.cards.some(
      (card) => card.itemId === locationItemId && card.role === "location",
    ),
  );
  assert.ok(
    result.dragState.cards.some(
      (card) =>
        card.itemId === spaceshipBoardItemId.device("player-shields-device") &&
        card.role === "device",
    ),
  );

  const attachedTokens = result.dragState.tokens.filter(
    (token) =>
      token.kind === "energy" &&
      token.placement.type === "card" &&
      token.placement.cardItemId === locationItemId,
  );
  assert.equal(attachedTokens.length, 2);
  assert.deepEqual(
    attachedTokens.map((token) => token.label),
    ["1", "1"],
  );
});

test("applySpaceshipAgentOperations preserves manually placed cards and tokens", () => {
  const scene = structuredClone(spaceshipScene);
  const dragState = createSpaceshipDragState(scene);
  const manualCardId = spaceshipBoardItemId.location("player-reactor");
  const manualTokenId = "reactor-energy";
  const manuallyEdited = {
    ...dragState,
    cards: dragState.cards.map((card) =>
      card.itemId === manualCardId
        ? { ...card, x: 1234, y: 567, placement: { type: "board" as const } }
        : card,
    ),
    tokens: dragState.tokens.map((token) =>
      token.tokenId === manualTokenId
        ? { ...token, x: 321, y: 654, placement: { type: "board" as const } }
        : token,
    ),
  };

  const result = applySpaceshipAgentOperations({
    scene,
    dragState: manuallyEdited,
    operations: [
      {
        type: "add-energy-tokens",
        pane: "Exiles Corvette",
        targetLocation: "Life Support",
        count: 1,
      },
    ],
  });

  const manualCard = result.dragState.cards.find(
    (card) => card.itemId === manualCardId,
  );
  const manualToken = result.dragState.tokens.find(
    (token) => token.tokenId === manualTokenId,
  );
  assert.equal(manualCard?.placement.type, "board");
  assert.equal(manualCard?.x, 1234);
  assert.equal(manualCard?.y, 567);
  assert.equal(manualToken?.placement.type, "board");
  assert.equal(manualToken?.x, 321);
  assert.equal(manualToken?.y, 654);
});

test("applySpaceshipAgentOperations gives duplicate location titles collision-safe ids", () => {
  const scene = structuredClone(spaceshipScene);
  const dragState = createSpaceshipDragState(scene);
  const result = applySpaceshipAgentOperations({
    scene,
    dragState,
    operations: [
      {
        type: "add-location",
        pane: "Exiles Corvette",
        title: "Cockpit",
        locationType: "cockpit",
        level: 1,
      },
    ],
  });

  assert.equal(result.errors.length, 0);
  assert.ok(
    result.scene.panes[0].locations.some(
      (location) => location.locationId === "player-cockpit-2",
    ),
  );
});

test("applySpaceshipAgentOperations rejects ambiguous panes without mutating state", () => {
  const scene = structuredClone(spaceshipScene);
  const dragState = createSpaceshipDragState(scene);
  const result = applySpaceshipAgentOperations({
    scene,
    dragState,
    operations: [
      {
        type: "add-location",
        pane: "pane",
        title: "Shields",
        locationType: "shield-generator",
      },
    ],
  });

  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0].message, /Ambiguous pane/);
  assert.deepEqual(result.scene, scene);
  assert.deepEqual(result.dragState, dragState);
});
