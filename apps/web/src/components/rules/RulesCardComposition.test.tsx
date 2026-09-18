import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const sourcePath = join(dirname(fileURLToPath(import.meta.url)), "RulesCardComposition.tsx");
const source = await readFile(sourcePath, "utf8");

test("Actor composition selects package parts and assembly and states every Minion and Fast contribution", () => {
  assert.match(source, /GameCard type="actor-base" slug="civilian"/);
  assert.match(source, /GameCard type="actor-role" slug="minion"/);
  assert.match(source, /GameCard type="actor-special" slug="fast"/);
  assert.match(source, /PackageActorCard baseLayerSlug="civilian" tacticalRoleSlug="minion" tacticalSpecialSlug="fast"/);
  assert.match(source, /Toughness: 2\. Melee: 1 Injury\. Ranged: 1 Injury at range 1–2\. Fast: Moves an extra zone per turn\./);
});

test("Asset composition shows unmodified Tools, Empowered, and the assembled card with readable arithmetic", () => {
  assert.match(source, /AssetCard baseAssetSlug="base_tools"/);
  assert.match(source, /AssetModifierCard modifierSlug="base_empowered"/);
  assert.match(source, /AssetCard baseAssetSlug="base_tools" modifierSlug="base_empowered"/);
  assert.match(source, /Tools — complete without a modifier/);
  assert.match(source, /Success: 4 Effect when using Tools to work\. Partial Success: 2 Effect; Empowered does not apply\./);
});
