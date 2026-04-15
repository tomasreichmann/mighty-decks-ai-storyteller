import {
  clampCounterValue,
  replaceCounterInDetail,
  resolvePlayerSummaryState,
  resolveStorytellerSummaryState,
} from "../sharedAuthoring";
import { toMarkdownPlainTextSnippet } from "../../markdownSnippet";
import type {
  AuthoringFormKey,
  EntityFormKey,
  SharedAuthoringDetail,
} from "./authoringStoreTypes";

export const ACTIVE_EDITOR_FOR_TAB: Record<string, AuthoringFormKey | null> = {
  base: "base",
  "player-info": "playerInfo",
  "storyteller-info": "storytellerInfo",
  actors: "actor",
  locations: "location",
  encounters: "encounter",
  quests: "quest",
  counters: "counter",
  assets: "asset",
};

export const ENTITY_FORM_FOR_TAB: Record<string, EntityFormKey> = {
  actors: "actor",
  locations: "location",
  encounters: "encounter",
  quests: "quest",
  counters: "counter",
  assets: "asset",
};

export const buildSavedMessage = (): string =>
  `at ${new Date().toLocaleTimeString()}`;

export const resolveActiveEditorForm = (
  activeTab: string,
  entityId: string | undefined,
): AuthoringFormKey | null => {
  const form = ACTIVE_EDITOR_FOR_TAB[activeTab] ?? null;
  if (
    (form === "actor" ||
      form === "location" ||
      form === "encounter" ||
      form === "quest" ||
      form === "counter" ||
      form === "asset") &&
    !entityId
  ) {
    return null;
  }
  return form;
};

export const cloneDetail = <TDetail extends SharedAuthoringDetail>(
  detail: TDetail,
): TDetail => JSON.parse(JSON.stringify(detail)) as TDetail;

interface OptimisticForms<TDetail extends SharedAuthoringDetail> {
  base: {
    title: string;
    premise: string;
    haveTags: string[];
    avoidTags: string[];
  };
  playerInfo: {
    summary: string;
    infoText: string;
  };
  storytellerInfo: {
    summary: string;
    infoText: string;
  };
  actor: {
    actorSlug: string;
    title: string;
    summary: string;
    baseLayerSlug: TDetail["actors"][number]["baseLayerSlug"];
    tacticalRoleSlug: TDetail["actors"][number]["tacticalRoleSlug"];
    tacticalSpecialSlug?: TDetail["actors"][number]["tacticalSpecialSlug"];
    isPlayerCharacter: boolean;
    content: string;
  } | null;
  location: {
    locationSlug: string;
    title: string;
    summary: string;
    titleImageUrl: string;
    introductionMarkdown: string;
    descriptionMarkdown: string;
    mapImageUrl: string;
    mapPins: TDetail["locations"][number]["mapPins"];
  } | null;
  encounter: {
    encounterSlug: string;
    title: string;
    summary: string;
    prerequisites: string;
    titleImageUrl: string;
    content: string;
  } | null;
  quest: {
    questSlug: string;
    title: string;
    summary: string;
    titleImageUrl: string;
    content: string;
  } | null;
  counter: {
    slug: string;
    title: string;
    iconSlug: string;
    currentValue: number;
    maxValue?: number;
    description: string;
  } | null;
  asset: {
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
  } | null;
}

export const buildOptimisticDetail = <TDetail extends SharedAuthoringDetail>(
  detail: TDetail,
  form: AuthoringFormKey,
  forms: OptimisticForms<TDetail>,
): TDetail | undefined => {
  const nextDetail = cloneDetail(detail);

  if (form === "base") {
    nextDetail.index = {
      ...nextDetail.index,
      title: forms.base.title,
      premise: forms.base.premise,
      dos: [...forms.base.haveTags],
      donts: [...forms.base.avoidTags],
    };
    return nextDetail;
  }

  if (form === "playerInfo") {
    const summaryState = resolvePlayerSummaryState(detail);
    if (!summaryState) {
      return undefined;
    }
    const nextSummarySnippet = toMarkdownPlainTextSnippet(
      forms.playerInfo.summary,
      500,
    ).trim();
    nextDetail.index = {
      ...nextDetail.index,
      playerSummaryMarkdown: forms.playerInfo.summary,
      fragments: nextDetail.index.fragments.map((fragment) =>
        fragment.fragmentId === summaryState.fragmentId
          ? {
              ...fragment,
              summary: nextSummarySnippet.length > 0 ? nextSummarySnippet : undefined,
            }
          : fragment,
      ),
    };
    nextDetail.fragments = nextDetail.fragments.map((fragment) =>
      fragment.fragment.fragmentId === summaryState.fragmentId
        ? { ...fragment, content: forms.playerInfo.infoText }
        : fragment,
    );
    return nextDetail;
  }

  if (form === "storytellerInfo") {
    const summaryState = resolveStorytellerSummaryState(detail);
    if (!summaryState) {
      return undefined;
    }
    const nextSummarySnippet = toMarkdownPlainTextSnippet(
      forms.storytellerInfo.summary,
      500,
    ).trim();
    nextDetail.index = {
      ...nextDetail.index,
      storytellerSummaryMarkdown: forms.storytellerInfo.summary,
      fragments: nextDetail.index.fragments.map((fragment) =>
        fragment.fragmentId === summaryState.fragmentId
          ? {
              ...fragment,
              summary: nextSummarySnippet.length > 0 ? nextSummarySnippet : undefined,
            }
          : fragment,
      ),
    };
    nextDetail.fragments = nextDetail.fragments.map((fragment) =>
      fragment.fragment.fragmentId === summaryState.fragmentId
        ? { ...fragment, content: forms.storytellerInfo.infoText }
        : fragment,
    );
    return nextDetail;
  }

  if (form === "actor" && forms.actor) {
    nextDetail.actors = nextDetail.actors.map((entry) =>
      entry.actorSlug === forms.actor?.actorSlug
        ? {
            ...entry,
            title: forms.actor.title,
            summary: forms.actor.summary,
            baseLayerSlug: forms.actor.baseLayerSlug,
            tacticalRoleSlug: forms.actor.tacticalRoleSlug,
            tacticalSpecialSlug: forms.actor.tacticalSpecialSlug,
            isPlayerCharacter: forms.actor.isPlayerCharacter,
            content: forms.actor.content,
          }
        : entry,
    ) as TDetail["actors"];
    return nextDetail;
  }

  if (form === "location" && forms.location) {
    nextDetail.locations = nextDetail.locations.map((entry) =>
      entry.locationSlug === forms.location?.locationSlug
        ? {
            ...entry,
            title: forms.location.title,
            summary: forms.location.summary,
            titleImageUrl:
              forms.location.titleImageUrl.trim().length > 0
                ? forms.location.titleImageUrl
                : undefined,
            introductionMarkdown: forms.location.introductionMarkdown,
            descriptionMarkdown: forms.location.descriptionMarkdown,
            mapImageUrl:
              forms.location.mapImageUrl.trim().length > 0
                ? forms.location.mapImageUrl
                : undefined,
            mapPins: forms.location.mapPins,
          }
        : entry,
    ) as TDetail["locations"];
    return nextDetail;
  }

  if (form === "encounter" && forms.encounter) {
    nextDetail.encounters = nextDetail.encounters.map((entry) =>
      entry.encounterSlug === forms.encounter?.encounterSlug
        ? {
            ...entry,
            title: forms.encounter.title,
            summary: forms.encounter.summary,
            prerequisites: forms.encounter.prerequisites,
            titleImageUrl:
              forms.encounter.titleImageUrl.trim().length > 0
                ? forms.encounter.titleImageUrl
                : undefined,
            content: forms.encounter.content,
          }
        : entry,
    ) as TDetail["encounters"];
    return nextDetail;
  }

  if (form === "quest" && forms.quest) {
    nextDetail.quests = nextDetail.quests.map((entry) =>
      entry.questSlug === forms.quest?.questSlug
        ? {
            ...entry,
            title: forms.quest.title,
            summary: forms.quest.summary,
            titleImageUrl:
              forms.quest.titleImageUrl.trim().length > 0
                ? forms.quest.titleImageUrl
                : undefined,
            content: forms.quest.content,
          }
        : entry,
    ) as TDetail["quests"];
    return nextDetail;
  }

  if (form === "counter" && forms.counter) {
    return replaceCounterInDetail(nextDetail, {
      slug: forms.counter.slug,
      title: forms.counter.title,
      iconSlug: forms.counter.iconSlug as TDetail["counters"][number]["iconSlug"],
      currentValue: forms.counter.currentValue,
      ...(typeof forms.counter.maxValue === "number"
        ? { maxValue: forms.counter.maxValue }
        : {}),
      description: forms.counter.description,
    } as TDetail["counters"][number]);
  }

  if (form === "asset" && forms.asset) {
    nextDetail.assets = nextDetail.assets.map((entry) => {
      if (entry.assetSlug !== forms.asset?.assetSlug) {
        return entry;
      }
      if (entry.kind === "custom") {
        return {
          ...entry,
          title: forms.asset.title,
          summary: forms.asset.summary,
          modifier: forms.asset.modifier,
          noun: forms.asset.noun,
          nounDescription: forms.asset.nounDescription,
          adjectiveDescription: forms.asset.adjectiveDescription,
          iconUrl: forms.asset.iconUrl,
          overlayUrl: forms.asset.overlayUrl,
          content: forms.asset.content,
        };
      }
      return {
        ...entry,
        title: forms.asset.title,
        summary: forms.asset.summary,
        content: forms.asset.content,
      };
    }) as TDetail["assets"];
    return nextDetail;
  }

  return undefined;
};

export const buildAdjustedCounterPayload = (
  payload: {
    title: string;
    iconSlug: string;
    currentValue: number;
    maxValue?: number;
    description: string;
  },
  delta: number,
  target: "current" | "max" = "current",
) => {
  if (target === "max") {
    const nextMaxValue = Math.max(
      0,
      Math.trunc(
        (typeof payload.maxValue === "number"
          ? payload.maxValue
          : payload.currentValue) + delta,
      ),
    );
    return {
      ...payload,
      maxValue: nextMaxValue,
      currentValue: clampCounterValue(payload.currentValue, nextMaxValue),
    };
  }

  return {
    ...payload,
    currentValue: clampCounterValue(
      payload.currentValue + delta,
      payload.maxValue,
    ),
  };
};
