import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("AdventureModuleQuestsTabPanel exposes quest delete affordance and canonical embed copy", () => {
  const source = readFileSync(
    new URL("./AdventureModuleQuestsTabPanel.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /Delete \$\{quest\.title\}/);
  assert.match(source, /<QuestCardView quest=\{quest\} \/>/);
  assert.match(source, /shortcode=\{\`@quest\/\$\{quest\.questSlug\}\`\}/);
  assert.match(source, /ShortcodeField/);
  assert.doesNotMatch(source, /Copy Shortcode/);
});
