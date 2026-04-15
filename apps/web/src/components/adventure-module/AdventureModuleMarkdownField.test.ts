import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("AdventureModuleMarkdownField exposes separate Generic Asset and Custom Asset insert controls", () => {
  const source = readFileSync(
    new URL("./AdventureModuleMarkdownField.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /<option value="GenericAsset">Generic Asset<\/option>/);
  assert.match(source, /<option value="CustomAsset">Custom Asset<\/option>/);
  assert.match(source, /Generic Asset/);
  assert.match(source, /Custom Asset/);
  assert.match(source, /modifierSlug/);
  assert.doesNotMatch(source, /Asset insert mode/);
});

test("AdventureModuleMarkdownField exposes Encounter insertion with canonical EncounterCard JSX", () => {
  const source = readFileSync(
    new URL("./AdventureModuleMarkdownField.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /<option value="EncounterCard">Encounter<\/option>/);
  assert.match(source, /name: "EncounterCard"/);
  assert.match(source, /createEncounterCardJsx/);
});

test("AdventureModuleMarkdownField exposes Quest insertion with canonical QuestCard JSX", () => {
  const source = readFileSync(
    new URL("./AdventureModuleMarkdownField.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /<option value="QuestCard">Quest<\/option>/);
  assert.match(source, /name: "QuestCard"/);
  assert.match(source, /createQuestCardJsx/);
});

test("AdventureModuleMarkdownField uses the native item select and carries slug context in option titles", () => {
  const source = readFileSync(
    new URL("./AdventureModuleMarkdownField.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    source,
    /aria-label=\{insertType === "CustomAsset" \? "Insert custom asset" : "Insert card"\}/,
  );
  assert.match(source, /title=\{option\.slug\}/);
  assert.match(source, /title=\{selectedInsertOption\?\.slug \?\? ""\}/);
  assert.doesNotMatch(source, /CompactOptionPicker/);
});

test("AdventureModuleMarkdownField enables standard markdown image tooling and reusable image modal insertion", () => {
  const source = readFileSync(
    new URL("./AdventureModuleMarkdownField.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /imagePlugin\(/);
  assert.match(source, /<InsertImage \/>/);
  assert.match(source, /MarkdownImageInsertButton/);
  assert.doesNotMatch(source, /GeneratedMarkdownImageInsertPanel/);
});
