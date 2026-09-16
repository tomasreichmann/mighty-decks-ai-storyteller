import assert from "node:assert/strict";
import test from "node:test";

import { assetBaseCatalog, assetModifierCatalog } from "./assetCards";
import {
  assetBasePresentationCards,
  assetModifierPresentationCards,
} from "./cardPresentation";

test("keeps one presentational asset record for every canonical asset", () => {
  assert.deepEqual(
    assetBasePresentationCards.map((card) => card.slug),
    assetBaseCatalog.map((card) => card.slug),
  );
  assert.deepEqual(
    assetModifierPresentationCards.map((card) => card.slug),
    assetModifierCatalog.map((card) => card.slug),
  );
});
