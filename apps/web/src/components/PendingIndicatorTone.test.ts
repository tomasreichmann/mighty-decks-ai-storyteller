import test from "node:test";
import assert from "node:assert/strict";
import {
  resolvePendingDotBorderClass,
  resolvePendingDotFillClass,
  resolvePendingIndicatorTone,
} from "./PendingIndicatorTone";

const colorCases = [
  ["gold", "bg-kac-gold", "border-kac-iron"],
  ["cloth", "bg-kac-cloth-light", "border-kac-iron"],
  ["fire", "bg-kac-fire-light", "border-kac-iron"],
  ["bone", "bg-kac-bone-light", "border-kac-iron"],
  ["steel", "bg-kac-steel-light", "border-kac-iron"],
  ["blood", "bg-kac-blood-light", "border-kac-iron"],
  ["curse", "bg-kac-curse-light", "border-kac-iron"],
  ["monster", "bg-kac-monster-light", "border-kac-iron"],
  ["skin", "bg-kac-skin", "border-kac-iron"],
  ["iron", "bg-kac-iron-light", "border-kac-steel"],
] as const;

test("PendingIndicator tone helpers use brighter family colors and keep iron borders for non-iron colors", () => {
  for (const [color, fillClass, borderClass] of colorCases) {
    const tone = resolvePendingIndicatorTone(color);
    assert.ok(tone.dotClassName.includes(fillClass));
    assert.ok(tone.dotClassName.includes(borderClass));
    assert.equal(resolvePendingDotFillClass(color), fillClass);
    assert.equal(resolvePendingDotBorderClass(color), borderClass);
  }

  assert.equal(resolvePendingDotBorderClass("iron-light"), "border-kac-steel");
  assert.equal(resolvePendingDotBorderClass("iron-dark"), "border-kac-steel");
  assert.equal(resolvePendingDotFillClass("fire-dark"), "bg-kac-fire-light");
  assert.equal(resolvePendingDotFillClass("blood-dark"), "bg-kac-blood-light");
  assert.equal(resolvePendingDotFillClass("cloth-dark"), "bg-kac-cloth-light");
});
