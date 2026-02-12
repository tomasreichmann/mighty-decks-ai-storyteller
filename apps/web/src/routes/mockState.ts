import type {
  ActiveVote,
  AdventurePhase,
  AdventureState,
  RuntimeConfig,
  SceneDebug,
  ScenePublic,
  TranscriptEntry,
} from "@mighty-decks/spec/adventureState";

const now = Date.now();

export const mockRoster: AdventureState["roster"] = [
  {
    playerId: "p-screen",
    displayName: "Table Screen",
    role: "screen",
    connected: true,
    ready: true,
    hasVoted: false,
  },
  {
    playerId: "p-alex",
    displayName: "Alex",
    role: "player",
    connected: true,
    ready: true,
    hasVoted: true,
  },
  {
    playerId: "p-jordan",
    displayName: "Jordan",
    role: "player",
    connected: true,
    ready: false,
    hasVoted: false,
  },
];

export const mockVote: ActiveVote = {
  voteId: "vote-1",
  kind: "adventure_pitch",
  title: "Choose your adventure",
  prompt: "Pick one pitch to start this session.",
  startedAtIso: new Date(now).toISOString(),
  timeoutMs: 20000,
  closesAtIso: new Date(now + 20000).toISOString(),
  options: [
    {
      optionId: "o1",
      title: "The Salt Clock",
      description: "A city keeps time by tides, but the tide has stopped.",
      voteCount: 1,
    },
    {
      optionId: "o2",
      title: "Ash Market",
      description: "Night bazaar vendors trade in secrets instead of coin.",
      voteCount: 1,
    },
  ],
};

export const mockScene: ScenePublic = {
  sceneId: "scene-1",
  imagePending: true,
  closingImagePending: false,
  mode: "low_tension",
  tension: 52,
  introProse:
    "Rain hammers the observatory glass while the brass doors lock behind you. The clocktower below has gone silent.",
  orientationBullets: [
    "Goal: Restart the tide clock before dawn.",
    "Pressure: Flood sirens are rising across the district.",
    "Exits: Ladder shaft, archive balcony, sealed roof hatch.",
  ],
};

export const mockTranscript: TranscriptEntry[] = [
  {
    entryId: "t1",
    kind: "system",
    author: "System",
    text: "Adventure started.",
    createdAtIso: new Date(now - 30000).toISOString(),
  },
  {
    entryId: "t2",
    kind: "storyteller",
    author: "Storyteller",
    text: "The stormline curls over the bay and all bells are silent.",
    createdAtIso: new Date(now - 20000).toISOString(),
  },
  {
    entryId: "t3",
    kind: "player",
    author: "Alex",
    text: "I check if the control console still has power.",
    createdAtIso: new Date(now - 10000).toISOString(),
  },
];

export const mockRuntimeConfig: RuntimeConfig = {
  textCallTimeoutMs: 10000,
  turnDeadlineMs: 18000,
  imageTimeoutMs: 30000,
  aiRetryCount: 1,
  voteTimeoutMs: 20000,
};

export const mockState: AdventureState = {
  adventureId: "adv-sample",
  phase: "lobby",
  roster: mockRoster,
  activeVote: mockVote,
  currentScene: mockScene,
  transcript: mockTranscript,
  sessionSummary:
    "You stabilized the tide clock, exposed the archive saboteur, and left the tower before the last floodwall failed.",
  debugScene: {
    tension: 58,
    secrets: ["Archivist knows the flood schedule"],
    pacingNotes: ["Offer hard choice within 2 turns"],
    continuityWarnings: [],
    aiRequests: [],
    recentDecisions: [],
  },
  runtimeConfig: mockRuntimeConfig,
  latencyMetrics: {
    actionCount: 14,
    averageMs: 3450,
    p90Ms: 6120,
    updatedAtIso: new Date(now).toISOString(),
  },
  debugMode: true,
  closed: false,
};

export const parsePhase = (value: string | null): AdventurePhase => {
  if (value === "lobby" || value === "vote" || value === "play" || value === "ending") {
    return value;
  }

  return "lobby";
};

export const mockDebugScene: SceneDebug = mockState.debugScene ?? {
  secrets: [],
  pacingNotes: [],
  continuityWarnings: [],
  aiRequests: [],
  recentDecisions: [],
};
