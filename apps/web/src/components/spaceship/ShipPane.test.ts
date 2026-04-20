import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("ShipPane keeps the lower crew strip as a plain section instead of a panel", () => {
  const source = readFileSync(new URL("./ShipPane.tsx", import.meta.url), "utf8");

  assert.match(source, /SpaceshipActorStrip/);
  assert.match(source, /border-t border-kac-iron\/15 pt-4/);
  assert.match(source, /overflow-x-auto pb-3/);
  assert.doesNotMatch(source, /rounded-\[1\.25rem\]/);
});
