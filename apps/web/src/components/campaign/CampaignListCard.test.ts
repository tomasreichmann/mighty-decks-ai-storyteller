import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("CampaignListCard uses a single polished surface for campaign metadata", () => {
  const source = readFileSync(
    new URL("./CampaignListCard.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /Panel/);
  assert.match(source, /formatLiveStatus/);
  assert.match(source, /max-w-\[30rem\]/);
  assert.match(source, /Open Campaign/);
  assert.match(source, /View Sessions/);
  assert.match(source, /<Tag tone="bone" size="sm">\s*Campaign\s*<\/Tag>/);
  assert.match(source, /resolveServerUrl/);
  assert.match(source, /loading="lazy"/);
  assert.doesNotMatch(source, /CTAButton/);
  assert.doesNotMatch(source, /Source module/);
});
