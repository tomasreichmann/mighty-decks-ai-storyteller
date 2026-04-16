import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("AdventureModuleAssetsTabPanel includes asset delete affordance markup", () => {
  const source = readFileSync(
    new URL("./AdventureModuleAssetsTabPanel.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /Delete \$\{asset\.title\}/);
  assert.match(source, /ShortcodeField/);
  assert.doesNotMatch(source, /Copy Shortcode/);
});
