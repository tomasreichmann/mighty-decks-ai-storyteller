import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const illustrations = readFileSync(
  new URL("./RulesIllustrations.tsx", import.meta.url),
  "utf8",
);
const styles = readFileSync(
  new URL("./RulesRulebookContent.module.css", import.meta.url),
  "utf8",
);

test("registers floated card illustrations for core component subsections", () => {
  assert.match(illustrations, /const RulebookCardFloat/);
  assert.match(illustrations, /"7-2-distress": DistressCardIllustration/);
  assert.match(illustrations, /"9-2-stunts": StuntCardIllustration/);
  assert.match(illustrations, /"9-3-assets": AssetCardIllustration/);
  assert.match(illustrations, /"9-4-consumables": ConsumableCardIllustration/);
  assert.match(illustrations, /<RulebookCardFloat label=/);
  assert.match(styles, /\.cardFloat/);
});
