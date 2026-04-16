import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("AdventureModuleTitleImagePanel uses the generated image picker frame instead of the inline generator field", () => {
  const source = readFileSync(
    new URL("./AdventureModuleTitleImagePanel.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /AdventureModuleGeneratedImagePicker/);
  assert.doesNotMatch(source, /AdventureModuleGeneratedImageField/);
  assert.match(source, /emptyFrameClassName/);
});
