import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("ImageCard keeps its single bottom-right label API", () => {
  const source = readFileSync(
    new URL("./ImageCard.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(source, /secondaryLabel/);
  assert.doesNotMatch(source, /labelPosition/);
  assert.doesNotMatch(source, /labelRotate/);
});
