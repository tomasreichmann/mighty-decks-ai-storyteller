import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("StyleguideTypographyPage showcases Label, Text, and Heading", () => {
  const source = readFileSync(
    new URL("./StyleguideTypographyPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /styleguide-typography-page/);
  assert.match(source, /StyleguideSectionNav/);
  assert.match(source, /Label/);
  assert.match(source, /Text/);
  assert.match(source, /Heading/);
  assert.match(source, /"blood"/);
  assert.match(source, /"steel"/);
  assert.match(source, /size="sm"/);
  assert.match(source, /size="md"/);
  assert.match(source, /size="lg"/);
  assert.match(source, /level="h1"/);
  assert.match(source, /level: "h2"/);
  assert.match(source, /level: "h3"/);
  assert.match(source, /highlightProps/);
  assert.match(source, /highlight: "gold"/);
  assert.match(source, /highlight: "fire"/);
  assert.match(source, /highlight: "cloth"/);
  assert.match(source, /Supported heading highlights/);
  assert.match(source, /highlight: "blood"/);
  assert.match(source, /highlight: "bone"/);
  assert.match(source, /highlight: "steel"/);
  assert.match(source, /highlight: "skin"/);
  assert.match(source, /highlight: "curse"/);
  assert.match(source, /highlight: "monster"/);
});
