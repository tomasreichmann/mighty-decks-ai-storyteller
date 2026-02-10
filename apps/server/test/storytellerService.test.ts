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
  introProse:
    "The air hangs heavy with silence where the Gilded Stein tavern once stood, leaving a lone keg in the empty lot.",
  orientationBullets: [
    "Goal: discover who erased the tavern.",
    "Pressure: evidence fades as dawn breaks.",
    "Exits: taste the ale, inspect the lot, question nearby witnesses.",
  ],
};

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
