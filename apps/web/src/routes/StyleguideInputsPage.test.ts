import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("StyleguideInputsPage includes the input demos", () => {
  const source = readFileSync(
    new URL("./StyleguideInputsPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /styleguide-inputs-page/);
  assert.match(source, /StyleguideSectionNav/);
  assert.match(source, /TextField/);
  assert.match(source, /TextArea/);
  assert.match(source, /Button/);
  assert.match(source, /size="sm"/);
  assert.match(source, /size="md"/);
  assert.match(source, /size="lg"/);
  assert.match(source, /rows=\{2\}/);
  assert.match(source, /rows=\{3\}/);
  assert.match(source, /rows=\{4\}/);
});
