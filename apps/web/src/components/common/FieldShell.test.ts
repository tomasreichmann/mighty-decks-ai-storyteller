import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("FieldShell exposes the shared depressed input chrome and helpers", () => {
  const source = readFileSync(
    new URL("./FieldShell.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /focusHighlightWrapper/);
  assert.match(source, /focusHighlight/);
  assert.match(source, /showLabel/);
  assert.match(source, /showCharCount/);
  assert.match(source, /topRightControl/);
  assert.match(source, /characterCount/);
});
