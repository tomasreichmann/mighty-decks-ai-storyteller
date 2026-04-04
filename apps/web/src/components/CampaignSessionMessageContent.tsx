import { useGameCardCatalogContext } from "../lib/gameCardCatalogContext";
import { resolveEncounterCard } from "../lib/markdownEncounterComponents";
import { resolveGameCard } from "../lib/markdownGameComponents";
import { resolveQuestCard } from "../lib/markdownQuestComponents";
import { parseCampaignSessionMessageSegments } from "../lib/campaignSessionMessageSegments";
import { ActorCard } from "./cards/ActorCard";
import { EncounterCardView } from "./adventure-module/EncounterCardView";
import { GameCardView } from "./adventure-module/GameCardView";
import { QuestCardView } from "./adventure-module/QuestCardView";

interface CampaignSessionMessageContentProps {
  text: string;
  claimedActorTitle?: string;
}

const normalizeActorTitle = (value: string): string =>
  value.trim().replace(/\s+/g, " ").toLocaleLowerCase();

export const CampaignSessionMessageContent = ({
  text,
  claimedActorTitle,
}: CampaignSessionMessageContentProps): JSX.Element => {
  const {
    actors,
    actorsBySlug,
    countersBySlug,
    assetsBySlug,
    encountersBySlug,
    questsBySlug,
  } = useGameCardCatalogContext();
  const actor = claimedActorTitle
    ? actors.find(
        (candidate) =>
          normalizeActorTitle(candidate.title) ===
          normalizeActorTitle(claimedActorTitle),
      ) ?? null
    : null;
  const segments = parseCampaignSessionMessageSegments(text);

  if (actor) {
    return (
      <div className="flex flex-wrap items-start gap-4">
        <ActorCard
          className="w-full max-w-[13rem] shrink-0"
          baseLayerSlug={actor.baseLayerSlug}
          tacticalRoleSlug={actor.tacticalRoleSlug}
          tacticalSpecialSlug={actor.tacticalSpecialSlug ?? undefined}
        />
        <div className="stack min-w-0 flex-1 gap-1">
          <span className="font-semibold">{actor.title}</span>
          <span className="text-sm text-kac-iron-light">
            {actor.summary ?? "No summary yet."}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="whitespace-pre-wrap break-words text-inherit">
      {segments.map((segment, index) => {
        if (segment.kind === "text") {
          return <span key={`text-${index}`}>{segment.text}</span>;
        }

        if (segment.kind === "markdown_image") {
          return (
            <span
              key={`markdown-image-${index}`}
              className="my-2 block max-w-full overflow-hidden rounded-sm border-2 border-kac-iron/20 bg-kac-bone-light/40 p-1"
            >
              <img
                src={segment.src}
                alt={segment.altText}
                loading="lazy"
                className="h-auto max-h-72 w-full rounded-sm object-cover"
              />
            </span>
          );
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
