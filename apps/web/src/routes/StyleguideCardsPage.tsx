import type {
  AdventureModuleResolvedEncounter,
  AdventureModuleResolvedLocation,
  AdventureModuleResolvedQuest,
} from "@mighty-decks/spec/adventureModuleAuthoring";
import { Heading } from "../components/common/Heading";
import { Label } from "../components/common/Label";
import { Panel } from "../components/common/Panel";
import { Text } from "../components/common/Text";
import { GameCard } from "../components/styleguide/GameCard";
import { StyleguideSectionNav } from "../components/styleguide/StyleguideSectionNav";

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

const sampleQuest: AdventureModuleResolvedQuest = {
  fragmentId: "frag-quest-recover-shard",
  questId: "quest-recover-the-shard",
  questSlug: "recover-the-shard",
  title: "Recover the Shard",
  summary: "Retrieve a stolen lantern shard before rival factions claim it.",
  titleImageUrl: "/scenes/defending-an-underground-village.jpg",
  content: `## Hook

Recover the shard before the floodwall seals the district.

## Rising Trouble

- The district watch closes checkpoints one by one.
- Rivals trace the shard's signal through the rain.
- The route out collapses if the players stall.`,
};

export const StyleguideCardsPage = (): JSX.Element => {
  return (
    <div className="styleguide-cards-page app-shell stack gap-6 py-8">
      <StyleguideSectionNav />

      <div className="stack gap-2">
        <Label color="gold" className="self-start">
          Card Gallery
        </Label>
        <Heading
          level="h1"
          color="iron"
          className="relative z-0 text-[2.4rem] leading-none sm:text-[3.4rem] sm:leading-none"
          highlightProps={{
            color: "gold",
            lineHeight: 8,
            brushHeight: 6,
            lineOffsets: [0, 8, 14, 20],
            className:
              "left-1/2 bottom-[0.08em] h-[0.5em] w-[calc(100%+0.22em)] -translate-x-1/2",
          }}
        >
          Cards
        </Heading>
        <Text variant="body" color="iron-light" className="max-w-3xl text-sm">
          The card gallery keeps the supported directions together on one page
          so contributors can compare the shared frame, chip language, and
          summary treatment without bouncing between separate subpages.
        </Text>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <GameCard type="location" location={sampleLocation} />
        <GameCard type="encounter" encounter={sampleEncounter} />
        <GameCard type="quest" quest={sampleQuest} />
      </div>

      <Panel as="section" tone="bone" contentClassName="stack gap-2">
        <Text variant="h3" color="iron">
          Why this page exists
        </Text>
        <Text variant="body" color="iron-light" className="text-sm">
          Use this page when you want to compare the three supported `GameCard`
          directions side by side. The detailed card routes still exist for
          deeper inspection, but they are no longer the main styleguide entry
          point.
        </Text>
      </Panel>
    </div>
  );
};
