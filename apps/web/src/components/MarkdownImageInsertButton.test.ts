import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("MarkdownImageInsertButton reopens with the current image URL in the generated image field", () => {
  const source = readFileSync(
    new URL("./MarkdownImageInsertButton.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /AdventureModuleGeneratedImageField/);
  assert.match(source, /role="dialog"/);
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /buildMarkdownImageSnippet/);
  assert.match(source, /variant="circle"/);
  assert.match(source, /initialImageUrl/);
  assert.match(source, /normalizedInitialImageUrl/);
  assert.match(source, /onInsertImageUrl/);
  assert.match(source, /hideAltTextField/);
});
