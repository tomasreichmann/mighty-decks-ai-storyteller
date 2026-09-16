import assert from "node:assert/strict";
import test from "node:test";

import {
  enumerateStaticCards,
  validateCardExportInput,
} from "../src/catalog";

test("rejects unsupported locales and incomplete custom cards", () => {
  assert.throws(() => validateCardExportInput({ locale: "cs", cards: [] }));
  assert.throws(() => validateCardExportInput({ locale: "en", cards: [{ family: "asset" }] }));
});

test("enumerates each standard card once per preset without deck-quantity duplication", () => {
  const entries = enumerateStaticCards();
  const success = entries.filter((entry) => entry.id === "outcome:success");

  assert.equal(success.length, 3);
  assert.deepEqual(
    success.map((entry) => `${entry.layout}/${entry.height}`),
    ["full/1024", "full/512", "compact/256"],
  );
});
