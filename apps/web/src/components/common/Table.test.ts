import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("Table inherits the styleguide body and heading typography", () => {
  const component = readFileSync(
    new URL("./Table.tsx", import.meta.url),
    "utf8",
  );
  const styles = readFileSync(
    new URL("./Table.module.css", import.meta.url),
    "utf8",
  );

  assert.match(component, /font-ui text-base leading-relaxed/);
  assert.match(component, /\[&_th\]:font-heading/);
  assert.match(component, /\[&_th\]:font-bold/);
  assert.doesNotMatch(styles, /font-family:\s*var\(/);
  assert.doesNotMatch(styles, /font-size:/);
  assert.doesNotMatch(styles, /line-height:/);
  assert.match(
    styles,
    /\.table th\s*\{[\s\S]*font-family:\s*"Kalam", cursive/,
  );
});
