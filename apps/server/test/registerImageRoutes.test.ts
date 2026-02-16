import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import Fastify from "fastify";
import type { FalClient } from "../src/image/FalClient";
import type { LeonardoClient } from "../src/image/LeonardoClient";
import { ImageGenerationService } from "../src/image/ImageGenerationService";
import { toCacheKey } from "../src/image/ImageNaming";
import { ImageStore } from "../src/image/ImageStore";
import { registerImageRoutes } from "../src/image/registerImageRoutes";

const createTempDir = async (): Promise<string> =>
  mkdtemp(join(tmpdir(), "md-image-routes-"));

const waitForJob = async (
  app: ReturnType<typeof Fastify>,
  jobId: string,
): Promise<void> => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const response = await app.inject({
      method: "GET",
      url: `/api/image/jobs/${jobId}`,
    });
    const payload = response.json() as {
      job?: { status?: string };
    };
    if (payload.job?.status && payload.job.status !== "running") {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }

  throw new Error("Timed out waiting for route job completion.");
};

test("registerImageRoutes serves image files and rejects unsafe file names", async (t) => {
  const rootDir = await createTempDir();
  const app = Fastify();

  t.after(async () => {
    await app.close();
    await rm(rootDir, { recursive: true, force: true });
  });

  const store = new ImageStore({
    rootDir,
    fileRouteBasePath: "/api/image/files",
  });
  await store.initialize();

  const provider = "fal" as const;
  const prompt = "Route storage";
  const model = "model-route";
  const resolution = { width: 1024, height: 1024 };
  const reservation = await store.reserveBatchIndex({ provider, prompt, model });
  const saved = await store.saveGeneratedImage({
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
    sourceUrl: "https://example.com/route.png",
    imageBuffer: Buffer.from("route-image"),
    contentType: "image/png",
  });

  const providerStub = {
    listModels: async () => [],
    generateImage: async () => ({
      imageUrl: "https://example.com/generated.png",
      status: "complete",
    }),
  } as unknown as LeonardoClient;

  const service = new ImageGenerationService({
    falClient: providerStub as unknown as FalClient,
    leonardoClient: providerStub,
    imageStore: store,
    maxActiveJobs: 4,
    rateLimitPerMinute: 10,
    downloadTimeoutMs: 5000,
  });
  registerImageRoutes(app, service);

  const validResponse = await app.inject({
    method: "GET",
    url: `/api/image/files/${saved.image.fileName}`,
  });
  assert.equal(validResponse.statusCode, 200);
  assert.equal(validResponse.headers["content-type"], "image/png");

  const unsafeResponse = await app.inject({
    method: "GET",
    url: "/api/image/files/not%20safe.png",
  });
  assert.equal(unsafeResponse.statusCode, 400);
});

test("registerImageRoutes validates payloads and exposes job lifecycle", async (t) => {
  const rootDir = await createTempDir();
  const app = Fastify();
  const originalFetch = globalThis.fetch;

  t.after(async () => {
    globalThis.fetch = originalFetch;
    await app.close();
    await rm(rootDir, { recursive: true, force: true });
  });

  globalThis.fetch = (async () =>
    new Response(Buffer.from("route-generated"), {
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

  const falStub = {
    listModels: async () => [{ modelId: "fal-1", displayName: "Fal Model" }],
    generateImage: async () => ({
      imageUrl: "https://example.com/generated-from-route.png",
      status: "complete",
    }),
  } as unknown as FalClient;
  const leonardoStub = {
    listModels: async () => [{ modelId: "leo-1", displayName: "Leonardo Model" }],
    generateImage: async () => ({
      imageUrl: "https://example.com/generated-from-route.png",
      status: "complete",
    }),
  } as unknown as LeonardoClient;

  const service = new ImageGenerationService({
    falClient: falStub,
    leonardoClient: leonardoStub,
    imageStore: store,
    maxActiveJobs: 4,
    rateLimitPerMinute: 10,
    downloadTimeoutMs: 5000,
  });
  registerImageRoutes(app, service);

  const falModelsResponse = await app.inject({
    method: "GET",
    url: "/api/image/models?provider=fal",
  });
  assert.equal(falModelsResponse.statusCode, 200);
  const falModelsPayload = falModelsResponse.json() as {
    models: Array<{ modelId: string }>;
  };
  assert.equal(falModelsPayload.models[0]?.modelId, "fal-1");

  const leonardoModelsResponse = await app.inject({
    method: "GET",
    url: "/api/image/models?provider=leonardo",
  });
  assert.equal(leonardoModelsResponse.statusCode, 200);
  const leonardoModelsPayload = leonardoModelsResponse.json() as {
    models: Array<{ modelId: string }>;
  };
  assert.equal(leonardoModelsPayload.models[0]?.modelId, "leo-1");

  const invalidJobResponse = await app.inject({
    method: "POST",
    url: "/api/image/jobs",
    payload: {
      prompt: "",
      model: "",
    },
  });
  assert.equal(invalidJobResponse.statusCode, 400);

  const createResponse = await app.inject({
    method: "POST",
    url: "/api/image/jobs",
    payload: {
      provider: "fal",
      prompt: "Route lifecycle",
      model: "m-1",
      resolution: {
        width: 1024,
        height: 1024,
      },
      useCache: false,
      amount: 1,
    },
  });
  assert.equal(createResponse.statusCode, 201);
  const created = createResponse.json() as {
    job: { jobId: string; status: string };
  };
  assert.equal(Boolean(created.job.jobId), true);

  await waitForJob(app, created.job.jobId);
  const finalResponse = await app.inject({
    method: "GET",
    url: `/api/image/jobs/${created.job.jobId}`,
  });
  const finalPayload = finalResponse.json() as {
    job: { status: string; succeededCount: number };
  };
  assert.equal(finalPayload.job.status, "completed");
  assert.equal(finalPayload.job.succeededCount, 1);
});
