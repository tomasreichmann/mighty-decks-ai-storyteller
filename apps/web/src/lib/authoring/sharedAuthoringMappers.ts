import type { AdventureModuleIndex } from "@mighty-decks/spec/adventureModule";
import type { AdventureModuleDetail } from "@mighty-decks/spec/adventureModuleAuthoring";
import { normalizeLegacyGameCardMarkdown } from "../gameCardMarkdown";
import type {
  ActorFormState,
  AssetFormState,
  BaseFormState,
  CounterFormState,
  EncounterFormState,
  LocationFormState,
  PlayerInfoFormState,
  QuestFormState,
  StorytellerInfoFormState,
  SummaryDetail,
} from "./sharedAuthoringTypes";

export const resolvePlayerSummaryState = (
  detail: SummaryDetail,
): {
  summaryMarkdown: string;
  infoText: string;
  fragmentId: string;
} | null => {
  const fragmentId = detail.index.playerSummaryFragmentId;
  const fragmentRef = detail.index.fragments.find(
    (fragment) => fragment.fragmentId === fragmentId,
  );
  const fragmentRecord = detail.fragments.find(
    (fragment) => fragment.fragment.fragmentId === fragmentId,
  );
  if (!fragmentRef || !fragmentRecord) {
    return null;
  }
  const summaryMarkdown =
    detail.index.playerSummaryMarkdown.trim().length > 0
      ? detail.index.playerSummaryMarkdown
      : (fragmentRef.summary ?? "");
  return {
    fragmentId,
    summaryMarkdown,
    infoText: fragmentRecord.content,
  };
};

export const resolveStorytellerSummaryState = (
  detail: SummaryDetail,
): {
  summaryMarkdown: string;
  infoText: string;
  fragmentId: string;
} | null => {
  const fragmentId = detail.index.storytellerSummaryFragmentId;
  const fragmentRef = detail.index.fragments.find(
    (fragment) => fragment.fragmentId === fragmentId,
  );
  const fragmentRecord = detail.fragments.find(
    (fragment) => fragment.fragment.fragmentId === fragmentId,
  );
  if (!fragmentRef || !fragmentRecord) {
    return null;
  }
  const summaryMarkdown =
    detail.index.storytellerSummaryMarkdown.trim().length > 0
      ? detail.index.storytellerSummaryMarkdown
      : (fragmentRef.summary ?? "");
  return {
    fragmentId,
    summaryMarkdown,
    infoText: fragmentRecord.content,
  };
};

export const toBaseFormState = (index: AdventureModuleIndex): BaseFormState => ({
  title: index.title,
  premise: index.premise,
  haveTags: [...index.dos],
  avoidTags: [...index.donts],
});

export const toPlayerInfoFormState = (
  detail: SummaryDetail,
): PlayerInfoFormState => {
  const summaryState = resolvePlayerSummaryState(detail);
  if (!summaryState) {
    return {
      summary: "",
      infoText: "",
    };
  }
  return {
    summary: normalizeLegacyGameCardMarkdown(summaryState.summaryMarkdown),
    infoText: normalizeLegacyGameCardMarkdown(summaryState.infoText),
  };
};

export const toStorytellerInfoFormState = (
  detail: SummaryDetail,
): StorytellerInfoFormState => {
  const summaryState = resolveStorytellerSummaryState(detail);
  if (!summaryState) {
    return {
      summary: "",
      infoText: "",
    };
  }
  return {
    summary: normalizeLegacyGameCardMarkdown(summaryState.summaryMarkdown),
    infoText: normalizeLegacyGameCardMarkdown(summaryState.infoText),
  };
};

export const toActorFormState = (
  actor: AdventureModuleDetail["actors"][number],
): ActorFormState => ({
  fragmentId: actor.fragmentId,
  actorSlug: actor.actorSlug,
  title: actor.title,
  summary: actor.summary ?? "",
  baseLayerSlug: actor.baseLayerSlug,
  tacticalRoleSlug: actor.tacticalRoleSlug,
  tacticalSpecialSlug: actor.tacticalSpecialSlug,
  isPlayerCharacter: actor.isPlayerCharacter,
  content: normalizeLegacyGameCardMarkdown(actor.content),
});

export const toCounterFormState = (
  counter: AdventureModuleDetail["counters"][number],
): CounterFormState => ({
  slug: counter.slug,
  title: counter.title,
  iconSlug: counter.iconSlug,
  currentValue: counter.currentValue,
  maxValue: counter.maxValue,
  description: counter.description ?? "",
});

export const toAssetFormState = (
  asset: AdventureModuleDetail["assets"][number],
): AssetFormState => ({
  fragmentId: asset.fragmentId,
  assetSlug: asset.assetSlug,
  title: asset.title,
  summary: asset.summary ?? "",
  modifier: asset.kind === "custom" ? asset.modifier : "",
  noun: asset.kind === "custom" ? asset.noun : "",
  nounDescription: asset.kind === "custom" ? asset.nounDescription : "",
  adjectiveDescription:
    asset.kind === "custom" ? asset.adjectiveDescription : "",
  iconUrl: asset.kind === "custom" ? asset.iconUrl : "",
  overlayUrl: asset.kind === "custom" ? asset.overlayUrl : "",
  content: normalizeLegacyGameCardMarkdown(asset.content),
  reauthorRequired: asset.kind === "legacy_layered",
});

export const toLocationFormState = (
  location: AdventureModuleDetail["locations"][number],
): LocationFormState => ({
  fragmentId: location.fragmentId,
  locationSlug: location.locationSlug,
  title: location.title,
  summary: location.summary ?? "",
  titleImageUrl: location.titleImageUrl ?? "",
  introductionMarkdown: normalizeLegacyGameCardMarkdown(
    location.introductionMarkdown,
  ),
  descriptionMarkdown: normalizeLegacyGameCardMarkdown(
    location.descriptionMarkdown,
  ),
  mapImageUrl: location.mapImageUrl ?? "",
  mapPins: location.mapPins.map((pin) => ({ ...pin })),
});

export const toEncounterFormState = (
  encounter: AdventureModuleDetail["encounters"][number],
): EncounterFormState => ({
  fragmentId: encounter.fragmentId,
  encounterSlug: encounter.encounterSlug,
  title: encounter.title,
  summary: encounter.summary ?? "",
  prerequisites: encounter.prerequisites,
  titleImageUrl: encounter.titleImageUrl ?? "",
  content: normalizeLegacyGameCardMarkdown(encounter.content),
});

export const toQuestFormState = (
  quest: AdventureModuleDetail["quests"][number],
): QuestFormState => ({
  fragmentId: quest.fragmentId,
  questSlug: quest.questSlug,
  title: quest.title,
  summary: quest.summary ?? "",
  titleImageUrl: quest.titleImageUrl ?? "",
  content: normalizeLegacyGameCardMarkdown(quest.content),
});
