import assert from "node:assert/strict";
import test from "node:test";
import { ClaudeCliClient } from "../src/ai/ClaudeCliClient";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeClient(maxConcurrent = 2, textCallTimeoutMs = 5000) {
  return new ClaudeCliClient({
    model: "claude-opus-4",
    maxConcurrent,
    textCallTimeoutMs,
  });
}

/**
 * Replace the private execCliWithStdin method on a client instance with a
 * factory-based mock. TypeScript `private` is compile-time only; bracket
 * access allows test injection without exposing a public seam.
 */
function mockExecCliWithStdin(
  client: ClaudeCliClient,
  impl: (args: string[], stdinData: string | null, timeoutMs: number) => Promise<string>,
) {
  (client as unknown as Record<string, unknown>)["execCliWithStdin"] = impl;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test("probe returns false and logs warning when spawn emits ENOENT", async () => {
  const client = makeClient();

  // Override execCliWithStdin so --version throws an ENOENT-style error
  mockExecCliWithStdin(client, async () => {
    const err = new Error("spawn claude ENOENT");
    (err as NodeJS.ErrnoException).code = "ENOENT";
    throw err;
  });

  const warnings: string[] = [];
  const logger = {
    warn: (msg: string) => warnings.push(msg),
    info: (_msg: string) => undefined,
  };

  const result = await client.probe(logger);

  assert.equal(result, false, "probe() should return false");
  assert.equal(client.isAvailable(), false, "isAvailable() should be false after failed probe");
  assert.equal(warnings.length, 1, "one warning should have been logged");
  assert.ok(
    warnings[0]?.includes("Claude CLI not found"),
    "warning should mention CLI unavailability",
  );
});

test("completeText returns null without invoking exec when client is unavailable", async () => {
  const client = makeClient();

  let execCalled = false;
  mockExecCliWithStdin(client, async () => {
    execCalled = true;
    return "should not reach here";
  });

  // Do not call probe — available defaults to false
  const result = await client.completeText({
    model: "claude-opus-4",
    prompt: "Hello?",
    timeoutMs: 1000,
    maxTokens: 100,
    temperature: 0.7,
  });

  assert.equal(result, null, "should return null when unavailable");
  assert.equal(execCalled, false, "exec should not have been called");
});

test("completeText returns trimmed text and undefined usage on successful run", async () => {
  const client = makeClient();

  // Mark the client as available by running a successful probe
  mockExecCliWithStdin(client, async (args) => {
    if (args.includes("--version")) {
      return "claude 1.0.0";
    }
    return "  Hello world  ";
  });

  await client.probe();

  const result = await client.completeTextWithMetadata({
    model: "claude-opus-4",
    prompt: "Say hello",
    timeoutMs: 2000,
    maxTokens: 50,
    temperature: 0.5,
  });

  assert.ok(result !== null, "result should not be null");
  assert.equal(result.text, "Hello world", "text should be trimmed");
  assert.equal(result.usage, undefined, "usage should be undefined for CLI backend");
});

test("completeText throws AbortError on timeout", async () => {
  const client = makeClient();

  // Probe succeeds
  mockExecCliWithStdin(client, async (args) => {
    if (args.includes("--version")) {
      return "claude 1.0.0";
    }
    // Simulate timeout: never resolve
    const abortErr = new Error("Claude CLI timed out after 50ms");
    abortErr.name = "AbortError";
    throw abortErr;
  });

  await client.probe();

  await assert.rejects(
    () =>
      client.completeTextWithMetadata({
        model: "claude-opus-4",
        prompt: "Take forever",
        timeoutMs: 50,
        maxTokens: 100,
        temperature: 0.7,
      }),
    (err: unknown) => {
      assert.ok(err instanceof Error, "error should be an Error");
      assert.equal((err as Error).name, "AbortError", "error name should be AbortError");
      return true;
    },
  );
});

test("completeText returns null when stdout exceeds 2 MB buffer limit", async () => {
  const client = makeClient();

  // Probe succeeds
  mockExecCliWithStdin(client, async (args) => {
    if (args.includes("--version")) {
      return "claude 1.0.0";
    }
    throw new Error("Claude CLI stdout exceeded max buffer size");
  });

  await client.probe();

  const result = await client.completeTextWithMetadata({
    model: "claude-opus-4",
    prompt: "Generate a lot",
    timeoutMs: 5000,
    maxTokens: 99999,
    temperature: 0.7,
  });

  assert.equal(result, null, "should swallow maxBuffer overflow and return null");
});

test("completeText returns null when process exits with non-zero code", async () => {
  const client = makeClient();

  mockExecCliWithStdin(client, async (args) => {
    if (args.includes("--version")) {
      return "claude 1.0.0";
    }
    throw new Error("Claude CLI exited with code 1: authentication required");
  });

  await client.probe();

  const result = await client.completeTextWithMetadata({
    model: "claude-opus-4",
    prompt: "Trigger error",
    timeoutMs: 2000,
    maxTokens: 100,
    temperature: 0.7,
  });

  assert.equal(result, null, "non-zero exit should return null, not rethrow");
});

test("semaphore at maxConcurrent=1 queues second call until first resolves", async () => {
  const client = makeClient(1);

  // Track call ordering
  const order: string[] = [];

  // Capture the resolve function for the first in-flight call so we can
  // release it manually.
  let releaseFirstCall!: (value: string) => void;

  let callIndex = 0;
  mockExecCliWithStdin(client, async (args) => {
    if (args.includes("--version")) {
      return "claude 1.0.0";
    }

    callIndex++;
    const thisCall = callIndex;

    if (thisCall === 1) {
      order.push("first-started");
      return new Promise<string>((resolve) => {
        releaseFirstCall = resolve;
      });
    }

    order.push("second-started");
    return "second response";
  });

  await client.probe();

  // Start both calls concurrently
  const first = client.completeTextWithMetadata({
    model: "claude-opus-4",
    prompt: "First",
    timeoutMs: 5000,
    maxTokens: 100,
    temperature: 0.7,
  });

  // Yield to let the first call enter execCliWithStdin
  await new Promise<void>((resolve) => setImmediate(resolve));

  const second = client.completeTextWithMetadata({
    model: "claude-opus-4",
    prompt: "Second",
    timeoutMs: 5000,
    maxTokens: 100,
    temperature: 0.7,
  });

  // Second call should be queued — not started yet
  assert.deepEqual(order, ["first-started"], "only first call should have started");

  // Release the first call
  releaseFirstCall("first response");

  const [firstResult, secondResult] = await Promise.all([first, second]);

  assert.ok(firstResult !== null, "first call should resolve");
  assert.ok(secondResult !== null, "second call should resolve");
  assert.equal(firstResult.text, "first response");
  assert.equal(secondResult.text, "second response");

  // Both calls must have started (second was held in queue until first finished)
  assert.ok(order.includes("second-started"), "second call should eventually start");
});
