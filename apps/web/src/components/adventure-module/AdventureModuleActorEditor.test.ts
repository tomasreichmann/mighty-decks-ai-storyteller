import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("AdventureModuleActorEditor includes a player character toggle", () => {
  const source = readFileSync(
    new URL("./AdventureModuleActorEditor.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /isPlayerCharacter/);
  assert.match(source, /Player Character/);
  assert.match(source, /Toggle/);
  assert.match(source, /ShortcodeField/);
  assert.match(source, /@actor\/\$\{actor\.actorSlug\}/);
  assert.match(source, /SceneCardDetailLink/);
  assert.match(source, /buildRoute\(moduleSlug, "actors", actor\.actorSlug\)/);
});

test("AdventureModuleActorEditor exposes generic/custom card controls", () => {
  const source = readFileSync(
    new URL("./AdventureModuleActorEditor.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /Make Custom/);
  assert.match(source, /Make Generic/);
  assert.match(source, /ActorIconTokenTextEditor/);
  assert.match(source, /AdventureModuleGeneratedImagePicker/);
});
