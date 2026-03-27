import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { AdventureModuleResolvedLocation } from "@mighty-decks/spec/adventureModuleAuthoring";

import { GameCard } from "./GameCard";

const sampleLocation: AdventureModuleResolvedLocation = {
  fragmentId: "frag-location-drowned-gate",
  locationSlug: "drowned-gate-district",
  title: "The Drowned Gate District",
  summary:
    "A half-submerged factory quarter with unstable walkways, rusted locks, and watch patrol routes.",
  titleImageUrl: "/scenes/defending-an-underground-village.jpg",
  introductionMarkdown:
    "Catwalks groan over dark water channels while the pumps thrum beneath the district.",
  descriptionMarkdown:
    "Pressure rises when patrols tighten and the flood level surges back through the works.",
  mapImageUrl: "/maps/exiles-ship.png",
  mapPins: [
    { pinId: "pin-vault", x: 18, y: 26, targetFragmentId: "frag-vault-annex" },
    { pinId: "pin-drain", x: 52, y: 68, targetFragmentId: "frag-drain-tunnel" },
    { pinId: "pin-crane", x: 77, y: 33, targetFragmentId: "frag-crane-gantry" },
  ],
};

test("GameCard renders a location card with local title and scene callout labels", () => {
  const markup = renderToStaticMarkup(
    React.createElement(GameCard, {
      type: "location",
      location: sampleLocation,
    }),
  );

  assert.match(markup, /The Drowned Gate District/);
  assert.match(
    markup,
    /Catwalks groan over dark water channels while the pumps thrum beneath the district\./,
  );
  assert.match(markup, /aspect-\[3\/2\]/);
  assert.match(markup, /left-3 top-3/);
  assert.match(markup, /bottom-3 right-3/);
  assert.match(markup, /text-lg\/\[0\.8\]/);
  assert.match(markup, /text-md\/\[0\.8\]/);
  assert.match(markup, /max-w-\[16rem\]/);
  assert.match(markup, /whitespace-normal/);
  assert.doesNotMatch(markup, /ImageCard-driven direction/);
  assert.doesNotMatch(markup, /drowned-gate-district/);
  assert.doesNotMatch(markup, /map pins/i);
});
