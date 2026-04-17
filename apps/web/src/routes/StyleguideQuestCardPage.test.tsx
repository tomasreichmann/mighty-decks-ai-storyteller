import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("StyleguideQuestCardPage renders the quest card direction", () => {
  const source = readFileSync(
    new URL("./StyleguideQuestCardPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /Recover the Shard/);
  assert.match(source, /QuestCard direction/);
  assert.match(source, /scroll icon medallion/);
  assert.match(source, /StyleguideSectionNav/);
  assert.match(source, /styleguide-quest-card-page/);
  assert.match(source, /CardBoundary/);
  assert.match(
    source,
    /<CardBoundary[\s\S]*<GameCard type="quest" quest=\{sampleQuest\} \/>[\s\S]*<\/CardBoundary>/,
  );
});
