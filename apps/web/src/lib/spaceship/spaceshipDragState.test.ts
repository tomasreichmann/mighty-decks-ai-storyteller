import test from "node:test";
import assert from "node:assert/strict";
import { spaceshipScene } from "./spaceshipSceneData";
import {
  beginEnergyStackTokenDrag,
  beginSpaceshipTokenDrag,
  createSpaceshipDragState,
  dropSpaceshipTokenOnBoard,
  dropSpaceshipTokenOnCard,
  dropSpaceshipTokenOnEnergyStack,
  moveSpaceshipTokenFromDragOrigin,
  moveSpaceshipToken,
} from "./spaceshipDragState";
import { spaceshipBoardItemId } from "./spaceshipBoardLayout";

test("createSpaceshipDragState creates draggable energy and actor tokens from the seeded scene", () => {
  const state = createSpaceshipDragState(spaceshipScene);
  const tokenIds = new Set(state.tokens.map((token) => token.tokenId));

  assert.equal(state.energyStack.availableCount, 20);
  assert.ok(tokenIds.has("reactor-energy"));
  assert.ok(tokenIds.has("actor-machinist-token"));
  assert.equal(
    state.tokens.find((token) => token.tokenId === "reactor-energy")?.kind,
    "energy",
  );
  assert.equal(
    state.tokens.find((token) => token.tokenId === "actor-machinist-token")?.kind,
    "actor",
  );
  assert.deepEqual(
    state.tokens.find((token) => token.tokenId === "reactor-energy")?.placement,
    {
      type: "card",
      cardItemId: spaceshipBoardItemId.location("player-reactor"),
      offsetX: 89,
      offsetY: 78,
    },
  );
});

test("beginSpaceshipTokenDrag brings the touched token above other tokens", () => {
  const state = createSpaceshipDragState(spaceshipScene);
  const result = beginSpaceshipTokenDrag(state, "reactor-energy");
  const touched = result.state.tokens.find(
    (token) => token.tokenId === "reactor-energy",
  );
  const maxOtherZ = Math.max(
    ...result.state.tokens
      .filter((token) => token.tokenId !== "reactor-energy")
      .map((token) => token.zIndex),
  );

  assert.ok(touched);
  assert.equal(result.dragTokenId, "reactor-energy");
  assert.ok(touched.zIndex > maxOtherZ);
});

test("dropSpaceshipTokenOnCard stores a card-relative placement", () => {
  const state = createSpaceshipDragState(spaceshipScene);
  const moved = moveSpaceshipToken(state, "reactor-energy", {
    deltaX: 240,
    deltaY: 120,
    zoom: 2,
  });
  const dropped = dropSpaceshipTokenOnCard(
    moved,
    "reactor-energy",
    spaceshipBoardItemId.actorCard("actor-veteran"),
    { x: 500, y: 700 },
  );
  const token = dropped.tokens.find((candidate) => candidate.tokenId === "reactor-energy");

  assert.ok(token);
  assert.equal(token.placement.type, "card");
  assert.equal(token.placement.cardItemId, spaceshipBoardItemId.actorCard("actor-veteran"));
  assert.equal(token.placement.offsetX, token.x - 500);
  assert.equal(token.placement.offsetY, token.y - 700);
});

test("dropSpaceshipTokenOnBoard stores board-level placement", () => {
  const state = createSpaceshipDragState(spaceshipScene);
  const moved = moveSpaceshipToken(state, "reactor-energy", {
    deltaX: 30,
    deltaY: 18,
    zoom: 3,
  });
  const dropped = dropSpaceshipTokenOnBoard(moved, "reactor-energy");
  const token = dropped.tokens.find((candidate) => candidate.tokenId === "reactor-energy");

  assert.ok(token);
  assert.deepEqual(token.placement, { type: "board" });
  assert.equal(token.x, 10);
  assert.equal(token.y, 6);
});

test("moveSpaceshipTokenFromDragOrigin keeps movement anchored to the original pointer grab", () => {
  const state = createSpaceshipDragState(spaceshipScene);
  const moved = moveSpaceshipTokenFromDragOrigin(state, "reactor-energy", {
    startX: 120,
    startY: 80,
    startClientX: 400,
    startClientY: 300,
    clientX: 700,
    clientY: 450,
    zoom: 2,
  });
  const movedAgainFromStaleState = moveSpaceshipTokenFromDragOrigin(
    moved,
    "reactor-energy",
    {
      startX: 120,
      startY: 80,
      startClientX: 400,
      startClientY: 300,
      clientX: 700,
      clientY: 450,
      zoom: 2,
    },
  );
  const token = moved.tokens.find((candidate) => candidate.tokenId === "reactor-energy");
  const tokenAgain = movedAgainFromStaleState.tokens.find(
    (candidate) => candidate.tokenId === "reactor-energy",
  );

  assert.ok(token);
  assert.ok(tokenAgain);
  assert.equal(token.x, 270);
  assert.equal(token.y, 155);
  assert.equal(tokenAgain.x, token.x);
  assert.equal(tokenAgain.y, token.y);
  assert.deepEqual(token.placement, { type: "board" });
});

test("beginEnergyStackTokenDrag creates a new energy token and decrements the stack", () => {
  const state = createSpaceshipDragState(spaceshipScene);
  const result = beginEnergyStackTokenDrag(state, { x: 1000, y: 1200 });
  const token = result.state.tokens.find(
    (candidate) => candidate.tokenId === result.dragTokenId,
  );

  assert.equal(result.state.energyStack.availableCount, 19);
  assert.ok(token);
  assert.equal(token.kind, "energy");
  assert.equal(token.label, "1");
  assert.equal(token.x, 1000);
  assert.equal(token.y, 1200);
  assert.deepEqual(token.placement, { type: "board" });
});

test("dropSpaceshipTokenOnEnergyStack removes an energy token and restores the stack count", () => {
  const state = createSpaceshipDragState(spaceshipScene);
  const result = beginEnergyStackTokenDrag(state, { x: 1000, y: 1200 });
  const dropped = dropSpaceshipTokenOnEnergyStack(
    result.state,
    result.dragTokenId,
  );

  assert.equal(dropped.energyStack.availableCount, 20);
  assert.equal(
    dropped.tokens.some((token) => token.tokenId === result.dragTokenId),
    false,
  );
});
