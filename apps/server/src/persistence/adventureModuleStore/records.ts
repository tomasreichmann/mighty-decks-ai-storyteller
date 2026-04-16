import type {
  AdventureModuleDetail,
  AdventureModulePreviewResponse,
} from "@mighty-decks/spec/adventureModuleAuthoring";
import type {
  AdventureModuleFragmentKind,
  AdventureModuleFragmentRef,
  AdventureModuleIndex,
} from "@mighty-decks/spec/adventureModule";
import {
  composeLocationFragmentContent,
  normalizeLocationFragmentContent,
} from "./factory";

export const deriveActorSlugFromPath = (fragmentPath: string): string =>
  fragmentPath.replace(/^actors\//, "").replace(/\.mdx$/i, "");

export const deriveLocationSlugFromPath = (fragmentPath: string): string =>
  fragmentPath.replace(/^locations\//, "").replace(/\.mdx$/i, "");

export const deriveEncounterSlugFromPath = (fragmentPath: string): string =>
  fragmentPath.replace(/^encounters\//, "").replace(/\.mdx$/i, "");

export const deriveQuestSlugFromPath = (fragmentPath: string): string =>
  fragmentPath.replace(/^quests\//, "").replace(/\.mdx$/i, "");

export const deriveAssetSlugFromPath = (fragmentPath: string): string =>
  fragmentPath.replace(/^assets\//, "").replace(/\.mdx$/i, "");

export const fragmentKindWeight = (kind: AdventureModuleFragmentKind): number => {
  const weights: Record<AdventureModuleFragmentKind, number> = {
    index: 0,
    storyteller_summary: 1,
    player_summary: 2,
    palette: 3,
    setting: 4,
    location: 5,
    actor: 6,
    asset: 7,
    item: 8,
    encounter: 9,
    quest: 10,
    component_map: 11,
    image_prompt: 12,
  };
  return weights[kind];
};

const makeUniqueSlug = (
  title: string,
  existingSlugs: Set<string>,
  errorMessage: string,
): string => {
  const baseSlug = title
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  for (let suffix = 2; suffix < 10_000; suffix += 1) {
    const candidate = `${baseSlug}-${suffix}`;
    if (!existingSlugs.has(candidate)) {
      return candidate;
    }
  }

  throw new Error(errorMessage);
};

export const makeUniqueLocationSlug = (
  title: string,
  index: AdventureModuleIndex,
  excludeFragmentId?: string,
): string => {
  const existingLocationSlugs = new Set(
    index.locationFragmentIds
      .filter((fragmentId) => fragmentId !== excludeFragmentId)
      .map((fragmentId) => index.fragments.find((fragment) => fragment.fragmentId === fragmentId))
      .filter((fragment): fragment is AdventureModuleFragmentRef => Boolean(fragment?.path))
      .map((fragment) => deriveLocationSlugFromPath(fragment.path)),
  );
  return makeUniqueSlug(title, existingLocationSlugs, "Could not allocate a unique location slug.");
};

export const makeUniqueEncounterSlug = (
  title: string,
  index: AdventureModuleIndex,
  excludeFragmentId?: string,
): string => {
  const existingEncounterSlugs = new Set(
    index.encounterFragmentIds
      .filter((fragmentId) => fragmentId !== excludeFragmentId)
      .map((fragmentId) => index.fragments.find((fragment) => fragment.fragmentId === fragmentId))
      .filter((fragment): fragment is AdventureModuleFragmentRef => Boolean(fragment?.path))
      .map((fragment) => deriveEncounterSlugFromPath(fragment.path)),
  );
  return makeUniqueSlug(
    title,
    existingEncounterSlugs,
    "Could not allocate a unique encounter slug.",
  );
};

export const makeUniqueQuestSlug = (
  title: string,
  index: AdventureModuleIndex,
  excludeFragmentId?: string,
): string => {
  const existingQuestSlugs = new Set(
    index.questFragmentIds
      .filter((fragmentId) => fragmentId !== excludeFragmentId)
      .map((fragmentId) => index.fragments.find((fragment) => fragment.fragmentId === fragmentId))
      .filter((fragment): fragment is AdventureModuleFragmentRef => Boolean(fragment?.path))
      .map((fragment) => deriveQuestSlugFromPath(fragment.path)),
  );
  return makeUniqueSlug(title, existingQuestSlugs, "Could not allocate a unique quest slug.");
};

export const makeUniqueActorSlug = (
  title: string,
  index: AdventureModuleIndex,
  excludeFragmentId?: string,
): string => {
  const existingActorSlugs = new Set(
    index.actorFragmentIds
      .filter((fragmentId) => fragmentId !== excludeFragmentId)
      .map((fragmentId) => index.fragments.find((fragment) => fragment.fragmentId === fragmentId))
      .filter((fragment): fragment is AdventureModuleFragmentRef => Boolean(fragment?.path))
      .map((fragment) => deriveActorSlugFromPath(fragment.path)),
  );
  return makeUniqueSlug(title, existingActorSlugs, "Could not allocate a unique actor slug.");
};

export const makeUniqueAssetSlug = (
  title: string,
  index: AdventureModuleIndex,
  excludeFragmentId?: string,
): string => {
  const existingAssetSlugs = new Set(
    index.assetFragmentIds
      .filter((fragmentId) => fragmentId !== excludeFragmentId)
      .map((fragmentId) => index.fragments.find((fragment) => fragment.fragmentId === fragmentId))
      .filter((fragment): fragment is AdventureModuleFragmentRef => Boolean(fragment?.path))
      .map((fragment) => deriveAssetSlugFromPath(fragment.path)),
  );
  return makeUniqueSlug(title, existingAssetSlugs, "Could not allocate a unique asset slug.");
};

export const makeUniqueCounterSlug = (
  title: string,
  index: AdventureModuleIndex,
  excludeCounterSlug?: string,
): string => {
  const existingCounterSlugs = new Set(
    index.counters
      .filter((counter) => counter.slug !== excludeCounterSlug)
      .map((counter) => counter.slug),
  );
  return makeUniqueSlug(
    title,
    existingCounterSlugs,
    "Could not allocate a unique counter slug.",
  );
};

export const findActorRecord = (
  index: AdventureModuleIndex,
  actorSlug: string,
): { fragment: AdventureModuleFragmentRef } | null => {
  for (const actorFragmentId of index.actorFragmentIds) {
    const fragment = index.fragments.find((entry) => entry.fragmentId === actorFragmentId);
    if (!fragment) {
      continue;
    }
    if (deriveActorSlugFromPath(fragment.path) === actorSlug) {
      return { fragment };
    }
  }
  return null;
};

export const findLocationRecord = (
  index: AdventureModuleIndex,
  locationSlug: string,
): { fragment: AdventureModuleFragmentRef } | null => {
  for (const locationFragmentId of index.locationFragmentIds) {
    const fragment = index.fragments.find((entry) => entry.fragmentId === locationFragmentId);
    if (!fragment) {
      continue;
    }
    if (deriveLocationSlugFromPath(fragment.path) === locationSlug) {
      return { fragment };
    }
  }
  return null;
};

export const findEncounterRecord = (
  index: AdventureModuleIndex,
  encounterSlug: string,
): { fragment: AdventureModuleFragmentRef } | null => {
  for (const encounterFragmentId of index.encounterFragmentIds) {
    const fragment = index.fragments.find((entry) => entry.fragmentId === encounterFragmentId);
    if (!fragment) {
      continue;
    }
    if (deriveEncounterSlugFromPath(fragment.path) === encounterSlug) {
      return { fragment };
    }
  }
  return null;
};

export const findQuestRecord = (
  index: AdventureModuleIndex,
  questSlug: string,
): {
  fragment: AdventureModuleFragmentRef;
  detail: AdventureModuleIndex["questDetails"][number];
  graph: AdventureModuleIndex["questGraphs"][number] | null;
} | null => {
  const questDetailByFragmentId = new Map(
    index.questDetails.map((questDetail) => [questDetail.fragmentId, questDetail] as const),
  );

  for (const questFragmentId of index.questFragmentIds) {
    const fragment = index.fragments.find((entry) => entry.fragmentId === questFragmentId);
    if (!fragment || deriveQuestSlugFromPath(fragment.path) !== questSlug) {
      continue;
    }
    const detail = questDetailByFragmentId.get(fragment.fragmentId);
    if (!detail) {
      return null;
    }
    const graph =
      index.questGraphs.find((questGraph) => questGraph.questId === detail.questId) ?? null;
    return { fragment, detail, graph };
  }
  return null;
};

export const findAssetRecord = (
  index: AdventureModuleIndex,
  assetSlug: string,
): { fragment: AdventureModuleFragmentRef } | null => {
  for (const assetFragmentId of index.assetFragmentIds) {
    const fragment = index.fragments.find((entry) => entry.fragmentId === assetFragmentId);
    if (!fragment) {
      continue;
    }
    if (deriveAssetSlugFromPath(fragment.path) === assetSlug) {
      return { fragment };
    }
  }
  return null;
};

export const findCounterRecord = (
  index: AdventureModuleIndex,
  counterSlug: string,
): AdventureModuleIndex["counters"][number] | null =>
  index.counters.find((counter) => counter.slug === counterSlug) ?? null;

export const resolveLocations = (
  index: AdventureModuleIndex,
  fragments: AdventureModuleDetail["fragments"],
): AdventureModuleDetail["locations"] => {
  const fragmentContentById = new Map(
    fragments.map((fragment) => [fragment.fragment.fragmentId, fragment.content] as const),
  );
  const locationDetailByFragmentId = new Map(
    index.locationDetails.map((locationDetail) => [
      locationDetail.fragmentId,
      locationDetail,
    ] as const),
  );

  return index.locationFragmentIds.flatMap((fragmentId) => {
    const fragmentRef = index.fragments.find((fragment) => fragment.fragmentId === fragmentId);
    const locationDetail = locationDetailByFragmentId.get(fragmentId);
    if (!fragmentRef || !locationDetail) {
      return [];
    }

    const storedFragmentContent = fragmentContentById.get(fragmentId) ?? "";
    const isLegacyFallbackCandidate =
      !locationDetail.titleImageUrl &&
      !locationDetail.mapImageUrl &&
      locationDetail.introductionMarkdown.length === 0 &&
      locationDetail.descriptionMarkdown.length === 0 &&
      locationDetail.mapPins.length === 0;
    const shouldUseLegacyDescription =
      isLegacyFallbackCandidate &&
      normalizeLocationFragmentContent(storedFragmentContent) !==
        normalizeLocationFragmentContent(
          composeLocationFragmentContent(fragmentRef.title, "", ""),
        );

    return [
      {
        fragmentId,
        locationSlug: deriveLocationSlugFromPath(fragmentRef.path),
        title: fragmentRef.title,
        summary: fragmentRef.summary,
        titleImageUrl: locationDetail.titleImageUrl,
        introductionMarkdown: locationDetail.introductionMarkdown,
        descriptionMarkdown: shouldUseLegacyDescription
          ? storedFragmentContent
          : locationDetail.descriptionMarkdown,
        mapImageUrl: locationDetail.mapImageUrl,
        mapPins: locationDetail.mapPins.map((mapPin) => ({ ...mapPin })),
      },
    ];
  });
};

export const resolveEncounters = (
  index: AdventureModuleIndex,
  fragments: AdventureModuleDetail["fragments"],
): AdventureModuleDetail["encounters"] => {
  const fragmentContentById = new Map(
    fragments.map((fragment) => [fragment.fragment.fragmentId, fragment.content] as const),
  );
  const encounterDetailByFragmentId = new Map(
    index.encounterDetails.map((encounterDetail) => [
      encounterDetail.fragmentId,
      encounterDetail,
    ] as const),
  );

  return index.encounterFragmentIds.flatMap((fragmentId) => {
    const fragmentRef = index.fragments.find((fragment) => fragment.fragmentId === fragmentId);
    const encounterDetail = encounterDetailByFragmentId.get(fragmentId);
    if (!fragmentRef || !encounterDetail) {
      return [];
    }

    return [
      {
        fragmentId,
        encounterSlug: deriveEncounterSlugFromPath(fragmentRef.path),
        title: fragmentRef.title,
        summary: fragmentRef.summary,
        prerequisites: encounterDetail.prerequisites,
        titleImageUrl: encounterDetail.titleImageUrl,
        content: fragmentContentById.get(fragmentId) ?? "",
      },
    ];
  });
};

export const resolveQuests = (
  index: AdventureModuleIndex,
  fragments: AdventureModuleDetail["fragments"],
): AdventureModuleDetail["quests"] => {
  const fragmentContentById = new Map(
    fragments.map((fragment) => [fragment.fragment.fragmentId, fragment.content] as const),
  );
  const questDetailByFragmentId = new Map(
    index.questDetails.map((questDetail) => [questDetail.fragmentId, questDetail] as const),
  );

  return index.questFragmentIds.flatMap((fragmentId) => {
    const fragmentRef = index.fragments.find((fragment) => fragment.fragmentId === fragmentId);
    const questDetail = questDetailByFragmentId.get(fragmentId);
    if (!fragmentRef || !questDetail) {
      return [];
    }

    const graph = index.questGraphs.find((questGraph) => questGraph.questId === questDetail.questId);
    return [
      {
        fragmentId,
        questSlug: deriveQuestSlugFromPath(fragmentRef.path),
        title: fragmentRef.title,
        summary: fragmentRef.summary,
        titleImageUrl: questDetail.titleImageUrl,
        questId: questDetail.questId,
        graph: graph ?? null,
        content: fragmentContentById.get(fragmentId) ?? "",
      },
    ];
  });
};

export const resolveActors = (
  index: AdventureModuleIndex,
  fragments: AdventureModuleDetail["fragments"],
): AdventureModuleDetail["actors"] => {
  const fragmentContentById = new Map(
    fragments.map((fragment) => [fragment.fragment.fragmentId, fragment.content] as const),
  );
  const actorCardByFragmentId = new Map(
    index.actorCards.map((actorCard) => [actorCard.fragmentId, actorCard] as const),
  );

  return index.actorFragmentIds.flatMap((fragmentId) => {
    const fragmentRef = index.fragments.find((fragment) => fragment.fragmentId === fragmentId);
    const actorCard = actorCardByFragmentId.get(fragmentId);
    if (!fragmentRef || !actorCard) {
      return [];
    }
    return [
      {
        fragmentId,
        actorSlug: deriveActorSlugFromPath(fragmentRef.path),
        title: fragmentRef.title,
        summary: fragmentRef.summary,
        baseLayerSlug: actorCard.baseLayerSlug,
        tacticalRoleSlug: actorCard.tacticalRoleSlug,
        tacticalSpecialSlug: actorCard.tacticalSpecialSlug,
        isPlayerCharacter: actorCard.isPlayerCharacter,
        content: fragmentContentById.get(fragmentId) ?? "",
      },
    ];
  });
};

export const resolveCounters = (
  index: AdventureModuleIndex,
): AdventureModuleDetail["counters"] => index.counters.map((counter) => ({ ...counter }));

export const resolveAssets = (
  index: AdventureModuleIndex,
  fragments: AdventureModuleDetail["fragments"],
): AdventureModuleDetail["assets"] => {
  const fragmentContentById = new Map(
    fragments.map((fragment) => [fragment.fragment.fragmentId, fragment.content] as const),
  );
  const assetCardByFragmentId = new Map(
    index.assetCards.map((assetCard) => [assetCard.fragmentId, assetCard] as const),
  );

  return index.assetFragmentIds.flatMap((fragmentId) => {
    const fragmentRef = index.fragments.find((fragment) => fragment.fragmentId === fragmentId);
    const assetCard = assetCardByFragmentId.get(fragmentId);
    if (!fragmentRef || !assetCard) {
      return [];
    }
    return [
      assetCard.kind === "custom"
        ? {
            fragmentId,
            assetSlug: deriveAssetSlugFromPath(fragmentRef.path),
            title: fragmentRef.title,
            summary: fragmentRef.summary,
            kind: "custom",
            modifier: assetCard.modifier,
            noun: assetCard.noun,
            nounDescription: assetCard.nounDescription,
            adjectiveDescription: assetCard.adjectiveDescription,
            iconUrl: assetCard.iconUrl,
            overlayUrl: assetCard.overlayUrl,
            content: fragmentContentById.get(fragmentId) ?? "",
          }
        : {
            fragmentId,
            assetSlug: deriveAssetSlugFromPath(fragmentRef.path),
            title: fragmentRef.title,
            summary: fragmentRef.summary,
            kind: "legacy_layered",
            baseAssetSlug: assetCard.baseAssetSlug,
            modifierSlug: assetCard.modifierSlug,
            content: fragmentContentById.get(fragmentId) ?? "",
          },
    ];
  });
};

export const buildPreviewGroups = (
  detail: Pick<AdventureModuleDetail, "index" | "fragments">,
  showSpoilers: boolean,
): AdventureModulePreviewResponse["groups"] => {
  const fragmentsById = new Map(
    detail.fragments.map((fragment) => [fragment.fragment.fragmentId, fragment]),
  );
  const groupsByKind = new Map<
    AdventureModuleFragmentKind,
    AdventureModulePreviewResponse["groups"][number]
  >();

  for (const fragmentRef of detail.index.fragments) {
    const fragmentRecord = fragmentsById.get(fragmentRef.fragmentId);
    const isHidden = fragmentRef.containsSpoilers && !showSpoilers;
    const safeTitle = isHidden
      ? `Spoiler Fragment ${fragmentRef.kind.replaceAll("_", " ")}`
      : fragmentRef.title;
    const group =
      groupsByKind.get(fragmentRef.kind) ??
      {
        kind: fragmentRef.kind,
        totalCount: 0,
        hiddenCount: 0,
        fragments: [],
      };

    group.totalCount += 1;
    if (isHidden) {
      group.hiddenCount += 1;
    }

    group.fragments.push({
      fragmentId: fragmentRef.fragmentId,
      kind: fragmentRef.kind,
      title: safeTitle,
      summary: isHidden ? undefined : fragmentRef.summary,
      tags: fragmentRef.tags,
      containsSpoilers: fragmentRef.containsSpoilers,
      intendedAudience: fragmentRef.intendedAudience,
      hidden: isHidden,
      content: isHidden ? undefined : fragmentRecord?.content,
    });

    groupsByKind.set(fragmentRef.kind, group);
  }

  return [...groupsByKind.values()].sort(
    (left, right) => fragmentKindWeight(left.kind) - fragmentKindWeight(right.kind),
  );
};
