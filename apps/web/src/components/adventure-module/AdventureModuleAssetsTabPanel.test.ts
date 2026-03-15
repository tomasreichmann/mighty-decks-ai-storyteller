import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("AdventureModuleAssetsTabPanel includes asset delete affordance markup", () => {
  const source = readFileSync(
    "apps/web/src/components/adventure-module/AdventureModuleAssetsTabPanel.tsx",
    "utf8",
  );

  assert.match(source, /Delete \$\{asset\.title\}/);
});
