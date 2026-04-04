import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("CampaignSessionSelectionStrip hides when empty and uses info hint guidance", () => {
  const source = readFileSync(
    new URL("./CampaignSessionSelectionStrip.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /if \(entries\.length === 0\) \{\s*return <><\/>;\s*\}/);
  assert.match(source, /InputDescriptionHint/);
  assert.match(
    source,
    /description="Use the \+ button on cards and shortcode controls to stage cards\."/,
  );
  assert.doesNotMatch(source, /cards staged/);
});
