import { useGameCardCatalogContext } from "../lib/gameCardCatalogContext";
import type { CampaignSessionMessageSegment } from "../lib/campaignSessionMessageSegments";
import { resolveEncounterCard } from "../lib/markdownEncounterComponents";
import { resolveGameCard } from "../lib/markdownGameComponents";
import { resolveQuestCard } from "../lib/markdownQuestComponents";
import { parseCampaignSessionMessageSegments } from "../lib/campaignSessionMessageSegments";
import { cn } from "../utils/cn";
import { ActorCard } from "./cards/ActorCard";
import { EncounterCardView } from "./adventure-module/EncounterCardView";
import { GameCardView } from "./adventure-module/GameCardView";
import { QuestCardView } from "./adventure-module/QuestCardView";
import { CardBoundary } from "./common/CardBoundary";

interface CampaignSessionMessageContentProps {
  text: string;
  claimedActorTitle?: string;
}

const normalizeActorTitle = (value: string): string =>
  value.trim().replace(/\s+/g, " ").toLocaleLowerCase();

const isRenderableCardSegment = (
  segment: CampaignSessionMessageSegment,
): segment is Extract<
  CampaignSessionMessageSegment,
  { kind: "game_card" | "encounter_card" | "quest_card" }
> =>
  segment.kind === "game_card" ||
  segment.kind === "encounter_card" ||
  segment.kind === "quest_card";

const getPlayedCardLayout = (
  segments: readonly CampaignSessionMessageSegment[],
):
  | {
      prefix: string;
      cards: Array<
        Extract<
          CampaignSessionMessageSegment,
          { kind: "game_card" | "encounter_card" | "quest_card" }
        >
      >;
    }
  | null => {
  if (segments.length < 2) {
    return null;
  }

  const [firstSegment, ...remainingSegments] = segments;
  if (
    !firstSegment ||
    firstSegment.kind !== "text" ||
    !firstSegment.text.trimEnd().endsWith("played:")
  ) {
    return null;
  }

  const cards = remainingSegments.filter(isRenderableCardSegment);
  if (cards.length === 0) {
    return null;
  }

  const onlyCardSeparators = remainingSegments.every((segment) => {
    if (isRenderableCardSegment(segment)) {
      return true;
    }

    return segment.kind === "text" && /^[\s,.;!?]*$/.test(segment.text);
  });

  if (!onlyCardSeparators) {
    return null;
  }

  return {
    prefix: firstSegment.text.trimEnd(),
    cards,
  };
};

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
        <CardBoundary
          resetKey={`actor-${normalizeActorTitle(actor.title)}`}
          label="Card failed to render"
          message="This character card could not render."
        >
          <ActorCard
            className="w-full max-w-[13rem] shrink-0"
            baseLayerSlug={actor.baseLayerSlug}
            tacticalRoleSlug={actor.tacticalRoleSlug}
            tacticalSpecialSlug={actor.tacticalSpecialSlug ?? undefined}
          />
        </CardBoundary>
        <div className="stack min-w-0 flex-1 gap-1">
          <span className="font-semibold">{actor.title}</span>
          <span className="text-sm text-kac-iron-light">
            {actor.summary ?? "No summary yet."}
          </span>
        </div>
      </div>
    );
  }

  const renderCardSegment = (
    segment: Extract<
      CampaignSessionMessageSegment,
      { kind: "game_card" | "encounter_card" | "quest_card" }
    >,
    key: string,
    block = false,
  ): JSX.Element => {
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
          key={key}
          className={cn(
            "my-1 max-w-full",
            block ? "block" : "inline-block align-middle",
          )}
        >
          <CardBoundary
            resetKey={`game-card-${segment.type}-${segment.slug}-${segment.modifierSlug ?? "base"}`}
            label="Card failed to render"
            message="This card could not render."
          >
            <GameCardView gameCard={resolved} />
          </CardBoundary>
        </div>
      ) : (
        <span key={`${key}-fallback`}>{segment.token}</span>
      );
    }

    if (segment.kind === "encounter_card") {
      const resolved = resolveEncounterCard(segment.slug, encountersBySlug);

      return resolved ? (
        <div
          key={key}
          className={cn(
            "my-1 max-w-full",
            block ? "block" : "inline-block align-middle",
          )}
        >
          <CardBoundary
            resetKey={`encounter-card-${segment.slug}`}
            label="Card failed to render"
            message="This encounter card could not render."
          >
            <EncounterCardView encounter={resolved.encounter} />
          </CardBoundary>
        </div>
      ) : (
        <span key={`${key}-fallback`}>{segment.token}</span>
      );
    }

    const resolved = resolveQuestCard(segment.slug, questsBySlug);

    return resolved ? (
      <div
        key={key}
        className={cn(
          "my-1 max-w-full",
          block ? "block" : "inline-block align-middle",
        )}
      >
        <CardBoundary
          resetKey={`quest-card-${segment.slug}`}
          label="Card failed to render"
          message="This quest card could not render."
        >
          <QuestCardView quest={resolved.quest} />
        </CardBoundary>
      </div>
    ) : (
      <span key={`${key}-fallback`}>{segment.token}</span>
    );
  };

  const playedCardLayout = getPlayedCardLayout(segments);
  if (playedCardLayout) {
    return (
      <div className="break-words text-inherit">
        <span className="whitespace-pre-wrap">{playedCardLayout.prefix}</span>
        <div className="mt-2 flex flex-wrap items-start gap-2">
          {playedCardLayout.cards.map((segment, index) =>
            renderCardSegment(segment, `played-card-${index}`, true),
          )}
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
          return renderCardSegment(segment, `game-card-${index}`);
        }

        if (segment.kind === "encounter_card") {
          return renderCardSegment(segment, `encounter-card-${index}`);
        }

        return renderCardSegment(segment, `quest-card-${index}`);
      })}
    </div>
  );
};
