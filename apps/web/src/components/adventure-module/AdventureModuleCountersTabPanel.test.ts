import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("AdventureModuleCountersTabPanel uses a message empty state instead of a framed panel", () => {
  const source = readFileSync(
    new URL("./AdventureModuleCountersTabPanel.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /<Message[\s\S]*No counters have been created yet\./);
  assert.doesNotMatch(source, /<Panel>[\s\S]*No counters have been created yet\./);
});
