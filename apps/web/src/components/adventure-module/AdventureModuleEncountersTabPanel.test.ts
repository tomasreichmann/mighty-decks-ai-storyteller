import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("AdventureModuleEncountersTabPanel exposes encounter delete affordance and canonical embed copy", () => {
  const source = readFileSync(
    "apps/web/src/components/adventure-module/AdventureModuleEncountersTabPanel.tsx",
    "utf8",
  );

  assert.match(source, /Delete \$\{encounter\.title\}/);
  assert.match(source, /<EncounterCardView encounter=\{encounter\} \/>/);
  assert.match(source, /@encounter\/\$\{encounterSlug\}/);
  assert.match(source, /Copy Shortcode/);
});
