import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultRuntimeConfig,
  type AdventureState,
  type RuntimeConfig,
} from "@mighty-decks/spec/adventureState";
import { AdventureManager, type AdventureManagerOptions } from "../src/adventure/AdventureManager";
import type {
  ActionResponseInput,
  ActionResponseResult,
  ContinuityResult,
  PitchInput,
  PitchOption,
  SceneReactionInput,
  SceneReactionResult,
  SceneStartInput,
  SceneStartResult,
  StorytellerService,
} from "../src/ai/StorytellerService";

const adventureId = "adv-integration";

const flushMicrotasks = async (turns = 6): Promise<void> => {
  for (let index = 0; index < turns; index += 1) {
    await Promise.resolve();
  }
};

const baseRuntimeConfig: RuntimeConfig = {
  ...defaultRuntimeConfig,
  voteTimeoutMs: 20000,
};

interface StorytellerMockOverrides {
  generateAdventurePitches?: (inputs: PitchInput[], runtimeConfig: RuntimeConfig) => Promise<PitchOption[]>;
  generateSceneStart?: (input: SceneStartInput, runtimeConfig: RuntimeConfig) => Promise<SceneStartResult>;
  updateContinuity?: (transcript: AdventureState["transcript"], runtimeConfig: RuntimeConfig) => Promise<ContinuityResult>;
  narrateAction?: (input: ActionResponseInput, runtimeConfig: RuntimeConfig) => Promise<ActionResponseResult>;
  resolveSceneReaction?: (
    input: SceneReactionInput,
    runtimeConfig: RuntimeConfig,
  ) => Promise<SceneReactionResult>;
  decideOutcomeCheckForPlayerAction?: (
    input: {
      actorCharacterName: string;
      actionText: string;
      turnNumber: number;
      scene: NonNullable<AdventureState["currentScene"]>;
      transcriptTail: AdventureState["transcript"];
      rollingSummary: string;
    },
    runtimeConfig: RuntimeConfig,
  ) => Promise<{
    shouldCheck: boolean;
    reason: string;
    triggers: {
      threat: boolean;
      uncertainty: boolean;
      highReward: boolean;
    };
  }>;
  summarizeSession?: (transcript: AdventureState["transcript"], runtimeConfig: RuntimeConfig) => Promise<string>;
  craftSessionForwardHook?: (
    transcript: AdventureState["transcript"],
    summary: string,
    runtimeConfig: RuntimeConfig,
  ) => Promise<string>;
  generateSceneImage?: (scene: NonNullable<AdventureState["currentScene"]>, runtimeConfig: RuntimeConfig) => Promise<string | null>;
}

interface StorytellerMockController {
  storyteller: StorytellerService;
  calls: {
    pitchInputs: PitchInput[][];
    sceneStarts: SceneStartInput[];
    narrateActions: ActionResponseInput[];
    sceneReactions: SceneReactionInput[];
    continuityUpdates: AdventureState["transcript"][];
  };
}

const createStorytellerMock = (overrides: StorytellerMockOverrides = {}): StorytellerMockController => {
  const calls = {
    pitchInputs: [] as PitchInput[][],
    sceneStarts: [] as SceneStartInput[],
    narrateActions: [] as ActionResponseInput[],
    sceneReactions: [] as SceneReactionInput[],
    continuityUpdates: [] as AdventureState["transcript"][],
  };

  const storyteller = {
    generateAdventurePitches: async (inputs: PitchInput[]) => {
      calls.pitchInputs.push(inputs);
      if (overrides.generateAdventurePitches) {
        return overrides.generateAdventurePitches(inputs, baseRuntimeConfig);
      }

      return [
        {
          title: "Pitch One",
          description: "A storm over the observatory reveals a buried city map.",
        },
        {
          title: "Pitch Two",
          description: "A flooded district trades memories to survive one final night.",
        },
      ];
    },
    generateSceneStart: async (input: SceneStartInput) => {
      calls.sceneStarts.push(input);
      if (overrides.generateSceneStart) {
        return overrides.generateSceneStart(input, baseRuntimeConfig);
      }

      return {
        introProse: "Rain hammers the observatory dome as the first alarm bell cuts off mid-ring.",
        orientationBullets: [
          "Goal: restore the tide clock before dawn.",
          "Pressure: flood sirens rise every minute.",
          "Exits: archive stairwell, roof hatch, cable lift.",
        ],
        playerPrompt:
          "Each of you, state why your character cannot walk away, then take one concrete action.",
        debug: {
          tension: 55,
          secrets: ["The archivist already sabotaged one relay."],
          pacingNotes: ["Offer a hard split decision within two turns."],
          continuityWarnings: [],
          aiRequests: [],
        },
      };
    },
    updateContinuity: async (transcript: AdventureState["transcript"]) => {
      calls.continuityUpdates.push(transcript);
      if (overrides.updateContinuity) {
        return overrides.updateContinuity(transcript, baseRuntimeConfig);
      }

      return {
        rollingSummary: "The party entered the observatory to stabilize the city tide clock.",
        continuityWarnings: [],
      };
    },
    narrateAction: async (input: ActionResponseInput) => {
      calls.narrateActions.push(input);
      if (overrides.narrateAction) {
        return overrides.narrateAction(input, baseRuntimeConfig);
      }

      return {
        text: "Your move buys the group a narrow opening before the next surge hits.",
        closeScene: false,
        debug: {
          tension: 62,
          secrets: [],
          pacingNotes: ["Escalate a consequence on the next turn."],
          continuityWarnings: [],
          aiRequests: [],
        },
      };
    },
    resolveSceneReaction: async (input: SceneReactionInput) => {
      calls.sceneReactions.push(input);
      if (overrides.resolveSceneReaction) {
        return overrides.resolveSceneReaction(input, baseRuntimeConfig);
      }

      return {
        goalStatus: "advanced",
        failForward: true,
        tensionShift: "stable",
        tensionDelta: 0,
        closeScene: false,
        tension: input.scene.tension,
        debug: {
          tension: input.scene.tension,
          secrets: [],
          pacingNotes: [],
          continuityWarnings: [],
          aiRequests: [],
        },
      };
    },
    decideOutcomeCheckForPlayerAction: async (input) => {
      if (overrides.decideOutcomeCheckForPlayerAction) {
        return overrides.decideOutcomeCheckForPlayerAction(input, baseRuntimeConfig);
      }

      return {
        shouldCheck: false,
        reason: "No immediate dramatic risk or major upside warrants an Outcome card.",
        triggers: {
          threat: false,
          uncertainty: false,
          highReward: false,
        },
      };
    },
    summarizeSession: async (transcript: AdventureState["transcript"]) => {
      if (overrides.summarizeSession) {
        return overrides.summarizeSession(transcript, baseRuntimeConfig);
      }

      return "The party contained the immediate crisis and left the district with one unresolved warning.";
    },
    craftSessionForwardHook: async (
      transcript: AdventureState["transcript"],
      summary: string,
    ) => {
      if (overrides.craftSessionForwardHook) {
        return overrides.craftSessionForwardHook(
          transcript,
          summary,
          baseRuntimeConfig,
        );
      }

      return "The warning points deeper into the district, and the next move could expose who set the trap.";
    },
    generateSceneImage: async (scene: NonNullable<AdventureState["currentScene"]>) => {
      if (overrides.generateSceneImage) {
        return overrides.generateSceneImage(scene, baseRuntimeConfig);
      }

      return null;
    },
  } as unknown as StorytellerService;

  return { storyteller, calls };
};

const createManager = (
  storyteller: StorytellerService,
  runtimeConfigOverrides: Partial<RuntimeConfig> = {},
  diagnosticsLogger?: AdventureManagerOptions["diagnosticsLogger"],
): AdventureManager =>
  new AdventureManager({
    debugMode: true,
    maxActiveAdventures: 1,
    runtimeConfigDefaults: {
      ...baseRuntimeConfig,
      ...runtimeConfigOverrides,
    },
    storyteller,
    diagnosticsLogger,
  });

const joinScreen = (manager: AdventureManager): void => {
  manager.joinAdventure(
    {
      adventureId,
      playerId: "screen-1",
      displayName: "Table Screen",
      role: "screen",
    },
    "socket-screen-1",
  );
};

const joinPlayer = (
  manager: AdventureManager,
  playerId: string,
  displayName: string,
): void => {
  manager.joinAdventure(
    {
      adventureId,
      playerId,
      displayName,
      role: "player",
    },
    `socket-${playerId}`,
  );
};

const submitSetup = (
  manager: AdventureManager,
  playerId: string,
  characterName: string,
  adventurePreference: string,
): void => {
  manager.updateSetup({
    adventureId,
    playerId,
    setup: {
      characterName,
      visualDescription: `${characterName} in weather-worn travel gear.`,
      adventurePreference,
    },
  });
};

test("starts adventure pitch vote from connected ready players and forwards setup context", async () => {
  const storyteller = createStorytellerMock();
  const manager = createManager(storyteller.storyteller);

  joinScreen(manager);
  joinPlayer(manager, "player-1", "Alex");
  joinPlayer(manager, "player-2", "Jordan");
  submitSetup(manager, "player-1", "Nyra Flint", "Tense mystery in a coastal city.");
  submitSetup(manager, "player-2", "Cass Varn", "High-pressure rescue with strange weather.");

  await manager.toggleReady({
    adventureId,
    playerId: "player-1",
    ready: true,
  });

  let state = manager.getAdventure(adventureId);
  assert.ok(state);
  assert.equal(state.phase, "lobby");
  assert.equal(state.activeVote, undefined);

  await manager.toggleReady({
    adventureId,
    playerId: "player-2",
    ready: true,
  });

  state = manager.getAdventure(adventureId);
  assert.ok(state);
  assert.equal(state.phase, "vote");
  assert.equal(state.activeVote?.kind, "adventure_pitch");
  assert.equal(storyteller.calls.pitchInputs.length, 1);
  assert.deepEqual(storyteller.calls.pitchInputs[0], [
    {
      displayName: "Alex",
      characterName: "Nyra Flint",
      visualDescription: "Nyra Flint in weather-worn travel gear.",
      adventurePreference: "Tense mystery in a coastal city.",
    },
    {
      displayName: "Jordan",
      characterName: "Cass Varn",
      visualDescription: "Cass Varn in weather-worn travel gear.",
      adventurePreference: "High-pressure rescue with strange weather.",
    },
  ]);

  await manager.endSession({
    adventureId,
    playerId: "player-1",
  });
});

test("resolves vote timeout with fake timers and transitions to play", async (t) => {
  try {
    t.mock.timers.enable(["setTimeout"]);
  } catch {
    const enableLegacy = t.mock.timers.enable as unknown as (
      options: { apis: string[] },
    ) => void;
    enableLegacy({ apis: ["setTimeout"] });
  }
  t.after(() => {
    t.mock.timers.reset();
  });

  const storyteller = createStorytellerMock();
  const manager = createManager(storyteller.storyteller, {
    voteTimeoutMs: 20000,
  });

  const stateSnapshots: AdventureState[] = [];
  manager.setHooks({
    onAdventureUpdated: (id) => {
      const current = manager.getAdventure(id);
      if (current) {
        stateSnapshots.push(structuredClone(current));
      }
    },
  });

  joinPlayer(manager, "player-1", "Alex");
  submitSetup(manager, "player-1", "Nyra Flint", "Occult storm mystery.");

  await manager.toggleReady({
    adventureId,
    playerId: "player-1",
    ready: true,
  });

  let state = manager.getAdventure(adventureId);
  assert.ok(state?.activeVote);
  assert.equal(state.phase, "vote");

  t.mock.timers.tick(20000);
  await flushMicrotasks();

  state = manager.getAdventure(adventureId);
  assert.ok(state);
  assert.equal(state.phase, "play");
  assert.ok(state.currentScene);
  assert.equal(storyteller.calls.sceneStarts.length, 1);

  const timeoutResolutionSnapshot = stateSnapshots.find(
    (snapshot) => snapshot.activeVote?.resolution?.timeoutClosed === true,
  );
  assert.ok(timeoutResolutionSnapshot);
  assert.equal(timeoutResolutionSnapshot.activeVote?.resolution?.tieBreakApplied, true);
});

test("enforces queue lock during storyteller turn and records player transcript author as character name", async () => {
  let resolveNarration: ((value: ActionResponseResult) => void) | null = null;

  const storyteller = createStorytellerMock({
    narrateAction: async () =>
      new Promise<ActionResponseResult>((resolve) => {
        resolveNarration = resolve;
      }),
  });

  const manager = createManager(storyteller.storyteller);

  joinPlayer(manager, "player-1", "Alex");
  submitSetup(manager, "player-1", "Nyra Flint", "Clockwork disaster mystery.");

  await manager.toggleReady({
    adventureId,
    playerId: "player-1",
    ready: true,
  });

  const voteId = manager.getAdventure(adventureId)?.activeVote?.voteId;
  const firstOptionId = manager.getAdventure(adventureId)?.activeVote?.options[0]?.optionId;
  assert.ok(voteId);
  assert.ok(firstOptionId);

  await manager.castVote({
    adventureId,
    playerId: "player-1",
    voteId,
    optionId: firstOptionId,
  });

  let state = manager.getAdventure(adventureId);
  assert.ok(state);
  assert.equal(state.phase, "play");

  const firstActionPromise = manager.submitAction({
    adventureId,
    playerId: "player-1",
    text: "I reroute power from the flood siren bank into the clock relay.",
  });

  state = manager.getAdventure(adventureId);
  const latestPlayerEntry = [...(state?.transcript ?? [])]
    .reverse()
    .find((entry) => entry.kind === "player");
  assert.ok(latestPlayerEntry);
  assert.equal(latestPlayerEntry.author, "Nyra Flint");
  await flushMicrotasks();
  assert.equal(storyteller.calls.narrateActions[0]?.actorCharacterName, "Nyra Flint");

  await assert.rejects(
    () =>
      manager.submitAction({
        adventureId,
        playerId: "player-1",
        text: "I also secure the archive hatch before the wave hits.",
      }),
    /action queue busy/i,
  );

  assert.ok(resolveNarration);
  resolveNarration({
    text: "The rerouted power stutters, then catches; the relay lights in sequence.",
    closeScene: false,
    debug: {
      tension: 68,
      secrets: [],
      pacingNotes: ["Escalate the external threat next turn."],
      continuityWarnings: [],
      aiRequests: [],
    },
  });
  await flushMicrotasks();
  await firstActionPromise;

  state = manager.getAdventure(adventureId);
  assert.ok(
    state?.transcript.some(
      (entry) => entry.kind === "storyteller" && entry.text.includes("relay lights in sequence"),
    ),
  );
});

test("allows late joiners to submit setup during play", async () => {
  const storyteller = createStorytellerMock();
  const manager = createManager(storyteller.storyteller);

  joinPlayer(manager, "player-1", "Alex");
  submitSetup(manager, "player-1", "Nyra Flint", "Clockwork disaster mystery.");

  await manager.toggleReady({
    adventureId,
    playerId: "player-1",
    ready: true,
  });

  const voteId = manager.getAdventure(adventureId)?.activeVote?.voteId;
  const firstOptionId = manager.getAdventure(adventureId)?.activeVote?.options[0]?.optionId;
  assert.ok(voteId);
  assert.ok(firstOptionId);

  await manager.castVote({
    adventureId,
    playerId: "player-1",
    voteId,
    optionId: firstOptionId,
  });

  let state = manager.getAdventure(adventureId);
  assert.equal(state?.phase, "play");

  joinPlayer(manager, "player-2", "Jordan");
  manager.updateSetup({
    adventureId,
    playerId: "player-2",
    setup: {
      characterName: "Cass Varn",
      visualDescription: "Cass Varn in soot-streaked courier leathers.",
      adventurePreference: "",
    },
  });

  state = manager.getAdventure(adventureId);
  const lateJoiner = state?.roster.find((entry) => entry.playerId === "player-2");
  assert.equal(lateJoiner?.setup?.characterName, "Cass Varn");

  manager.submitAction({
    adventureId,
    playerId: "player-2",
    text: "I sweep the archive floor for tripwires before anyone moves.",
  });

  state = manager.getAdventure(adventureId);
  const latestPlayerEntry = [...(state?.transcript ?? [])]
    .reverse()
    .find((entry) => entry.kind === "player");
  assert.ok(latestPlayerEntry);
  assert.equal(latestPlayerEntry.author, "Cass Varn");
});

test("excludes AI debug transcript entries from storyteller and continuity context", async () => {
  const storyteller = createStorytellerMock();
  const manager = createManager(storyteller.storyteller);

  joinPlayer(manager, "player-1", "Alex");
  submitSetup(manager, "player-1", "Nyra Flint", "Clockwork disaster mystery.");

  await manager.toggleReady({
    adventureId,
    playerId: "player-1",
    ready: true,
  });

  const voteId = manager.getAdventure(adventureId)?.activeVote?.voteId;
  const firstOptionId = manager.getAdventure(adventureId)?.activeVote?.options[0]?.optionId;
  assert.ok(voteId);
  assert.ok(firstOptionId);

  await manager.castVote({
    adventureId,
    playerId: "player-1",
    voteId,
    optionId: firstOptionId,
  });

  manager.appendAiRequestLog({
    adventureId,
    requestId: "req-debug-1",
    createdAtIso: new Date().toISOString(),
    agent: "scene_controller",
    kind: "text",
    model: "google/gemini-2.5-flash-lite",
    timeoutMs: 20000,
    attempt: 1,
    fallback: false,
    status: "succeeded",
    prompt: "raw debug prompt should not leak into context",
    response: "{\"introProse\":\"Scene\",\"orientationBullets\":[\"A\",\"B\"]}",
  });

  manager.submitAction({
    adventureId,
    playerId: "player-1",
    text: "I secure the cable lift and search for emergency seals.",
  });

  await flushMicrotasks();

  assert.ok(storyteller.calls.narrateActions.length > 0);
  const narrateContext = storyteller.calls.narrateActions[0]?.transcriptTail ?? [];
  assert.equal(
    narrateContext.some((entry) => entry.author === "AI Debug"),
    false,
  );

  assert.ok(storyteller.calls.continuityUpdates.length > 0);
  const latestContinuityTranscript =
    storyteller.calls.continuityUpdates[storyteller.calls.continuityUpdates.length - 1] ?? [];
  assert.equal(
    latestContinuityTranscript.some((entry) => entry.author === "AI Debug"),
    false,
  );
});

test("writes concise AI transcript debug entries without prompt text", () => {
  const storyteller = createStorytellerMock();
  const manager = createManager(storyteller.storyteller);

  joinPlayer(manager, "player-1", "Alex");
  const stateBefore = manager.getAdventure(adventureId);
  assert.ok(stateBefore);

  manager.appendAiRequestLog({
    adventureId,
    requestId: "req-debug-2",
    createdAtIso: new Date().toISOString(),
    agent: "continuity_keeper",
    kind: "text",
    model: "google/gemini-2.5-flash-lite",
    timeoutMs: 20000,
    attempt: 1,
    fallback: false,
    status: "succeeded",
    prompt: "This prompt should never appear in transcript entries.",
    response: "Compressed continuity response.",
  });

  const stateAfter = manager.getAdventure(adventureId);
  assert.ok(stateAfter);
  const aiDebugEntry = [...stateAfter.transcript]
    .reverse()
    .find((entry) => entry.author === "AI Debug");
  assert.ok(aiDebugEntry);
  assert.match(aiDebugEntry.text, /\[AI SUCCEEDED\]/);
  assert.match(aiDebugEntry.text, /Response:/);
  assert.doesNotMatch(aiDebugEntry.text, /Prompt:/);
  assert.doesNotMatch(aiDebugEntry.text, /This prompt should never appear/);
});

test("includes prompt text for AI STARTED transcript debug entries", () => {
  const storyteller = createStorytellerMock();
  const manager = createManager(storyteller.storyteller);

  joinPlayer(manager, "player-1", "Alex");

  manager.appendAiRequestLog({
    adventureId,
    requestId: "req-debug-started-1",
    createdAtIso: new Date().toISOString(),
    agent: "scene_controller",
    kind: "text",
    model: "google/gemini-2.5-flash-lite",
    timeoutMs: 20000,
    attempt: 1,
    fallback: false,
    status: "started",
    prompt: "Return JSON with introProse, orientationBullets, and playerPrompt.",
  });

  const state = manager.getAdventure(adventureId);
  assert.ok(state);
  const aiDebugEntry = [...state.transcript]
    .reverse()
    .find((entry) => entry.author === "AI Debug");
  assert.ok(aiDebugEntry);
  assert.match(aiDebugEntry.text, /\[AI STARTED\]/);
  assert.match(aiDebugEntry.text, /Prompt:/);
  assert.match(aiDebugEntry.text, /playerPrompt/);
});

test("publishes pending scene, then prompts players without duplicating intro prose in transcript", async () => {
  let resolveSceneStart: ((value: SceneStartResult) => void) | null = null;
  const sceneStartResult: SceneStartResult = {
    introProse: "The hidden tavern hums with warding magic as the staff watch every shadow.",
    orientationBullets: [
      "Goal: secure the ledger before the ward collapses.",
      "Pressure: the ward destabilizes with every loud movement.",
      "Exits: negotiate, search the cellar, or trigger a risky dispel.",
    ],
    playerPrompt:
      "Each of you, state why this tavern crisis matters to your character, then take one immediate action.",
    debug: {
      tension: 63,
      secrets: ["The ledger implicates a trusted patron."],
      pacingNotes: ["Escalate if players split up."],
      continuityWarnings: [],
      aiRequests: [],
    },
  };

  const storyteller = createStorytellerMock({
    generateSceneStart: async () =>
      new Promise<SceneStartResult>((resolve) => {
        resolveSceneStart = resolve;
      }),
  });
  const manager = createManager(storyteller.storyteller);
  const thinkingEvents: Array<{ active: boolean; label: string }> = [];
  manager.setHooks({
    onStorytellerThinking: (_adventureId, payload) => {
      thinkingEvents.push(payload);
    },
  });

  joinPlayer(manager, "player-1", "Alex");
  submitSetup(manager, "player-1", "Nyra Flint", "Arcane tavern mystery.");

  await manager.toggleReady({
    adventureId,
    playerId: "player-1",
    ready: true,
  });

  const voteId = manager.getAdventure(adventureId)?.activeVote?.voteId;
  const firstOptionId = manager.getAdventure(adventureId)?.activeVote?.options[0]?.optionId;
  assert.ok(voteId);
  assert.ok(firstOptionId);

  const castVotePromise = manager.castVote({
    adventureId,
    playerId: "player-1",
    voteId,
    optionId: firstOptionId,
  });
  await flushMicrotasks();

  let state = manager.getAdventure(adventureId);
  assert.ok(state);
  assert.equal(state.phase, "play");
  assert.ok(state.currentScene);
  assert.notEqual(state.currentScene?.introProse, sceneStartResult.introProse);
  assert.ok(thinkingEvents.some((event) => event.active && event.label.includes("Framing scene")));

  assert.ok(resolveSceneStart);
  resolveSceneStart(sceneStartResult);
  await castVotePromise;
  await flushMicrotasks();

  state = manager.getAdventure(adventureId);
  assert.ok(state?.currentScene);
  assert.equal(state?.currentScene?.introProse, sceneStartResult.introProse);
  assert.deepEqual(state?.currentScene?.orientationBullets, sceneStartResult.orientationBullets);
  const storytellerEntries = state?.transcript.filter((entry) => entry.kind === "storyteller") ?? [];
  assert.equal(
    storytellerEntries.some((entry) => entry.text === sceneStartResult.introProse),
    false,
  );
  assert.equal(
    storytellerEntries.some((entry) => entry.text === sceneStartResult.playerPrompt),
    true,
  );
  assert.ok(thinkingEvents.some((event) => !event.active));
});

test("emits thinking state while generating adventure pitches", async () => {
  let resolvePitches: ((value: PitchOption[]) => void) | null = null;
  const storyteller = createStorytellerMock({
    generateAdventurePitches: async () =>
      new Promise<PitchOption[]>((resolve) => {
        resolvePitches = resolve;
      }),
  });
  const manager = createManager(storyteller.storyteller);
  const thinkingEvents: Array<{ active: boolean; label: string }> = [];
  manager.setHooks({
    onStorytellerThinking: (_adventureId, payload) => {
      thinkingEvents.push(payload);
    },
  });

  joinPlayer(manager, "player-1", "Alex");
  submitSetup(manager, "player-1", "Nyra Flint", "Storm-locked mystery.");

  const togglePromise = manager.toggleReady({
    adventureId,
    playerId: "player-1",
    ready: true,
  });
  await flushMicrotasks();

  assert.ok(thinkingEvents.some((event) => event.active && event.label.includes("Generating adventure pitches")));

  assert.ok(resolvePitches);
  resolvePitches([
    {
      title: "Pitch One",
      description: "A flooded district trades memories to survive one final night.",
    },
    {
      title: "Pitch Two",
      description: "A silent observatory reveals a hidden route under the bay.",
    },
  ]);
  await togglePromise;

  assert.ok(thinkingEvents.some((event) => !event.active));
});

test("stores session summary in state only and does not duplicate it into transcript", async () => {
  const storyteller = createStorytellerMock({
    summarizeSession: async () =>
      "## Session Summary\n- The party stabilized the immediate threat.\n- One unresolved clue remains.",
  });
  const manager = createManager(storyteller.storyteller);

  joinPlayer(manager, "player-1", "Alex");
  submitSetup(manager, "player-1", "Nyra Flint", "Arcane tavern mystery.");

  await manager.endSession({
    adventureId,
    playerId: "player-1",
  });

  const state = manager.getAdventure(adventureId);
  assert.ok(state);
  assert.equal(state.phase, "ending");
  assert.equal(state.closed, true);
  assert.equal(typeof state.sessionSummary, "string");
  assert.equal(typeof state.sessionForwardHook, "string");
  assert.equal(
    state.transcript.some((entry) => entry.text.startsWith("Session summary:")),
    false,
  );
});

test("can continue an ended adventure and start a follow-up scene", async () => {
  const storyteller = createStorytellerMock({
    summarizeSession: async () =>
      "The chamber falls quiet. However, deeper signals are still calling from below.",
  });
  const manager = createManager(storyteller.storyteller);

  joinPlayer(manager, "player-1", "Alex");
  submitSetup(manager, "player-1", "Nyra Flint", "Arcane tavern mystery.");

  await manager.endSession({
    adventureId,
    playerId: "player-1",
  });

  let state = manager.getAdventure(adventureId);
  assert.ok(state);
  assert.equal(state.phase, "ending");
  assert.equal(state.closed, true);
  assert.equal(typeof state.sessionSummary, "string");

  await manager.continueAdventure({
    adventureId,
    playerId: "player-1",
  });
  await flushMicrotasks();

  state = manager.getAdventure(adventureId);
  assert.ok(state);
  assert.equal(state.phase, "play");
  assert.equal(state.closed, false);
  assert.equal(state.sessionSummary, undefined);
  assert.equal(state.sessionForwardHook, undefined);
  assert.ok(state.currentScene);
  assert.equal(storyteller.calls.sceneStarts.length, 1);
});

test("enforces high-tension turn order and gates rewards until goal completion", async () => {
  const storyteller = createStorytellerMock({
    narrateAction: async ({ actorCharacterName }) => ({
      text: `${actorCharacterName} drives the action forward under pressure.`,
      closeScene: false,
      debug: {
        tension: 70,
        secrets: [],
        pacingNotes: [],
        continuityWarnings: [],
        aiRequests: [],
      },
    }),
    resolveSceneReaction: async ({ turnNumber }) => {
      if (turnNumber === 1) {
        return {
          goalStatus: "advanced",
          reward: "A heavy satchel of coin drops from the enemy belt.",
          failForward: true,
          tensionShift: "rise",
          tensionDelta: 22,
          sceneMode: "high_tension",
          npcBeat: "Two reinforcements rush in through the side door.",
          closeScene: false,
          tension: 74,
          debug: {
            tension: 74,
            secrets: [],
            pacingNotes: [],
            continuityWarnings: [],
            aiRequests: [],
          },
        };
      }

      return {
        goalStatus: "completed",
        reward: "You recover a coded keyring and enemy insignia.",
        failForward: true,
        tensionShift: "stable",
        tensionDelta: 0,
        sceneMode: "high_tension",
        npcBeat: "The commander falls back to regroup.",
        closeScene: false,
        tension: 68,
        debug: {
          tension: 68,
          secrets: [],
          pacingNotes: [],
          continuityWarnings: [],
          aiRequests: [],
        },
      };
    },
  });
  const manager = createManager(storyteller.storyteller);

  joinPlayer(manager, "player-1", "Alex");
  joinPlayer(manager, "player-2", "Jordan");
  submitSetup(manager, "player-1", "Nyra Flint", "High-pressure showdown.");
  submitSetup(manager, "player-2", "Cass Varn", "Urban pursuit under fire.");

  await manager.toggleReady({
    adventureId,
    playerId: "player-1",
    ready: true,
  });
  await manager.toggleReady({
    adventureId,
    playerId: "player-2",
    ready: true,
  });

  const voteId = manager.getAdventure(adventureId)?.activeVote?.voteId;
  const firstOptionId = manager.getAdventure(adventureId)?.activeVote?.options[0]?.optionId;
  assert.ok(voteId);
  assert.ok(firstOptionId);
  await manager.castVote({
    adventureId,
    playerId: "player-1",
    voteId,
    optionId: firstOptionId,
  });
  await manager.castVote({
    adventureId,
    playerId: "player-2",
    voteId,
    optionId: firstOptionId,
  });

  await manager.submitAction({
    adventureId,
    playerId: "player-1",
    text: "I attack the captain and force them off balance.",
  });
  await flushMicrotasks();

  let state = manager.getAdventure(adventureId);
  assert.ok(state?.currentScene);
  assert.equal(state.currentScene?.mode, "high_tension");
  assert.equal(state.currentScene?.activeActorPlayerId, "player-2");
  const latestStorytellerAfterFirst = [...(state?.transcript ?? [])]
    .reverse()
    .find((entry) => entry.kind === "storyteller");
  assert.ok(latestStorytellerAfterFirst);
  assert.equal(latestStorytellerAfterFirst?.text.includes("Reward:"), false);
  assert.equal(
    latestStorytellerAfterFirst?.text.includes(
      "A heavy satchel of coin drops from the enemy belt.",
    ),
    false,
  );

  await assert.rejects(
    () =>
      manager.submitAction({
        adventureId,
        playerId: "player-1",
        text: "I strike again before anyone else can move.",
      }),
    /high tension turn order active/i,
  );

  await manager.submitAction({
    adventureId,
    playerId: "player-2",
    text: "I finish the captain and grab whatever falls from their belt.",
  });
  await flushMicrotasks();

  state = manager.getAdventure(adventureId);
  const latestStorytellerAfterSecond = [...(state?.transcript ?? [])]
    .reverse()
    .find((entry) => entry.kind === "storyteller");
  assert.ok(latestStorytellerAfterSecond);
  assert.equal(latestStorytellerAfterSecond?.text.includes("Reward:"), false);
  assert.equal(
    latestStorytellerAfterSecond?.text.includes(
      "You recover a coded keyring and enemy insignia.",
    ),
    true,
  );
});

test("does not inject generic fail-forward placeholder when consequence detail is missing", async () => {
  const storyteller = createStorytellerMock({
    narrateAction: async () => ({
      text: "The attempt backfires and the lock almost snaps shut for good.",
      closeScene: false,
      debug: {
        tension: 62,
        secrets: [],
        pacingNotes: [],
        continuityWarnings: [],
        aiRequests: [],
      },
    }),
    resolveSceneReaction: async () => ({
      goalStatus: "blocked",
      failForward: true,
      tensionShift: "rise",
      tensionDelta: 8,
      closeScene: false,
      debug: {
        tension: 68,
        secrets: [],
        pacingNotes: [],
        continuityWarnings: [],
        aiRequests: [],
      },
    }),
  });
  const manager = createManager(storyteller.storyteller);

  joinPlayer(manager, "player-1", "Alex");
  submitSetup(manager, "player-1", "Nyra Flint", "Break into a sealed safehouse.");
  await manager.toggleReady({
    adventureId,
    playerId: "player-1",
    ready: true,
  });

  const voteId = manager.getAdventure(adventureId)?.activeVote?.voteId;
  const firstOptionId = manager.getAdventure(adventureId)?.activeVote?.options[0]?.optionId;
  assert.ok(voteId);
  assert.ok(firstOptionId);
  await manager.castVote({
    adventureId,
    playerId: "player-1",
    voteId,
    optionId: firstOptionId,
  });

  await manager.submitAction({
    adventureId,
    playerId: "player-1",
    text: "I force the sealed door with everything I have.",
  });
  await flushMicrotasks();

  const state = manager.getAdventure(adventureId);
  const latestStoryteller = [...(state?.transcript ?? [])]
    .reverse()
    .find((entry) => entry.kind === "storyteller");
  assert.ok(latestStoryteller);
  assert.equal(latestStoryteller?.text.includes("Consequence:"), false);
  assert.equal(
    latestStoryteller?.text.includes(
      "The attempt backfires and the lock almost snaps shut for good.",
    ),
    true,
  );
  assert.equal(
    latestStoryteller?.text.includes("Progress comes at a price"),
    false,
  );
});

test("records played outcome cards as player-labeled transcript entries", async () => {
  const storyteller = createStorytellerMock({
    decideOutcomeCheckForPlayerAction: async () => ({
      shouldCheck: true,
      reason: "Direct confrontation under immediate threat requires an Outcome card.",
      triggers: {
        threat: true,
        uncertainty: true,
        highReward: false,
      },
    }),
  });
  const manager = createManager(storyteller.storyteller);

  joinPlayer(manager, "player-1", "Alex");
  submitSetup(manager, "player-1", "Nyra Flint", "High-pressure reactor breach.");
  await manager.toggleReady({
    adventureId,
    playerId: "player-1",
    ready: true,
  });

  const voteId = manager.getAdventure(adventureId)?.activeVote?.voteId;
  const firstOptionId = manager.getAdventure(adventureId)?.activeVote?.options[0]?.optionId;
  assert.ok(voteId);
  assert.ok(firstOptionId);
  await manager.castVote({
    adventureId,
    playerId: "player-1",
    voteId,
    optionId: firstOptionId,
  });

  await manager.submitAction({
    adventureId,
    playerId: "player-1",
    text: "I charge straight into the signal chamber and strike the core.",
  });
  await flushMicrotasks();

  const checkId = manager.getAdventure(adventureId)?.activeOutcomeCheck?.checkId;
  assert.ok(checkId);
  manager.playOutcomeCard({
    adventureId,
    playerId: "player-1",
    checkId,
    card: "success",
  });

  const state = manager.getAdventure(adventureId);
  const outcomeEntry = [...(state?.transcript ?? [])]
    .reverse()
    .find((entry) => entry.text.includes("played Outcome card:"));
  assert.ok(outcomeEntry);
  assert.equal(outcomeEntry?.kind, "player");
  assert.equal(outcomeEntry?.author, "Nyra Flint");
  assert.equal(
    outcomeEntry?.text.includes("Success (+2 Effect)"),
    true,
  );
});

test("requires a final finishing move before scene transition vote opens", async () => {
  let narrationCalls = 0;
  const storyteller = createStorytellerMock({
    narrateAction: async ({ actorCharacterName }) => {
      narrationCalls += 1;
      if (narrationCalls === 1) {
        return {
          text: `${actorCharacterName} destabilizes the AI core and forces it into a collapsing loop.`,
          closeScene: true,
          sceneSummary:
            "The core destabilizes and the immediate threat can be ended with one final decisive move.",
          debug: {
            tension: 88,
            secrets: [],
            pacingNotes: [],
            continuityWarnings: [],
            aiRequests: [],
          },
        };
      }

      return {
        text: `${actorCharacterName} drives the final strike through the core housing; the signal fractures and the chamber finally falls silent.`,
        closeScene: false,
        debug: {
          tension: 70,
          secrets: [],
          pacingNotes: [],
          continuityWarnings: [],
          aiRequests: [],
        },
      };
    },
    resolveSceneReaction: async () => ({
      goalStatus: "advanced",
      failForward: false,
      tensionShift: "stable",
      tensionDelta: 0,
      closeScene: false,
      debug: {
        tension: 80,
        secrets: [],
        pacingNotes: [],
        continuityWarnings: [],
        aiRequests: [],
      },
    }),
  });
  const manager = createManager(storyteller.storyteller);

  joinPlayer(manager, "player-1", "Alex");
  submitSetup(manager, "player-1", "Nyra Flint", "Confront a rogue machine intellect.");
  await manager.toggleReady({
    adventureId,
    playerId: "player-1",
    ready: true,
  });

  const voteId = manager.getAdventure(adventureId)?.activeVote?.voteId;
  const firstOptionId = manager.getAdventure(adventureId)?.activeVote?.options[0]?.optionId;
  assert.ok(voteId);
  assert.ok(firstOptionId);
  await manager.castVote({
    adventureId,
    playerId: "player-1",
    voteId,
    optionId: firstOptionId,
  });

  await manager.submitAction({
    adventureId,
    playerId: "player-1",
    text: "I overload the core's containment matrix.",
  });
  await flushMicrotasks();

  let state = manager.getAdventure(adventureId);
  assert.ok(state);
  assert.equal(state.activeVote?.kind, undefined);
  assert.equal(
    state.transcript.some((entry) =>
      entry.text.includes("give one final finishing move"),
    ),
    true,
  );

  await manager.submitAction({
    adventureId,
    playerId: "player-1",
    text: "I slam my arc welder into the core and vent the surge into the chamber walls.",
  });
  await flushMicrotasks();

  state = manager.getAdventure(adventureId);
  assert.ok(state?.currentScene);
  assert.equal(state.activeVote?.kind, "scene_transition");
  assert.equal(
    state.currentScene?.closingProse?.includes("chamber finally falls silent"),
    true,
  );
  assert.equal(
    state.currentScene?.summary,
    "The core destabilizes and the immediate threat can be ended with one final decisive move.",
  );
  assert.equal(
    state.transcript.some((entry) => entry.text.startsWith("Scene Summary:")),
    false,
  );
  assert.equal(
    state.transcript.some((entry) =>
      entry.text.startsWith("Scene ended. Choose whether to continue"),
    ),
    true,
  );
});
