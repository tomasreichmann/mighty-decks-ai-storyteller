import type {
  CampaignSessionTableCardReference,
  CampaignSessionTableEntry,
} from "@mighty-decks/spec/campaign";
import type { LabelVariant } from "../../common/Label";

export type SessionViewerRole = "player" | "storyteller";

export interface TableEntryGroup {
  key: string;
  entries: CampaignSessionTableEntry[];
}

export const makeReferenceKey = (
  card: CampaignSessionTableCardReference,
): string => {
  if (card.type === "AssetCard") {
    return `${card.type}:${card.slug}:${card.modifierSlug ?? ""}`;
  }
  return `${card.type}:${card.slug}`;
};

export const makeReferenceTitle = (
  card: CampaignSessionTableCardReference,
): string => {
  if (card.type === "AssetCard" && card.modifierSlug) {
    return `${card.type} ${card.slug}/${card.modifierSlug}`;
  }
  return `${card.type} ${card.slug}`;
};

export const canStackReference = (
  card: CampaignSessionTableCardReference,
): boolean =>
  card.type !== "LocationCard" &&
  card.type !== "EncounterCard" &&
  card.type !== "QuestCard";

export const isSceneReference = (
  card: CampaignSessionTableCardReference,
): boolean =>
  card.type === "LocationCard" ||
  card.type === "EncounterCard" ||
  card.type === "QuestCard";

export const groupAdjacentEntries = (
  entries: readonly CampaignSessionTableEntry[],
): TableEntryGroup[] => {
  const groups: TableEntryGroup[] = [];

  for (const entry of entries) {
    const key = makeReferenceKey(entry.card);
    const previousGroup = groups.at(-1);
    if (previousGroup && previousGroup.key === key) {
      previousGroup.entries.push(entry);
      continue;
    }

    groups.push({
      key,
      entries: [entry],
    });
  }

  return groups;
};

export const getLaneVariant = (
  viewerRole: SessionViewerRole,
  isCurrentLane: boolean,
  index: number,
): LabelVariant => {
  if (isCurrentLane) {
    return "gold";
  }
  if (viewerRole === "storyteller") {
    return "cloth";
  }

  const variants: LabelVariant[] = ["fire", "monster", "cloth", "skin", "bone"];
  return variants[index % variants.length] ?? "cloth";
};
