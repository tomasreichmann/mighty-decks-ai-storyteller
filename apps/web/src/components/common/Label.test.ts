import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Label uses color and size props instead of dynamic size strings", () => {
  const source = readFileSync(new URL("./Label.tsx", import.meta.url), "utf8");

  assert.match(source, /LabelColor/);
  assert.match(source, /color\?: LabelColor/);
  assert.match(source, /ComponentSize/);
  assert.match(source, /size\?: ComponentSize/);
  assert.match(source, /"blood"/);
  assert.match(source, /"steel"/);
  assert.match(source, /labelToneClassMap/);
  assert.match(source, /labelSizeClassMap/);
  assert.doesNotMatch(source, /"text-" \+ size/);
  assert.doesNotMatch(source, /text-md\/\[0\.8\]/);
});
