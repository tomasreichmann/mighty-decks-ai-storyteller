import type { AdventureModuleResolvedEncounter } from "@mighty-decks/spec/adventureModuleAuthoring";
import { Heading } from "../components/common/Heading";
import { Label } from "../components/common/Label";
import { Panel } from "../components/common/Panel";
import { Text } from "../components/common/Text";
import { GameCard, StyleguideBackLink } from "../components/styleguide/GameCard";

const sampleEncounter: AdventureModuleResolvedEncounter = {
  fragmentId: "frag-encounter-bridge-tribute",
  encounterSlug: "bridge-tribute-checkpoint",
  title: "Bridge Tribute Checkpoint",
  summary: "Pay, bluff, or break through an armored toll blockade.",
  prerequisites: "Suggested for level 3+ or while The Black Ledger is ongoing.",
  titleImageUrl: "/scenes/defending-an-underground-village.jpg",
  content: `## Goal

Get past the bridge before the tax captain closes the gates.

## Pressure

- The gate chain lowers one section every round.
- Guards call for reinforcements if talks stall.
- The tribute chest may hide the ledger clue.`,
};

export const StyleguideEncounterCardPage = (): JSX.Element => {
  return (
    <div className="app-shell stack gap-6 py-8">
      <StyleguideBackLink />

      <div className="stack gap-2">
        <Label variant="fire" className="self-start">
          Single Direction
        </Label>
        <Heading
          variant="h1"
          color="iron"
          className="text-[2.2rem] sm:text-[3.2rem]"
          highlightProps={{ color: "gold" }}
        >
          Encounter Card
        </Heading>
        <Text variant="body" color="iron-light" className="max-w-3xl text-sm">
          EncounterCard direction using the shared landscape 332x204 scene
          frame (the portrait-card size rotated), plus a fire title chip,
          warning icon medallion, and lighter full-width summary strip.
        </Text>
      </div>

      <Panel as="section" tone="fire" contentClassName="stack gap-3">
        <Text variant="h3" color="iron">
          {sampleEncounter.title}
        </Text>
        <Text variant="body" color="iron-light" className="text-sm">
          {sampleEncounter.summary}
        </Text>
        <Text variant="note" color="iron-light" className="text-xs !opacity-100">
          Prerequisites stay in the editor and detail surface, not on the
          compact card.
        </Text>
      </Panel>

      <Panel as="section" tone="bone" contentClassName="stack gap-4">
        <div className="stack gap-1">
          <Text variant="h3" color="iron" className="text-[1.7rem]">
            EncounterCard direction
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            The warning medallion reads faster at card size, while the fire
            title chip keeps the encounter classification color on the
            headline.
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            The icon medallion sits opposite the title, while the summary fills
            the lighter strip across the bottom edge.
          </Text>
        </div>

        <div className="flex justify-center">
          <GameCard type="encounter" encounter={sampleEncounter} />
        </div>
      </Panel>
    </div>
  );
};
