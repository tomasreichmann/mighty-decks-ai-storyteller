import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("CampaignListCard uses a single polished surface for campaign metadata", () => {
  const source = readFileSync(
    new URL("./CampaignListCard.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /StoryTileCard/);
  assert.match(
    source,
    /href=\{`\/campaign\/\$\{encodeURIComponent\(campaign\.slug\)\}\/base`\}/,
  );
  assert.match(source, /formatLiveStatus/);
  assert.doesNotMatch(source, /Open Campaign/);
  assert.doesNotMatch(source, /View Sessions/);
  assert.match(source, /<Tag tone="bone" size="sm">\s*Campaign\s*<\/Tag>/);
  assert.match(source, /Source Module/);
  assert.match(source, /resolveServerUrl/);
  assert.match(source, /imageLoading="lazy"/);
  assert.doesNotMatch(source, /CTAButton/);
});
