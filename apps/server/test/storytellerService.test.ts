import assert from "node:assert/strict";
import test from "node:test";
import { defaultRuntimeConfig, type ScenePublic } from "@mighty-decks/spec/adventureState";
import type { OpenRouterClient } from "../src/ai/OpenRouterClient";
import { StorytellerService, type StorytellerModelConfig } from "../src/ai/StorytellerService";

interface TextCompletionRequest {
  model: string;
  prompt: string;
  timeoutMs: number;
  maxTokens: number;
  temperature: number;
}

interface ImageGenerationRequest {
  model: string;
  prompt: string;
  timeoutMs: number;
}

interface OpenRouterStubOverrides {
  completeText?: (request: TextCompletionRequest) => Promise<string | null>;
  generateImage?: (request: ImageGenerationRequest) => Promise<string | null>;
}

interface OpenRouterStubController {
  client: OpenRouterClient;
  calls: {
    completeText: TextCompletionRequest[];
    generateImage: ImageGenerationRequest[];
  };
}

const models: StorytellerModelConfig = {
  narrativeDirector: "deepseek/deepseek-v3.2",
  narrativeDirectorFallback: "google/gemini-2.5-flash",
  sceneController: "google/gemini-2.5-flash-lite",
  sceneControllerFallback: "google/gemini-2.5-flash",
  outcomeDecider: "google/gemini-2.5-flash-lite",
  outcomeDeciderFallback: "google/gemini-2.5-flash",
  continuityKeeper: "google/gemini-2.5-flash-lite",
  continuityKeeperFallback: "deepseek/deepseek-v3.2",
  pitchGenerator: "deepseek/deepseek-v3.2",
  pitchGeneratorFallback: "google/gemini-2.5-flash",
  imageGenerator: "black-forest-labs/flux.2-klein-4b",
};

const createOpenRouterStub = (
  overrides: OpenRouterStubOverrides = {},
): OpenRouterStubController => {
  const calls = {
    completeText: [] as TextCompletionRequest[],
    generateImage: [] as ImageGenerationRequest[],
  };

  const client = {
    hasApiKey: () => true,
    completeText: async (request: TextCompletionRequest): Promise<string | null> => {
      calls.completeText.push(request);
      if (overrides.completeText) {
        return overrides.completeText(request);
      }

      return null;
    },
    generateImage: async (request: ImageGenerationRequest): Promise<string | null> => {
      calls.generateImage.push(request);
      if (overrides.generateImage) {
        return overrides.generateImage(request);
      }

      return "https://cdn.example.com/scene.png";
    },
  } as unknown as OpenRouterClient;

  return {
    client,
    calls,
  };
};

const baseScene: ScenePublic = {
  sceneId: "scene-test-1",
  imagePending: true,
  closingImagePending: false,
  mode: "low_tension",
  tension: 48,
  introProse:
    "The air hangs heavy with silence where the Gilded Stein tavern once stood, leaving a lone keg in the empty lot.",
  orientationBullets: [
    "Goal: discover who erased the tavern.",
    "Pressure: evidence fades as dawn breaks.",
    "Exits: taste the ale, inspect the lot, question nearby witnesses.",
  ],
};
const highTensionScene: ScenePublic = {
  ...baseScene,
  mode: "high_tension",
  tension: 78,
};

const basePitchInputs = [
  {
    displayName: "Alex",
    characterName: "Nyra Flint",
    visualDescription: "A storm-chaser in patched leather with brass goggles.",
    adventurePreference: "High-pressure occult mystery.",
  },
];

test("uses loose scene controller parsing when JSON parsing fails", async () => {
  const openRouter = createOpenRouterStub({
    completeText: async () =>
      [
        "introProse: The air hangs heavy with a silence that screams absence.",
        "orientationBullets:",
        "- Goal: uncover what erased the tavern overnight.",
        "- Pressure: clues degrade every minute.",
        "- Exits: inspect tracks, sample the keg, chase a spectral witness.",
        "playerPrompt: Why does your character care about this vanished tavern, and what do you do first?",
      ].join("\n"),
  });

  const service = new StorytellerService({
    openRouterClient: openRouter.client,
    models,
  });

  const result = await service.generateSceneStart(
    {
      pitchTitle: "The Vanishing Keg",
      pitchDescription: "A city tavern disappears and leaves one full keg behind.",
      sceneNumber: 1,
      partyMembers: ["Nyra Flint"],
      transcriptTail: [],
    },
    defaultRuntimeConfig,
  );

  assert.equal(
    result.introProse,
    "The air hangs heavy with a silence that screams absence.",
  );
  assert.equal(result.introProse.includes("opens in a strained moment"), false);
  assert.equal(result.orientationBullets.length >= 2, true);
  assert.equal(
    result.orientationBullets.some((bullet) => bullet.includes("uncover what erased")),
    true,
  );
  assert.equal(
    result.playerPrompt,
    "Why does your character care about this vanished tavern, and what do you do first?",
  );
});

test("parses fenced JSON scene output that contains arrays", async () => {
  const openRouter = createOpenRouterStub({
    completeText: async () =>
      [
        "```json",
        "{",
        "  \"introProse\": \"The air thrums with residual magic as the hidden tavern flickers into view.\",",
        "  \"orientationBullets\": [",
        "    \"Locate the invisible threshold.\",",
        "    \"Find the barkeep ledger.\",",
        "    \"Calm the terrified staff.\"",
        "  ],",
        "  \"playerPrompt\": \"Each of you, state your stake in this tavern and take one immediate action.\"",
        "}",
        "```",
      ].join("\n"),
  });

  const service = new StorytellerService({
    openRouterClient: openRouter.client,
    models,
  });

  const result = await service.generateSceneStart(
    {
      pitchTitle: "The Signet in the Suds",
      pitchDescription: "A vanished tavern hides a blackmail ledger.",
      sceneNumber: 1,
      partyMembers: ["Xanxer Silverhair"],
      transcriptTail: [],
    },
    defaultRuntimeConfig,
  );

  assert.equal(
    result.introProse,
    "The air thrums with residual magic as the hidden tavern flickers into view.",
  );
  assert.equal(result.orientationBullets[0], "Locate the invisible threshold.");
  assert.equal(result.introProse.includes("opens in a strained moment"), false);
  assert.equal(
    result.playerPrompt,
    "Each of you, state your stake in this tavern and take one immediate action.",
  );
});

test("builds an intermediate visual prompt before calling image generation", async () => {
  const generatedVisualPrompt =
    "Wide cinematic fantasy shot of a rain-slick empty lot where a lone wooden keg glows faintly, ghostly tavern silhouettes reflected in puddles, dramatic backlight, moody fog, high detail environment, low camera angle, painterly realism, no text.";
  const openRouter = createOpenRouterStub({
    completeText: async () => generatedVisualPrompt,
    generateImage: async () => "https://cdn.example.com/vanishing-keg.png",
  });

  const service = new StorytellerService({
    openRouterClient: openRouter.client,
    models,
  });

  const imageUrl = await service.generateSceneImage(baseScene, defaultRuntimeConfig);

  assert.equal(imageUrl, "https://cdn.example.com/vanishing-keg.png");
  assert.equal(openRouter.calls.completeText.length, 1);
  assert.equal(openRouter.calls.generateImage.length, 1);
  assert.equal(openRouter.calls.generateImage[0]?.prompt, generatedVisualPrompt);
  assert.equal(openRouter.calls.generateImage[0]?.prompt.includes("Goal:"), false);
});

test("falls back to secondary image model when primary image request is moderated", async () => {
  const fallbackImageModel = "stability-ai/sd3.5-large";
  const openRouter = createOpenRouterStub({
    completeText: async () => "Cinematic image prompt.",
    generateImage: async (request) => {
      if (request.model === models.imageGenerator) {
        throw new Error(
          "Image request failed (400 Bad Request): {\"error\":{\"message\":\"Provider returned error\",\"metadata\":{\"raw\":\"{\\\"status\\\":\\\"Request Moderated\\\"}\"}}}",
        );
      }

      if (request.model === fallbackImageModel) {
        return "https://cdn.example.com/fallback-scene.png";
      }

      return null;
    },
  });

  const service = new StorytellerService({
    openRouterClient: openRouter.client,
    models: {
      ...models,
      imageGeneratorFallback: fallbackImageModel,
    },
  });

  const imageUrl = await service.generateSceneImage(baseScene, {
    ...defaultRuntimeConfig,
    aiRetryCount: 2,
  });

  assert.equal(imageUrl, "https://cdn.example.com/fallback-scene.png");
  assert.deepEqual(
    openRouter.calls.generateImage.map((call) => call.model),
    [models.imageGenerator, fallbackImageModel],
  );
});

test("does not retry image generation on permanent 4xx failures", async () => {
  const openRouter = createOpenRouterStub({
    completeText: async () => "Cinematic image prompt.",
    generateImage: async () => {
      throw new Error("Image request failed (404 Not Found): endpoint missing");
    },
  });

  const service = new StorytellerService({
    openRouterClient: openRouter.client,
    models,
  });

  const imageUrl = await service.generateSceneImage(
    baseScene,
    {
      ...defaultRuntimeConfig,
      aiRetryCount: 2,
    },
  );

  assert.equal(imageUrl, null);
  assert.equal(openRouter.calls.generateImage.length, 1);
});

test("supports disabling image generation via cost controls", async () => {
  const openRouter = createOpenRouterStub({
    completeText: async () => "Cinematic image prompt.",
    generateImage: async () => "https://cdn.example.com/disabled-should-not-call.png",
  });

  const service = new StorytellerService({
    openRouterClient: openRouter.client,
    models,
    costControls: {
      disableImageGeneration: true,
    },
  });

  const imageUrl = await service.generateSceneImage(baseScene, defaultRuntimeConfig);

  assert.equal(imageUrl, null);
  assert.equal(openRouter.calls.completeText.length, 0);
  assert.equal(openRouter.calls.generateImage.length, 0);
});

test("caches image generation results with TTL", async () => {
  const openRouter = createOpenRouterStub({
    completeText: async () => "Cinematic image prompt.",
    generateImage: async () => "https://cdn.example.com/cached-scene.png",
  });

  const service = new StorytellerService({
    openRouterClient: openRouter.client,
    models,
    costControls: {
      imageCacheTtlMs: 60_000,
    },
  });

  const firstUrl = await service.generateSceneImage(baseScene, defaultRuntimeConfig);
  const secondUrl = await service.generateSceneImage(baseScene, defaultRuntimeConfig);

  assert.equal(firstUrl, "https://cdn.example.com/cached-scene.png");
  assert.equal(secondUrl, "https://cdn.example.com/cached-scene.png");
  assert.equal(openRouter.calls.completeText.length, 1);
  assert.equal(openRouter.calls.generateImage.length, 1);
});

test("caches generated pitch options with TTL", async () => {
  const openRouter = createOpenRouterStub({
    completeText: async () =>
      JSON.stringify([
        {
          title: "Ash Market",
          description:
            "Memories are traded for survival and the party must stop tomorrow's disaster from being sold.",
        },
        {
          title: "Lanterns Below",
          description:
            "An underground rail delivers impossible cargo and the party must trace its source tonight.",
        },
        {
          title: "Salt Clock",
          description:
            "The tide clock fails and the party races rival crews before dawn floods the district.",
        },
      ]),
  });

  const service = new StorytellerService({
    openRouterClient: openRouter.client,
    models,
    costControls: {
      pitchCacheTtlMs: 60_000,
    },
  });

  const firstPitches = await service.generateAdventurePitches(
    basePitchInputs,
    defaultRuntimeConfig,
  );
  const secondPitches = await service.generateAdventurePitches(
    basePitchInputs,
    defaultRuntimeConfig,
  );

  assert.equal(firstPitches.length, 3);
  assert.equal(secondPitches.length, 3);
  assert.deepEqual(secondPitches, firstPitches);
  assert.equal(openRouter.calls.completeText.length, 1);
});

test("uses expanded narration budget for information requests", async () => {
  const openRouter = createOpenRouterStub({
    completeText: async () =>
      JSON.stringify({
        text: "You find etched floor marks pointing to a hidden maintenance hatch and smell lamp oil from the south wall vents.",
        closeScene: false,
      }),
  });

  const service = new StorytellerService({
    openRouterClient: openRouter.client,
    models,
  });

  await service.narrateAction(
    {
      pitchTitle: "The Vanishing Keg",
      pitchDescription: "A city tavern disappears and leaves one full keg behind.",
      actorCharacterName: "Nyra Flint",
      actionText: "I inspect the floor around the keg for hidden mechanisms.",
      turnNumber: 1,
      responseMode: "expanded",
      scene: baseScene,
      transcriptTail: [],
      rollingSummary: "The tavern vanished overnight.",
    },
    defaultRuntimeConfig,
  );

  assert.equal(openRouter.calls.completeText.length, 1);
  assert.equal(openRouter.calls.completeText[0]?.maxTokens, 1100);
});

test("accepts plain prose narration output without requiring JSON", async () => {
  const openRouter = createOpenRouterStub({
    completeText: async () =>
      "Veleslava scans the crowded stalls, tracing sigils she once saw in her family's chapel. A weathered map case bears a raven mark that might connect to her lineage.",
  });

  const service = new StorytellerService({
    openRouterClient: openRouter.client,
    models,
  });

  const result = await service.narrateAction(
    {
      pitchTitle: "Echoes in the Black Market",
      pitchDescription:
        "Veleslava navigates a hidden auction to recover clues about her family.",
      actorCharacterName: "Veleslava \"Vela\" Morozovna",
      actionText: "I want to inspect the merchandise if anything looks familiar.",
      turnNumber: 3,
      responseMode: "concise",
      detailLevel: "concise",
      outcomeCheckTriggered: false,
      allowHardDenyWithoutOutcomeCheck: false,
      hardDenyReason: "",
      scene: baseScene,
      transcriptTail: [],
      rollingSummary: "Vela is searching the market for traces of her family.",
    },
    defaultRuntimeConfig,
  );

  assert.equal(
    result.text.includes(
      "commits to the action, shifting the situation and forcing an urgent follow-up choice",
    ),
    false,
  );
  assert.equal(
    result.text.includes("weathered map case bears a raven mark"),
    true,
  );
  assert.equal(result.closeScene, false);
});

test("parses scene reaction and keeps reward tied to goal completion", async () => {
  const openRouter = createOpenRouterStub({
    completeText: async () =>
      JSON.stringify({
        goalStatus: "completed",
        reward: "You recover a ring of encrypted guard keys from the fallen captain.",
        npcBeat: "A rival scavenger rushes in after hearing the clash.",
        failForward: true,
        tensionShift: "fall",
        tensionDelta: -12,
        tensionBand: "medium",
        turnOrderRequired: false,
        closeScene: false,
      }),
  });

  const service = new StorytellerService({
    openRouterClient: openRouter.client,
    models,
  });

  const reaction = await service.resolveSceneReaction(
    {
      pitchTitle: "The Vanishing Keg",
      pitchDescription: "A city tavern disappears and leaves one full keg behind.",
      actorCharacterName: "Nyra Flint",
      actionText: "I finish off the captain and search the body.",
      actionResponseText:
        "Nyra drives the blade through a gap in the captain's armor and drops him.",
      turnNumber: 2,
      scene: baseScene,
      transcriptTail: [],
      rollingSummary: "The captain is nearly defeated.",
    },
    defaultRuntimeConfig,
  );

  assert.equal(reaction.goalStatus, "completed");
  assert.equal(
    reaction.reward,
    "You recover a ring of encrypted guard keys from the fallen captain.",
  );
  assert.equal(reaction.tensionShift, "fall");
  assert.equal(reaction.tensionBand, "medium");
  assert.equal(reaction.turnOrderRequired, false);
});

test("parses outcome decision intent and response mode from AI output", async () => {
  const openRouter = createOpenRouterStub({
    completeText: async () =>
      JSON.stringify({
        intent: "information_request",
        responseMode: "expanded",
        shouldCheck: false,
        reason: "Pure information probe with no immediate contested stakes.",
        triggers: {
          threat: false,
          uncertainty: false,
          highReward: false,
        },
      }),
  });

  const service = new StorytellerService({
    openRouterClient: openRouter.client,
    models,
  });

  const decision = await service.decideOutcomeCheckForPlayerAction(
    {
      actorCharacterName: "Nyra Flint",
      actionText: "What signs show who broke in first?",
      turnNumber: 2,
      scene: baseScene,
      transcriptTail: [],
      rollingSummary: "The crew is mapping clues in the lot.",
    },
    defaultRuntimeConfig,
  );

  assert.equal(decision.intent, "information_request");
  assert.equal(decision.detailLevel, "expanded");
  assert.equal(decision.responseMode, "expanded");
  assert.equal(decision.shouldCheck, false);
  assert.equal(
    openRouter.calls.completeText[0]?.prompt.includes("Scene mode: low_tension"),
    true,
  );
});

test("parses loose outcome decision output when JSON formatting is broken", async () => {
  const openRouter = createOpenRouterStub({
    completeText: async () =>
      [
        "intent: direct_action",
        "detailLevel: standard",
        "responseMode: concise",
        "shouldCheck: false",
        "reason: Repositioning under watchful pressure without direct contest.",
        "allowHardDenyWithoutOutcomeCheck: false",
        "hardDenyReason: ",
        "threat: false",
        "uncertainty: false",
        "highReward: false",
      ].join("\n"),
  });

  const service = new StorytellerService({
    openRouterClient: openRouter.client,
    models,
  });

  const decision = await service.decideOutcomeCheckForPlayerAction(
    {
      actorCharacterName: "Nyra Flint",
      actionText: "I reposition closer to the service stairs.",
      turnNumber: 3,
      scene: highTensionScene,
      transcriptTail: [],
      rollingSummary: "The hall is tense but no one has directly engaged Nyra.",
    },
    defaultRuntimeConfig,
  );

  assert.equal(decision.intent, "direct_action");
  assert.equal(decision.detailLevel, "standard");
  assert.equal(decision.responseMode, "concise");
  assert.equal(decision.shouldCheck, false);
});

test("retries once with parse error context when outcome decision JSON is invalid", async () => {
  let callCount = 0;
  const openRouter = createOpenRouterStub({
    completeText: async () => {
      callCount += 1;
      if (callCount === 1) {
        return "intent=information_request; shouldCheck=false; malformed";
      }

      return JSON.stringify({
        intent: "information_request",
        detailLevel: "expanded",
        responseMode: "expanded",
        shouldCheck: false,
        reason: "Player is gathering information with no immediate stakes.",
        allowHardDenyWithoutOutcomeCheck: false,
        hardDenyReason: "",
        triggers: {
          threat: false,
          uncertainty: false,
          highReward: false,
        },
      });
    },
  });

  const service = new StorytellerService({
    openRouterClient: openRouter.client,
    models,
  });

  const decision = await service.decideOutcomeCheckForPlayerAction(
    {
      actorCharacterName: "Nyra Flint",
      actionText: "I inspect the ward seams for hidden triggers.",
      turnNumber: 4,
      scene: baseScene,
      transcriptTail: [],
      rollingSummary: "Nyra is probing the scene for clues.",
    },
    defaultRuntimeConfig,
  );

  assert.equal(openRouter.calls.completeText.length, 2);
  assert.equal(
    openRouter.calls.completeText[1]?.prompt.includes("Parse error:"),
    true,
  );
  assert.equal(
    openRouter.calls.completeText[1]?.prompt.includes("Required fields:"),
    true,
  );
  assert.equal(decision.intent, "information_request");
  assert.equal(decision.detailLevel, "expanded");
  assert.equal(decision.shouldCheck, false);
});

test("does not override model no-check decisions for direct actions in high tension", async () => {
  const openRouter = createOpenRouterStub({
    completeText: async () =>
      JSON.stringify({
        intent: "direct_action",
        responseMode: "concise",
        shouldCheck: false,
        reason: "Quick move to reposition and push forward.",
        allowHardDenyWithoutOutcomeCheck: false,
        hardDenyReason: "",
        triggers: {
          threat: false,
          uncertainty: false,
          highReward: false,
        },
      }),
  });

  const service = new StorytellerService({
    openRouterClient: openRouter.client,
    models,
  });

  const decision = await service.decideOutcomeCheckForPlayerAction(
    {
      actorCharacterName: "Nyra Flint",
      actionText: "I sprint straight through the crossfire to grab the detonator.",
      turnNumber: 4,
      scene: highTensionScene,
      transcriptTail: [],
      rollingSummary: "Crossfire pins the team in a collapsing hallway.",
    },
    defaultRuntimeConfig,
  );

  assert.equal(decision.intent, "direct_action");
  assert.equal(decision.detailLevel, "standard");
  assert.equal(decision.shouldCheck, false);
  assert.equal(decision.reason, "Quick move to reposition and push forward.");
  assert.equal(decision.allowHardDenyWithoutOutcomeCheck, false);
});

test("does not force outcome checks for low-scrutiny direct actions in high tension", async () => {
  const openRouter = createOpenRouterStub({
    completeText: async () =>
      JSON.stringify({
        intent: "direct_action",
        responseMode: "concise",
        shouldCheck: false,
        reason: "Stealthy movement with no active opposition in this moment.",
        allowHardDenyWithoutOutcomeCheck: false,
        hardDenyReason: "",
        triggers: {
          threat: false,
          uncertainty: false,
          highReward: false,
        },
      }),
  });

  const service = new StorytellerService({
    openRouterClient: openRouter.client,
    models,
  });

  const decision = await service.decideOutcomeCheckForPlayerAction(
    {
      actorCharacterName: "Nyra Flint",
      actionText: "I move quietly through the servant corridor while no one is looking.",
      turnNumber: 4,
      scene: highTensionScene,
      transcriptTail: [],
      rollingSummary: "The guards are currently focused on the ballroom and have not noticed Nyra.",
    },
    defaultRuntimeConfig,
  );

  assert.equal(decision.intent, "direct_action");
  assert.equal(decision.detailLevel, "standard");
  assert.equal(decision.shouldCheck, false);
});

test("uses conservative fallback outcome behavior when outcome classifier is unavailable", async () => {
  const openRouter = createOpenRouterStub({
    completeText: async () => null,
  });

  const service = new StorytellerService({
    openRouterClient: openRouter.client,
    models,
  });

  const decision = await service.decideOutcomeCheckForPlayerAction(
    {
      actorCharacterName: "Nyra Flint",
      actionText: "I break cover and rush the unstable control console.",
      turnNumber: 3,
      scene: {
        ...highTensionScene,
        tension: 92,
      },
      transcriptTail: [],
      rollingSummary: "The chamber is collapsing and alarms are blaring.",
    },
    defaultRuntimeConfig,
  );

  assert.equal(decision.intent, "direct_action");
  assert.equal(decision.detailLevel, "standard");
  assert.equal(decision.shouldCheck, false);
  assert.equal(decision.triggers.threat, false);
  assert.equal(decision.triggers.uncertainty, false);
});

test("keeps fallback outcome checks off for low-scrutiny actions without direct threat cues", async () => {
  const openRouter = createOpenRouterStub({
    completeText: async () => null,
  });

  const service = new StorytellerService({
    openRouterClient: openRouter.client,
    models,
  });

  const decision = await service.decideOutcomeCheckForPlayerAction(
    {
      actorCharacterName: "Nyra Flint",
      actionText: "I quietly inspect the ward glyphs from the shadows.",
      turnNumber: 3,
      scene: highTensionScene,
      transcriptTail: [],
      rollingSummary: "No one has detected Nyra yet and there is no active pursuit in this beat.",
    },
    defaultRuntimeConfig,
  );

  assert.equal(decision.intent, "direct_action");
  assert.equal(decision.detailLevel, "standard");
  assert.equal(decision.shouldCheck, false);
  assert.equal(decision.triggers.threat, false);
});

test("answers metagame questions with internal context prompt", async () => {
  const openRouter = createOpenRouterStub({
    completeText: async () =>
      "Truthfully: the locked door hid a relay core chamber that stayed sealed until the ward key was disabled.",
  });

  const service = new StorytellerService({
    openRouterClient: openRouter.client,
    models,
  });

  const answer = await service.answerMetagameQuestion(
    {
      actorCharacterName: "Nyra Flint",
      questionText: "What was behind the locked door?",
      pitchTitle: "The Vanishing Keg",
      pitchDescription: "A city tavern disappears and leaves one full keg behind.",
      scene: baseScene,
      sceneDebug: {
        tension: 52,
        secrets: ["The locked door concealed a relay core chamber."],
        pacingNotes: ["Keep pressure on the flooding timeline."],
        continuityWarnings: [],
        aiRequests: [],
        recentDecisions: [],
      },
      transcriptTail: [],
      rollingSummary: "The party is uncovering why the tavern vanished.",
      activeVoteSummary: "none",
      activeOutcomeSummary: "none",
      pendingSceneClosureSummary: "none",
    },
    defaultRuntimeConfig,
  );

  assert.equal(
    answer,
    "Truthfully: the locked door hid a relay core chamber that stayed sealed until the ward key was disabled.",
  );
  assert.equal(openRouter.calls.completeText.length, 1);
  assert.equal(
    openRouter.calls.completeText[0]?.prompt.includes(
      "Internal secrets: The locked door concealed a relay core chamber.",
    ),
    true,
  );
});

test("crafts session forward hook via AI output", async () => {
  const openRouter = createOpenRouterStub({
    completeText: async () =>
      "As the district calms, a hidden signal from beneath the vanished tavern begins pulsing again, drawing the crew toward a deeper breach.",
  });

  const service = new StorytellerService({
    openRouterClient: openRouter.client,
    models,
  });

  const hook = await service.craftSessionForwardHook(
    [
      {
        entryId: "t-1",
        kind: "storyteller",
        author: "Storyteller",
        text: "The crew secures the chamber, but a buried beacon still hums.",
        createdAtIso: new Date().toISOString(),
      },
    ],
    "The team shut down the immediate threat and restored control of the chamber.",
    defaultRuntimeConfig,
  );

  assert.equal(
    hook,
    "As the district calms, a hidden signal from beneath the vanished tavern begins pulsing again, drawing the crew toward a deeper breach.",
  );
  assert.equal(openRouter.calls.completeText.length, 1);
});
