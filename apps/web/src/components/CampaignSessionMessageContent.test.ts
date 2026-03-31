import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("CampaignSessionMessageContent parses session text and falls back to raw tokens when resolution fails", () => {
  const source = readFileSync(
    new URL("./CampaignSessionMessageContent.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /parseCampaignSessionMessageSegments/);
  assert.match(source, /resolveGameCard/);
  assert.match(source, /resolveEncounterCard/);
  assert.match(source, /resolveQuestCard/);
  assert.match(source, /segment\.token/);
  assert.match(source, /whitespace-pre-wrap/);
});
