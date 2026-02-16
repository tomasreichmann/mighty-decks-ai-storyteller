import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { toCacheKey } from "../src/image/ImageNaming";
import { ImageStore } from "../src/image/ImageStore";

const createTempDir = async (): Promise<string> =>
  mkdtemp(join(tmpdir(), "md-image-store-"));

test("ImageStore selects next then previous active image after deletions", async () => {
  const rootDir = await createTempDir();

  try {
    const store = new ImageStore({
      rootDir,
      fileRouteBasePath: "/api/image/files",
    });
    await store.initialize();

    const provider = "fal" as const;
    const prompt = "Misty bridge at dusk";
    const model = "model-alpha";
    const resolution = { width: 1024, height: 1024 };
    const cacheKey = toCacheKey(prompt, provider, model, resolution);
    const reservation = await store.reserveBatchIndex({ provider, prompt, model });

    const savedA = await store.saveGeneratedImage({
      provider,
      prompt,
      model,
      promptHash: reservation.promptHash,
      modelHash: reservation.modelHash,
      groupKey: reservation.groupKey,
      cacheKey,
      batchIndex: reservation.batchIndex,
      imageIndex: 0,
      resolution,
      sourceUrl: "https://example.com/a.png",
      imageBuffer: Buffer.from("a"),
      contentType: "image/png",
    });
    const savedB = await store.saveGeneratedImage({
      provider,
      prompt,
      model,
      promptHash: reservation.promptHash,
      modelHash: reservation.modelHash,
      groupKey: reservation.groupKey,
      cacheKey,
      batchIndex: reservation.batchIndex,
      imageIndex: 1,
      resolution,
      sourceUrl: "https://example.com/b.png",
      imageBuffer: Buffer.from("b"),
      contentType: "image/png",
    });
    const savedC = await store.saveGeneratedImage({
      provider,
      prompt,
      model,
      promptHash: reservation.promptHash,
      modelHash: reservation.modelHash,
      groupKey: reservation.groupKey,
      cacheKey,
      batchIndex: reservation.batchIndex,
      imageIndex: 2,
      resolution,
      sourceUrl: "https://example.com/c.png",
      imageBuffer: Buffer.from("c"),
      contentType: "image/png",
    });

    const afterSetActive = await store.setActiveImage(
      reservation.groupKey,
      savedB.image.imageId,
    );
    assert.equal(afterSetActive.activeImageId, savedB.image.imageId);

    const afterDeleteB = await store.deleteImage(
      reservation.groupKey,
      savedB.image.imageId,
    );
    assert.equal(afterDeleteB.activeImageId, savedC.image.imageId);

    const afterDeleteC = await store.deleteImage(
      reservation.groupKey,
      savedC.image.imageId,
    );
    assert.equal(afterDeleteC.activeImageId, savedA.image.imageId);

    const afterDeleteA = await store.deleteImage(
      reservation.groupKey,
      savedA.image.imageId,
    );
    assert.equal(afterDeleteA.activeImageId, undefined);
    assert.equal(afterDeleteA.images.length, 0);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test("ImageStore persists groups and active image in index.json", async () => {
  const rootDir = await createTempDir();

  try {
    const provider = "fal" as const;
    const prompt = "Sunset over frozen valley";
    const model = "model-beta";
    const resolution = { width: 1280, height: 720 };
    const cacheKey = toCacheKey(prompt, provider, model, resolution);

    const firstStore = new ImageStore({
      rootDir,
      fileRouteBasePath: "/api/image/files",
    });
    await firstStore.initialize();

    const reservation = await firstStore.reserveBatchIndex({
      provider,
      prompt,
      model,
    });
    const saved = await firstStore.saveGeneratedImage({
      provider,
      prompt,
      model,
      promptHash: reservation.promptHash,
      modelHash: reservation.modelHash,
      groupKey: reservation.groupKey,
      cacheKey,
      batchIndex: reservation.batchIndex,
      imageIndex: 0,
      resolution,
      sourceUrl: "https://example.com/restart.png",
      imageBuffer: Buffer.from("restart"),
      contentType: "image/png",
    });
    await firstStore.setActiveImage(reservation.groupKey, saved.image.imageId);

    const secondStore = new ImageStore({
      rootDir,
      fileRouteBasePath: "/api/image/files",
    });
    await secondStore.initialize();

    const loadedGroup = secondStore.lookupGroup(provider, prompt, model);
    assert.ok(loadedGroup);
    assert.equal(loadedGroup?.images.length, 1);
    assert.equal(loadedGroup?.activeImageId, saved.image.imageId);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});
