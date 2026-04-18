import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("StyleguideLabelsPage showcases the shared label palette and size ladder", () => {
  const source = readFileSync(
    new URL("./StyleguideLabelsPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /styleguide-labels-page/);
  assert.match(source, /StyleguideSectionNav/);
  assert.match(source, /Label/);
  assert.match(source, /Color family sheet/);
  assert.match(source, /Size ladder/);
  assert.match(source, /"gold"/);
  assert.match(source, /"fire"/);
  assert.match(source, /"blood"/);
  assert.match(source, /"bone"/);
  assert.match(source, /"steel"/);
  assert.match(source, /"skin"/);
  assert.match(source, /"cloth"/);
  assert.match(source, /"curse"/);
  assert.match(source, /"monster"/);
  assert.match(source, /size="sm"/);
  assert.match(source, /size="lg"/);
  assert.match(source, /rotate={false}/);
  assert.match(source, /Back to Overview/);
});
