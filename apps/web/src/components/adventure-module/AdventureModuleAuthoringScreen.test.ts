import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("AdventureModuleAuthoringScreen renders the loading state without a panel wrapper", () => {
  const source = readFileSync(
    new URL("./AdventureModuleAuthoringScreen.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /className="flex flex-1 items-center justify-center py-10"/);
  assert.match(source, /PendingIndicator label="Loading adventure module" color="cloth" \/>/);
  assert.doesNotMatch(source, /<Panel[\s\S]*Loading adventure module/);
});
