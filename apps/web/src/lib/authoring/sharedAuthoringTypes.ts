import type { AdventureModuleIndex } from "@mighty-decks/spec/adventureModule";
import type { AdventureModuleDetail } from "@mighty-decks/spec/adventureModuleAuthoring";

export interface BaseFormState {
  title: string;
  premise: string;
  haveTags: string[];
  avoidTags: string[];
}

export interface PlayerInfoFormState {
  summary: string;
  infoText: string;
}

export interface StorytellerInfoFormState {
  summary: string;
  infoText: string;
}

export interface ActorFormState {
  fragmentId: string;
  actorSlug: string;
  title: string;
  summary: string;
  baseLayerSlug: AdventureModuleDetail["actors"][number]["baseLayerSlug"];
  tacticalRoleSlug: AdventureModuleDetail["actors"][number]["tacticalRoleSlug"];
  tacticalSpecialSlug?: AdventureModuleDetail["actors"][number]["tacticalSpecialSlug"];
  isPlayerCharacter: boolean;
  content: string;
}

export interface CounterFormState {
  slug: string;
  title: string;
  iconSlug: AdventureModuleDetail["counters"][number]["iconSlug"];
  currentValue: number;
  maxValue?: number;
  description: string;
}

export interface AssetFormState {
  fragmentId: string;
  assetSlug: string;
  title: string;
  summary: string;
  modifier: string;
  noun: string;
  nounDescription: string;
  adjectiveDescription: string;
  iconUrl: string;
  overlayUrl: string;
  content: string;
  reauthorRequired: boolean;
}

export interface LocationFormState {
  fragmentId: string;
  locationSlug: string;
  title: string;
  summary: string;
  titleImageUrl: string;
  introductionMarkdown: string;
  descriptionMarkdown: string;
  mapImageUrl: string;
  mapPins: AdventureModuleDetail["locations"][number]["mapPins"];
}

export interface EncounterFormState {
  fragmentId: string;
  encounterSlug: string;
  title: string;
  summary: string;
  prerequisites: string;
  titleImageUrl: string;
  content: string;
}

export interface QuestFormState {
  fragmentId: string;
  questSlug: string;
  title: string;
  summary: string;
  titleImageUrl: string;
  content: string;
}

export type SummaryDetail = Pick<AdventureModuleDetail, "index" | "fragments">;
export type DetailWithCounters = Pick<AdventureModuleDetail, "index" | "counters">;
export type BaseIndexState = AdventureModuleIndex;
