import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const assertClickableSceneCardShell = (
  fileName: string,
  visibleCardLabel: string,
  resolverName: string,
  detailRouteTab: string,
): void => {
  const source = readFileSync(new URL(`./${fileName}`, import.meta.url), "utf8");

  assert.match(source, /type="button"/);
  assert.match(source, /contentEditable=\{false\}/);
  assert.match(source, /cursor-pointer/);
  assert.match(source, /data-selected=\{isSelected \? "true" : "false"\}/);
  assert.match(source, new RegExp(resolverName));
  assert.match(source, new RegExp(visibleCardLabel));
  assert.match(source, /SceneCardDetailLink/);
  assert.match(source, new RegExp(`buildRoute\\(moduleSlug, "${detailRouteTab}", slug\\)`));
};

test("scene card JSX editors render clickable button shells", () => {
  assertClickableSceneCardShell(
    "EncounterCardJsxEditor.tsx",
    "EncounterCardView",
    "resolveEncounterCard",
    "encounters",
  );
  assertClickableSceneCardShell(
    "LocationCardJsxEditor.tsx",
    "LocationCardView",
    "resolveLocationCard",
    "locations",
  );
  assertClickableSceneCardShell(
    "QuestCardJsxEditor.tsx",
    "QuestCardView",
    "resolveQuestCard",
    "quests",
  );
});
