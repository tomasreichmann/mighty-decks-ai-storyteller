import assert from "node:assert/strict";
import test from "node:test";
import { getBackendWakeCopy } from "./backendReadiness";

test("getBackendWakeCopy advances through the server wake-up messages", () => {
  assert.deepEqual(getBackendWakeCopy("checking", 0), {
    title: "Loading Mighty Decks AI Storyteller…",
    detail: "Preparing the adventure table…",
    canRetry: false,
  });
  assert.deepEqual(getBackendWakeCopy("waking", 2_000), {
    title: "The Storyteller is lighting the candles…",
    detail: "The free server may need up to a minute to wake after inactivity.",
    canRetry: false,
  });
  assert.deepEqual(getBackendWakeCopy("waking", 20_000), {
    title: "Still waking…",
    detail: "Free hosting sometimes needs about a minute after hibernation.",
    canRetry: false,
  });
  assert.deepEqual(getBackendWakeCopy("waking", 60_000), {
    title: "The Storyteller is taking longer than usual",
    detail: "The server may still be waking. Try again to send a fresh request.",
    canRetry: true,
  });
});

test("getBackendWakeCopy offers retry immediately after a readiness error", () => {
  assert.deepEqual(getBackendWakeCopy("error", 100), {
    title: "The Storyteller could not be reached",
    detail: "Check your connection, then try waking the server again.",
    canRetry: true,
  });
});

test("isBackendDependentPath keeps static reference pages available", async () => {
  const { isBackendDependentPath } = await import("./backendReadiness");

  assert.equal(isBackendDependentPath("/"), false);
  assert.equal(isBackendDependentPath("/rules/outcomes"), false);
  assert.equal(isBackendDependentPath("/styleguide/loading"), false);
  assert.equal(isBackendDependentPath("/adventure/new"), true);
  assert.equal(isBackendDependentPath("/campaign/list"), true);
});
