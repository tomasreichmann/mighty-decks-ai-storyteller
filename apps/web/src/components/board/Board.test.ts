import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Board item refs are stable so fit operations do not remeasure on every render", () => {
  const source = readFileSync(new URL("./Board.tsx", import.meta.url), "utf8");

  assert.match(source, /useCallback/);
  assert.match(source, /const BoardItem/);
  assert.match(source, /registerItemElement\(item\.id, element\)/);
  assert.doesNotMatch(source, /ref=\{\(element\) => registerItemElement/);
});

test("Board applies transition duration to viewport transforms and item positions", () => {
  const source = readFileSync(new URL("./Board.tsx", import.meta.url), "utf8");

  assert.match(source, /transitionDurationMs/);
  assert.match(source, /rotate\(\$\{item\.rotation \?\? 0\}deg\)/);
  assert.match(source, /transitionProperty: "transform"/);
  assert.match(source, /transitionProperty: "left, top, transform"/);
  assert.match(source, /transitionDuration: `\$\{transitionDurationMs\}ms`/);
});

test("Board renders layout items directly without group wrapper elements", () => {
  const source = readFileSync(new URL("./Board.tsx", import.meta.url), "utf8");

  assert.match(source, /items\.map\(\(item\) => \(/);
  assert.match(source, /<BoardItem/);
  assert.doesNotMatch(source, /layout-group/);
  assert.doesNotMatch(source, /layout-wrapper/);
});
