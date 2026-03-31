import assert from "node:assert/strict";
import test from "node:test";
import { parseCampaignSessionMessageSegments } from "./campaignSessionMessageSegments";

test("parseCampaignSessionMessageSegments preserves mixed prose and repeated shortcode order", () => {
  assert.deepEqual(
    parseCampaignSessionMessageSegments(
      "Push @counter/threat-clock, then inspect @quest/recover-the-shard and @counter/threat-clock again.",
    ),
    [
      { kind: "text", text: "Push " },
      {
        kind: "game_card",
        token: "@counter/threat-clock",
        type: "CounterCard",
        slug: "threat-clock",
      },
      { kind: "text", text: ", then inspect " },
      {
        kind: "quest_card",
        token: "@quest/recover-the-shard",
        slug: "recover-the-shard",
      },
      { kind: "text", text: " and " },
      {
        kind: "game_card",
        token: "@counter/threat-clock",
        type: "CounterCard",
        slug: "threat-clock",
      },
      { kind: "text", text: " again." },
    ],
  );
});

test("parseCampaignSessionMessageSegments recognizes punctuation-adjacent asset and encounter shortcodes", () => {
  assert.deepEqual(
    parseCampaignSessionMessageSegments(
      "Ready @asset/base_light/base_hidden? Trigger @encounter/bridge-tribute-checkpoint!",
    ),
    [
      { kind: "text", text: "Ready " },
      {
        kind: "game_card",
        token: "@asset/base_light/base_hidden",
        type: "AssetCard",
        slug: "base_light",
        modifierSlug: "base_hidden",
      },
      { kind: "text", text: "? Trigger " },
      {
        kind: "encounter_card",
        token: "@encounter/bridge-tribute-checkpoint",
        slug: "bridge-tribute-checkpoint",
      },
      { kind: "text", text: "!" },
    ],
  );
});
