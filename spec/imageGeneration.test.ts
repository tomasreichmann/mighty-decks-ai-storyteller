import assert from "node:assert/strict";
import test from "node:test";
import {
  generatedImageAssetSchema,
  generatedImageGroupSchema,
  imageEditJobRequestSchema,
  imageEditJobResponseSchema,
  imageModelCapabilitySchema,
} from "./imageGeneration";

test("image edit request schema requires a source image URL", () => {
  const parsed = imageEditJobRequestSchema.safeParse({
    provider: "fal",
    prompt: "Change the sky to a stormy dusk.",
    model: "fal-ai/flux-pro/kontext",
  });

  assert.equal(parsed.success, false);
});

test("generated image metadata accepts optional edit reference image URLs", () => {
  const assetParsed = generatedImageAssetSchema.safeParse({
    provider: "fal",
    imageId: "image-1",
    groupKey: "group-1",
    promptHash: "a".repeat(64),
    modelHash: "b".repeat(64),
    cacheKey: "cache-1",
    prompt: "Swap the lantern glow to emerald green.",
    model: "fal-ai/flux-pro/kontext",
    batchIndex: 0,
    imageIndex: 0,
    width: 1024,
    height: 1024,
    fileName: "emerald-lantern.png",
    metadataFileName: "emerald-lantern.png.json",
    fileUrl: "/api/image/files/emerald-lantern.png",
    contentType: "image/png",
    referenceImageUrl: "/api/image/files/base-image.png",
    createdAtIso: "2026-04-17T10:00:00.000Z",
  });
  assert.equal(assetParsed.success, true);

  const groupParsed = generatedImageGroupSchema.safeParse({
    provider: "fal",
    groupKey: "group-1",
    prompt: "Swap the lantern glow to emerald green.",
    promptHash: "a".repeat(64),
    model: "fal-ai/flux-pro/kontext",
    modelHash: "b".repeat(64),
    referenceImageUrl: "/api/image/files/base-image.png",
    nextBatchIndex: 1,
    images: [],
  });
  assert.equal(groupParsed.success, true);
});

test("image edit job responses validate edit requests and job payloads", () => {
  const parsed = imageEditJobResponseSchema.safeParse({
    job: {
      jobId: "edit-job-1",
      createdAtIso: "2026-04-17T10:00:00.000Z",
      updatedAtIso: "2026-04-17T10:00:00.000Z",
      groupKey: "group-1",
      promptHash: "a".repeat(64),
      modelHash: "b".repeat(64),
      request: {
        provider: "fal",
        prompt: "Change the lantern glow to emerald green.",
        model: "fal-ai/flux-pro/kontext",
        sourceImageUrl: "/api/image/files/base-image.png",
        useCache: true,
        amount: 1,
      },
      status: "completed",
      totalRequested: 1,
      cachedCount: 0,
      generatedCount: 1,
      succeededCount: 1,
      failedCount: 0,
      items: [
        {
          requestIndex: 0,
          status: "succeeded",
          imageId: "image-1",
          batchIndex: 0,
          imageIndex: 0,
        },
      ],
    },
  });

  assert.equal(parsed.success, true);
});

test("image model capability schema recognizes generate and edit values", () => {
  assert.equal(imageModelCapabilitySchema.parse("generate"), "generate");
  assert.equal(imageModelCapabilitySchema.parse("edit"), "edit");
});
