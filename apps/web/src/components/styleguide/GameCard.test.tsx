import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type {
  AdventureModuleResolvedEncounter,
  AdventureModuleResolvedLocation,
  AdventureModuleResolvedQuest,
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

const sampleQuest: AdventureModuleResolvedQuest = {
  fragmentId: "frag-quest-recover-shard",
  questId: "quest-recover-the-shard",
  questSlug: "recover-the-shard",
  title: "Recover the Shard",
  summary: "Retrieve a stolen lantern shard before rival factions claim it.",
  titleImageUrl: "/scenes/defending-an-underground-village.jpg",
  content:
    "## Hook\n\nRecover the shard before the floodwall seals the district.",
};

test("GameCard renders location content without leaking internal location metadata", () => {
  const markup = renderToStaticMarkup(
    React.createElement(GameCard, {
      type: "location",
      location: sampleLocation,
    }),
  );

  assert.match(markup, /The Drowned Gate District/);
  assert.match(
    markup,
    /Catwalks groan over dark water channels while the pumps[\s\S]*thrum beneath the district\./,
  );
  assert.doesNotMatch(markup, /ImageCard-driven direction/);
  assert.doesNotMatch(markup, /drowned-gate-district/);
  assert.doesNotMatch(markup, /map pins/i);
});

test("GameCard renders encounter content without leaking prerequisites", () => {
  const markup = renderToStaticMarkup(
    React.createElement(GameCard, {
      type: "encounter",
      encounter: sampleEncounter,
    }),
  );

  assert.match(markup, /Bridge Tribute Checkpoint/);
  assert.match(markup, /Pay, bluff, or break through an armored toll blockade\./);
  assert.doesNotMatch(markup, /Suggested for level 3\+/);
});

test("GameCard renders quest content without leaking the quest slug", () => {
  const markup = renderToStaticMarkup(
    React.createElement(GameCard, {
      type: "quest",
      quest: sampleQuest,
    }),
  );

  assert.match(markup, /Recover the Shard/);
  assert.match(
    markup,
    /Retrieve a stolen lantern shard before rival factions[\s\S]*claim it\./,
  );
  assert.doesNotMatch(markup, /recover-the-shard/);
});
