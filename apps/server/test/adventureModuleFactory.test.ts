import assert from "node:assert/strict";
import test from "node:test";
import { createBlankIndex } from "../src/persistence/adventureModuleStore/factory";

test("createBlankIndex seeds a valid starter opportunity map and artifact manifest", () => {
  const index = createBlankIndex({
    moduleId: "am-factory-test",
    slug: "factory-test-module",
    title: "Factory Test Module",
    nowIso: "2026-04-18T12:00:00.000Z",
  });

  assert.equal(index.componentOpportunities.length > 0, true);
  assert.equal(
    index.componentOpportunities.some(
      (opportunity) =>
        opportunity.fragmentId === "frag-encounter-main" &&
        opportunity.fragmentKind === "encounter",
    ),
    true,
  );

  const artifactSourceFragmentIds = new Set(
    index.artifacts
      .map((artifact) => artifact.sourceFragmentId)
      .filter((fragmentId): fragmentId is string => typeof fragmentId === "string"),
  );

  for (const fragment of index.fragments) {
    assert.equal(
      artifactSourceFragmentIds.has(fragment.fragmentId),
      true,
      `missing artifact entry for ${fragment.fragmentId}`,
    );
  }
});
