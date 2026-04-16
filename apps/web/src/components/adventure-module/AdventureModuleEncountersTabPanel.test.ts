import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("AdventureModuleEncountersTabPanel exposes encounter delete affordance and canonical embed copy", () => {
  const source = readFileSync(
    new URL("./AdventureModuleEncountersTabPanel.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /Delete \$\{encounter\.title\}/);
  assert.match(source, /<EncounterCardView encounter=\{encounter\} \/>/);
  assert.match(source, /shortcode=\{\`@encounter\/\$\{encounter\.encounterSlug\}\`\}/);
  assert.match(source, /ShortcodeField/);
  assert.doesNotMatch(source, /Copy Shortcode/);
});
