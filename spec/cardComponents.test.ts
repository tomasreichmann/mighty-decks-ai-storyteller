import assert from "node:assert/strict";
import test from "node:test";

import { validateCardExportInput } from "./cardComponents";

test("accepts serializable English card export data", () => {
  const input = validateCardExportInput({
    locale: "en",
    cards: [
      {
        family: "asset-base",
        id: "custom:field-kit",
        title: "Field Kit",
        artworkPath: "art/field-kit.png",
      },
    ],
  });

  assert.equal(input.cards[0]?.id, "custom:field-kit");
  assert.equal(input.cards[0]?.family, "asset-base");
});
