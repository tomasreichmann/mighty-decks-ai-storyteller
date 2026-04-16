import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("ToggleButton exposes an active state API", () => {
  const source = readFileSync(new URL("./ToggleButton.tsx", import.meta.url), "utf8");

  assert.match(source, /active\?: boolean/);
  assert.match(source, /aria-pressed=\{active\}/);
  assert.match(
    source,
    /"gold"[\s\S]*"fire"[\s\S]*"monster"[\s\S]*"cloth"[\s\S]*"bone"[\s\S]*"curse"/,
  );
  assert.match(source, /"sm" \| "md" \| "lg"/);
  assert.doesNotMatch(source, /"s" \| "m" \| "l"/);
});

test("ButtonRadioGroup renders accessible radio-group semantics", () => {
  const source = readFileSync(
    new URL("./ButtonRadioGroup.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /role="radiogroup"/);
  assert.match(source, /role="radio"/);
  assert.match(source, /aria-checked=/);
  assert.match(source, /onValueChange/);
  assert.match(source, /active=\{isActive\}/);
});
