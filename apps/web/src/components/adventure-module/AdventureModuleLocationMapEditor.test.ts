import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("AdventureModuleLocationMapEditor includes pin controls and hover preview copy", () => {
  const source = readFileSync(
    "apps/web/src/components/adventure-module/AdventureModuleLocationMapEditor.tsx",
    "utf8",
  );

  assert.match(source, /Add Pin/);
  assert.match(source, /Map Pins/);
  assert.match(source, /Hover to preview linked content/);
  assert.doesNotMatch(source, /bg-kac-iron-dark\/95/);
  assert.doesNotMatch(source, /bg-kac-iron-dark\/70/);
  assert.match(source, /bg-gradient-to-b from-\[#fffdf5\] to-kac-bone-light/);
});
