import assert from "node:assert/strict";
import { mkdtemp, rm, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import { toCacheKey } from "../src/image/ImageNaming";
import { CharacterPortraitCache } from "../src/image/CharacterPortraitCache";
import { ImageStore } from "../src/image/ImageStore";

const createTempDir = async (): Promise<string> =>
  mkdtemp(join(tmpdir(), "md-portrait-cache-"));

test("CharacterPortraitCache persists aliases and restores them after restart", async (t) => {
  const rootDir = await createTempDir();
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

  const provider = "fal" as const;
  const prompt = "Portrait prompt";
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
    sourceUrl: "https://example.com/portrait.png",
    imageBuffer: Buffer.from("portrait"),
    contentType: "image/png",
  });

  const cache = new CharacterPortraitCache({
    rootDir,
    imageStore,
  });
  await cache.initialize();

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

  const restoredCache = new CharacterPortraitCache({
    rootDir,
    imageStore,
  });
  await restoredCache.initialize();

  const restored = await restoredCache.getByCharacterNameKey("nyra flint");
  assert.ok(restored);
  assert.equal(restored?.characterName, "Nyra Flint");
  assert.equal(restored?.imageId, stored.image.imageId);
});

test("CharacterPortraitCache self-heals aliases when backing files are missing", async (t) => {
  const rootDir = await createTempDir();
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

  const provider = "fal" as const;
  const prompt = "Portrait prompt";
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
    sourceUrl: "https://example.com/portrait.png",
    imageBuffer: Buffer.from("portrait"),
    contentType: "image/png",
  });

  const cache = new CharacterPortraitCache({
    rootDir,
    imageStore,
  });
  await cache.initialize();

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

  await unlink(resolve(rootDir, stored.image.fileName));
  const resolved = await cache.getByCharacterNameKey("nyra flint");
  assert.equal(resolved, null);
});

