import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const illustrations = readFileSync(
  new URL("./RulesIllustrations.tsx", import.meta.url),
  "utf8",
);
const dieMarker = readFileSync(new URL("./DieMarker.tsx", import.meta.url), "utf8");

test("uses removed d4s, equal tracking cards, and centered Location occupants", () => {
  assert.match(dieMarker, /removed\?: boolean/);
  assert.match(dieMarker, /d\$\{sides\} marker removed/);
  assert.match(dieMarker, /styles\.removed/);

  const toughness = illustrations
    .split("export const RemainingToughness")[1]
    ?.split("export const CounterTracking")[0] ?? "";
  assert.match(toughness, /removed=\{value === 0\}/);

  const counter = illustrations
    .split("export const CounterTracking")[1]
    ?.split("export const CatastropheFlow")[0] ?? "";
  assert.match(illustrations, /const trackingCardClassName = "w-\[10rem\]"/);
  assert.equal((counter.match(/className=\{trackingCardClassName\}/g) ?? []).length, 2);

  assert.match(illustrations, /roleLabel: "Player"/);
  assert.match(illustrations, /roleLabel: "Enemy"/);
  assert.match(illustrations, /symbol: "✦"/);
  assert.match(illustrations, /symbol: "☠"/);
  assert.match(illustrations, /absolute inset-0 z-20 flex items-center justify-center/);
});
