import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("DepressedInput exposes color and size props for the label shell", () => {
  const source = readFileSync(
    new URL("./DepressedInput.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /color\?: LabelVariant/);
  assert.match(source, /ComponentSize/);
  assert.match(source, /size\?: ComponentSize/);
  assert.match(source, /Label[^]*color=\{color\}/);
  assert.match(source, /Label[^]*size=\{size\}/);
  assert.doesNotMatch(source, /labelColor\?:/);
});
