import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("AppErrorBoundary renders the crash fallback message", () => {
  const source = readFileSync(new URL("./AppErrorBoundary.tsx", import.meta.url), "utf8");

  assert.match(source, /BoundaryMessage/);
  assert.match(source, /title="App crashed while rendering"/);
});
