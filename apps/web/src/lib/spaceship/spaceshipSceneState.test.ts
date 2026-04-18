import test from "node:test";
import assert from "node:assert/strict";
import {
  createCardLibraryOverlayState,
  toggleCardLibraryEntrySelection,
  toggleCardLibraryOpen,
} from "./spaceshipSceneState";

test("toggleCardLibraryOpen opens and closes the overlay", () => {
  const initialState = createCardLibraryOverlayState();
  const openState = toggleCardLibraryOpen(initialState, true);
  const closedState = toggleCardLibraryOpen(openState, false);

  assert.equal(initialState.open, false);
  assert.equal(openState.open, true);
  assert.equal(closedState.open, false);
});

test("toggleCardLibraryEntrySelection tracks multi-select entry ids", () => {
  const initialState = toggleCardLibraryOpen(createCardLibraryOverlayState(), true);
  const selectedOnce = toggleCardLibraryEntrySelection(initialState, "card-1");
  const selectedTwice = toggleCardLibraryEntrySelection(selectedOnce, "card-2");
  const deselected = toggleCardLibraryEntrySelection(selectedTwice, "card-1");

  assert.deepEqual(selectedOnce.selectedEntryIds, ["card-1"]);
  assert.deepEqual(selectedTwice.selectedEntryIds, ["card-1", "card-2"]);
  assert.deepEqual(deselected.selectedEntryIds, ["card-2"]);
});
