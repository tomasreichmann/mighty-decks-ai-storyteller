import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("GeneratedImage fits images instead of cropping them", () => {
  const source = readFileSync(
    new URL("./GeneratedImage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /object-contain object-center/);
  assert.doesNotMatch(source, /object-cover/);
});
