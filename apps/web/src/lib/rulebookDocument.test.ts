import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  parseRulebookDocument,
  rulebookSectionDefinitions,
} from "./rulebookDocument";

const canonicalRulebook = readFileSync(
  new URL("../../../../docs/mighty-decks-rulebook.md", import.meta.url),
  "utf8",
);

test("parses every public top-level section in source order", () => {
  const document = parseRulebookDocument(canonicalRulebook);

  assert.deepEqual(
    document.sections.map((section) => section.sourceHeading),
    rulebookSectionDefinitions.map((section) => section.sourceHeading),
  );
  assert.ok(document.sections.some((section) => section.id === "quick-reference"));
  assert.ok(document.sections.some((section) => section.id === "design-philosophy"));
  assert.ok(!document.sections.some((section) => section.sourceHeading.includes("28.")));
});

test("assigns unique stable IDs, navigation groups, and addressable examples", () => {
  const document = parseRulebookDocument(canonicalRulebook);
  const ids = document.sections.map((section) => section.id);

  assert.equal(new Set(ids).size, ids.length);
  assert.equal(
    new Set([...ids, ...document.subsections.map((section) => section.id)]).size,
    ids.length + document.subsections.length,
    "section and subsection fragment IDs must never collide",
  );
  assert.ok(document.sections.every((section) => section.navGroup));
  assert.deepEqual(
    document.subsections
      .filter((section) => /^(Tiny )?Example/.test(section.title))
      .map((section) => section.id),
    [
      "example-a-basic-action",
      "example-partial-success",
      "example-two-valid-fumbles",
      "example-chaos",
      "example-effect-is-impact-not-damage",
      "example-catastrophe",
      "example-stacking-modifiers",
      "example-healing-with-a-consumable",
      "example-injury-and-distress-combine",
      "example-range-and-zones",
      "example-defense",
      "tiny-example-splash",
      "example-taken-out",
      "example-progress-counter",
      "example-ongoing-counter",
    ],
  );
});

test("keeps Distress thresholds as rules prose rather than a simulated example", () => {
  const document = parseRulebookDocument(canonicalRulebook);

  assert.ok(
    document.subsections.some(
      (subsection) => subsection.id === "distress-thresholds",
    ),
  );
  assert.ok(
    !document.subsections.some((subsection) => subsection.id === "tiny-example-distress-thresholds"),
  );
});

test("excludes editorial notes and illustration briefs from reader prose", () => {
  const document = parseRulebookDocument(canonicalRulebook);
  const renderedSource = document.sections.map((section) => section.body).join("\n");

  assert.doesNotMatch(renderedSource, /Draft rules text/);
  assert.doesNotMatch(renderedSource, /Recommended Instructional Illustrations/);
  assert.doesNotMatch(renderedSource, /> \*\*Illustration/);
});

test("fails clearly when the canonical heading inventory changes", () => {
  const renamed = canonicalRulebook.replace(
    "## 8. Catastrophe",
    "## 8. Disaster",
  );

  assert.throws(
    () => parseRulebookDocument(renamed),
    /Missing required rulebook heading: "## 8\. Catastrophe"/,
  );
});
