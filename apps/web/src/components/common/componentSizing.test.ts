import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("shared component sizing exports the sm md lg ladder", () => {
  const source = readFileSync(new URL("./componentSizing.ts", import.meta.url), "utf8");

  assert.match(source, /export type ComponentSize = "sm" \| "md" \| "lg"/);
  assert.match(source, /componentSurfaceSizeClassMap/);
  assert.match(source, /componentCircleSizeClassMap/);
  assert.match(source, /componentLabelSizeClassMap/);
  assert.match(source, /sm: "min-h-8 px-3 py-1\.5 text-xs"/);
  assert.match(source, /md: "min-h-10 px-4 py-2 text-sm"/);
  assert.match(source, /lg: "min-h-12 px-5 py-2\.5 text-base"/);
});
