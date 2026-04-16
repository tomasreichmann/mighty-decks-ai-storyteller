import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("StyleguideInputsPage validates field and button alignment", () => {
  const source = readFileSync(
    new URL("./StyleguideInputsPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /styleguide-inputs-page/);
  assert.match(source, /StyleguideSectionNav/);
  assert.match(source, /TextField/);
  assert.match(source, /TextArea/);
  assert.match(source, /DepressedInput/);
  assert.match(source, /Button/);
  assert.match(source, /size="sm"/);
  assert.match(source, /size="md"/);
  assert.match(source, /size="lg"/);
  assert.match(source, /sm:grid-cols-\[minmax\(0,1fr\)_auto\]/);
  assert.match(source, /sm:pt-7/);
  assert.match(source, /inset style variant/);
});
