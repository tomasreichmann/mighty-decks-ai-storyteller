import assert from "node:assert/strict";
import test from "node:test";

import {
  getCard,
  validateCardExportInput,
} from "../src/catalog";

test("publishes Taken Out as the sole maximum-Injury effect", () => {
  const takenOut = getCard("effect", "taken-out");

  assert.equal(takenOut?.title, "Taken Out");
  assert.equal(getCard("effect", "dying"), undefined);
});

test("rejects unsupported locales and incomplete custom cards", () => {
  assert.throws(() => validateCardExportInput({ locale: "cs", cards: [] }));
  assert.throws(() => validateCardExportInput({ locale: "en", cards: [{ family: "asset" }] }));
});
