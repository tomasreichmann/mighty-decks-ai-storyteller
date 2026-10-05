import assert from "node:assert/strict";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { inspectArchitecture } from "./check-architecture.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));

test("new runtime may import another owner and shared spec", () => {
  const path = "apps/server/src/campaign/runtime/Coordinator.ts";
  assert.deepEqual(inspectArchitecture(path, 'import type { X } from "../read/view"; export { y } from "@mighty-decks/spec";', root), []);
});

test("new runtime rejects source store, routes, workflow, filesystem and provider clients", () => {
  const path = "apps/server/src/campaign/runtime/Coordinator.ts";
  const source = [
    'import "../../persistence/AdventureModuleStore";',
    'export * from "../../campaign/registerCampaignRoutes";',
    'const workflow = import("../../workflow/executor");',
    'import "node:fs";',
    'import "../../ai/OpenRouterClient";',
  ].join("\n");
  assert.equal(inspectArchitecture(path, source, root).length, 6);
});

test("provider imports are limited to adapters, composition and exact legacy owners", () => {
  assert.equal(inspectArchitecture("apps/server/src/ai/useCases/new.ts", 'import "../../ai/OpenRouterClient";', root).length > 0, true);
  assert.deepEqual(inspectArchitecture("apps/server/src/index.ts", 'import "./ai/OpenRouterClient";', root), []);
  assert.deepEqual(inspectArchitecture("apps/server/src/ai/providers/openrouter.ts", 'import "../OpenRouterClient";', root), []);
});

test("baseUrl imports and re-exports cannot bypass the boundary", () => {
  const path = "apps/server/src/campaign/runtime/Coordinator.ts";
  assert.equal(inspectArchitecture(path, 'export * from "apps/server/src/persistence/CampaignStore";', root).length, 1);
  assert.equal(inspectArchitecture(path, 'const f = require("fs/promises");', root).length, 1);
});
