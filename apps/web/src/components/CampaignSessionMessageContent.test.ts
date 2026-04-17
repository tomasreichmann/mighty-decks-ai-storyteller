import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("CampaignSessionMessageContent renders markdown images inside session chat bubbles", () => {
  const source = readFileSync(
    new URL("./CampaignSessionMessageContent.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /markdown_image/);
  assert.match(source, /<img/);
  assert.match(source, /segment\.altText/);
  assert.match(source, /segment\.src/);
});

test("CampaignSessionMessageContent can render claimed-character transcript entries as actor cards", () => {
  const source = readFileSync(
    new URL("./CampaignSessionMessageContent.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /ActorCard/);
  assert.match(source, /claimedActorTitle/);
  assert.match(source, /actor\.baseLayerSlug/);
  assert.match(source, /actor\.tacticalRoleSlug/);
  assert.match(source, /actor\.summary \?\? "No summary yet\."./);
});

test("CampaignSessionMessageContent promotes played-card transcript shortcodes onto a dedicated card row", () => {
  const source = readFileSync(
    new URL("./CampaignSessionMessageContent.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /endsWith\("played:"\)/);
  assert.match(source, /game_card|encounter_card|quest_card/);
});
