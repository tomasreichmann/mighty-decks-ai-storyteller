import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type {
  AdventureModuleResolvedEncounter,
  AdventureModuleResolvedLocation,
} from "@mighty-decks/spec/adventureModuleAuthoring";

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

const sampleEncounter: AdventureModuleResolvedEncounter = {
  fragmentId: "frag-encounter-bridge-tribute",
  encounterSlug: "bridge-tribute-checkpoint",
  title: "Bridge Tribute Checkpoint",
  summary: "Pay, bluff, or break through an armored toll blockade.",
  prerequisites: "Suggested for level 3+ or while The Black Ledger is ongoing.",
  titleImageUrl: "/scenes/defending-an-underground-village.jpg",
  content:
    "## Goal\n\nGet past the bridge before the tax captain closes the gates.",
};

test("GameCard renders a location card with a visible Location badge and full-width summary strip", () => {
  const markup = renderToStaticMarkup(
    React.createElement(GameCard, {
      type: "location",
      location: sampleLocation,
    }),
  );

  assert.match(markup, /The Drowned Gate District/);
  assert.match(markup, /Location/);
  assert.match(
    markup,
    /Catwalks groan over dark water channels while the pumps thrum beneath the district\./,
  );
  assert.match(markup, /aspect-\[3\/2\]/);
  assert.match(markup, /left-3 top-3/);
  assert.match(markup, /right-3 top-3/);
  assert.match(markup, /bottom-0/);
  assert.match(markup, /w-full/);
  assert.match(markup, /text-lg\/\[0\.8\]/);
  assert.match(markup, /text-md\/\[0\.8\]/);
  assert.match(markup, /rotate=\{false\}|-rotate-\[1\.5deg\]/);
  assert.match(markup, /whitespace-normal/);
  assert.doesNotMatch(markup, /ImageCard-driven direction/);
  assert.doesNotMatch(markup, /drowned-gate-district/);
  assert.doesNotMatch(markup, /map pins/i);
});

test("GameCard renders an encounter card with a visible Encounter badge and encounter summary strip", () => {
  const markup = renderToStaticMarkup(
    React.createElement(GameCard, {
      type: "encounter",
      encounter: sampleEncounter,
    }),
  );

  assert.match(markup, /Bridge Tribute Checkpoint/);
  assert.match(markup, /Encounter/);
  assert.match(markup, /Pay, bluff, or break through an armored toll blockade\./);
  assert.match(markup, /aspect-\[3\/2\]/);
  assert.match(markup, /left-3 top-3/);
  assert.match(markup, /right-3 top-3/);
  assert.match(markup, /bottom-0/);
  assert.match(markup, /w-full/);
  assert.doesNotMatch(markup, /Suggested for level 3\+/);
});
