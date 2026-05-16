import test from "node:test";
import assert from "node:assert/strict";
import { spaceshipScene } from "./spaceshipSceneData";
import {
  applySpaceshipCardLiveSnap,
  beginSpaceshipCardDrag,
  beginEnergyStackTokenDrag,
  beginSpaceshipTokenDrag,
  createSpaceshipDragState,
  didSpaceshipCardLayoutDragExceedTearOffDistance,
  dropSpaceshipCardOnBoard,
  dropSpaceshipTokenOnBoard,
  dropSpaceshipTokenOnCard,
  dropSpaceshipTokenOnEnergyStack,
  dropSpaceshipCardOnTrashTarget,
  dropSpaceshipTokenOnTrashTarget,
  getFrameTrashTargetBounds,
  insertSpaceshipCardIntoLayout,
  isFrameBoundsOverTrashTarget,
  isFramePointOverTrashTarget,
  isSpaceshipCardSnapInsertBlocked,
  isSpaceshipCardLayoutTearOffBlocked,
  moveSpaceshipCardFromDragOrigin,
  moveSpaceshipTokenFromDragOrigin,
  moveSpaceshipToken,
  removeSpaceshipCardFromLayouts,
  resolveSpaceshipCardSnapTarget,
  spaceshipCardLayoutTearOffDistancePx,
  spaceshipCardSnapInsertCooldownMs,
  spaceshipTrashFrameTargetSize,
} from "./spaceshipDragState";
import {
  createSpaceshipBoardLayout,
  spaceshipBoardItemId,
} from "./spaceshipBoardLayout";

test("didSpaceshipCardLayoutDragExceedTearOffDistance requires a 10px tear-off from layout", () => {
  assert.equal(spaceshipCardLayoutTearOffDistancePx, 10);
  assert.equal(
    didSpaceshipCardLayoutDragExceedTearOffDistance({
      anchorClientX: 100,
      anchorClientY: 100,
      clientX: 107,
      clientY: 107,
    }),
    false,
  );
  assert.equal(
    didSpaceshipCardLayoutDragExceedTearOffDistance({
      anchorClientX: 100,
      anchorClientY: 100,
      clientX: 108,
      clientY: 106,
    }),
    true,
  );
});

test("isSpaceshipCardSnapInsertBlocked keeps a torn card out of layouts for 400ms", () => {
  assert.equal(spaceshipCardSnapInsertCooldownMs, 400);
  assert.equal(isSpaceshipCardSnapInsertBlocked(1399, 1400), true);
  assert.equal(isSpaceshipCardSnapInsertBlocked(1400, 1400), false);
  assert.equal(isSpaceshipCardSnapInsertBlocked(1401, 1400), false);
  assert.equal(isSpaceshipCardSnapInsertBlocked(1401, null), false);
});

test("isSpaceshipCardLayoutTearOffBlocked keeps a newly snapped card docked for 400ms", () => {
  assert.equal(isSpaceshipCardLayoutTearOffBlocked(1399, 1400), true);
  assert.equal(isSpaceshipCardLayoutTearOffBlocked(1400, 1400), false);
  assert.equal(isSpaceshipCardLayoutTearOffBlocked(1401, 1400), false);
  assert.equal(isSpaceshipCardLayoutTearOffBlocked(1401, null), false);
});

test("isFramePointOverTrashTarget resolves the lower-left frame corner", () => {
  const frameSize = { width: 1280, height: 720 };

  assert.equal(spaceshipTrashFrameTargetSize, 80);
  assert.deepEqual(getFrameTrashTargetBounds(frameSize), {
    x: 0,
    y: 640,
    width: 80,
    height: 80,
  });
  assert.equal(isFramePointOverTrashTarget(frameSize, { x: 70, y: 650 }), true);
  assert.equal(isFramePointOverTrashTarget(frameSize, { x: 90, y: 650 }), false);
  assert.equal(isFramePointOverTrashTarget(frameSize, { x: 70, y: 630 }), false);
});

test("isFrameBoundsOverTrashTarget resolves dragged item overlap with the lower-left frame corner", () => {
  const frameSize = { width: 1280, height: 720 };

  assert.equal(
    isFrameBoundsOverTrashTarget(frameSize, {
      x: 70,
      y: 560,
      width: 40,
      height: 130,
    }),
    true,
  );
  assert.equal(
    isFrameBoundsOverTrashTarget(frameSize, {
      x: 90,
      y: 560,
      width: 40,
      height: 130,
    }),
    false,
  );
  assert.equal(
    isFrameBoundsOverTrashTarget(frameSize, {
      x: 12,
      y: 520,
      width: 40,
      height: 90,
    }),
    false,
  );
});

test("isFrameBoundsOverTrashTarget handles frames smaller than the trash target size", () => {
  const frameSize = { width: 48, height: 52 };

  assert.deepEqual(getFrameTrashTargetBounds(frameSize), {
    x: 0,
    y: 0,
    width: 48,
    height: 52,
  });
  assert.equal(
    isFrameBoundsOverTrashTarget(frameSize, {
      x: 44,
      y: 40,
      width: 12,
      height: 12,
    }),
    true,
  );
  assert.equal(
    isFrameBoundsOverTrashTarget(frameSize, {
      x: 50,
      y: 10,
      width: 12,
      height: 12,
    }),
    false,
  );
});

test("createSpaceshipDragState creates layout membership for rows, device columns, actor rows, and effect stacks", () => {
  const state = createSpaceshipDragState(spaceshipScene);
  const playerTopRow = state.layouts.locationRows.find(
    (row) => row.paneId === "pane-player" && row.row === "top",
  );
  const reactorDeviceColumn = state.layouts.deviceColumns.find(
    (column) =>
      column.locationItemId === spaceshipBoardItemId.location("player-reactor"),
  );
  const reactorEffects = state.layouts.effectStacks.find(
    (stack) =>
      stack.ownerItemId === spaceshipBoardItemId.location("player-reactor"),
  );
  const veteranEffects = state.layouts.effectStacks.find(
    (stack) =>
      stack.ownerItemId === spaceshipBoardItemId.actorCard("actor-veteran"),
  );
  const playerActorRow = state.layouts.actorRows.find(
    (row) => row.paneId === "pane-player",
  );

  assert.ok(playerTopRow);
  assert.ok(playerTopRow.itemIds.includes(spaceshipBoardItemId.location("player-reactor")));
  assert.ok(reactorDeviceColumn);
  assert.deepEqual(reactorDeviceColumn.itemIds, [
    spaceshipBoardItemId.device("player-reactor-device"),
  ]);
  assert.ok(reactorEffects);
  assert.deepEqual(reactorEffects.itemIds, [
    spaceshipBoardItemId.effectCard("reactor-distress", 0),
  ]);
  assert.ok(veteranEffects);
  assert.deepEqual(veteranEffects.itemIds, [
    spaceshipBoardItemId.actorEffectCard("actor-veteran", "injury", 0),
    spaceshipBoardItemId.actorEffectCard("actor-veteran", "injury", 1),
    spaceshipBoardItemId.actorEffectCard("actor-veteran", "distress", 0),
  ]);
  assert.ok(playerActorRow);
  assert.ok(playerActorRow.itemIds.includes(spaceshipBoardItemId.actorCard("actor-veteran")));
});

test("removeSpaceshipCardFromLayouts removes a Location from its row and reflows source membership", () => {
  const state = createSpaceshipDragState(spaceshipScene);
  const itemId = spaceshipBoardItemId.location("player-reactor");
  const removed = removeSpaceshipCardFromLayouts(state, itemId);
  const playerTopRow = removed.layouts.locationRows.find(
    (row) => row.paneId === "pane-player" && row.row === "top",
  );
  const card = removed.cards.find((candidate) => candidate.itemId === itemId);

  assert.ok(playerTopRow);
  assert.equal(playerTopRow.itemIds.includes(itemId), false);
  assert.ok(card);
  assert.deepEqual(card.placement, { type: "board" });
});

test("insertSpaceshipCardIntoLayout moves a Device into another room device column", () => {
  const state = createSpaceshipDragState(spaceshipScene);
  const itemId = spaceshipBoardItemId.device("player-reactor-device");
  const targetLayoutId = `spaceship:device-column:${spaceshipBoardItemId.location("player-life-support")}`;
  const moved = insertSpaceshipCardIntoLayout(
    removeSpaceshipCardFromLayouts(state, itemId),
    itemId,
    {
      type: "device-column",
      layoutId: targetLayoutId,
      index: 1,
    },
  );
  const sourceColumn = moved.layouts.deviceColumns.find(
    (column) =>
      column.locationItemId === spaceshipBoardItemId.location("player-reactor"),
  );
  const targetColumn = moved.layouts.deviceColumns.find(
    (column) => column.layoutId === targetLayoutId,
  );
  const card = moved.cards.find((candidate) => candidate.itemId === itemId);

  assert.ok(sourceColumn);
  assert.equal(sourceColumn.itemIds.includes(itemId), false);
  assert.ok(targetColumn);
  assert.deepEqual(targetColumn.itemIds, [
    spaceshipBoardItemId.device("player-life-support-device"),
    itemId,
  ]);
  assert.ok(card);
  assert.deepEqual(card.placement, { type: "layout", layoutId: targetLayoutId });
});

test("insertSpaceshipCardIntoLayout reorders an Actor across actor rows", () => {
  const state = createSpaceshipDragState(spaceshipScene);
  const itemId = spaceshipBoardItemId.actorCard("actor-veteran");
  const targetLayoutId = "spaceship:actor-row:pane-pirate";
  const moved = insertSpaceshipCardIntoLayout(
    removeSpaceshipCardFromLayouts(state, itemId),
    itemId,
    {
      type: "actor-row",
      layoutId: targetLayoutId,
      index: 1,
    },
  );
  const sourceRow = moved.layouts.actorRows.find(
    (row) => row.paneId === "pane-player",
  );
  const targetRow = moved.layouts.actorRows.find(
    (row) => row.layoutId === targetLayoutId,
  );

  assert.ok(sourceRow);
  assert.equal(sourceRow.itemIds.includes(itemId), false);
  assert.ok(targetRow);
  assert.equal(targetRow.itemIds[1], itemId);
});

test("insertSpaceshipCardIntoLayout attaches an effect behind Location, Device, and Actor owners", () => {
  const state = createSpaceshipDragState(spaceshipScene);
  const itemId = spaceshipBoardItemId.effectCard("reactor-distress", 0);
  const deviceStackId = `spaceship:effect-stack:${spaceshipBoardItemId.device("player-life-support-device")}`;
  const actorStackId = `spaceship:effect-stack:${spaceshipBoardItemId.actorCard("actor-veteran")}`;
  const movedToDevice = insertSpaceshipCardIntoLayout(
    removeSpaceshipCardFromLayouts(state, itemId),
    itemId,
    {
      type: "effect-stack",
      layoutId: deviceStackId,
      index: 999,
      ownerItemId: spaceshipBoardItemId.device("player-life-support-device"),
    },
  );
  const movedToActor = insertSpaceshipCardIntoLayout(
    removeSpaceshipCardFromLayouts(movedToDevice, itemId),
    itemId,
    {
      type: "effect-stack",
      layoutId: actorStackId,
      index: 999,
      ownerItemId: spaceshipBoardItemId.actorCard("actor-veteran"),
    },
  );
  const actorStack = movedToActor.layouts.effectStacks.find(
    (stack) => stack.layoutId === actorStackId,
  );

  assert.ok(
    movedToDevice.layouts.effectStacks
      .find((stack) => stack.layoutId === deviceStackId)
      ?.itemIds.includes(itemId),
  );
  assert.ok(actorStack);
  assert.equal(actorStack.itemIds.at(-1), itemId);
});

test("applySpaceshipCardLiveSnap leaves incompatible targets as manual board placement", () => {
  const state = createSpaceshipDragState(spaceshipScene);
  const itemId = spaceshipBoardItemId.device("player-reactor-device");
  const boardItems = createSpaceshipBoardLayout(spaceshipScene, state).placements.map(
    (placement) => ({
      ...placement,
      kind: "card" as const,
      zIndex: placement.zIndex ?? 0,
    }),
  );
  const stack = boardItems.find(
    (item) => item.id === spaceshipBoardItemId.energyStack(),
  );
  assert.ok(stack);
  const moved = applySpaceshipCardLiveSnap(state, itemId, boardItems, {
    x: stack.x + stack.width / 2,
    y: stack.y + stack.height / 2,
  });
  const card = moved.cards.find((candidate) => candidate.itemId === itemId);

  assert.ok(card);
  assert.deepEqual(card.placement, { type: "board" });
});

test("resolveSpaceshipCardSnapTarget calculates row and column insertion indexes from pointer position", () => {
  const state = createSpaceshipDragState(spaceshipScene);
  const boardItems = createSpaceshipBoardLayout(spaceshipScene, state).placements.map(
    (placement) => ({
      ...placement,
      kind: "card" as const,
      zIndex: placement.zIndex ?? 0,
    }),
  );
  const dockingBay = boardItems.find(
    (item) => item.id === spaceshipBoardItemId.location("player-docking-bay"),
  );
  const lifeSupportDevice = boardItems.find(
    (item) => item.id === spaceshipBoardItemId.device("player-life-support-device"),
  );
  assert.ok(dockingBay);
  assert.ok(lifeSupportDevice);

  const locationTarget = resolveSpaceshipCardSnapTarget(
    state,
    boardItems,
    spaceshipBoardItemId.location("player-reactor"),
    { x: dockingBay.x + 1, y: dockingBay.y + dockingBay.height / 2 },
  );
  const deviceTarget = resolveSpaceshipCardSnapTarget(
    state,
    boardItems,
    spaceshipBoardItemId.device("player-reactor-device"),
    {
      x: lifeSupportDevice.x + lifeSupportDevice.width / 2,
      y: lifeSupportDevice.y + lifeSupportDevice.height + 20,
    },
  );

  assert.equal(locationTarget?.type, "location-row");
  assert.equal(locationTarget?.index, 0);
  assert.equal(deviceTarget?.type, "device-column");
  assert.equal(deviceTarget?.index, 1);
});

test("createSpaceshipDragState creates draggable cards for eligible board card roles", () => {
  const state = createSpaceshipDragState(spaceshipScene);
  const cardIds = new Set(state.cards.map((card) => card.itemId));

  assert.ok(cardIds.has(spaceshipBoardItemId.location("player-reactor")));
  assert.ok(cardIds.has(spaceshipBoardItemId.device("player-life-support-device")));
  assert.ok(cardIds.has(spaceshipBoardItemId.effectCard("reactor-distress", 0)));
  assert.ok(cardIds.has(spaceshipBoardItemId.actorCard("actor-veteran")));
  assert.ok(cardIds.has(spaceshipBoardItemId.actorEffectCard("actor-veteran", "injury", 0)));
  assert.equal(cardIds.has(spaceshipBoardItemId.energyStack()), false);
  assert.equal(cardIds.has(spaceshipBoardItemId.shipHeader("pane-player")), false);
  assert.equal(
    state.cards.find(
      (card) => card.itemId === spaceshipBoardItemId.location("player-reactor"),
    )?.role,
    "location",
  );
});

test("beginSpaceshipCardDrag brings the touched card above other cards but below tokens", () => {
  const state = createSpaceshipDragState(spaceshipScene);
  const itemId = spaceshipBoardItemId.location("player-reactor");
  const result = beginSpaceshipCardDrag(state, itemId);
  const touched = result.state.cards.find((card) => card.itemId === itemId);
  const maxOtherCardZ = Math.max(
    ...result.state.cards
      .filter((card) => card.itemId !== itemId)
      .map((card) => card.zIndex),
  );
  const minTokenZ = Math.min(...result.state.tokens.map((token) => token.zIndex));

  assert.ok(touched);
  assert.equal(result.dragItemId, itemId);
  assert.ok(touched.zIndex > maxOtherCardZ);
  assert.ok(touched.zIndex < minTokenZ);
});

test("moveSpaceshipCardFromDragOrigin keeps card movement anchored to the original pointer grab", () => {
  const state = createSpaceshipDragState(spaceshipScene);
  const itemId = spaceshipBoardItemId.location("player-reactor");
  const moved = moveSpaceshipCardFromDragOrigin(state, itemId, {
    startX: 800,
    startY: 400,
    startClientX: 300,
    startClientY: 200,
    clientX: 600,
    clientY: 350,
    zoom: 2,
  });
  const movedAgainFromStaleState = moveSpaceshipCardFromDragOrigin(
    moved,
    itemId,
    {
      startX: 800,
      startY: 400,
      startClientX: 300,
      startClientY: 200,
      clientX: 600,
      clientY: 350,
      zoom: 2,
    },
  );
  const card = moved.cards.find((candidate) => candidate.itemId === itemId);
  const cardAgain = movedAgainFromStaleState.cards.find(
    (candidate) => candidate.itemId === itemId,
  );

  assert.ok(card);
  assert.ok(cardAgain);
  assert.equal(card.x, 950);
  assert.equal(card.y, 475);
  assert.equal(cardAgain.x, card.x);
  assert.equal(cardAgain.y, card.y);
  assert.deepEqual(card.placement, { type: "board" });
});

test("dropSpaceshipCardOnBoard stores board-level placement", () => {
  const state = createSpaceshipDragState(spaceshipScene);
  const itemId = spaceshipBoardItemId.location("player-reactor");
  const dropped = dropSpaceshipCardOnBoard(state, itemId);
  const card = dropped.cards.find((candidate) => candidate.itemId === itemId);

  assert.ok(card);
  assert.deepEqual(card.placement, { type: "board" });
});

test("createSpaceshipBoardLayout uses manual card positions without reflowing other layout cards", () => {
  const state = createSpaceshipDragState(spaceshipScene);
  const itemId = spaceshipBoardItemId.location("player-reactor");
  const baseLayout = createSpaceshipBoardLayout(spaceshipScene, state);
  const moved = moveSpaceshipCardFromDragOrigin(state, itemId, {
    startX: 900,
    startY: 650,
    startClientX: 100,
    startClientY: 100,
    clientX: 220,
    clientY: 180,
    zoom: 1,
  });
  const nextLayout = createSpaceshipBoardLayout(spaceshipScene, moved);
  const baseById = new Map(baseLayout.placements.map((placement) => [placement.id, placement]));
  const nextById = new Map(nextLayout.placements.map((placement) => [placement.id, placement]));

  assert.equal(nextById.get(itemId)?.x, 1020);
  assert.equal(nextById.get(itemId)?.y, 730);
  assert.equal(
    nextById.get(spaceshipBoardItemId.location("player-sealed-corridor"))?.x,
    baseById.get(spaceshipBoardItemId.location("player-sealed-corridor"))?.x,
  );
});

test("createSpaceshipBoardLayout moves card-attached tokens with a dragged card", () => {
  const state = createSpaceshipDragState(spaceshipScene);
  const itemId = spaceshipBoardItemId.location("player-reactor");
  const moved = moveSpaceshipCardFromDragOrigin(state, itemId, {
    startX: 1000,
    startY: 500,
    startClientX: 50,
    startClientY: 50,
    clientX: 250,
    clientY: 150,
    zoom: 1,
  });
  const layout = createSpaceshipBoardLayout(spaceshipScene, moved);
  const placements = new Map(layout.placements.map((placement) => [placement.id, placement]));
  const card = placements.get(itemId);
  const token = placements.get(spaceshipBoardItemId.token("reactor-energy"));

  assert.ok(card);
  assert.ok(token);
  assert.equal(token.x, card.x + 89);
  assert.equal(token.y, card.y + 78);
});

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

test("dropSpaceshipTokenOnTrashTarget removes actor tokens", () => {
  const state = createSpaceshipDragState(spaceshipScene);
  const dropped = dropSpaceshipTokenOnTrashTarget(
    state,
    "actor-machinist-token",
  );

  assert.equal(
    dropped.state.tokens.some((token) => token.tokenId === "actor-machinist-token"),
    false,
  );
  assert.deepEqual(dropped.removedItemIds, [
    spaceshipBoardItemId.token("actor-machinist-token"),
  ]);
  assert.equal(dropped.state.energyStack.availableCount, 20);
});

test("dropSpaceshipTokenOnTrashTarget restores generated energy tokens to the stack", () => {
  const state = createSpaceshipDragState(spaceshipScene);
  const result = beginEnergyStackTokenDrag(state, { x: 1000, y: 1200 });
  const dropped = dropSpaceshipTokenOnTrashTarget(
    result.state,
    result.dragTokenId,
  );

  assert.equal(dropped.state.energyStack.availableCount, 20);
  assert.equal(
    dropped.state.tokens.some((token) => token.tokenId === result.dragTokenId),
    false,
  );
  assert.deepEqual(dropped.removedItemIds, [
    spaceshipBoardItemId.token(result.dragTokenId),
  ]);
});

test("dropSpaceshipCardOnTrashTarget removes a Location bundle and layout membership", () => {
  const state = createSpaceshipDragState(spaceshipScene);
  const itemId = spaceshipBoardItemId.location("player-reactor");
  const dropped = dropSpaceshipCardOnTrashTarget(state, itemId);
  const removedIds = new Set(dropped.removedItemIds);
  const playerTopRow = dropped.state.layouts.locationRows.find(
    (row) => row.paneId === "pane-player" && row.row === "top",
  );
  const deviceColumn = dropped.state.layouts.deviceColumns.find(
    (column) => column.locationItemId === itemId,
  );

  assert.equal(dropped.state.cards.some((card) => card.itemId === itemId), false);
  assert.equal(playerTopRow?.itemIds.includes(itemId), false);
  assert.equal(deviceColumn?.itemIds.length, 0);
  assert.ok(removedIds.has(itemId));
  assert.ok(removedIds.has(spaceshipBoardItemId.device("player-reactor-device")));
  assert.ok(removedIds.has(spaceshipBoardItemId.effectCard("reactor-distress", 0)));
  assert.ok(removedIds.has(spaceshipBoardItemId.token("reactor-energy")));
  assert.equal(
    dropped.state.tokens.some((token) => token.tokenId === "reactor-energy"),
    false,
  );
});

test("dropSpaceshipCardOnTrashTarget removes an Actor bundle and matching actor token", () => {
  const state = createSpaceshipDragState(spaceshipScene);
  const itemId = spaceshipBoardItemId.actorCard("actor-machinist");
  const dropped = dropSpaceshipCardOnTrashTarget(state, itemId);
  const removedIds = new Set(dropped.removedItemIds);
  const playerActorRow = dropped.state.layouts.actorRows.find(
    (row) => row.paneId === "pane-player",
  );

  assert.equal(dropped.state.cards.some((card) => card.itemId === itemId), false);
  assert.equal(playerActorRow?.itemIds.includes(itemId), false);
  assert.ok(removedIds.has(itemId));
  assert.ok(removedIds.has(spaceshipBoardItemId.token("actor-machinist-token")));
  assert.equal(
    dropped.state.tokens.some(
      (token) => token.tokenId === "actor-machinist-token",
    ),
    false,
  );
});

test("dropSpaceshipCardOnTrashTarget removes only the targeted effect card and attached tokens", () => {
  const state = createSpaceshipDragState(spaceshipScene);
  const effectId = spaceshipBoardItemId.actorEffectCard(
    "actor-veteran",
    "injury",
    0,
  );
  const withAttachedToken = dropSpaceshipTokenOnCard(
    state,
    "reactor-energy",
    effectId,
    { x: 500, y: 500 },
  );
  const dropped = dropSpaceshipCardOnTrashTarget(withAttachedToken, effectId);
  const removedIds = new Set(dropped.removedItemIds);
  const veteranStack = dropped.state.layouts.effectStacks.find(
    (stack) =>
      stack.ownerItemId === spaceshipBoardItemId.actorCard("actor-veteran"),
  );

  assert.equal(dropped.state.cards.some((card) => card.itemId === effectId), false);
  assert.equal(
    dropped.state.cards.some(
      (card) =>
        card.itemId ===
        spaceshipBoardItemId.actorEffectCard("actor-veteran", "injury", 1),
    ),
    true,
  );
  assert.equal(veteranStack?.itemIds.includes(effectId), false);
  assert.ok(removedIds.has(effectId));
  assert.ok(removedIds.has(spaceshipBoardItemId.token("reactor-energy")));
  assert.equal(
    dropped.state.tokens.some((token) => token.tokenId === "reactor-energy"),
    false,
  );
});
