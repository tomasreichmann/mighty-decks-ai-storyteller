import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";
import {
  defaultAiCostMetrics,
  defaultLatencyMetrics,
  defaultRuntimeConfig,
  type AdventureState,
} from "@mighty-decks/spec/adventureState";
import { AdventureDiagnosticsLogger } from "../src/diagnostics/AdventureDiagnosticsLogger";

const createAdventure = (adventureId: string): AdventureState => ({
  adventureId,
  phase: "lobby",
  roster: [],
  transcript: [],
  runtimeConfig: defaultRuntimeConfig,
  latencyMetrics: {
    ...defaultLatencyMetrics,
    updatedAtIso: new Date().toISOString(),
  },
  aiCostMetrics: {
    ...defaultAiCostMetrics,
    updatedAtIso: new Date().toISOString(),
  },
  debugMode: true,
  closed: false,
});

test("writes per-adventure diagnostic events to a session file", () => {
  const tempRoot = mkdtempSync(join(tmpdir(), "mighty-decks-debug-"));
  const logger = new AdventureDiagnosticsLogger({
    enabled: true,
    logDir: tempRoot,
  });

  const adventure = createAdventure("adv-debug-file");
  logger.logEvent(adventure, {
    type: "session_started",
    runtimeConfig: adventure.runtimeConfig,
  });
  logger.logEvent(adventure, {
    type: "phase_changed",
    phase: "vote",
  });

  const files = readdirSync(resolve(tempRoot));
  assert.equal(files.length, 1);
  const logPath = resolve(tempRoot, files[0] ?? "");
  const lines = readFileSync(logPath, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  assert.equal(lines.some((line) => line.includes("\"session_file_opened\"")), true);
  assert.equal(lines.some((line) => line.includes("\"session_started\"")), true);
  assert.equal(lines.some((line) => line.includes("\"phase_changed\"")), true);
  assert.equal(lines.some((line) => line.includes("\"adventureId\":\"adv-debug-file\"")), true);
});

test("redacts image base64 payloads from diagnostic file logs", () => {
  const tempRoot = mkdtempSync(join(tmpdir(), "mighty-decks-debug-"));
  const logger = new AdventureDiagnosticsLogger({
    enabled: true,
    logDir: tempRoot,
  });

  const adventure = createAdventure("adv-redaction");
  const base64Response = "data:image/png;base64,AAAABBBBCCCCDDDD";
  logger.logEvent(adventure, {
    type: "ai_request",
    request: {
      requestId: "req-image-1",
      createdAtIso: new Date().toISOString(),
      agent: "image_generator",
      kind: "image",
      model: "black-forest-labs/flux.2-klein-4b",
      timeoutMs: 180000,
      attempt: 1,
      fallback: false,
      status: "succeeded",
      response: base64Response,
    },
  });
  logger.logEvent(adventure, {
    type: "transcript_append",
    entry: {
      entryId: "t-image-1",
      kind: "system",
      author: "AI Debug",
      text: `[AI SUCCEEDED] image_generator image attempt 1\n\nResponse:\n${base64Response}`,
      createdAtIso: new Date().toISOString(),
    },
  });

  const files = readdirSync(resolve(tempRoot));
  assert.equal(files.length, 1);
  const logPath = resolve(tempRoot, files[0] ?? "");
  const contents = readFileSync(logPath, "utf8");

  assert.equal(contents.includes("data:image/png;base64"), false);
  assert.equal(contents.includes("[omitted data:image base64 payload"), true);
});
