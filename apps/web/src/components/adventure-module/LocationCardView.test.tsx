import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { AdventureModuleResolvedLocation } from "@mighty-decks/spec/adventureModuleAuthoring";

import { LocationCardView } from "./LocationCardView";

const sampleLocation: AdventureModuleResolvedLocation = {
  fragmentId: "frag-location-echoing-underhall",
  locationSlug: "echoing-underhall",
  title: "Echoing Underhall",
  summary:
    "A drowned dwarf-hall of toppled pillars, black water, and brittle bridges.",
  titleImageUrl: "/scenes/defending-an-underground-village.jpg",
  introductionMarkdown: "",
  descriptionMarkdown: "",
  mapImageUrl: "",
  mapPins: [],
};

test("LocationCardView wraps long location summaries before the footer edge", () => {
  const markup = renderToStaticMarkup(
    React.createElement(LocationCardView, {
      location: sampleLocation,
    }),
  );

  assert.match(
    markup,
    /A drowned dwarf-hall of toppled pillars, black water,<\/text>/,
  );
  assert.match(markup, /and brittle bridges\.<\/text>/);
  assert.doesNotMatch(markup, /black water, and<\/text>/);
});
