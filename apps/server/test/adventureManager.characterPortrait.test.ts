import assert from "node:assert/strict";
import test from "node:test";
import { defaultRuntimeConfig, type AdventureState } from "@mighty-decks/spec/adventureState";
import type { StorytellerService } from "../src/ai/StorytellerService";
import { AdventureManager } from "../src/adventure/AdventureManager";
import { CHARACTER_PORTRAIT_PLACEHOLDER_URL } from "../src/image/characterPortraitConfig";
import type { CharacterPortraitService } from "../src/image/CharacterPortraitService";

const adventureId = "adv-portrait";

const flushMicrotasks = async (turns = 6): Promise<void> => {
  for (let index = 0; index < turns; index += 1) {
    await Promise.resolve();
  }
};

const createStorytellerStub = (): StorytellerService =>
  ({
    generateAdventurePitches: async () => [
      { title: "Pitch A", description: "Pitch A description" },
      { title: "Pitch B", description: "Pitch B description" },
    ],
    generateSceneStart: async () => ({
      introProse: "Intro",
      orientationBullets: ["Goal", "Pressure"],
      playerPrompt: "Do something",
      debug: {
        tension: 35,
        secrets: [],
        pacingNotes: [],
        continuityWarnings: [],
        aiRequests: [],
      },
    }),
    updateContinuity: async () => ({
      rollingSummary: "summary",
      continuityWarnings: [],
    }),
    narrateAction: async () => ({
      text: "Response",
      closeScene: false,
      debug: {
        tension: 35,
        secrets: [],
        pacingNotes: [],
        continuityWarnings: [],
        aiRequests: [],
      },
    }),
    decideOutcomeCheckForPlayerAction: async () => ({
      intent: "direct_action",
      responseMode: "concise",
      detailLevel: "standard",
      shouldCheck: false,
      reason: "No check",
      allowHardDenyWithoutOutcomeCheck: false,
      hardDenyReason: "",
      triggers: {
        threat: false,
        uncertainty: false,
        highReward: false,
      },
    }),
    answerMetagameQuestion: async () => "Answer",
    resolveSceneReaction: async () => ({
      goalStatus: "advanced",
      failForward: false,
      closeScene: false,
      tension: 35,
      debug: {
        tension: 35,
        secrets: [],
        pacingNotes: [],
        continuityWarnings: [],
        aiRequests: [],
      },
    }),
    summarizeSession: async () => "Summary",
    craftSessionForwardHook: async () => "Hook",
    generateSceneImage: async () => null,
  }) as unknown as StorytellerService;

test("updateSetup seeds pending portrait entry and updates to ready when portrait generation completes", async () => {
  let resolvePortrait:
    | ((value: {
        characterNameKey: string;
        characterName: string;
        imageUrl: string;
        status: "ready";
      }) => void)
    | null = null;
  const portraitService = {
    ensurePortrait: async () =>
      new Promise<{
        characterNameKey: string;
        characterName: string;
        imageUrl: string;
        status: "ready";
      }>((resolve) => {
        resolvePortrait = resolve;
      }),
  } as unknown as CharacterPortraitService;

  const snapshots: AdventureState[] = [];
  const manager = new AdventureManager({
    debugMode: false,
    maxActiveAdventures: 1,
    runtimeConfigDefaults: defaultRuntimeConfig,
    storyteller: createStorytellerStub(),
    characterPortraitService: portraitService,
  });
  manager.setHooks({
    onAdventureUpdated: (updatedAdventureId) => {
      const current = manager.getAdventure(updatedAdventureId);
      if (current) {
        snapshots.push(structuredClone(current));
      }
    },
  });

  manager.joinAdventure(
    {
      adventureId,
      playerId: "player-1",
      displayName: "Alex",
      role: "player",
    },
    "socket-player-1",
  );

  manager.updateSetup({
    adventureId,
    playerId: "player-1",
    setup: {
      characterName: "Nyra Flint",
      visualDescription: "A storm-worn investigator",
      adventurePreference: "Mystery",
    },
  });

  const pendingState = manager.getAdventure(adventureId);
  assert.ok(pendingState);
  assert.equal(
    pendingState?.characterPortraitsByName["nyra flint"]?.status,
    "pending",
  );
  assert.equal(
    pendingState?.characterPortraitsByName["nyra flint"]?.imageUrl,
    CHARACTER_PORTRAIT_PLACEHOLDER_URL,
  );

  assert.ok(resolvePortrait);
  resolvePortrait({
    characterNameKey: "nyra flint",
    characterName: "Nyra Flint",
    imageUrl: "/api/image/files/nyra-portrait.png",
    status: "ready",
  });
  await flushMicrotasks();

  const readyState = manager.getAdventure(adventureId);
  assert.ok(readyState);
  assert.equal(
    readyState?.characterPortraitsByName["nyra flint"]?.status,
    "ready",
  );
  assert.equal(
    readyState?.characterPortraitsByName["nyra flint"]?.imageUrl,
    "/api/image/files/nyra-portrait.png",
  );

  assert.equal(snapshots.length >= 2, true);
});

