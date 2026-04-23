import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("ActorCard uses a hardcoded line height for the body rows", () => {
  const source = readFileSync(new URL("./ActorCard.tsx", import.meta.url), "utf8");

  assert.match(source, /leading-\[16px\]/);
  assert.match(source, /min-h-4/);
  assert.match(source, /whitespace-nowrap leading-\[16px\]/);
  assert.match(source, /nounEffectClassName:\s*[\s\S]*px-0 pb-1 text-\[11px\] leading-\[16px\]/);
  assert.doesNotMatch(source, /min-h-5/);
});
