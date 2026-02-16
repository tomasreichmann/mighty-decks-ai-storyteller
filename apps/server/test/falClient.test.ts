import assert from "node:assert/strict";
import test from "node:test";
import { FalClient } from "../src/image/FalClient";

test("FalClient lists active text-to-image models", async (t) => {
  const originalFetch = globalThis.fetch;
  const requestedUrls: string[] = [];

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = (async (input) => {
    requestedUrls.push(String(input));
    return new Response(
      JSON.stringify([
        {
          endpoint_id: "fal-ai/flux/dev",
          metadata: {
            display_name: "FLUX Dev",
            description: "Fast text-to-image model",
          },
        },
      ]),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }) as typeof fetch;

  const client = new FalClient({
    apiKey: "fal-test-key",
    apiBaseUrl: "https://api.fal.test/v1",
    queueBaseUrl: "https://queue.fal.test",
    pollIntervalMs: 10,
    pollTimeoutMs: 1000,
  });

  const models = await client.listModels();
  assert.equal(models.length, 1);
  assert.equal(models[0]?.modelId, "fal-ai/flux/dev");
  assert.equal(models[0]?.displayName, "FLUX Dev");
  assert.equal(
    requestedUrls.some((url) => url.includes("limit=100")),
    true,
  );
});

test("FalClient generateImage returns immediate image URL when submit responds with images", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  let callCount = 0;
  globalThis.fetch = (async () => {
    callCount += 1;
    return new Response(
      JSON.stringify({
        status: "COMPLETED",
        images: [{ url: "https://cdn.example.com/fal-immediate.png" }],
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }) as typeof fetch;

  const client = new FalClient({
    apiKey: "fal-test-key",
    apiBaseUrl: "https://api.fal.test/v1",
    queueBaseUrl: "https://queue.fal.test",
    pollIntervalMs: 10,
    pollTimeoutMs: 1000,
  });

  const result = await client.generateImage({
    prompt: "castle on a hill",
    model: "fal-ai/flux/dev",
    resolution: {
      width: 1024,
      height: 1024,
    },
  });

  assert.equal(callCount, 1);
  assert.equal(result.imageUrl, "https://cdn.example.com/fal-immediate.png");
});

test("FalClient generateImage polls queue status and loads result", async (t) => {
  const originalFetch = globalThis.fetch;
  const calledUrls: string[] = [];

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  let callCount = 0;
  globalThis.fetch = (async (input) => {
    calledUrls.push(String(input));
    callCount += 1;
    if (callCount === 1) {
      return new Response(
        JSON.stringify({
          request_id: "req-123",
          status: "IN_PROGRESS",
          status_url: "https://queue.fal.test/fal-ai/flux-1/requests/req-123/status",
          response_url: "https://queue.fal.test/fal-ai/flux-1/requests/req-123",
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    if (callCount === 2) {
      return new Response(
        JSON.stringify({
          status: "COMPLETED",
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
        images: [{ url: "https://cdn.example.com/fal-polled.png" }],
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }) as typeof fetch;

  const client = new FalClient({
    apiKey: "fal-test-key",
    apiBaseUrl: "https://api.fal.test/v1",
    queueBaseUrl: "https://queue.fal.test",
    pollIntervalMs: 10,
    pollTimeoutMs: 1000,
  });

  const result = await client.generateImage({
    prompt: "desert city",
    model: "fal-ai/flux/dev",
    resolution: {
      width: 1536,
      height: 1024,
    },
  });

  assert.equal(callCount, 3);
  assert.equal(result.imageUrl, "https://cdn.example.com/fal-polled.png");
  assert.equal(
    calledUrls.includes(
      "https://queue.fal.test/fal-ai/flux-1/requests/req-123/status",
    ),
    true,
  );
  assert.equal(
    calledUrls.includes("https://queue.fal.test/fal-ai/flux-1/requests/req-123"),
    true,
  );
});

test("FalClient throws descriptive errors on non-2xx responses", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = (async () =>
    new Response("bad request", {
      status: 400,
      statusText: "Bad Request",
    })) as typeof fetch;

  const client = new FalClient({
    apiKey: "fal-test-key",
    apiBaseUrl: "https://api.fal.test/v1",
    queueBaseUrl: "https://queue.fal.test",
    pollIntervalMs: 10,
    pollTimeoutMs: 1000,
  });

  await assert.rejects(
    () =>
      client.generateImage({
        prompt: "failure case",
        model: "fal-ai/flux/dev",
        resolution: {
          width: 1024,
          height: 1024,
        },
      }),
    /fal\.ai request failed/,
  );
});
