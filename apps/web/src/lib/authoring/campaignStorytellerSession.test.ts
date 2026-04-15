import test from "node:test";
import assert from "node:assert/strict";
import {
  appendStorytellerTableSelection,
  createStorytellerTableSelectionEntry,
  removeStorytellerTableSelection,
  resolveSessionStatusTone,
} from "./campaignStorytellerSession";

test("resolveSessionStatusTone maps campaign session statuses to the shared badge tones", () => {
  assert.equal(resolveSessionStatusTone("active"), "connected");
  assert.equal(resolveSessionStatusTone("setup"), "reconnecting");
  assert.equal(resolveSessionStatusTone("closed"), "offline");
});

test("table selection helpers dedupe cards and remove entries by id", () => {
  const entry = createStorytellerTableSelectionEntry({
    type: "ActorCard",
    slug: "watch-captain",
  });

  const deduped = appendStorytellerTableSelection([entry], {
    ...createStorytellerTableSelectionEntry({
      type: "ActorCard",
      slug: "watch-captain",
    }),
  });

  assert.equal(deduped.length, 1);
  assert.equal(deduped[0]?.card.slug, "watch-captain");

  const withSecondEntry = appendStorytellerTableSelection(deduped, {
    ...createStorytellerTableSelectionEntry({
      type: "CounterCard",
      slug: "heat",
    }),
  });

  assert.equal(withSecondEntry.length, 2);
  assert.deepEqual(removeStorytellerTableSelection(withSecondEntry, entry.id), [
    withSecondEntry[1],
  ]);
});
