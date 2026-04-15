import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("EntityList reuses the shared shortcode field instead of a text copy button", () => {
  const source = readFileSync(
    new URL("./EntityList.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /ShortcodeField/);
  assert.match(source, /referenceCode = `@\$\{tab\}\/\$\{item\.slug\}`/);
  assert.doesNotMatch(source, /Copy Code/);
});
