import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("OutcomeHandPanel raises hovered fan cards above their neighbors", () => {
  const source = readFileSync(
    new URL("./OutcomeHandPanel.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /hover:z-30 focus-within:z-30/);
});
