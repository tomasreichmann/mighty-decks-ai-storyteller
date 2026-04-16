import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("StyleguideControlsPage groups the toggle and rocker controls", () => {
  const source = readFileSync(
    new URL("./StyleguideControlsPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /ToggleButton/);
  assert.match(source, /ButtonRadioGroup/);
  assert.match(source, /RockerSwitch/);
  assert.match(source, /styleguide-controls-page/);
  assert.match(source, /size="md"/);
  assert.doesNotMatch(source, /size="m"/);
});
