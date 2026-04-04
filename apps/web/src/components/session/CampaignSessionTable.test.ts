import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("CampaignSessionTable delegates rendering and local UI state to focused session-table modules", () => {
  const source = readFileSync(
    new URL("./CampaignSessionTable.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /participant\.role === "player"/);
  assert.match(source, /hasStagedCards/);
  assert.match(source, /viewerRole === "storyteller"/);
  assert.match(source, /entry\.target\.scope === "participant"/);
  assert.match(source, /entry\.target\.participantId === currentParticipantId/);
  assert.match(source, /onRemoveEntry\?: \(tableEntryId: string\) => void/);
  assert.match(source, /onDrawOutcomeCard\?: \(participantId: string\) => void/);
  assert.match(source, /onShuffleOutcomeDeck\?: \(participantId: string\) => void/);
  assert.match(source, /onPlayOutcomeCards\?: \(participantId: string, cardIds: string\[\]\) => void/);
  assert.match(source, /SessionTableLane/);
  assert.match(source, /useCampaignSessionTableRemoval/);
  assert.match(source, /emptyOutcomePile/);
  assert.doesNotMatch(source, /selectedOutcomeCardIds/);
  assert.doesNotMatch(source, /discardRotationDegrees/);
  assert.doesNotMatch(source, /window\.setTimeout/);
});
