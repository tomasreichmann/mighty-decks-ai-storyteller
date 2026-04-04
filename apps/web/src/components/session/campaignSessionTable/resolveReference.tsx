import type {
  CampaignDetail,
  CampaignSessionTableCardReference,
} from "@mighty-decks/spec/campaign";
import { resolveGameCard } from "../../../lib/markdownGameComponents";
import {
  EncounterCardView,
  InvalidEncounterCardView,
} from "../../adventure-module/EncounterCardView";
import { GameCardView } from "../../adventure-module/GameCardView";
import { LocationCardView } from "../../adventure-module/LocationCardView";
import {
  InvalidQuestCardView,
  QuestCardView,
} from "../../adventure-module/QuestCardView";
import { AssetCard } from "../../cards/AssetCard";
import { CounterCard } from "../../cards/CounterCard";
import { makeReferenceTitle } from "./utils";

const compactCardClassName = "w-full max-w-[6.5rem]";

const InvalidTableCard = ({
  title,
}: {
  title: string;
}): JSX.Element => (
  <article
    className="relative flex aspect-[204/332] w-[6.5rem] max-w-[6.5rem] flex-col justify-between rounded-[0.6rem] border-2 border-dashed border-kac-blood-dark/70 bg-kac-bone-light/80 p-3 text-left shadow-[2px_2px_0_0_#121b23]"
    aria-label={title}
  >
    <div className="stack gap-1">
      <span className="font-ui text-[9px] font-bold uppercase tracking-[0.08em] text-kac-blood-dark">
        Missing Card
      </span>
      <span className="font-md-heading text-[15px] font-bold leading-tight text-kac-iron">
        {title}
      </span>
    </div>
    <p className="font-ui text-[10px] leading-[1.3] text-kac-iron-light">
      Source was removed or renamed. Storyteller can remove this card.
    </p>
  </article>
);

export interface RenderedReference {
  title: string;
  node: JSX.Element;
}

export const resolveReference = (
  card: CampaignSessionTableCardReference,
  campaign: CampaignDetail | null,
): RenderedReference => {
  const actorsBySlug = new Map(
    (campaign?.actors ?? []).map((actor) => [
      actor.actorSlug.toLocaleLowerCase(),
      actor,
    ] as const),
  );
  const countersBySlug = new Map(
    (campaign?.counters ?? []).map((counter) => [
      counter.slug.toLocaleLowerCase(),
      counter,
    ] as const),
  );
  const assetsBySlug = new Map(
    (campaign?.assets ?? []).map((asset) => [
      asset.assetSlug.toLocaleLowerCase(),
      asset,
    ] as const),
  );
  const locationsBySlug = new Map(
    (campaign?.locations ?? []).map((location) => [
      location.locationSlug.toLocaleLowerCase(),
      location,
    ] as const),
  );
  const encountersBySlug = new Map(
    (campaign?.encounters ?? []).map((encounter) => [
      encounter.encounterSlug.toLocaleLowerCase(),
      encounter,
    ] as const),
  );
  const questsBySlug = new Map(
    (campaign?.quests ?? []).map((quest) => [
      quest.questSlug.toLocaleLowerCase(),
      quest,
    ] as const),
  );

  if (card.type === "LocationCard") {
    const location = locationsBySlug.get(card.slug.toLocaleLowerCase());
    if (!location) {
      return {
        title: makeReferenceTitle(card),
        node: <InvalidTableCard title={makeReferenceTitle(card)} />,
      };
    }
    return {
      title: location.title,
      node: <LocationCardView location={location} />,
    };
  }

  if (card.type === "EncounterCard") {
    const encounter = encountersBySlug.get(card.slug.toLocaleLowerCase());
    if (!encounter) {
      return {
        title: makeReferenceTitle(card),
        node: <InvalidEncounterCardView slug={card.slug} />,
      };
    }
    return {
      title: encounter.title,
      node: <EncounterCardView encounter={encounter} />,
    };
  }

  if (card.type === "QuestCard") {
    const quest = questsBySlug.get(card.slug.toLocaleLowerCase());
    if (!quest) {
      return {
        title: makeReferenceTitle(card),
        node: <InvalidQuestCardView slug={card.slug} />,
      };
    }
    return {
      title: quest.title,
      node: <QuestCardView quest={quest} />,
    };
  }

  const resolved = resolveGameCard(
    card.type,
    card.slug,
    actorsBySlug,
    countersBySlug,
    assetsBySlug,
    card.type === "AssetCard" ? card.modifierSlug : undefined,
  );

  if (!resolved) {
    return {
      title: makeReferenceTitle(card),
      node: <InvalidTableCard title={makeReferenceTitle(card)} />,
    };
  }

  if (
    resolved.type === "OutcomeCard" ||
    resolved.type === "EffectCard" ||
    resolved.type === "StuntCard" ||
    resolved.type === "ActorCard"
  ) {
    return {
      title:
        resolved.type === "ActorCard" ? resolved.actor.title : resolved.card.title,
      node: <GameCardView gameCard={resolved} className={compactCardClassName} />,
    };
  }

  if (resolved.type === "CounterCard") {
    return {
      title: resolved.counter.title,
      node: (
        <CounterCard
          className={compactCardClassName}
          iconSlug={resolved.counter.iconSlug}
          title={resolved.counter.title}
          currentValue={resolved.counter.currentValue}
          maxValue={resolved.counter.maxValue}
          description={resolved.counter.description}
        />
      ),
    };
  }

  if (resolved.asset.kind === "custom") {
    return {
      title: resolved.asset.title,
      node: (
        <AssetCard
          kind="custom"
          modifier={resolved.asset.modifier}
          noun={resolved.asset.noun}
          nounDescription={resolved.asset.nounDescription}
          adjectiveDescription={resolved.asset.adjectiveDescription}
          iconUrl={resolved.asset.iconUrl}
          overlayUrl={resolved.asset.overlayUrl}
          className={compactCardClassName}
        />
      ),
    };
  }

  if (resolved.asset.kind === "legacy_layered") {
    return {
      title: resolved.asset.title,
      node: (
        <AssetCard
          kind="legacy_layered"
          title={resolved.asset.title}
          className={compactCardClassName}
        />
      ),
    };
  }

  return {
    title: resolved.asset.title,
    node: (
      <AssetCard
        baseAssetSlug={resolved.asset.baseAssetSlug}
        modifierSlug={resolved.asset.modifierSlug}
        className={compactCardClassName}
      />
    ),
  };
};
