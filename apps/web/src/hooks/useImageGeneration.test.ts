import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("useImageGeneration exposes separate edit-model loading and edit submission helpers", () => {
  const source = readFileSync(
    new URL("./useImageGeneration.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /editModels/);
  assert.match(source, /selectedEditModelId/);
  assert.match(source, /submitEditJob/);
  assert.match(source, /fetchImageModels\(provider,\s*"edit"\)/);
});
