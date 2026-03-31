import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("CampaignSessionTranscriptFeed reuses Adventure transcript wrapper styling and shared session presentation rules", () => {
  const source = readFileSync(
    new URL("./CampaignSessionTranscriptFeed.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /TranscriptFeed\.module\.css/);
  assert.match(source, /scrollMask/);
  assert.match(source, /presentCampaignSessionTranscriptEntry/);
  assert.match(source, /CampaignSessionMessageContent/);
  assert.match(source, /Message/);
  assert.match(source, /GameCardCatalogContext\.Provider/);
});
