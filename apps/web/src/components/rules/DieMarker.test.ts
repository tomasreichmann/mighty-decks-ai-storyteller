import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("DieMarker exposes marker semantics without interaction", () => {
  const source = readFileSync(new URL("./DieMarker.tsx", import.meta.url), "utf8");

  assert.match(source, /sides: 4 \| 6 \| 8 \| 12/);
  assert.match(source, /value: number/);
  assert.match(source, /aria-label/);
  assert.match(source, /Dice track values; they are not rolled/);
  assert.doesNotMatch(source, /onClick|Math\.random|button/);
});
