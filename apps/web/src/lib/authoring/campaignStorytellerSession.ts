import type {
  CampaignSessionStatus,
  CampaignSessionTableCardReference,
} from "@mighty-decks/spec/campaign";

export interface StorytellerTableSelectionItem {
  id: string;
  label: string;
  card: CampaignSessionTableCardReference;
}

export const formatSessionCreatedAt = (createdAtIso: string): string => {
  const parsed = new Date(createdAtIso);
  if (Number.isNaN(parsed.getTime())) {
    return createdAtIso;
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const resolveSessionStatusTone = (
  status: CampaignSessionStatus,
): "connected" | "reconnecting" | "offline" => {
  switch (status) {
    case "active":
      return "connected";
    case "setup":
      return "reconnecting";
    case "closed":
      return "offline";
    default:
      return "offline";
  }
};

export const createTableSelectionId = (): string =>
  `table-selection-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const formatTableSelectionLabel = (
  card: CampaignSessionTableCardReference,
): string => {
  if (card.type === "AssetCard" && card.modifierSlug) {
    return `Asset ${card.slug}/${card.modifierSlug}`;
  }
  return `${card.type.replace("Card", "")} ${card.slug}`;
};

export const createStorytellerTableSelectionEntry = (
  card: CampaignSessionTableCardReference,
): StorytellerTableSelectionItem => ({
  id: createTableSelectionId(),
  label: formatTableSelectionLabel(card),
  card,
});

export const appendStorytellerTableSelection = <
  TEntry extends StorytellerTableSelectionItem,
>(
  current: TEntry[],
  nextEntry: TEntry,
): TEntry[] =>
  current.some(
    (entry) =>
      entry.card.type === nextEntry.card.type &&
      entry.card.slug === nextEntry.card.slug &&
      ("modifierSlug" in entry.card ? entry.card.modifierSlug : undefined) ===
        ("modifierSlug" in nextEntry.card
          ? nextEntry.card.modifierSlug
          : undefined),
  )
    ? current
    : [...current, nextEntry];

export const removeStorytellerTableSelection = <
  TEntry extends Pick<StorytellerTableSelectionItem, "id">,
>(
  current: TEntry[],
  entryId: string,
): TEntry[] => current.filter((entry) => entry.id !== entryId);
