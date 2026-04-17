import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("OutcomePilesRow centers the width-driven hand fan and removes visible pile labels", () => {
  const source = readFileSync(
    new URL("./OutcomePilesRow.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /const outcomeHandFanZenithOffset = -19/);
  assert.match(source, /const outcomeHandVisibleHeightRem = outcomePileCardHeightRem \+ 3\.5/);
  assert.doesNotMatch(source, />\s*Deck\s*</);
  assert.doesNotMatch(source, />\s*Hand\s*</);
  assert.doesNotMatch(source, />\s*Discard\s*</);
  assert.match(source, /aria-label="Play an Outcome card"/);
  assert.match(source, /title="Play an Outcome card"/);
  assert.match(source, />\s*▶\s*</);
});
