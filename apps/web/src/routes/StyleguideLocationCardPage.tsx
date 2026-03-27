import type { AdventureModuleResolvedLocation } from "@mighty-decks/spec/adventureModuleAuthoring";
import { Heading } from "../components/common/Heading";
import { Label } from "../components/common/Label";
import { Panel } from "../components/common/Panel";
import { Text } from "../components/common/Text";
import { GameCard, StyleguideBackLink } from "../components/styleguide/GameCard";

const sampleLocation: AdventureModuleResolvedLocation = {
  fragmentId: "frag-location-drowned-gate",
  locationSlug: "drowned-gate-district",
  title: "The Drowned Gate District",
  summary:
    "A half-submerged factory quarter with unstable walkways, rusted locks, and watch patrol routes.",
  titleImageUrl: "/scenes/defending-an-underground-village.jpg",
  introductionMarkdown: `## Situation

The district floods in pulses whenever the old pumps kick on. Catwalks groan above dark water channels, and every route offers speed at different risk.`,
  descriptionMarkdown: `## Pressure

- Patrol sweep interval tightens over time.
- Flood level rises when pumps restart.
- Rival crew marks player route with signal flares.`,
  mapImageUrl: "/maps/exiles-ship.png",
  mapPins: [
    { pinId: "pin-vault", x: 18, y: 26, targetFragmentId: "frag-vault-annex" },
    { pinId: "pin-drain", x: 52, y: 68, targetFragmentId: "frag-drain-tunnel" },
    { pinId: "pin-crane", x: 77, y: 33, targetFragmentId: "frag-crane-gantry" },
  ],
};

export const StyleguideLocationCardPage = (): JSX.Element => {
  return (
    <div className="app-shell stack gap-6 py-8">
      <StyleguideBackLink />

      <div className="stack gap-2">
        <Label variant="gold" className="self-start">
          Single Direction
        </Label>
        <Heading
          variant="h1"
          color="iron"
          className="text-[2.2rem] sm:text-[3.2rem]"
          highlightProps={{ color: "monster-light" }}
        >
          Location Card
        </Heading>
        <Text variant="body" color="iron-light" className="max-w-3xl text-sm">
          LocationCard direction with a 3:2 scene image, a gold title label, a
          cloth Location badge, and a full-width summary strip.
        </Text>
      </div>

      <Panel as="section" tone="gold" contentClassName="stack gap-3">
        <Text variant="h3" color="iron">
          {sampleLocation.title}
        </Text>
        <Text variant="body" color="iron-light" className="text-sm">
          {sampleLocation.summary}
        </Text>
      </Panel>

      <Panel as="section" tone="bone" contentClassName="stack gap-4">
        <div className="stack gap-1">
          <Text variant="h3" color="iron" className="text-[1.7rem]">
            LocationCard direction
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            The Location badge keeps this clearly distinct from the encounter
            card while preserving the same shared scene-card frame.
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            Location badge uses the cloth label tone, and the summary sits in a
            full-width bone strip instead of a floating callout.
          </Text>
        </div>

        <div className="flex justify-center">
          <GameCard type="location" location={sampleLocation} />
        </div>
      </Panel>
    </div>
  );
};
