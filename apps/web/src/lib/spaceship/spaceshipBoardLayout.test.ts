import test from "node:test";
import assert from "node:assert/strict";
import { spaceshipScene } from "./spaceshipSceneData";
import {
  createSpaceshipBoardLayout,
  createSpaceshipBoardItems,
  getSpaceshipBoardPaneItemIds,
  spaceshipBoardItemId,
} from "./spaceshipBoardLayout";

test("createSpaceshipBoardItems creates board entries for locations, devices, tokens, effects, and actor parts", () => {
  const items = createSpaceshipBoardItems(spaceshipScene);
  const ids = new Set(items.map((item) => item.id));

  assert.ok(ids.has(spaceshipBoardItemId.location("player-reactor")));
  assert.ok(ids.has(spaceshipBoardItemId.device("player-reactor-device")));
  assert.ok(ids.has(spaceshipBoardItemId.tokens("player-reactor")));
  assert.ok(
    ids.has(spaceshipBoardItemId.effectCard("reactor-distress", 0)),
  );
  assert.ok(ids.has(spaceshipBoardItemId.actorCard("actor-machinist")));
  assert.ok(
    ids.has(spaceshipBoardItemId.actorEffectCard("actor-machinist", "injury", 0)),
  );
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
  const ids = getSpaceshipBoardPaneItemIds(spaceshipScene, "pane-player");

  assert.ok(ids.includes(spaceshipBoardItemId.location("player-reactor")));
  assert.ok(ids.includes(spaceshipBoardItemId.device("player-reactor-device")));
  assert.ok(ids.includes(spaceshipBoardItemId.actorCard("actor-machinist")));
  assert.equal(
    ids.includes(spaceshipBoardItemId.location("pirate-reactor")),
    false,
  );
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
      spaceshipBoardItemId.tokens(location.locationId),
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
