import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("CampaignSessionTable supports seat-owned lanes, send actions, and role-aware remove permissions", () => {
  const source = readFileSync(
    new URL("./CampaignSessionTable.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /participant\.role === "player"/);
  assert.match(source, /const laneLabel = actor\?\.title \?\? participant\.displayName/);
  assert.match(source, /label="Shared"/);
  assert.match(source, /Send Cards/);
  assert.match(source, /hasStagedCards/);
  assert.match(source, /viewerRole === "storyteller"/);
  assert.match(source, /entry\.target\.scope === "participant"/);
  assert.match(source, /entry\.target\.participantId === currentParticipantId/);
  assert.match(source, /onRemoveEntry\?: \(tableEntryId: string\) => void/);
  assert.match(source, /groupAdjacentEntries/);
  assert.match(source, /canStackReference/);
  assert.match(source, /isSceneReference/);
  assert.match(source, /compactSceneCardSlotClassName/);
  assert.match(source, /onDrawOutcomeCard\?: \(participantId: string\) => void/);
  assert.match(source, /onShuffleOutcomeDeck\?: \(participantId: string\) => void/);
  assert.match(source, /onPlayOutcomeCards\?: \(participantId: string, cardIds: string\[\]\) => void/);
  assert.match(source, /selectedOutcomeCardIds/);
  assert.match(source, /discardRotationDegrees/);
  assert.match(source, /Play Character/);
  assert.match(source, /face="back"/);
  assert.match(source, /face="front"/);
  assert.match(
    source,
    /slotWidthClassName = isSceneReference\(entry\.card\)\s*\?\s*compactSceneCardSlotClassName\s*:\s*compactCardSlotClassName/,
  );
  assert.match(source, /removeFadeDurationMs\s*=\s*\d+/);
  assert.match(source, /styles\.tableCardShell/);
  assert.match(source, /styles\.tableCardFading/);
  assert.match(source, /window\.setTimeout\(\(\) => \{[\s\S]*onRemoveEntry\(tableEntryId\);[\s\S]*\}, removeFadeDurationMs\)/);
  assert.match(source, /Missing Card/);
});
