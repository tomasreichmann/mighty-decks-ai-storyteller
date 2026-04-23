import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("authoring delete flows route through shared confirmation dialogs instead of native confirm", () => {
  const tabContentSource = readFileSync(
    new URL("./CommonAuthoringTabContent.tsx", import.meta.url),
    "utf8",
  );
  const providerSource = readFileSync(
    new URL("../../lib/authoring/store/AuthoringProvider.tsx", import.meta.url),
    "utf8",
  );

  assert.match(tabContentSource, /ConfirmationDialog/);
  assert.match(tabContentSource, /Delete "\$\{title\}"\?/);
  assert.doesNotMatch(providerSource, /window\.confirm\(/);
});
