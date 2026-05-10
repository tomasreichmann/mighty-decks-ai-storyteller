import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("StyleguideTokensPage showcases the shared Token component", () => {
  const source = readFileSync(
    new URL("./StyleguideTokensPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /styleguide-tokens-page/);
  assert.match(source, /StyleguideSectionNav/);
  assert.match(source, /Token/);
  assert.match(source, /tokenColors/);
  assert.match(source, /tokenSizes/);
  assert.match(source, /Standard colors/);
  assert.match(source, /Physical size ladder/);
  assert.match(source, /Image-only marker/);
  assert.match(source, /Selection and ping/);
  assert.match(source, /selected/);
  assert.match(source, /ping=\{true\}/);
  assert.match(source, /ping=\{3\}/);
  assert.match(source, /ping="infinite"/);
  assert.match(source, /<section className="stack gap-5">/);
  assert.doesNotMatch(source, /Panel/);
  assert.match(source, /0\.5in/);
  assert.match(source, /1in/);
  assert.match(source, /2in/);
  assert.match(source, /3in/);
});
