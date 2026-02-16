import assert from "node:assert/strict";
import test from "node:test";
import { LeonardoClient } from "../src/image/LeonardoClient";

test("LeonardoClient lists models from platformModels response", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        custom_models: [
          {
            id: "model-a",
            name: "Model A",
            description: "Primary model",
          },
        ],
        platformModels: [
          {
            modelId: "model-b",
            title: "Model B",
          },
        ],
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )) as typeof fetch;

  const client = new LeonardoClient({
    apiKey: "test-key",
    baseUrl: "https://example.test",
    pollIntervalMs: 10,
    pollTimeoutMs: 1000,
  });

  const models = await client.listModels();
  assert.equal(models.length, 2);
  assert.equal(models.some((candidate) => candidate.modelId === "model-a"), true);
  assert.equal(models.some((candidate) => candidate.modelId === "model-b"), true);
});

test("LeonardoClient generateImage returns immediate image URL when present", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  let callCount = 0;
  globalThis.fetch = (async () => {
    callCount += 1;
    return new Response(
      JSON.stringify({
        generated_images: [{ url: "https://cdn.example.com/immediate.png" }],
        status: "COMPLETE",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }) as typeof fetch;

  const client = new LeonardoClient({
    apiKey: "test-key",
    baseUrl: "https://example.test",
    pollIntervalMs: 10,
    pollTimeoutMs: 1000,
  });

  const result = await client.generateImage({
    prompt: "Immediate",
    model: "model-1",
    resolution: {
      width: 1024,
      height: 1024,
    },
  });

  assert.equal(callCount, 1);
  assert.equal(result.imageUrl, "https://cdn.example.com/immediate.png");
});

test("LeonardoClient generateImage polls by generation id until completed", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  let callCount = 0;
  globalThis.fetch = (async () => {
    callCount += 1;
    if (callCount === 1) {
      return new Response(
        JSON.stringify({
          sdGenerationJob: {
            generationId: "gen-123",
            status: "PENDING",
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    return new Response(
      JSON.stringify({
        generations_by_pk: {
          status: "COMPLETE",
          generated_images: [
            { generated_image_url: "https://cdn.example.com/polled.png" },
          ],
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }) as typeof fetch;

  const client = new LeonardoClient({
    apiKey: "test-key",
    baseUrl: "https://example.test",
    pollIntervalMs: 10,
    pollTimeoutMs: 1000,
  });

  const result = await client.generateImage({
    prompt: "Poll",
    model: "model-2",
    resolution: {
      width: 1280,
      height: 720,
    },
  });

  assert.equal(callCount, 2);
  assert.equal(result.imageUrl, "https://cdn.example.com/polled.png");
});

test("LeonardoClient throws descriptive errors on non-2xx responses", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = (async () =>
    new Response("upstream error", {
      status: 500,
      statusText: "Internal Server Error",
    })) as typeof fetch;

  const client = new LeonardoClient({
    apiKey: "test-key",
    baseUrl: "https://example.test",
    pollIntervalMs: 10,
    pollTimeoutMs: 1000,
  });

  await assert.rejects(
    () =>
      client.generateImage({
        prompt: "Fails",
        model: "model-3",
        resolution: {
          width: 1024,
          height: 1024,
        },
      }),
    /Leonardo request failed/,
  );
});

