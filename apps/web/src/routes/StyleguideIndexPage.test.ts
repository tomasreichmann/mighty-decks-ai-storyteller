import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("StyleguideIndexPage links to typography inputs buttons panel and cards labs", () => {
  const source = readFileSync(
    new URL("./StyleguideIndexPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /\/styleguide\/typography/);
  assert.match(source, /\/styleguide\/inputs/);
  assert.match(source, /\/styleguide\/buttons/);
  assert.match(source, /\/styleguide\/panel/);
  assert.match(source, /\/styleguide\/cards/);
  assert.match(source, /Typography/);
  assert.match(source, /Inputs/);
  assert.match(source, /Buttons/);
  assert.match(source, /Panel/);
  assert.match(source, /Cards/);
});
