import test from "node:test";
import assert from "node:assert/strict";
import { spaceshipScene } from "./spaceshipSceneData";
import {
  createSpaceshipBoardLayout,
  createSpaceshipBoardItems,
  getSpaceshipBoardPaneItemIds,
  isSpaceshipCardDropTargetItemId,
  spaceshipBoardItemId,
} from "./spaceshipBoardLayout";
import {
  createSpaceshipDragState,
  insertSpaceshipCardIntoLayout,
  removeSpaceshipCardFromLayouts,
} from "./spaceshipDragState";

test("createSpaceshipBoardItems creates board entries for locations, devices, individual tokens, effects, and actor parts", () => {
  const dragState = createSpaceshipDragState(spaceshipScene);
  const items = createSpaceshipBoardItems(spaceshipScene, dragState);
  const ids = new Set(items.map((item) => item.id));

  assert.ok(ids.has(spaceshipBoardItemId.location("player-reactor")));
  assert.ok(ids.has(spaceshipBoardItemId.device("player-reactor-device")));
  assert.ok(ids.has(spaceshipBoardItemId.token("reactor-energy")));
  assert.ok(ids.has(spaceshipBoardItemId.token("actor-machinist-token")));
  assert.ok(ids.has(spaceshipBoardItemId.energyStack()));
  assert.ok(
    ids.has(spaceshipBoardItemId.effectCard("reactor-distress", 0)),
  );
  assert.ok(ids.has(spaceshipBoardItemId.actorCard("actor-machinist")));
  assert.ok(
    ids.has(spaceshipBoardItemId.actorEffectCard("actor-machinist", "injury", 0)),
  );
});

test("createSpaceshipBoardLayout renders multiple Devices in a flow column above a Location", () => {
  const state = createSpaceshipDragState(spaceshipScene);
  const deviceId = spaceshipBoardItemId.device("player-reactor-device");
  const targetLocationId = spaceshipBoardItemId.location("player-life-support");
  const moved = insertSpaceshipCardIntoLayout(
    removeSpaceshipCardFromLayouts(state, deviceId),
    deviceId,
    {
      type: "device-column",
      layoutId: `spaceship:device-column:${targetLocationId}`,
      index: 1,
    },
  );
  const layout = createSpaceshipBoardLayout(spaceshipScene, moved);
  const placements = new Map(layout.placements.map((placement) => [placement.id, placement]));
  const lifeSupport = placements.get(targetLocationId);
  const firstDevice = placements.get(
    spaceshipBoardItemId.device("player-life-support-device"),
  );
  const secondDevice = placements.get(deviceId);

  assert.ok(lifeSupport);
  assert.ok(firstDevice);
  assert.ok(secondDevice);
  assert.ok(firstDevice.y < secondDevice.y);
  assert.ok(secondDevice.y + secondDevice.height <= lifeSupport.y - 10);
  assert.equal(firstDevice.x + firstDevice.width / 2, lifeSupport.x + lifeSupport.width / 2);
  assert.equal(secondDevice.x, firstDevice.x);
});

test("createSpaceshipBoardLayout tucks effects behind Location, Device, and Actor owners from membership", () => {
  const state = createSpaceshipDragState(spaceshipScene);
  const effectId = spaceshipBoardItemId.effectCard("reactor-distress", 0);
  const deviceId = spaceshipBoardItemId.device("player-life-support-device");
  const moved = insertSpaceshipCardIntoLayout(
    removeSpaceshipCardFromLayouts(state, effectId),
    effectId,
    {
      type: "effect-stack",
      layoutId: `spaceship:effect-stack:${deviceId}`,
      ownerItemId: deviceId,
      index: 999,
    },
  );
  const layout = createSpaceshipBoardLayout(spaceshipScene, moved);
  const placements = new Map(layout.placements.map((placement) => [placement.id, placement]));
  const effect = placements.get(effectId);
  const device = placements.get(deviceId);
  const actor = placements.get(spaceshipBoardItemId.actorCard("actor-veteran"));
  const actorEffect = placements.get(
    spaceshipBoardItemId.actorEffectCard("actor-veteran", "injury", 0),
  );

  assert.ok(effect);
  assert.ok(device);
  assert.ok(actor);
  assert.ok(actorEffect);
  assert.equal(effect.x + effect.width / 2, device.x + device.width / 2);
  assert.ok(effect.y < device.y);
  assert.ok(effect.y + effect.height > device.y);
  assert.equal(actorEffect.x + actorEffect.width / 2, actor.x + actor.width / 2);
  assert.ok(actorEffect.y < actor.y);
});

test("createSpaceshipBoardLayout recalculates source and target rows when a Location moves", () => {
  const state = createSpaceshipDragState(spaceshipScene);
  const itemId = spaceshipBoardItemId.location("player-reactor");
  const moved = insertSpaceshipCardIntoLayout(
    removeSpaceshipCardFromLayouts(state, itemId),
    itemId,
    {
      type: "location-row",
      layoutId: "spaceship:location-row:pane-pirate:bottom",
      index: 1,
    },
  );
  const layout = createSpaceshipBoardLayout(spaceshipScene, moved);
  const placements = new Map(layout.placements.map((placement) => [placement.id, placement]));
  const sourceNeighbor = placements.get(
    spaceshipBoardItemId.location("player-sealed-corridor"),
  );
  const movedLocation = placements.get(itemId);
  const pirateNeighbor = placements.get(
    spaceshipBoardItemId.location("pirate-engine-room"),
  );

  assert.ok(sourceNeighbor);
  assert.ok(movedLocation);
  assert.ok(pirateNeighbor);
  assert.ok(movedLocation.y >= pirateNeighbor.y - 180);
  assert.ok(Math.abs(sourceNeighbor.y - movedLocation.y) > 500);
});

test("createSpaceshipBoardLayout keeps the actively dragged snapped card under the pointer", () => {
  const state = createSpaceshipDragState(spaceshipScene);
  const itemId = spaceshipBoardItemId.location("player-reactor");
  const dragged = state.cards.find((card) => card.itemId === itemId);
  assert.ok(dragged);
  const movedState = {
    ...state,
    cards: state.cards.map((card) =>
      card.itemId === itemId ? { ...card, x: 2400, y: 900 } : card,
    ),
  };
  const snapped = insertSpaceshipCardIntoLayout(
    removeSpaceshipCardFromLayouts(movedState, itemId),
    itemId,
    {
      type: "location-row",
      layoutId: "spaceship:location-row:pane-pirate:bottom",
      index: 1,
    },
  );
  const layout = createSpaceshipBoardLayout(spaceshipScene, snapped, {
    activeCardItemId: itemId,
  });
  const placements = new Map(layout.placements.map((placement) => [placement.id, placement]));
  const movedLocation = placements.get(itemId);
  const pirateNeighbor = placements.get(
    spaceshipBoardItemId.location("pirate-engine-room"),
  );

  assert.ok(movedLocation);
  assert.ok(pirateNeighbor);
  assert.equal(movedLocation.x, 2400);
  assert.equal(movedLocation.y, 900);
  assert.ok(Math.abs(pirateNeighbor.x - movedLocation.x) > 500);
});

test("spaceshipScene uses custom Exiles actor cards for the Corvette crew", () => {
  const playerPane = spaceshipScene.panes[0];
  const actorsById = new Map(
    playerPane.actors.map((actor) => [actor.actorId, actor]),
  );

  assert.equal(
    actorsById.get("actor-machinist")?.customCard?.noun,
    "Machinist-Priest Heretic",
  );
  assert.equal(
    actorsById.get("actor-veteran")?.customCard?.imageUrl,
    "/api/adventure-artifacts/augmented-veteran-male-profile-f520a85de6d856aee8ae.png",
  );
  assert.equal(
    actorsById.get("actor-seer")?.customCard?.adjectiveDescription,
    "Certified Navigator\nSpace Folding\nGravity Manipulation",
  );
  assert.equal(
    actorsById.get("actor-medic")?.token.imageUrl,
    "/api/adventure-artifacts/robot-surgeon-male-profile-dea30fb20cdbdfbce28d.png",
  );
});

test("createSpaceshipBoardItems uses the same card footprint for locations and devices", () => {
  const items = createSpaceshipBoardItems(spaceshipScene);
  const location = items.find(
    (item) => item.id === spaceshipBoardItemId.location("player-reactor"),
  );
  const device = items.find(
    (item) => item.id === spaceshipBoardItemId.device("player-reactor-device"),
  );

  assert.ok(location);
  assert.ok(device);
  assert.equal(location.width, device.height);
  assert.equal(location.height, device.width);
});

test("createSpaceshipBoardItems keeps ship title items compact for focus bounds", () => {
  const items = createSpaceshipBoardItems(spaceshipScene);
  const header = items.find(
    (item) => item.id === spaceshipBoardItemId.shipHeader("pane-player"),
  );
  const location = items.find(
    (item) => item.id === spaceshipBoardItemId.location("player-reactor"),
  );

  assert.ok(header);
  assert.ok(location);

  const headerWidth = header.width;
  const locationWidth = location.width;

  if (typeof headerWidth !== "number" || typeof locationWidth !== "number") {
    throw new Error("Ship header and location widths should be numeric");
  }

  assert.ok(headerWidth >= locationWidth);
  assert.ok(headerWidth < locationWidth * 3);
});

test("getSpaceshipBoardPaneItemIds returns focusable board IDs for one ship pane", () => {
  const dragState = createSpaceshipDragState(spaceshipScene);
  const ids = getSpaceshipBoardPaneItemIds(spaceshipScene, "pane-player", dragState);

  assert.ok(ids.includes(spaceshipBoardItemId.location("player-reactor")));
  assert.ok(ids.includes(spaceshipBoardItemId.device("player-reactor-device")));
  assert.ok(ids.includes(spaceshipBoardItemId.token("reactor-energy")));
  assert.ok(ids.includes(spaceshipBoardItemId.token("actor-machinist-token")));
  assert.ok(ids.includes(spaceshipBoardItemId.actorCard("actor-machinist")));
  assert.equal(
    ids.includes(spaceshipBoardItemId.location("pirate-reactor")),
    false,
  );
});

test("createSpaceshipBoardLayout places the energy stack above the Exiles ship title in the flow column", () => {
  const layout = createSpaceshipBoardLayout(spaceshipScene);
  const placementsById = new Map(
    layout.placements.map((placement) => [placement.id, placement]),
  );
  const energyStack = placementsById.get(spaceshipBoardItemId.energyStack());
  const playerHeader = placementsById.get(
    spaceshipBoardItemId.shipHeader("pane-player"),
  );

  assert.ok(energyStack);
  assert.ok(playerHeader);
  assert.equal(energyStack.x, playerHeader.x);
  assert.ok(energyStack.y < playerHeader.y);
  assert.equal(playerHeader.y - (energyStack.y + energyStack.height), 34);
});

test("createSpaceshipBoardLayout places each actor row after its ship content before the next ship", () => {
  const layout = createSpaceshipBoardLayout(spaceshipScene);
  const placementsById = new Map(
    layout.placements.map((placement) => [placement.id, placement]),
  );

  spaceshipScene.panes.forEach((pane, paneIndex) => {
    const shipContentIds = [
    spaceshipBoardItemId.shipHeader(pane.paneId),
    ...pane.locations.flatMap((location) => [
      spaceshipBoardItemId.location(location.locationId),
      ...(location.device
        ? [spaceshipBoardItemId.device(location.device.deviceId)]
        : []),
      ...location.effects.flatMap((effect) =>
        Array.from({ length: effect.count }, (_, index) =>
          spaceshipBoardItemId.effectCard(effect.effectId, index),
        ),
      ),
    ]),
    ];
    const actorIds = pane.actors.flatMap((actor) => [
      ...(actor.injuryCount > 0
        ? Array.from({ length: actor.injuryCount }, (_, index) =>
            spaceshipBoardItemId.actorEffectCard(actor.actorId, "injury", index),
          )
        : []),
      ...(actor.distressCount > 0
        ? Array.from({ length: actor.distressCount }, (_, index) =>
            spaceshipBoardItemId.actorEffectCard(actor.actorId, "distress", index),
          )
        : []),
      spaceshipBoardItemId.actorCard(actor.actorId),
    ]);
    const shipContentBottom = Math.max(
      ...shipContentIds.map((id) => {
      const placement = placementsById.get(id);
      assert.ok(placement, `${id} should be placed`);
      return placement.y + placement.height;
      }),
    );
    const actorTop = Math.min(
      ...actorIds.map((id) => {
        const placement = placementsById.get(id);
        assert.ok(placement, `${id} should be placed`);
        return placement.y;
      }),
    );

    assert.equal(actorTop - shipContentBottom, 92);

    actorIds.forEach((id) => {
      const placement = placementsById.get(id);
      assert.ok(placement, `${id} should be placed`);
      assert.ok(
        placement.y >= shipContentBottom,
        `${id} should be below its ship content`,
      );

      const nextPane = spaceshipScene.panes[paneIndex + 1];
      if (nextPane) {
        const nextHeader = placementsById.get(
          spaceshipBoardItemId.shipHeader(nextPane.paneId),
        );
        assert.ok(nextHeader, `${nextPane.paneId} header should be placed`);
        assert.ok(
          placement.y + placement.height <= nextHeader.y,
          `${id} should stay before the next ship`,
        );
      }
    });
  });
});

test("isSpaceshipCardDropTargetItemId accepts all card surfaces but not tokens or the stack", () => {
  assert.equal(
    isSpaceshipCardDropTargetItemId(spaceshipBoardItemId.location("player-reactor")),
    true,
  );
  assert.equal(
    isSpaceshipCardDropTargetItemId(spaceshipBoardItemId.device("player-reactor-device")),
    true,
  );
  assert.equal(
    isSpaceshipCardDropTargetItemId(spaceshipBoardItemId.effectCard("reactor-distress", 0)),
    true,
  );
  assert.equal(
    isSpaceshipCardDropTargetItemId(spaceshipBoardItemId.actorCard("actor-veteran")),
    true,
  );
  assert.equal(
    isSpaceshipCardDropTargetItemId(
      spaceshipBoardItemId.actorEffectCard("actor-veteran", "injury", 0),
    ),
    true,
  );
  assert.equal(
    isSpaceshipCardDropTargetItemId(spaceshipBoardItemId.token("reactor-energy")),
    false,
  );
  assert.equal(
    isSpaceshipCardDropTargetItemId(spaceshipBoardItemId.energyStack()),
    false,
  );
});

test("createSpaceshipBoardLayout puts actor effects behind the actor card with top header offset", () => {
  const layout = createSpaceshipBoardLayout(spaceshipScene);
  const placementsById = new Map(
    layout.placements.map((placement) => [placement.id, placement]),
  );
  const card = placementsById.get(spaceshipBoardItemId.actorCard("actor-veteran"));
  const injury = placementsById.get(
    spaceshipBoardItemId.actorEffectCard("actor-veteran", "injury", 0),
  );
  const distress = placementsById.get(
    spaceshipBoardItemId.actorEffectCard("actor-veteran", "distress", 0),
  );
  const secondInjury = placementsById.get(
    spaceshipBoardItemId.actorEffectCard("actor-veteran", "injury", 1),
  );

  assert.ok(card);
  assert.ok(injury);
  assert.ok(distress);
  assert.ok(secondInjury);
  assert.equal(injury.x, distress.x);
  assert.equal(injury.x + injury.width / 2, card.x + card.width / 2);
  assert.ok(injury.y < card.y);
  assert.ok(injury.y + injury.height > card.y);
  assert.equal(secondInjury.y, injury.y - 36);
  assert.equal(distress.y, secondInjury.y - 36);
  assert.ok((injury.zIndex ?? 0) > (secondInjury.zIndex ?? 0));
  assert.ok((secondInjury.zIndex ?? 0) > (distress.zIndex ?? 0));
  assert.ok((injury.zIndex ?? 0) < (card.zIndex ?? 0));
  assert.ok((distress.zIndex ?? 0) < (card.zIndex ?? 0));
});

test("createSpaceshipBoardLayout stacks location effects from the Location bottom", () => {
  const scene = structuredClone(spaceshipScene);
  const reactor = scene.panes[0].locations.find(
    (location) => location.locationId === "player-reactor",
  );
  assert.ok(reactor);
  reactor.effects = [
    {
      effectId: "reactor-distress",
      type: "distress",
      label: "Distress",
      detail: "Output feels one step down.",
      count: 2,
    },
  ];
  const layout = createSpaceshipBoardLayout(scene);
  const placementsById = new Map(
    layout.placements.map((placement) => [placement.id, placement]),
  );
  const location = placementsById.get(
    spaceshipBoardItemId.location("player-reactor"),
  );
  const device = placementsById.get(
    spaceshipBoardItemId.device("player-reactor-device"),
  );
  const firstEffect = placementsById.get(
    spaceshipBoardItemId.effectCard("reactor-distress", 0),
  );
  const secondEffect = placementsById.get(
    spaceshipBoardItemId.effectCard("reactor-distress", 1),
  );

  assert.ok(location);
  assert.ok(device);
  assert.ok(firstEffect);
  assert.ok(secondEffect);
  assert.ok(firstEffect.y >= device.y + device.height + 10);
  assert.equal(firstEffect.x + firstEffect.width / 2, location.x + location.width / 2);
  assert.equal(secondEffect.x, firstEffect.x);
  assert.equal(firstEffect.y + firstEffect.height, location.y + location.height);
  assert.equal(secondEffect.y, firstEffect.y - 36);
  assert.ok(firstEffect.y < location.y);
  assert.ok((firstEffect.zIndex ?? 0) > (secondEffect.zIndex ?? 0));
  assert.ok((firstEffect.zIndex ?? 0) < (location.zIndex ?? 0));
  assert.ok((secondEffect.zIndex ?? 0) < (location.zIndex ?? 0));
});

test("createSpaceshipBoardLayout bottom-aligns Location cards within each location row", () => {
  const layout = createSpaceshipBoardLayout(spaceshipScene);
  const placementsById = new Map(
    layout.placements.map((placement) => [placement.id, placement]),
  );
  const playerTopLocationIds = [
    "player-docking-bay",
    "player-reactor",
    "player-engines",
    "player-spin-drive",
    "player-weapon-station",
    "player-missile-bay",
  ];
  const bottoms = playerTopLocationIds.map((locationId) => {
    const placement = placementsById.get(spaceshipBoardItemId.location(locationId));
    assert.ok(placement, `${locationId} should be placed`);
    return placement.y + placement.height;
  });

  assert.equal(new Set(bottoms).size, 1);
});
