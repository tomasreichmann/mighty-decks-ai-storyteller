import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { OpenRouterClient } from "../src/ai/OpenRouterClient";
import { CharacterPortraitCache } from "../src/image/CharacterPortraitCache";
import {
  CharacterPortraitService,
  normalizeCharacterNameKey,
} from "../src/image/CharacterPortraitService";
import type { FalClient } from "../src/image/FalClient";
import { toCacheKey } from "../src/image/ImageNaming";
import { ImageStore } from "../src/image/ImageStore";
import type { LeonardoClient } from "../src/image/LeonardoClient";
import { CHARACTER_PORTRAIT_PLACEHOLDER_URL } from "../src/image/characterPortraitConfig";

const createTempDir = async (): Promise<string> =>
  mkdtemp(join(tmpdir(), "md-portrait-service-"));

interface ProviderStubController {
  falClient: FalClient;
  leonardoClient: LeonardoClient;
  calls: {
    listModels: number;
    generateImage: number;
  };
}

const createProviderStub = (options?: {
  generateImage?: () => Promise<{ imageUrl: string; status: string }>;
}): ProviderStubController => {
  const calls = {
    listModels: 0,
    generateImage: 0,
  };

  const base = {
    listModels: async () => {
      calls.listModels += 1;
      return [{ modelId: "fal-ai/flux/schnell", displayName: "Flux Schnell" }];
    },
    generateImage: async () => {
      calls.generateImage += 1;
      if (options?.generateImage) {
        return options.generateImage();
      }

      return {
        imageUrl: "https://example.com/portrait-generated.png",
        status: "completed",
      };
    },
  };

  return {
    falClient: base as unknown as FalClient,
    leonardoClient: base as unknown as LeonardoClient,
    calls,
  };
};

const createOpenRouterStub = (options?: {
  hasApiKey?: boolean;
  completeText?: () => Promise<string | null>;
}): OpenRouterClient =>
  ({
    hasApiKey: () => options?.hasApiKey ?? true,
    completeText: async () => {
      if (options?.completeText) {
        return options.completeText();
      }

      return "Painterly profile portrait prompt from model.";
    },
  }) as unknown as OpenRouterClient;

test("normalizeCharacterNameKey is deterministic and whitespace-insensitive", () => {
  assert.equal(
    normalizeCharacterNameKey("  Nyra   Flint "),
    normalizeCharacterNameKey("nyra flint"),
  );
  assert.equal(normalizeCharacterNameKey("Nyra Flint"), "nyra flint");
});

test("CharacterPortraitService returns cached portrait even when image generation is disabled", async (t) => {
  const rootDir = await createTempDir();
  const providers = createProviderStub();
  const originalFetch = globalThis.fetch;

  t.after(async () => {
    globalThis.fetch = originalFetch;
    await rm(rootDir, { recursive: true, force: true });
  });

  globalThis.fetch = (async () =>
    new Response(Buffer.from("portrait"), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
      },
    })) as typeof fetch;

  const imageStore = new ImageStore({
    rootDir,
    fileRouteBasePath: "/api/image/files",
  });
  await imageStore.initialize();
  const cache = new CharacterPortraitCache({
    rootDir,
    imageStore,
  });
  await cache.initialize();

  const provider = "fal" as const;
  const prompt = "Cached portrait prompt";
  const model = "fal-ai/flux/schnell";
  const resolution = { width: 512, height: 512 };
  const reservation = await imageStore.reserveBatchIndex({ provider, prompt, model });
  const stored = await imageStore.saveGeneratedImage({
    provider,
    prompt,
    model,
    promptHash: reservation.promptHash,
    modelHash: reservation.modelHash,
    groupKey: reservation.groupKey,
    cacheKey: toCacheKey(prompt, provider, model, resolution),
    batchIndex: reservation.batchIndex,
    imageIndex: 0,
    resolution,
    sourceUrl: "https://example.com/cached-portrait.png",
    imageBuffer: Buffer.from("portrait"),
    contentType: "image/png",
  });
  await cache.save({
    characterNameKey: "nyra flint",
    characterName: "Nyra Flint",
    provider,
    model,
    groupKey: stored.group.groupKey,
    imageId: stored.image.imageId,
    fileName: stored.image.fileName,
    fileUrl: stored.image.fileUrl,
  });

  const service = new CharacterPortraitService({
    falClient: providers.falClient,
    leonardoClient: providers.leonardoClient,
    imageStore,
    cache,
    openRouterClient: createOpenRouterStub(),
    disableImageGeneration: true,
  });

  const result = await service.ensurePortrait({
    characterName: "Nyra Flint",
    visualDescription: "A storm-worn investigator",
  });

  assert.equal(result.status, "ready");
  assert.equal(result.imageUrl, stored.image.fileUrl);
  assert.equal(providers.calls.generateImage, 0);
});

test("CharacterPortraitService returns disabled placeholder on cache miss when generation is disabled", async (t) => {
  const rootDir = await createTempDir();
  const providers = createProviderStub();

  t.after(async () => {
    await rm(rootDir, { recursive: true, force: true });
  });

  const imageStore = new ImageStore({
    rootDir,
    fileRouteBasePath: "/api/image/files",
  });
  await imageStore.initialize();
  const cache = new CharacterPortraitCache({
    rootDir,
    imageStore,
  });
  await cache.initialize();

  const service = new CharacterPortraitService({
    falClient: providers.falClient,
    leonardoClient: providers.leonardoClient,
    imageStore,
    cache,
    openRouterClient: createOpenRouterStub(),
    disableImageGeneration: true,
  });

  const result = await service.ensurePortrait({
    characterName: "Cass Varn",
    visualDescription: "A rogue courier",
  });

  assert.equal(result.status, "disabled");
  assert.equal(result.imageUrl, CHARACTER_PORTRAIT_PLACEHOLDER_URL);
  assert.equal(providers.calls.listModels, 0);
  assert.equal(providers.calls.generateImage, 0);
});

test("CharacterPortraitService deduplicates in-flight generation by normalized character name", async (t) => {
  const rootDir = await createTempDir();
  const providers = createProviderStub();
  const originalFetch = globalThis.fetch;

  t.after(async () => {
    globalThis.fetch = originalFetch;
    await rm(rootDir, { recursive: true, force: true });
  });

  globalThis.fetch = (async () =>
    new Response(Buffer.from("portrait"), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
      },
    })) as typeof fetch;

  const imageStore = new ImageStore({
    rootDir,
    fileRouteBasePath: "/api/image/files",
  });
  await imageStore.initialize();
  const cache = new CharacterPortraitCache({
    rootDir,
    imageStore,
  });
  await cache.initialize();

  const service = new CharacterPortraitService({
    falClient: providers.falClient,
    leonardoClient: providers.leonardoClient,
    imageStore,
    cache,
    openRouterClient: createOpenRouterStub(),
    disableImageGeneration: false,
  });

  const [first, second] = await Promise.all([
    service.ensurePortrait({
      characterName: "Nyra Flint",
      visualDescription: "A storm-worn investigator",
    }),
    service.ensurePortrait({
      characterName: "  nyra   flint ",
      visualDescription: "A storm-worn investigator",
    }),
  ]);

  assert.equal(first.status, "ready");
  assert.equal(second.status, "ready");
  assert.equal(first.imageUrl, second.imageUrl);
  assert.equal(providers.calls.generateImage, 1);
});

test("CharacterPortraitService returns failed placeholder on generation errors without internal retry", async (t) => {
  const rootDir = await createTempDir();
  const providers = createProviderStub({
    generateImage: async () => {
      throw new Error("provider failure");
    },
  });

  t.after(async () => {
    await rm(rootDir, { recursive: true, force: true });
  });

  const imageStore = new ImageStore({
    rootDir,
    fileRouteBasePath: "/api/image/files",
  });
  await imageStore.initialize();
  const cache = new CharacterPortraitCache({
    rootDir,
    imageStore,
  });
  await cache.initialize();

  const service = new CharacterPortraitService({
    falClient: providers.falClient,
    leonardoClient: providers.leonardoClient,
    imageStore,
    cache,
    openRouterClient: createOpenRouterStub(),
    disableImageGeneration: false,
  });

  const result = await service.ensurePortrait({
    characterName: "Nyra Flint",
    visualDescription: "A storm-worn investigator",
  });

  assert.equal(result.status, "failed");
  assert.equal(result.imageUrl, CHARACTER_PORTRAIT_PLACEHOLDER_URL);
  assert.equal(providers.calls.generateImage, 1);
});

