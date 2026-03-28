import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("StyleguideEncounterCardPage renders the encounter card direction", () => {
  const source = readFileSync(
    new URL("./StyleguideEncounterCardPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /Bridge Tribute Checkpoint/);
  assert.match(source, /EncounterCard direction/);
  assert.match(source, /warning icon medallion/);
  assert.match(source, /<GameCard type="encounter" encounter=\{sampleEncounter\} \/>/);
});
