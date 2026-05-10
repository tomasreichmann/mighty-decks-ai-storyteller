import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

test("RulesShipCombatPage documents the physical table prototype and power model", () => {
  const source = readFileSync(
    new URL("./RulesShipCombatPage.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(source, /SpaceshipBoard/);
  assert.doesNotMatch(source, /spaceshipScene/);
  assert.doesNotMatch(source, /import \{ Panel \}/);
  assert.doesNotMatch(source, /<Panel\b/);
  assert.doesNotMatch(source, /RulesPanel/);
  assert.match(source, /rules-ship-combat-page__intro stack gap-3/);
  assert.match(source, /rules-ship-combat-page__layout stack gap-3/);
  assert.doesNotMatch(
    source,
    /<Panel className="stack gap-3" contentClassName="stack gap-3">\s*<div className="flex flex-wrap items-center gap-2">/,
  );
  assert.doesNotMatch(
    source,
    /<RulesPanel title="Ship Layout Without A Diagram" items=\{shipLayoutRules\} \/>/,
  );
  assert.match(source, /Ship Layout Without A Diagram/);
  assert.match(source, /Location cards/);
  assert.match(source, /Device Asset cards/);
  assert.match(source, /circular Power tokens/);
  assert.match(source, /minis\/Actor tokens/);
  assert.match(source, /flip spent tokens/);
  assert.match(source, /End of Round/);
  assert.match(source, /Device Used markers/);
  assert.match(source, /attacker Outcome Effect \+ weapon damage - defender Outcome Effect - Shields/);
  assert.match(source, /Rupture Cascade/);
});

test("RulesShipCombatPage lists ship devices and flight-control turn options", () => {
  const source = readFileSync(
    new URL("./RulesShipCombatPage.tsx", import.meta.url),
    "utf8",
  );

  for (const label of [
    "Flight Controls",
    "Weapon Turret",
    "Sensors",
    "Shields",
    "Engines",
    "Spin Drive",
    "Life Support",
    "Workbench",
    "Missile Bay",
    "Reactor",
  ]) {
    assert.match(source, new RegExp(label));
  }

  assert.match(source, /change range closer\/farther/);
  assert.match(source, /dodge incoming ship attacks/);
  assert.match(source, /line up a shot/);
  assert.match(source, /brace the ship/);
});

test("RulesShipCombatPage provides detailed device and special-location reference panels", () => {
  const source = readFileSync(
    new URL("./RulesShipCombatPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /ReferencePanel/);
  assert.match(source, /deviceReferencePanels/);
  assert.match(source, /specialLocationPanels/);

  for (const label of [
    "Laser Turret",
    "Scatter Turret",
    "Rail Turret",
    "Minigun Turret",
    "Arc Turret",
    "Plasma Turret",
    "Radiation Turret",
    "Cryo Turret",
    "Tractor Turret",
    "Acid Turret",
  ]) {
    assert.match(source, new RegExp(label));
  }

  for (const phrase of [
    "cannot be targeted from outside",
    "Detection Power is higher than enemy Cloaking Power",
    "extra Power over its maximum",
    "shortens the spin-up time",
    "control doors remotely",
    "specialized crafting",
    "store a shuttle or a fighter",
    "store cargo",
    "crew comfort",
    "boost a medic's healing abilities",
    "boosts spiritual abilities",
    "preserve bodies",
    "Missiles pass through shields",
    "trigger a Rupture Cascade intentionally",
  ]) {
    assert.match(source, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("RulesShipCombatPage renders generated static Asset cards for ship devices", () => {
  const source = readFileSync(
    new URL("./RulesShipCombatPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /import \{ AssetCard \}/);
  assert.match(source, /import \{ LocationCard \}/);
  assert.match(source, /kind="custom"/);
  assert.match(source, /deck: "sci-fi"/);
  assert.doesNotMatch(source, /Ship Device/);
  assert.match(source, /assetCard/);
  assert.match(source, /locationCard/);
  assert.match(source, /w-\[244px\]/);
  assert.match(source, /sm:grid-cols-\[minmax\(220px,244px\)_1fr\]/);

  for (const iconPath of [
    "/assets/spaceship/devices/flight-controls-device.png",
    "/assets/spaceship/devices/weapon-turret-device.png",
    "/assets/spaceship/devices/sensors-device.png",
    "/assets/spaceship/devices/shields-device.png",
    "/assets/spaceship/devices/engines-device.png",
    "/assets/spaceship/devices/spin-drive-device.png",
    "/assets/spaceship/devices/life-support-device.png",
    "/assets/spaceship/devices/workbench-device.png",
  ]) {
    assert.match(source, new RegExp(iconPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.equal(
      existsSync(new URL(`../../public${iconPath}`, import.meta.url)),
      true,
      `${iconPath} should exist in public assets`,
    );
  }

  for (const artifactPath of [
    "/api/adventure-artifacts/docking-bay-63de54ac4b3c469379e9.png",
    "/api/adventure-artifacts/cargo-hold-202afa0e160b9f892887.png",
    "/api/adventure-artifacts/crew-quarters-fb4b60ee93280b0a8dca.png",
    "/api/adventure-artifacts/medical-bay-db2f101567e8ebf32643.png",
    "/api/adventure-artifacts/ritual-chamber-486d7edd806eec3296e2.png",
    "/api/adventure-artifacts/morgue-shroud-operating-table.png",
    "/api/adventure-artifacts/missile-bay-97234afe5d3d668c403b.png",
    "/api/adventure-artifacts/reactor-99836c3e8add9c720018.png",
  ]) {
    const artifactFileName = artifactPath.split("/").pop() ?? "";
    assert.match(source, new RegExp(artifactPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.equal(
      existsSync(
        new URL(
          `../../../server/output/adventure-artifacts/${artifactFileName}`,
          import.meta.url,
        ),
      ),
      true,
      `${artifactPath} should exist in server artifact output`,
    );
  }
});
