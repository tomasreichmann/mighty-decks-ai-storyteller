import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("LayeredCard centers SVG text content through a full-width inner wrapper", () => {
  const source = readFileSync(
    new URL("./LayeredCard.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /<div className="w-full text-center">/);
  assert.doesNotMatch(source, /text-center text-kac-iron-light"\s*,\s*className\)\}\s*>\s*\{children\}/);
});
