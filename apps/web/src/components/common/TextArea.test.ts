import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("TextArea accepts shared size and color props", () => {
  const source = readFileSync(new URL("./TextArea.tsx", import.meta.url), "utf8");

  assert.match(source, /LabelColor/);
  assert.match(source, /ComponentSize/);
  assert.match(source, /size\?: ComponentSize/);
  assert.match(source, /color\?: LabelColor/);
  assert.match(source, /sizeClassMap/);
  assert.match(source, /Label[^]*size=\{size\}/);
});
