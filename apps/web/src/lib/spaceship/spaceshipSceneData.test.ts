import test from "node:test";
import assert from "node:assert/strict";
import { spaceshipScene } from "./spaceshipSceneData";

test("spaceshipScene seeds two panes with locations, actor strips, and a card library", () => {
  assert.equal(spaceshipScene.panes.length, 2);
  assert.ok(spaceshipScene.panes[0].locations.length >= 10);
  assert.ok(spaceshipScene.panes[1].locations.length >= 8);
  assert.ok(spaceshipScene.panes[0].actors.length > 0);
  assert.ok(spaceshipScene.panes[1].actors.length > 0);
  assert.ok(spaceshipScene.cardLibrary.length >= 5);
});

test("spaceshipScene includes energy tokens and effect stacks in the seeded layout", () => {
  const locations = spaceshipScene.panes.flatMap((pane) => pane.locations);

  assert.ok(locations.some((location) => location.energyTokens.length > 0));
  assert.ok(locations.some((location) => location.effects.length > 0));
  assert.ok(locations.some((location) => location.actorTokens.length > 0));
});

test("spaceshipScene places each Exiles crew token on one Location", () => {
  const playerLocations = spaceshipScene.panes[0].locations;
  const tokens = playerLocations.flatMap((location) => location.actorTokens);
  const tokenLocationById = new Map(
    playerLocations.flatMap((location) =>
      location.actorTokens.map((token) => [token.tokenId, location.locationId] as const),
    ),
  );

  assert.deepEqual(
    tokens.map((token) => token.tokenId).sort(),
    [
      "actor-machinist-token",
      "actor-medic-token",
      "actor-seer-token",
      "actor-veteran-token",
    ],
  );
  assert.equal(tokenLocationById.get("actor-machinist-token"), "player-reactor");
  assert.equal(tokenLocationById.get("actor-veteran-token"), "player-sealed-corridor");
  assert.equal(tokenLocationById.get("actor-seer-token"), "player-sensor-array");
  assert.equal(tokenLocationById.get("actor-medic-token"), "player-life-support");
});

test("spaceshipScene uses the generated rules device cards for ship Devices", () => {
  const devices = spaceshipScene.panes.flatMap((pane) =>
    pane.locations.flatMap((location) => (location.device ? [location.device] : [])),
  );
  const devicesByTitle = new Map(devices.map((device) => [device.title, device]));

  assert.equal(
    devicesByTitle.get("Flight Controls")?.asset.iconUrl,
    "/assets/spaceship/devices/flight-controls-device.png",
  );
  assert.equal(
    devicesByTitle.get("Weapon Turret")?.asset.nounDescription,
    "Powered ship weapon station for attacking ships or defending from missiles.",
  );
  assert.equal(
    devicesByTitle.get("Sensors")?.asset.iconUrl,
    "/assets/spaceship/devices/sensors-device.png",
  );
  assert.equal(
    devicesByTitle.get("Life Support")?.asset.nounDescription,
    "Atmosphere, pressure, temperature, gravity, and door-control system.",
  );
  assert.equal(
    devicesByTitle.get("Workbench")?.asset.iconUrl,
    "/assets/spaceship/devices/workbench-device.png",
  );
});
