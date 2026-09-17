import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("StyleguidePanelPage distinguishes open content, paper panels, and semantic messages", () => {
  const content = readFileSync(new URL("./StyleguidePanelPage.tsx", import.meta.url), "utf8");

  assert.match(content, /Open Section \(no Panel\)/);
  assert.match(content, /Paper Panel/);
  assert.match(content, /Panel \+ Label/);
  assert.match(content, /Semantic Message/);
});
