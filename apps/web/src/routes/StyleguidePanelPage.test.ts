import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("StyleguidePanelPage showcases the lighter framed surface", () => {
  const source = readFileSync(
    new URL("./StyleguidePanelPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /styleguide-panel-page/);
  assert.match(source, /StyleguideSectionNav/);
  assert.match(source, /Panel/);
  assert.match(source, /tone: "bone"/);
  assert.match(source, /tone: "gold"/);
  assert.match(source, /tone: "cloth"/);
  assert.match(source, /tone: "fire"/);
  assert.match(source, /tone="bone"/);
  assert.match(source, /lighter framed surface/);
  assert.match(source, /Where to use it/);
});
