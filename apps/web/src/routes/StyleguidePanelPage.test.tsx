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

test("styleguide border primitives use the shared Iron edge recipe", () => {
  const panel = readFileSync(
    new URL("../components/common/Panel.tsx", import.meta.url),
    "utf8",
  );
  const tag = readFileSync(
    new URL("../components/common/Tag.tsx", import.meta.url),
    "utf8",
  );
  const stepNavigation = readFileSync(
    new URL("../components/common/StepNavigation.tsx", import.meta.url),
    "utf8",
  );

  assert.match(panel, /border-2 border-kac-iron/);
  assert.match(panel, /shadow-\[4px_4px_0_0_#121b23\]/);
  assert.match(tag, /border-2 border-kac-iron/);
  assert.doesNotMatch(tag, /shadow-\[4px_4px_0_0_#121b23\]/);
  assert.match(tag, /tag__leading inline-flex items-center px-1\.5/);
  assert.match(stepNavigation, /bg-kac-iron/);
});
