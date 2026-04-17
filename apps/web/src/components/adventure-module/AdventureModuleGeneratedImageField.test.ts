import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("AdventureModuleGeneratedImageField uses a depressed URL input and an image drop area", () => {
  const source = readFileSync(
    new URL("./AdventureModuleGeneratedImageField.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /DepressedInput/);
  assert.match(source, /Selected Image URL/);
  assert.match(source, /aria-label="Clear image"/);
  assert.match(source, /type="file"/);
  assert.match(source, /onDrop/);
  assert.match(source, /uploadAdventureArtifactImage/);
  assert.match(source, /Drop an external image here/);
});

test("AdventureModuleGeneratedImageField renders gallery, generate, and edit controls for shared image selection", () => {
  const source = readFileSync(
    new URL("./AdventureModuleGeneratedImageField.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /ButtonRadioGroup/);
  assert.match(source, /Gallery/);
  assert.match(source, /Generate Edit/);
  assert.doesNotMatch(source, /Lookup Existing/);
  assert.doesNotMatch(source, /\{model\.displayName\} - \{model\.modelId\}/);
});
