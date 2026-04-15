import test from "node:test";
import assert from "node:assert/strict";
import {
  clampCounterValue,
  resolveCompactTitleInputSize,
  toEntitySlug,
  validateBaseForm,
} from "./sharedAuthoring";

test("resolveCompactTitleInputSize keeps the compact title input within its expected bounds", () => {
  assert.equal(resolveCompactTitleInputSize(""), 5);
  assert.equal(resolveCompactTitleInputSize("Hero"), 5);
  assert.equal(resolveCompactTitleInputSize("A".repeat(40)), 32);
});

test("toEntitySlug normalizes punctuation and accents into stable lowercase slugs", () => {
  assert.equal(toEntitySlug("  Sire Brulee!!  "), "sire-brulee");
  assert.equal(toEntitySlug(""), "untitled");
});

test("clampCounterValue keeps counters within zero and the optional max", () => {
  assert.equal(clampCounterValue(-3), 0);
  assert.equal(clampCounterValue(12, 5), 5);
  assert.equal(clampCounterValue(3, 5), 3);
});

test("validateBaseForm trims tags and rejects duplicate have-tags", () => {
  const duplicateResult = validateBaseForm({
    title: " Lantern Watch ",
    premise: " Guard the gate ",
    haveTags: ["Stealth", " stealth "],
    avoidTags: [],
  });

  assert.equal(duplicateResult.error, 'Have has duplicate tag "stealth".');

  const validResult = validateBaseForm({
    title: " Lantern Watch ",
    premise: " Guard the gate ",
    haveTags: [" Stealth ", "Rain-soaked alleys"],
    avoidTags: [" Body horror "],
  });

  assert.deepEqual(validResult, {
    title: "Lantern Watch",
    premise: "Guard the gate",
    dos: ["Stealth", "Rain-soaked alleys"],
    donts: ["Body horror"],
  });
});
