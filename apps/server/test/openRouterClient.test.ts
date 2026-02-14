import assert from "node:assert/strict";
import test from "node:test";
import { OpenRouterClient } from "../src/ai/OpenRouterClient";

test("generateImage uses chat/completions and extracts image URL from message images", async (t) => {
  const originalFetch = globalThis.fetch;
  const urls: string[] = [];
  const requestBodies: unknown[] = [];

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    urls.push(typeof input === "string" ? input : input.toString());
    requestBodies.push(init?.body ? JSON.parse(String(init.body)) : null);

    return new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              images: [
                {
                  image_url: {
                    url: "https://cdn.example.com/generated-image.png",
                  },
                },
              ],
            },
          },
        ],
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }) as typeof fetch;

  const client = new OpenRouterClient({
    apiKey: "test-api-key",
  });

  const result = await client.generateImage({
    model: "black-forest-labs/flux.2-klein-4b",
    prompt: "A misty tavern lot at dusk.",
    timeoutMs: 1000,
  });

  assert.equal(result, "https://cdn.example.com/generated-image.png");
  assert.equal(urls.length, 1);
  assert.equal(urls[0]?.endsWith("/chat/completions"), true);
  assert.deepEqual((requestBodies[0] as { modalities?: string[] }).modalities, ["image"]);
  assert.equal((requestBodies[0] as { image_config?: { aspect_ratio?: string } }).image_config?.aspect_ratio, "16:9");
});

test("generateImage falls back to image+text modalities when provider rejects image-only", async (t) => {
  const originalFetch = globalThis.fetch;
  const requestBodies: unknown[] = [];
  let callCount = 0;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    callCount += 1;
    requestBodies.push(init?.body ? JSON.parse(String(init.body)) : null);

    if (callCount === 1) {
      return new Response(
        JSON.stringify({
          error: {
            message: "No endpoints found that support the requested output modalities: image",
            code: 404,
          },
        }),
        {
          status: 404,
          statusText: "Not Found",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    return new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              images: [
                {
                  image_url: {
                    url: "https://cdn.example.com/fallback-image.png",
                  },
                },
              ],
            },
          },
        ],
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }) as typeof fetch;

  const client = new OpenRouterClient({
    apiKey: "test-api-key",
  });

  const result = await client.generateImage({
    model: "some-image-model",
    prompt: "An atmospheric alleyway at night.",
    timeoutMs: 1000,
  });

  assert.equal(result, "https://cdn.example.com/fallback-image.png");
  assert.equal(callCount, 2);
  assert.deepEqual((requestBodies[0] as { modalities?: string[] }).modalities, ["image"]);
  assert.deepEqual((requestBodies[1] as { modalities?: string[] }).modalities, ["image", "text"]);
  assert.equal((requestBodies[0] as { image_config?: { aspect_ratio?: string } }).image_config?.aspect_ratio, "16:9");
  assert.equal((requestBodies[1] as { image_config?: { aspect_ratio?: string } }).image_config?.aspect_ratio, "16:9");
});

test("completeTextWithMetadata captures usage and cost fields", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = (async (): Promise<Response> =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              content: "Narration output.",
            },
          },
        ],
        usage: {
          prompt_tokens: 321,
          completion_tokens: 89,
          total_tokens: 410,
          cost: 0.0023,
          prompt_tokens_details: {
            cached_tokens: 120,
          },
          completion_tokens_details: {
            reasoning_tokens: 11,
          },
          upstream_inference_cost: 0.0019,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )) as typeof fetch;

  const client = new OpenRouterClient({
    apiKey: "test-api-key",
  });

  const result = await client.completeTextWithMetadata({
    model: "google/gemini-2.5-flash-lite",
    prompt: "Prompt",
    timeoutMs: 1000,
    maxTokens: 400,
    temperature: 0.4,
  });

  assert.equal(result?.text, "Narration output.");
  assert.equal(result?.usage?.promptTokens, 321);
  assert.equal(result?.usage?.completionTokens, 89);
  assert.equal(result?.usage?.totalTokens, 410);
  assert.equal(result?.usage?.cachedTokens, 120);
  assert.equal(result?.usage?.reasoningTokens, 11);
  assert.equal(result?.usage?.costCredits, 0.0023);
  assert.equal(result?.usage?.upstreamInferenceCostCredits, 0.0019);
});

test("generateImageWithMetadata captures usage and cost fields", async (t) => {
  const originalFetch = globalThis.fetch;

  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  globalThis.fetch = (async (): Promise<Response> =>
    new Response(
      JSON.stringify({
        choices: [
          {
            message: {
              images: [
                {
                  image_url: {
                    url: "https://cdn.example.com/usage-image.png",
                  },
                },
              ],
            },
          },
        ],
        usage: {
          input_tokens: 140,
          output_tokens: 1,
          total_tokens: 141,
          total_cost: 0.0175,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )) as typeof fetch;

  const client = new OpenRouterClient({
    apiKey: "test-api-key",
  });

  const result = await client.generateImageWithMetadata({
    model: "black-forest-labs/flux.2-klein-4b",
    prompt: "Prompt",
    timeoutMs: 1000,
  });

  assert.equal(result?.imageUrl, "https://cdn.example.com/usage-image.png");
  assert.equal(result?.usage?.promptTokens, 140);
  assert.equal(result?.usage?.completionTokens, 1);
  assert.equal(result?.usage?.totalTokens, 141);
  assert.equal(result?.usage?.costCredits, 0.0175);
});
