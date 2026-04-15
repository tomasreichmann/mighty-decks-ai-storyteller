import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("InputDescriptionHint supports overriding the tooltip z-index class per usage site", () => {
  const source = readFileSync(
    new URL("./InputDescriptionHint.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /tooltipClassName\?: string;/);
  assert.match(source, /tooltipClassName = "z-50"/);
  assert.match(source, /tooltipClassName,/);
  assert.doesNotMatch(source, /absolute z-50 w-72/);
});
