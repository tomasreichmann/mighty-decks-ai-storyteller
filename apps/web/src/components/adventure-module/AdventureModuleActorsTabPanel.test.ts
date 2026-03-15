import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("AdventureModuleActorsTabPanel includes actor delete affordance markup", () => {
  const source = readFileSync(
    "apps/web/src/components/adventure-module/AdventureModuleActorsTabPanel.tsx",
    "utf8",
  );

  assert.match(source, /Delete \$\{actor\.title\}/);
});
