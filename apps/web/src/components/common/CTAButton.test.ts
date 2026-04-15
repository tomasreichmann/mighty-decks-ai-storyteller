import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("CTAButton applies the rotated highlighted call-to-action treatment", () => {
  const source = readFileSync(new URL("./CTAButton.tsx", import.meta.url), "utf8");

  assert.match(source, /Highlight/);
  assert.match(source, /rotate-\[-2deg\]/);
  assert.match(source, /skew-x-\[-5deg\]/);
  assert.match(source, /containerClassName/);
});
