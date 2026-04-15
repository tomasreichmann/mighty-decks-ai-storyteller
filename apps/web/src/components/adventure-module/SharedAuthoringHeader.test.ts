import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("SharedAuthoringHeader owns the shared title shell and responsive tab nav API", () => {
  const source = readFileSync(
    new URL("./SharedAuthoringHeader.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /AdventureModuleTabNav/);
  assert.match(source, /titleRowTrailingContent/);
  assert.match(source, /titleSupportingContent/);
  assert.match(source, /navLeadingContent/);
  assert.doesNotMatch(source, /loadingTrailingContent/);
  assert.doesNotMatch(source, /navTrailingContent/);
  assert.match(source, /showMobileMenu = false/);
  assert.match(source, /buildTabPath/);
  assert.match(source, /titleAriaLabel/);
});
