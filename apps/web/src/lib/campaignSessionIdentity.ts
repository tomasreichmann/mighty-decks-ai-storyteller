import { generateUuid } from "./randomId";

export type CampaignSessionRole = "player" | "storyteller";

export interface CampaignSessionIdentity {
  participantId: string;
  displayName: string;
}

const storageKey = (
  campaignSlug: string,
  sessionId: string,
  role: CampaignSessionRole,
  suffix: "participant_id" | "display_name",
): string =>
  `mighty_decks_campaign_${campaignSlug}_${sessionId}_${role}_${suffix}`;

const getOrCreateStorageValue = (key: string, factory: () => string): string => {
  const existing = window.localStorage.getItem(key);
  if (existing) {
    return existing;
  }

  const generated = factory();
  window.localStorage.setItem(key, generated);
  return generated;
};

export const getCampaignSessionIdentity = (
  campaignSlug: string,
  sessionId: string,
  role: CampaignSessionRole,
): CampaignSessionIdentity => {
  const participantId = getOrCreateStorageValue(
    storageKey(campaignSlug, sessionId, role, "participant_id"),
    () => `campaign-${role}-${generateUuid()}`,
  );
  const displayName = getOrCreateStorageValue(
    storageKey(campaignSlug, sessionId, role, "display_name"),
    () =>
      role === "storyteller"
        ? `Storyteller ${participantId.slice(-4).toUpperCase()}`
        : `Player ${participantId.slice(-4).toUpperCase()}`,
  );

  return {
    participantId,
    displayName,
  };
};

export const setCampaignSessionDisplayName = (
  campaignSlug: string,
  sessionId: string,
  role: CampaignSessionRole,
  displayName: string,
): void => {
  window.localStorage.setItem(
    storageKey(campaignSlug, sessionId, role, "display_name"),
    displayName,
  );
};
