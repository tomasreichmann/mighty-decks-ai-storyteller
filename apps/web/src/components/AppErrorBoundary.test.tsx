import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("AppErrorBoundary centers the crash fallback vertically", () => {
  const source = readFileSync(new URL("./AppErrorBoundary.tsx", import.meta.url), "utf8");

  assert.match(source, /className="app-shell flex min-h-\[100dvh\] items-center py-8"/);
  assert.match(source, /<Message color="curse" label="App crashed while rendering">/);
});
