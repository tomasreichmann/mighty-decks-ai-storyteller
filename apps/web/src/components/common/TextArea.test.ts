import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("TextArea uses the shared field shell by default", () => {
  const source = readFileSync(new URL("./TextArea.tsx", import.meta.url), "utf8");

  assert.match(source, /FieldShell/);
  assert.match(source, /showLabel/);
  assert.match(source, /showCharCount/);
  assert.match(source, /topRightControl/);
  assert.match(source, /controlClassName\?: string/);
});
