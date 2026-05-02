import test from "node:test";
import assert from "node:assert/strict";

import { buildCustomActorCardDraft } from "./actorCardCustomization";

test("buildCustomActorCardDraft seeds Chmatak-style custom text from generic actor rows", () => {
  const draft = buildCustomActorCardDraft({
    baseLayerSlug: "aristocrat",
    tacticalRoleSlug: "bomber",
    tacticalSpecialSlug: "grabbing",
  });

  assert.equal(draft.imageUrl, "/actors/base/aristocrat.png");
  assert.equal(draft.adjective, "Grabbing");
  assert.equal(draft.noun, "Bomber");
  assert.equal(
    draft.nounDescription,
    "[toughness][toughness][toughness]\n[ranged][injury3][splash][range]0 (+[stuck])",
  );
  assert.equal(
    draft.adjectiveDescription,
    "[melee] attack also deals +[stuck]",
  );
});
