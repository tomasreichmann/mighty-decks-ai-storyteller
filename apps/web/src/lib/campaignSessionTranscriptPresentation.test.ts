import assert from "node:assert/strict";
import test from "node:test";
import type {
  CampaignSessionParticipant,
  CampaignSessionTranscriptEntry,
} from "@mighty-decks/spec/campaign";
import { presentCampaignSessionTranscriptEntry } from "./campaignSessionTranscriptPresentation";

const participants: CampaignSessionParticipant[] = [
  {
    participantId: "player-current",
    displayName: "Nima",
    role: "player",
    isMock: false,
    connected: true,
    joinedAtIso: "2026-03-31T08:00:00.000Z",
  },
  {
    participantId: "player-other",
    displayName: "Ash",
    role: "player",
    isMock: false,
    connected: true,
    joinedAtIso: "2026-03-31T08:01:00.000Z",
  },
  {
    participantId: "storyteller-1",
    displayName: "Morgan",
    role: "storyteller",
    isMock: false,
    connected: true,
    joinedAtIso: "2026-03-31T08:02:00.000Z",
  },
];

const makeEntry = (
  overrides: Partial<CampaignSessionTranscriptEntry>,
): CampaignSessionTranscriptEntry => ({
  entryId: "entry-1",
  kind: "system",
  text: "Session created.",
  createdAtIso: "2026-03-31T08:03:00.000Z",
  ...overrides,
});

test("presentCampaignSessionTranscriptEntry gives the current player join event the self player treatment", () => {
  const presented = presentCampaignSessionTranscriptEntry({
    entry: makeEntry({
      text: "Nima joined as player.",
    }),
    participants,
    currentParticipantId: "player-current",
  });

  assert.deepEqual(presented, {
    label: "Nima",
    color: "fire",
    text: "Joined",
    align: "end",
  });
});

test("presentCampaignSessionTranscriptEntry distinguishes other players and storytellers on join events", () => {
  const otherPlayer = presentCampaignSessionTranscriptEntry({
    entry: makeEntry({
      text: "Ash joined as player.",
    }),
    participants,
    currentParticipantId: "player-current",
  });
  const storyteller = presentCampaignSessionTranscriptEntry({
    entry: makeEntry({
      text: "Morgan joined as storyteller.",
    }),
    participants,
    currentParticipantId: "player-current",
  });

  assert.deepEqual(otherPlayer, {
    label: "Ash",
    color: "fire-lightest",
    text: "Joined",
    align: "start",
  });
  assert.deepEqual(storyteller, {
    label: "Morgan",
    color: "gold",
    text: "Joined",
    align: "start",
  });
});

test("presentCampaignSessionTranscriptEntry keeps authored chat messages role-colored and shortens known system action text", () => {
  const groupMessage = presentCampaignSessionTranscriptEntry({
    entry: makeEntry({
      kind: "group_message",
      participantId: "storyteller-1",
      authorDisplayName: "Morgan",
      authorRole: "storyteller",
      text: "The lanterns dim as the fog rolls in.",
    }),
    participants,
    currentParticipantId: "player-current",
  });
  const claimEvent = presentCampaignSessionTranscriptEntry({
    entry: makeEntry({
      text: "Ash claimed Sir Rowan.",
    }),
    participants,
    currentParticipantId: "player-current",
  });

  assert.deepEqual(groupMessage, {
    label: "Morgan",
    color: "gold",
    text: "The lanterns dim as the fog rolls in.",
    align: "start",
  });
  assert.deepEqual(claimEvent, {
    label: "Ash",
    color: "fire-lightest",
    text: "Claimed Sir Rowan",
    align: "start",
  });
});

test("presentCampaignSessionTranscriptEntry keeps unknown system entries as cloth System messages", () => {
  const presented = presentCampaignSessionTranscriptEntry({
    entry: makeEntry({
      text: "Session is now active.",
    }),
    participants,
    currentParticipantId: "player-current",
  });

  assert.deepEqual(presented, {
    label: "System",
    color: "cloth",
    text: "Session is now active.",
    align: "start",
  });
});
