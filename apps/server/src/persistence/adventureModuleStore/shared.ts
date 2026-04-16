import { createHash } from "node:crypto";
import { z } from "zod";
import {
  defaultActorBaseLayerSlug,
  defaultActorTacticalRoleSlug,
} from "@mighty-decks/spec/actorCards";
import { defaultAssetBaseSlug } from "@mighty-decks/spec/assetCards";
import type { AdventureModuleIndex } from "@mighty-decks/spec/adventureModule";

export interface AdventureModuleStoreOptions {
  rootDir: string;
}

export interface AdventureModuleStoreRuntime {
  rootDir: string;
  moduleWriteLocks: Map<string, Promise<void>>;
}

export interface ModuleSystemMetadata {
  version: 1;
  creatorTokenHash: string;
  createdAtIso: string;
  updatedAtIso: string;
  coverImageUrl?: string;
}

export const moduleSystemMetadataSchema: z.ZodType<ModuleSystemMetadata> = z.object({
  version: z.literal(1),
  creatorTokenHash: z.string().min(1),
  createdAtIso: z.string().datetime(),
  updatedAtIso: z.string().datetime(),
  coverImageUrl: z.string().min(1).max(500).optional(),
});

export const HEADERLESS_TOKEN_VALUE = "anonymous";
export const MAX_IDENTIFIER_LENGTH = 120;

export const defaultLocationIntroductionMarkdown =
  "Describe what players immediately notice when they arrive here.";
export const defaultLocationDescriptionMarkdown =
  "- Actors usually here\n- Assets that can be found here\n- Exits to other locations\n- Hazards or pressure that shape the scene";

export const hashCreatorToken = (token: string | undefined): string =>
  createHash("sha256")
    .update((token ?? HEADERLESS_TOKEN_VALUE).trim().toLowerCase())
    .digest("hex");

export const makeId = (prefix: string): string => {
  const stamp = Date.now().toString(36).slice(-8);
  const noise = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${stamp}${noise}`;
};

export const toSlug = (value: string): string => {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized.length > 0 ? normalized.slice(0, MAX_IDENTIFIER_LENGTH) : makeId("module");
};

export const makePrefixedIdentifier = (prefix: string, value: string): string => {
  const normalizedPrefix = toSlug(prefix);
  const normalizedValue = toSlug(value);
  const maxValueLength = Math.max(
    1,
    MAX_IDENTIFIER_LENGTH - normalizedPrefix.length - 1,
  );
  return `${normalizedPrefix}-${normalizedValue.slice(0, maxValueLength)}`;
};

export const createBlankCustomAssetCard = (
  fragmentId: string,
): AdventureModuleIndex["assetCards"][number] => ({
  fragmentId,
  kind: "custom",
  modifier: "",
  noun: "",
  nounDescription: "",
  adjectiveDescription: "",
  iconUrl: "",
  overlayUrl: "",
});

export const isMissingFileError = (error: unknown): boolean => {
  const nodeError = error as NodeJS.ErrnoException;
  return Boolean(nodeError && typeof nodeError === "object" && nodeError.code === "ENOENT");
};

export const normalizeStoredIndexCandidate = (candidate: unknown): unknown => {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return candidate;
  }
  const record = candidate as Record<string, unknown>;
  const intentValue = record.intent;
  const premiseValue = record.premise;
  let normalized = record;
  if (
    typeof intentValue === "string" &&
    intentValue.trim().length > 0 &&
    (typeof premiseValue !== "string" || premiseValue.trim().length === 0)
  ) {
    normalized = {
      ...normalized,
      premise: intentValue,
    };
  }

  const actorFragmentIds = Array.isArray(normalized.actorFragmentIds)
    ? normalized.actorFragmentIds.filter(
        (value): value is string => typeof value === "string" && value.trim().length > 0,
      )
    : [];
  const rawActorCards = Array.isArray(normalized.actorCards) ? normalized.actorCards : [];
  const actorCardsByFragmentId = new Map<string, Record<string, unknown>>();
  for (const actorCard of rawActorCards) {
    if (!actorCard || typeof actorCard !== "object" || Array.isArray(actorCard)) {
      continue;
    }
    const actorCardRecord = actorCard as Record<string, unknown>;
    const fragmentId = actorCardRecord.fragmentId;
    if (typeof fragmentId !== "string" || fragmentId.trim().length === 0) {
      continue;
    }
    actorCardsByFragmentId.set(fragmentId, actorCardRecord);
  }

  const assetFragmentIds = Array.isArray(normalized.assetFragmentIds)
    ? normalized.assetFragmentIds.filter(
        (value): value is string => typeof value === "string" && value.trim().length > 0,
      )
    : [];
  const locationFragmentIds = Array.isArray(normalized.locationFragmentIds)
    ? normalized.locationFragmentIds.filter(
        (value): value is string => typeof value === "string" && value.trim().length > 0,
      )
    : [];
  const encounterFragmentIds = Array.isArray(normalized.encounterFragmentIds)
    ? normalized.encounterFragmentIds.filter(
        (value): value is string => typeof value === "string" && value.trim().length > 0,
      )
    : [];
  const questFragmentIds = Array.isArray(normalized.questFragmentIds)
    ? normalized.questFragmentIds.filter(
        (value): value is string => typeof value === "string" && value.trim().length > 0,
      )
    : [];
  const rawLocationDetails = Array.isArray(normalized.locationDetails)
    ? normalized.locationDetails
    : [];
  const locationDetailsByFragmentId = new Map<string, Record<string, unknown>>();
  for (const locationDetail of rawLocationDetails) {
    if (!locationDetail || typeof locationDetail !== "object" || Array.isArray(locationDetail)) {
      continue;
    }
    const locationDetailRecord = locationDetail as Record<string, unknown>;
    const fragmentId = locationDetailRecord.fragmentId;
    if (typeof fragmentId !== "string" || fragmentId.trim().length === 0) {
      continue;
    }
    locationDetailsByFragmentId.set(fragmentId, locationDetailRecord);
  }
  const rawEncounterDetails = Array.isArray(normalized.encounterDetails)
    ? normalized.encounterDetails
    : [];
  const encounterDetailsByFragmentId = new Map<string, Record<string, unknown>>();
  for (const encounterDetail of rawEncounterDetails) {
    if (!encounterDetail || typeof encounterDetail !== "object" || Array.isArray(encounterDetail)) {
      continue;
    }
    const encounterDetailRecord = encounterDetail as Record<string, unknown>;
    const fragmentId = encounterDetailRecord.fragmentId;
    if (typeof fragmentId !== "string" || fragmentId.trim().length === 0) {
      continue;
    }
    encounterDetailsByFragmentId.set(fragmentId, encounterDetailRecord);
  }
  const rawQuestDetails = Array.isArray(normalized.questDetails)
    ? normalized.questDetails
    : [];
  const questDetailsByFragmentId = new Map<string, Record<string, unknown>>();
  for (const questDetail of rawQuestDetails) {
    if (!questDetail || typeof questDetail !== "object" || Array.isArray(questDetail)) {
      continue;
    }
    const questDetailRecord = questDetail as Record<string, unknown>;
    const fragmentId = questDetailRecord.fragmentId;
    if (typeof fragmentId !== "string" || fragmentId.trim().length === 0) {
      continue;
    }
    questDetailsByFragmentId.set(fragmentId, questDetailRecord);
  }
  const rawAssetCards = Array.isArray(normalized.assetCards) ? normalized.assetCards : [];
  const assetCardsByFragmentId = new Map<string, Record<string, unknown>>();
  for (const assetCard of rawAssetCards) {
    if (!assetCard || typeof assetCard !== "object" || Array.isArray(assetCard)) {
      continue;
    }
    const assetCardRecord = assetCard as Record<string, unknown>;
    const fragmentId = assetCardRecord.fragmentId;
    if (typeof fragmentId !== "string" || fragmentId.trim().length === 0) {
      continue;
    }
    assetCardsByFragmentId.set(fragmentId, assetCardRecord);
  }

  return {
    ...normalized,
    locationDetails: locationFragmentIds.map((fragmentId) => {
      const existing = locationDetailsByFragmentId.get(fragmentId);
      return {
        fragmentId,
        ...(typeof existing?.titleImageUrl === "string" &&
        existing.titleImageUrl.trim().length > 0
          ? { titleImageUrl: existing.titleImageUrl.trim() }
          : {}),
        introductionMarkdown:
          typeof existing?.introductionMarkdown === "string"
            ? existing.introductionMarkdown
            : "",
        descriptionMarkdown:
          typeof existing?.descriptionMarkdown === "string"
            ? existing.descriptionMarkdown
            : "",
        ...(typeof existing?.mapImageUrl === "string" &&
        existing.mapImageUrl.trim().length > 0
          ? { mapImageUrl: existing.mapImageUrl.trim() }
          : {}),
        mapPins: Array.isArray(existing?.mapPins) ? existing.mapPins : [],
      };
    }),
    encounterDetails: encounterFragmentIds.map((fragmentId) => {
      const existing = encounterDetailsByFragmentId.get(fragmentId);
      return {
        fragmentId,
        prerequisites:
          typeof existing?.prerequisites === "string"
            ? existing.prerequisites
            : "",
        ...(typeof existing?.titleImageUrl === "string" &&
        existing.titleImageUrl.trim().length > 0
          ? { titleImageUrl: existing.titleImageUrl.trim() }
          : {}),
      };
    }),
    questDetails: questFragmentIds.map((fragmentId) => {
      const existing = questDetailsByFragmentId.get(fragmentId);
      return {
        fragmentId,
        questId:
          typeof existing?.questId === "string" && existing.questId.trim().length > 0
            ? existing.questId
            : `quest-${fragmentId}`,
        ...(typeof existing?.titleImageUrl === "string" &&
        existing.titleImageUrl.trim().length > 0
          ? { titleImageUrl: existing.titleImageUrl.trim() }
          : {}),
      };
    }),
    actorCards: actorFragmentIds.map((fragmentId) => {
      const existing = actorCardsByFragmentId.get(fragmentId);
      return {
        fragmentId,
        baseLayerSlug:
          typeof existing?.baseLayerSlug === "string" &&
          existing.baseLayerSlug.trim().length > 0
            ? existing.baseLayerSlug
            : defaultActorBaseLayerSlug,
        tacticalRoleSlug:
          typeof existing?.tacticalRoleSlug === "string" &&
          existing.tacticalRoleSlug.trim().length > 0
            ? existing.tacticalRoleSlug
            : defaultActorTacticalRoleSlug,
        ...(typeof existing?.tacticalSpecialSlug === "string" &&
        existing.tacticalSpecialSlug.trim().length > 0
          ? { tacticalSpecialSlug: existing.tacticalSpecialSlug.trim() }
          : {}),
        isPlayerCharacter: Boolean(existing?.isPlayerCharacter),
      };
    }),
    assetCards: assetFragmentIds.map((fragmentId) => {
      const existing = assetCardsByFragmentId.get(fragmentId);
      if (existing?.kind === "legacy_layered") {
        return {
          fragmentId,
          kind: "legacy_layered",
          baseAssetSlug:
            typeof existing.baseAssetSlug === "string" ? existing.baseAssetSlug : defaultAssetBaseSlug,
          modifierSlug:
            typeof existing.modifierSlug === "string" ? existing.modifierSlug : "",
        };
      }
      return {
        fragmentId,
        kind: "custom",
        modifier: typeof existing?.modifier === "string" ? existing.modifier : "",
        noun: typeof existing?.noun === "string" ? existing.noun : "",
        nounDescription:
          typeof existing?.nounDescription === "string" ? existing.nounDescription : "",
        adjectiveDescription:
          typeof existing?.adjectiveDescription === "string"
            ? existing.adjectiveDescription
            : "",
        iconUrl: typeof existing?.iconUrl === "string" ? existing.iconUrl : "",
        overlayUrl: typeof existing?.overlayUrl === "string" ? existing.overlayUrl : "",
      };
    }),
  };
};

