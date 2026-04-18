import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("StyleguideSectionNav exposes the styleguide labs", () => {
  const source = readFileSync(
    new URL("./StyleguideSectionNav.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /\/styleguide\/typography/);
  assert.match(source, /\/styleguide\/inputs/);
  assert.match(source, /\/styleguide\/loading/);
  assert.match(source, /\/styleguide\/buttons/);
  assert.match(source, /\/styleguide\/panel/);
  assert.match(source, /Typography/);
  assert.match(source, /Inputs/);
  assert.match(source, /Loading/);
  assert.match(source, /Buttons/);
  assert.match(source, /Panel/);
  assert.match(source, /\/styleguide\/labels/);
  assert.match(source, /\/styleguide\/messages/);
  assert.match(source, /Labels/);
  assert.match(source, /Messages/);
});
