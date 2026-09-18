import assert from "node:assert/strict";
import test from "node:test";
import { cardCatalog } from "@mighty-decks/components";
import { rulesActorGroups } from "./rulesActors";

const actorFamilies = ["actor-base", "actor-role", "actor-special"] as const;

test("projects every Actor catalog card, including the expanded base catalog, exactly once", () => {
  const expected = actorFamilies.flatMap((family) =>
    cardCatalog.filter((card) => card.family === family),
  );
  const projected = rulesActorGroups.flatMap((group) => group.cards);

  assert.deepEqual(
    Object.fromEntries(
      rulesActorGroups.map((group) => [group.family, group.cards.length]),
    ),
    { "actor-base": 84, "actor-role": 16, "actor-special": 24 },
  );
  assert.deepEqual(
    projected.map((card) => card.id),
    expected.map((card) => card.id),
  );
  assert.equal(new Set(projected.map((card) => card.id)).size, projected.length);
  assert.ok(projected.every((card) => actorFamilies.includes(card.family as (typeof actorFamilies)[number])));
});
