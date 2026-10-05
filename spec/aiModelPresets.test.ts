import assert from "node:assert/strict";
import { test } from "node:test";
import { modelPresetIdSchema, modelPresetSchema } from "./aiModelPresets";

test("four fixed IDs and resolved settings validate", () => {
  assert.equal(modelPresetIdSchema.options.length, 4);
  const preset = { id: "fastOrchestrator", configVersion: "1", provider: "openrouter", model: "example/model",
    settings: { temperature: 0, maxOutputTokens: 100, timeoutMs: 1000, retryCount: 0, inputTokenBudget: 2000 } };
  assert.equal(modelPresetSchema.safeParse(preset).success, true);
  assert.equal(modelPresetSchema.safeParse({ ...preset, settings: { ...preset.settings, timeoutMs: 0 } }).success, false);
});
