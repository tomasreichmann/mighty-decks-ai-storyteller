import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Heading exposes a level prop and keeps Text as the semantic base", () => {
  const source = readFileSync(new URL("./Heading.tsx", import.meta.url), "utf8");

  assert.match(source, /HeadingLevel/);
  assert.match(source, /level\?: HeadingLevel/);
  assert.match(source, /Text/);
  assert.match(source, /Highlight/);
  assert.doesNotMatch(source, /variant\?: Partial<TextProps>/);
  assert.doesNotMatch(source, /variant="h2"/);
});
