import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("LoadingIndicator supports token colors and track overrides", () => {
  const source = readFileSync(
    new URL("./LoadingIndicator.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /ButtonColors/);
  assert.match(source, /color\?: LoadingIndicatorColor/);
  assert.match(source, /trackColor\?: LoadingIndicatorColor/);
  assert.match(source, /resolvedArcTone\s*===\s*"iron"\s*\?\s*"bone"\s*:\s*"iron"/);
  assert.match(source, /LoadingIndicatorColor/);
});
