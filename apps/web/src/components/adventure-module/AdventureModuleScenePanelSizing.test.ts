import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string): string =>
  readFileSync(new URL(path, import.meta.url), "utf8");

test("scene-card authoring tab panels constrain card width and allow metadata rows to shrink", () => {
  const encounterSource = read("./AdventureModuleEncountersTabPanel.tsx");
  const locationSource = read("./AdventureModuleLocationsTabPanel.tsx");
  const questSource = read("./AdventureModuleQuestsTabPanel.tsx");
  const sizingSource = read("./sceneCardSizing.ts");

  assert.match(
    sizingSource,
    /AUTHORED_SCENE_PANEL_CLASS =\s*"w-full max-w-\[24rem\] min-w-0 self-start"/,
  );
  assert.match(
    sizingSource,
    /AUTHORED_SCENE_PANEL_CONTENT_CLASS = "stack gap-3 min-w-0"/,
  );
  assert.match(
    sizingSource,
    /AUTHORED_SCENE_PANEL_BUTTON_CLASS =\s*"stack w-full min-w-0 gap-3 text-left"/,
  );
  assert.match(
    sizingSource,
    /AUTHORED_SCENE_ACTION_ROW_CLASS =\s*"flex min-w-0 items-start justify-between gap-3"/,
  );

  for (const source of [encounterSource, locationSource, questSource]) {
    assert.match(source, /AUTHORED_SCENE_PANEL_CLASS/);
    assert.match(source, /AUTHORED_SCENE_PANEL_CONTENT_CLASS/);
    assert.match(source, /AUTHORED_SCENE_PANEL_BUTTON_CLASS/);
    assert.match(source, /AUTHORED_SCENE_ACTION_ROW_CLASS/);
    assert.match(source, /<ShortcodeField[\s\S]*className="flex-1"/);
  }

  assert.match(encounterSource, /className="text-sm break-words"/);
  assert.match(questSource, /className="text-sm break-words"/);
});
