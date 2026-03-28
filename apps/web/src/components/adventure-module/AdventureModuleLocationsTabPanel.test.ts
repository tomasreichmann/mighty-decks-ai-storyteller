import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("AdventureModuleLocationsTabPanel exposes location delete affordance and shortcode", () => {
  const source = readFileSync(
    "apps/web/src/components/adventure-module/AdventureModuleLocationsTabPanel.tsx",
    "utf8",
  );

  assert.match(source, /Delete \$\{location\.title\}/);
  assert.match(source, /<LocationCardView location=\{location\} \/>/);
  assert.match(source, /@location\/\$\{location\.locationSlug\}/);
  assert.doesNotMatch(source, /No summary yet\./);
});
