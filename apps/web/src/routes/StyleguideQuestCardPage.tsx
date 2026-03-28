import type { AdventureModuleResolvedQuest } from "@mighty-decks/spec/adventureModuleAuthoring";
import { Heading } from "../components/common/Heading";
import { Label } from "../components/common/Label";
import { Panel } from "../components/common/Panel";
import { Text } from "../components/common/Text";
import { GameCard, StyleguideBackLink } from "../components/styleguide/GameCard";

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

export const StyleguideQuestCardPage = (): JSX.Element => {
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
          highlightProps={{ color: "gold-dark" }}
        >
          Quest Card
        </Heading>
        <Text variant="body" color="iron-light" className="max-w-3xl text-sm">
          QuestCard direction with the shared smaller 3:2 scene frame, a gold
          title chip, a scroll icon medallion, and a lighter full-width summary
          strip.
        </Text>
      </div>

      <Panel as="section" tone="gold" contentClassName="stack gap-3">
        <Text variant="h3" color="iron">
          {sampleQuest.title}
        </Text>
        <Text variant="body" color="iron-light" className="text-sm">
          {sampleQuest.summary}
        </Text>
      </Panel>

      <Panel as="section" tone="bone" contentClassName="stack gap-4">
        <div className="stack gap-1">
          <Text variant="h3" color="iron" className="text-[1.7rem]">
            QuestCard direction
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            The scroll icon medallion gives quest embeds their own silhouette
            while still keeping the shared scene-card frame intact.
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            The gold title chip keeps the quest callout prominent while the
            summary stays in the lighter strip across the bottom edge.
          </Text>
        </div>

        <div className="flex justify-center">
          <GameCard type="quest" quest={sampleQuest} />
        </div>
      </Panel>
    </div>
  );
};
