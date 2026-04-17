import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("shared component sizing exports the sm md lg ladder", () => {
  const source = readFileSync(new URL("./componentSizing.ts", import.meta.url), "utf8");

  assert.match(source, /export type ComponentSize = "sm" \| "md" \| "lg"/);
  assert.match(source, /componentSurfaceSizeClassMap/);
  assert.match(source, /componentCircleSizeClassMap/);
  assert.match(source, /componentLabelSizeClassMap/);
});
