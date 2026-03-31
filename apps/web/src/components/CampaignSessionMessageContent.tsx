import { useGameCardCatalogContext } from "../lib/gameCardCatalogContext";
import { resolveEncounterCard } from "../lib/markdownEncounterComponents";
import { resolveGameCard } from "../lib/markdownGameComponents";
import { resolveQuestCard } from "../lib/markdownQuestComponents";
import { parseCampaignSessionMessageSegments } from "../lib/campaignSessionMessageSegments";
import { EncounterCardView } from "./adventure-module/EncounterCardView";
import { GameCardView } from "./adventure-module/GameCardView";
import { QuestCardView } from "./adventure-module/QuestCardView";

interface CampaignSessionMessageContentProps {
  text: string;
}

export const CampaignSessionMessageContent = ({
  text,
}: CampaignSessionMessageContentProps): JSX.Element => {
  const {
    actorsBySlug,
    countersBySlug,
    assetsBySlug,
    encountersBySlug,
    questsBySlug,
  } = useGameCardCatalogContext();
  const segments = parseCampaignSessionMessageSegments(text);

  return (
    <div className="whitespace-pre-wrap break-words text-inherit">
      {segments.map((segment, index) => {
        if (segment.kind === "text") {
          return <span key={`text-${index}`}>{segment.text}</span>;
        }

        if (segment.kind === "game_card") {
          const resolved = resolveGameCard(
            segment.type,
            segment.slug,
            actorsBySlug,
            countersBySlug,
            assetsBySlug,
            segment.modifierSlug,
          );

          return resolved ? (
            <div
              key={`game-card-${index}`}
              className="my-1 inline-block max-w-full align-middle"
            >
              <GameCardView gameCard={resolved} />
            </div>
          ) : (
            <span key={`game-card-fallback-${index}`}>{segment.token}</span>
          );
        }

        if (segment.kind === "encounter_card") {
          const resolved = resolveEncounterCard(segment.slug, encountersBySlug);

          return resolved ? (
            <div
              key={`encounter-card-${index}`}
              className="my-1 inline-block max-w-full align-middle"
            >
              <EncounterCardView encounter={resolved.encounter} />
            </div>
          ) : (
            <span key={`encounter-card-fallback-${index}`}>
              {segment.token}
            </span>
          );
        }

        const resolved = resolveQuestCard(segment.slug, questsBySlug);

        return resolved ? (
          <div
            key={`quest-card-${index}`}
            className="my-1 inline-block max-w-full align-middle"
          >
            <QuestCardView quest={resolved.quest} />
          </div>
        ) : (
          <span key={`quest-card-fallback-${index}`}>{segment.token}</span>
        );
      })}
    </div>
  );
};
