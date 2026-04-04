import assert from "node:assert/strict";
import test from "node:test";
import type { CampaignSessionTableEntry } from "@mighty-decks/spec/campaign";
import {
  canStackReference,
  getLaneVariant,
  groupAdjacentEntries,
  isSceneReference,
  makeReferenceKey,
  makeReferenceTitle,
} from "./utils";

const makeEntry = (
  tableEntryId: string,
  card: CampaignSessionTableEntry["card"],
): CampaignSessionTableEntry => ({
  tableEntryId,
  target: { scope: "shared" },
  card,
  addedAtIso: "2026-04-04T10:00:00.000Z",
});

test("groupAdjacentEntries only stacks adjacent matching references", () => {
  const entries = [
    makeEntry("shared-1", { type: "OutcomeCard", slug: "success" }),
    makeEntry("shared-2", { type: "OutcomeCard", slug: "success" }),
    makeEntry("shared-3", { type: "ActorCard", slug: "warden-sable" }),
    makeEntry("shared-4", { type: "OutcomeCard", slug: "success" }),
  ];

  const groups = groupAdjacentEntries(entries);

  assert.deepEqual(
    groups.map((group) => ({
      key: group.key,
      entryIds: group.entries.map((entry) => entry.tableEntryId),
    })),
    [
      {
        key: "OutcomeCard:success",
        entryIds: ["shared-1", "shared-2"],
      },
      {
        key: "ActorCard:warden-sable",
        entryIds: ["shared-3"],
      },
      {
        key: "OutcomeCard:success",
        entryIds: ["shared-4"],
      },
    ],
  );
});

test("scene cards stay unstacked while non-scene cards may stack", () => {
  assert.equal(canStackReference({ type: "OutcomeCard", slug: "success" }), true);
  assert.equal(canStackReference({ type: "ActorCard", slug: "warden-sable" }), true);
  assert.equal(canStackReference({ type: "LocationCard", slug: "drowned-gate" }), false);
  assert.equal(canStackReference({ type: "EncounterCard", slug: "counterweight-collapse" }), false);
  assert.equal(canStackReference({ type: "QuestCard", slug: "recover-the-lantern" }), false);

  assert.equal(isSceneReference({ type: "OutcomeCard", slug: "success" }), false);
  assert.equal(isSceneReference({ type: "LocationCard", slug: "drowned-gate" }), true);
  assert.equal(isSceneReference({ type: "EncounterCard", slug: "counterweight-collapse" }), true);
  assert.equal(isSceneReference({ type: "QuestCard", slug: "recover-the-lantern" }), true);
});

test("reference labels and viewer lane variants stay explicit", () => {
  assert.equal(
    makeReferenceKey({
      type: "AssetCard",
      slug: "lantern-shards",
      modifierSlug: "cracked",
    }),
    "AssetCard:lantern-shards:cracked",
  );
  assert.equal(
    makeReferenceTitle({
      type: "AssetCard",
      slug: "lantern-shards",
      modifierSlug: "cracked",
    }),
    "AssetCard lantern-shards/cracked",
  );

  assert.equal(getLaneVariant("player", true, 3), "gold");
  assert.equal(getLaneVariant("storyteller", false, 0), "cloth");
  assert.equal(getLaneVariant("player", false, 1), "monster");
});
