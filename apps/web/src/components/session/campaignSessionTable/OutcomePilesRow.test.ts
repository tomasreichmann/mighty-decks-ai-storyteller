import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("OutcomePilesRow centers the width-driven hand fan and removes visible pile labels", () => {
  const source = readFileSync(
    new URL("./OutcomePilesRow.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /const outcomeHandFanZenithOffset = -19/);
  assert.match(source, /justify-center/);
  assert.match(source, /overflow-visible/);
  assert.match(source, /hover:z-30 focus-within:z-30/);
  assert.match(source, /stack w-fit min-w-0 gap-2/);
  assert.match(source, /relative w-fit min-w-0 pt-2/);
  assert.match(source, /flex w-fit min-w-0 items-end justify-center gap-1 overflow-visible px-8 pb-2/);
  assert.match(source, /-mx-4/);
  assert.match(source, /lg:flex lg:items-start lg:justify-center lg:gap-6/);
  assert.match(source, /w-\[5rem\]/);
  assert.match(source, /sm:w-\[5\.75rem\]/);
  assert.match(source, /const outcomeHandVisibleHeightRem = outcomePileCardHeightRem \+ 3\.5/);
  assert.doesNotMatch(source, />\s*Deck\s*</);
  assert.doesNotMatch(source, />\s*Hand\s*</);
  assert.doesNotMatch(source, />\s*Discard\s*</);
  assert.match(source, /aria-label="Play an Outcome card"/);
  assert.match(source, /title="Play an Outcome card"/);
  assert.match(source, />\s*▶\s*</);
});
