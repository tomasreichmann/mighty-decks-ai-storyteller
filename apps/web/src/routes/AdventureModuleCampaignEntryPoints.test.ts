import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("AdventureModuleListPage exposes create campaign entry points", () => {
  const source = readFileSync(
    new URL("./AdventureModuleListPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /createCampaign/);
  assert.match(source, /Create Campaign/);
});

test("AdventureModuleAuthoringPage exposes a create campaign action in the header", () => {
  const source = readFileSync(
    new URL("./AdventureModuleAuthoringPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /createCampaign/);
  assert.match(source, /Create Campaign/);
});
