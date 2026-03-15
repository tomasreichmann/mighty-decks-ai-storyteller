import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("AdventureModuleAssetsTabPanel includes reauthor-required copy for legacy assets", () => {
  const source = readFileSync(
    "apps/web/src/components/adventure-module/AdventureModuleAssetsTabPanel.tsx",
    "utf8",
  );

  assert.match(source, /reauthor required/i);
});
