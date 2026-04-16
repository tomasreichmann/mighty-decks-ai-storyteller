import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("AdventureModuleGeneratedImagePicker renders a preview frame with a top-right dialog trigger", () => {
  const source = readFileSync(
    new URL("./AdventureModuleGeneratedImagePicker.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /emptyFrameClassName/);
  assert.match(source, /buttonClassName=\{cn\("absolute right-2 top-2 z-10"/);
  assert.match(source, /MarkdownImageInsertButton/);
  assert.match(source, /initialImageUrl=\{normalizedValue\}/);
  assert.match(source, /hideAltTextField/);
  assert.match(source, /onInsertImageUrl/);
  assert.match(source, /resolveServerUrl/);
  assert.match(source, /toImageSrc/);
});
