import assert from "node:assert/strict";
import { test } from "node:test";
import { executionEventSchema } from "./aiExecution";

test("versioned events retain run and call correlation", () => {
  const event = {
    schemaVersion: 1, eventId: "event:1", sequence: 0, atIso: "2026-10-05T00:00:00.000Z",
    type: "model.requested", step: "model_call",
    correlation: { campaignId: "c1", sessionId: "s1", runId: "r1", commandId: "cmd1", modelCallId: "mc1", spanId: "span1" },
    payload: { callId: "mc1", presetId: "fastCheapProse", promptDocumentId: "prompt1" },
  };
  assert.equal(executionEventSchema.parse(event).type, "model.requested");
  assert.equal(executionEventSchema.safeParse({ ...event, schemaVersion: 2 }).success, false);
  assert.equal(executionEventSchema.safeParse({ ...event, payload: { ...event.payload, presetId: "unknown" } }).success, false);
});
