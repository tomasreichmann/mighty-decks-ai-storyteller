import test from "node:test";
import assert from "node:assert/strict";
import { resolveAnimatedLoadingValue } from "./styleguideLoadingProgress";

test("StyleguideLoadingPage animates loading rings from 0 to 100 over 4s", () => {
  assert.equal(resolveAnimatedLoadingValue(0, 100, 4000), 0);
  assert.equal(resolveAnimatedLoadingValue(2000, 100, 4000), 50);
  assert.equal(resolveAnimatedLoadingValue(4000, 100, 4000), 100);
  assert.equal(resolveAnimatedLoadingValue(5000, 100, 4000), 100);
  assert.equal(resolveAnimatedLoadingValue(-100, 100, 4000), 0);
  assert.equal(resolveAnimatedLoadingValue(1000, 100, 0), 100);
});
