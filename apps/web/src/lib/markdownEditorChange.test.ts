import test from "node:test";
import assert from "node:assert/strict";

import { normalizeMarkdownEditorChange } from "./markdownEditorChange";

test("normalizeMarkdownEditorChange upgrades actor shortcodes once", () => {
  assert.deepEqual(
    normalizeMarkdownEditorChange("@actor/primary-actor", 10_000),
    {
      value: '<GameCard type="ActorCard" slug="primary-actor" />',
      normalized: true,
      exceedsMaxLength: false,
    },
  );
});

test("normalizeMarkdownEditorChange leaves unchanged markdown alone", () => {
  assert.deepEqual(
    normalizeMarkdownEditorChange("Already plain markdown.", 10_000),
    {
      value: "Already plain markdown.",
      normalized: false,
      exceedsMaxLength: false,
    },
  );
});

test("normalizeMarkdownEditorChange enforces max length after normalization", () => {
  assert.deepEqual(
    normalizeMarkdownEditorChange("@actor/primary-actor", 20),
    {
      value: '@actor/primary-actor',
      normalized: true,
      exceedsMaxLength: true,
    },
  );
});
