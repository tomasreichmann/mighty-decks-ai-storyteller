import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("AdventureModuleAuthoringPage places Assets tab after Counters", () => {
  const source = readFileSync(
    "apps/web/src/routes/AdventureModuleAuthoringPage.tsx",
    "utf8",
  );

  assert.match(source, /"actors"[\s\S]*"counters"[\s\S]*"assets"[\s\S]*"locations"/);
});
