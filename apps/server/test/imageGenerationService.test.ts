import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { FalClient } from "../src/image/FalClient";
import type { LeonardoClient } from "../src/image/LeonardoClient";
import { ImageGenerationError, ImageGenerationService } from "../src/image/ImageGenerationService";
import { toCacheKey } from "../src/image/ImageNaming";
import { ImageStore } from "../src/image/ImageStore";

const createTempDir = async (): Promise<string> =>
  mkdtemp(join(tmpdir(), "md-image-service-"));

const waitForJobFinalState = async (
  service: ImageGenerationService,
  jobId: string,
): Promise<void> => {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const job = service.getJob(jobId);
    if (!job || job.status !== "running") {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 25));
  }

  throw new Error("Timed out waiting for image job completion.");
};

const createLeonardoStub = (options: {
  delayMs?: number;
} = {}): {
  client: LeonardoClient;
  calls: {
    generateImage: number;
  };
} => {
  const calls = {
    generateImage: 0,
  };

  const client = {
    listModels: async () => [],
    generateImage: async () => {
      calls.generateImage += 1;
      if (options.delayMs) {
        await new Promise((resolve) => setTimeout(resolve, options.delayMs));
      }

      return {
        imageUrl: `https://example.com/generated-${calls.generateImage}.png`,
        status: "complete",
      };
    },
  } as unknown as LeonardoClient;

  return {
    client,
    calls,
  };
};

test("ImageGenerationService returns cached-only jobs without generating new images", async (t) => {
  const rootDir = await createTempDir();
  const originalFetch = globalThis.fetch;

  t.after(async () => {
    globalThis.fetch = originalFetch;
    await rm(rootDir, { recursive: true, force: true });
  });

  globalThis.fetch = (async () =>
    new Response(Buffer.from("cached"), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
      },
    })) as typeof fetch;

  const store = new ImageStore({
    rootDir,
    fileRouteBasePath: "/api/image/files",
  });
  await store.initialize();

  const provider = "fal" as const;
  const prompt = "Cache me if you can";
  const model = "model-cache";
  const resolution = { width: 1024, height: 1024 };
  const reservation = await store.reserveBatchIndex({ provider, prompt, model });
  await store.saveGeneratedImage({
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
    sourceUrl: "https://example.com/cached.png",
    imageBuffer: Buffer.from("cached"),
    contentType: "image/png",
  });

  const providerClient = createLeonardoStub();
  const service = new ImageGenerationService({
    falClient: providerClient.client as unknown as FalClient,
    leonardoClient: providerClient.client,
    imageStore: store,
    maxActiveJobs: 4,
    rateLimitPerMinute: 10,
    downloadTimeoutMs: 5000,
  });

  const job = await service.createJob(
    {
      provider,
      prompt,
      model,
      resolution,
      useCache: true,
      amount: 1,
    },
    "127.0.0.1",
  );

  assert.equal(job.status, "completed");
  assert.equal(job.cachedCount, 1);
  assert.equal(job.generatedCount, 0);
  assert.equal(job.items[0]?.status, "cached");
  assert.equal(providerClient.calls.generateImage, 0);
});

test("ImageGenerationService generates only missing images on partial cache hits", async (t) => {
  const rootDir = await createTempDir();
  const originalFetch = globalThis.fetch;

  t.after(async () => {
    globalThis.fetch = originalFetch;
    await rm(rootDir, { recursive: true, force: true });
  });

  globalThis.fetch = (async () =>
    new Response(Buffer.from("generated"), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
      },
    })) as typeof fetch;

  const store = new ImageStore({
    rootDir,
    fileRouteBasePath: "/api/image/files",
  });
  await store.initialize();

  const provider = "fal" as const;
  const prompt = "Partial cache should fill missing";
  const model = "model-partial";
  const resolution = { width: 1024, height: 1024 };
  const cacheKey = toCacheKey(prompt, provider, model, resolution);

  const firstBatch = await store.reserveBatchIndex({ provider, prompt, model });
  await store.saveGeneratedImage({
    provider,
    prompt,
    model,
    promptHash: firstBatch.promptHash,
    modelHash: firstBatch.modelHash,
    groupKey: firstBatch.groupKey,
    cacheKey,
    batchIndex: firstBatch.batchIndex,
    imageIndex: 0,
    resolution,
    sourceUrl: "https://example.com/existing.png",
    imageBuffer: Buffer.from("existing"),
    contentType: "image/png",
  });

  const providerClient = createLeonardoStub();
  const service = new ImageGenerationService({
    falClient: providerClient.client as unknown as FalClient,
    leonardoClient: providerClient.client,
    imageStore: store,
    maxActiveJobs: 4,
    rateLimitPerMinute: 10,
    downloadTimeoutMs: 5000,
  });

  const job = await service.createJob(
    {
      provider,
      prompt,
      model,
      resolution,
      useCache: true,
      amount: 3,
    },
    "127.0.0.1",
  );
  await waitForJobFinalState(service, job.jobId);

  const finalJob = service.getJob(job.jobId);
  assert.ok(finalJob);
  assert.equal(finalJob?.cachedCount, 1);
  assert.equal(finalJob?.generatedCount, 2);
  assert.equal(finalJob?.succeededCount, 3);
  assert.equal(providerClient.calls.generateImage, 2);

  const group = store.lookupGroup(provider, prompt, model);
  assert.equal(group?.images.length, 3);
});

test("ImageGenerationService enforces active-job cap and per-minute rate limit", async (t) => {
  const rootDir = await createTempDir();
  const originalFetch = globalThis.fetch;

  t.after(async () => {
    globalThis.fetch = originalFetch;
    await rm(rootDir, { recursive: true, force: true });
  });

  globalThis.fetch = (async () =>
    new Response(Buffer.from("generated"), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
      },
    })) as typeof fetch;

  const store = new ImageStore({
    rootDir,
    fileRouteBasePath: "/api/image/files",
  });
  await store.initialize();

  const provider = "fal" as const;
  const prompt = "Guardrails";
  const model = "model-guardrails";
  const resolution = { width: 1024, height: 1024 };

  const slowProviderClient = createLeonardoStub({ delayMs: 120 });
  const cappedService = new ImageGenerationService({
    falClient: slowProviderClient.client as unknown as FalClient,
    leonardoClient: slowProviderClient.client,
    imageStore: store,
    maxActiveJobs: 1,
    rateLimitPerMinute: 10,
    downloadTimeoutMs: 5000,
  });

  const firstJob = await cappedService.createJob(
    {
      provider,
      prompt,
      model,
      resolution,
      useCache: false,
      amount: 1,
    },
    "10.0.0.1",
  );
  assert.equal(firstJob.status, "running");

  await assert.rejects(
    () =>
      cappedService.createJob(
        {
          provider,
          prompt,
          model,
          resolution,
          useCache: false,
          amount: 1,
        },
        "10.0.0.2",
      ),
    (error: unknown) =>
      error instanceof ImageGenerationError && error.statusCode === 429,
  );

  await waitForJobFinalState(cappedService, firstJob.jobId);

  const fastProviderClient = createLeonardoStub();
  const rateLimitedService = new ImageGenerationService({
    falClient: fastProviderClient.client as unknown as FalClient,
    leonardoClient: fastProviderClient.client,
    imageStore: store,
    maxActiveJobs: 4,
    rateLimitPerMinute: 1,
    downloadTimeoutMs: 5000,
  });

  const rateLimitedFirstJob = await rateLimitedService.createJob(
    {
      provider,
      prompt: "Rate one",
      model,
      resolution,
      useCache: false,
      amount: 1,
    },
    "10.0.0.3",
  );
  await waitForJobFinalState(rateLimitedService, rateLimitedFirstJob.jobId);

  await assert.rejects(
    () =>
      rateLimitedService.createJob(
        {
          provider,
          prompt: "Rate two",
          model,
          resolution,
          useCache: false,
          amount: 1,
        },
        "10.0.0.3",
      ),
    (error: unknown) =>
      error instanceof ImageGenerationError && error.statusCode === 429,
  );
});
