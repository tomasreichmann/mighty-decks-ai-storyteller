import {
  campaignCreateRequestSchema,
  campaignCreateResponseSchema,
  campaignGetResponseSchema,
  campaignListResponseSchema,
  campaignListSessionsResponseSchema,
  campaignSessionResponseSchema,
  type CampaignCreateRequest,
  type CampaignDetail,
  type CampaignListItem,
  type CampaignSessionDetail,
  type CampaignSessionSummary,
} from "@mighty-decks/spec/campaign";
import {
  adventureModuleCreateActorRequestSchema,
  adventureModuleCreateAssetRequestSchema,
  adventureModuleCreateCounterRequestSchema,
  adventureModuleCreateEncounterRequestSchema,
  adventureModuleCreateLocationRequestSchema,
  adventureModuleCreateQuestRequestSchema,
  adventureModuleUpdateActorRequestSchema,
  adventureModuleUpdateAssetRequestSchema,
  adventureModuleUpdateCounterRequestSchema,
  adventureModuleUpdateEncounterRequestSchema,
  adventureModuleUpdateFragmentRequestSchema,
  adventureModuleUpdateCoverImageRequestSchema,
  adventureModuleUpdateIndexRequestSchema,
  adventureModuleUpdateLocationRequestSchema,
  adventureModuleUpdateQuestRequestSchema,
  type AdventureModuleCreateActorRequest,
  type AdventureModuleCreateAssetRequest,
  type AdventureModuleCreateCounterRequest,
  type AdventureModuleCreateEncounterRequest,
  type AdventureModuleCreateLocationRequest,
  type AdventureModuleCreateQuestRequest,
  type AdventureModuleUpdateCoverImageRequest,
  type AdventureModuleUpdateEncounterRequest,
  type AdventureModuleUpdateLocationRequest,
  type AdventureModuleUpdateQuestRequest,
} from "@mighty-decks/spec/adventureModuleAuthoring";
import type { AdventureModuleIndex } from "@mighty-decks/spec/adventureModule";
import { resolveServerUrl } from "./socket";
import { buildHeaders } from "./adventureModuleApi";

const buildApiUrl = (path: string): string =>
  new URL(path, resolveServerUrl()).toString();

const fetchJson = async (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<unknown> => {
  const response = await fetch(input, init);
  const text = await response.text();
  const payload = text.trim().length > 0 ? (JSON.parse(text) as unknown) : null;
  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : `Request failed (${response.status})`;
    throw new Error(message);
  }
  return payload;
};

export const listCampaigns = async (): Promise<CampaignListItem[]> => {
  const payload = await fetchJson(buildApiUrl("/api/campaigns"));
  return campaignListResponseSchema.parse(payload).campaigns;
};

export const createCampaign = async (
  request: CampaignCreateRequest,
  creatorToken?: string,
): Promise<CampaignDetail> => {
  const payload = await fetchJson(buildApiUrl("/api/campaigns"), {
    method: "POST",
    headers: buildHeaders(creatorToken, { jsonContentType: true }),
    body: JSON.stringify(campaignCreateRequestSchema.parse(request)),
  });
  return campaignCreateResponseSchema.parse(payload);
};

export const getCampaignBySlug = async (
  slug: string,
  creatorToken?: string,
): Promise<CampaignDetail> => {
  const payload = await fetchJson(
    buildApiUrl(`/api/campaigns/by-slug/${encodeURIComponent(slug)}`),
    {
      headers: buildHeaders(creatorToken),
    },
  );
  return campaignGetResponseSchema.parse(payload);
};

export const updateCampaignIndex = async (
  campaignId: string,
  index: AdventureModuleIndex,
  creatorToken?: string,
): Promise<CampaignDetail> => {
  const payload = await fetchJson(
    buildApiUrl(`/api/campaigns/${encodeURIComponent(campaignId)}/index`),
    {
      method: "PUT",
      headers: buildHeaders(creatorToken, { jsonContentType: true }),
      body: JSON.stringify(
        adventureModuleUpdateIndexRequestSchema.parse({
          index,
        }),
      ),
    },
  );
  return campaignGetResponseSchema.parse(payload);
};

export const updateCampaignFragment = async (
  campaignId: string,
  fragmentId: string,
  content: string,
  creatorToken?: string,
): Promise<CampaignDetail> => {
  const payload = await fetchJson(
    buildApiUrl(
      `/api/campaigns/${encodeURIComponent(campaignId)}/fragments/${encodeURIComponent(fragmentId)}`,
    ),
    {
      method: "PUT",
      headers: buildHeaders(creatorToken, { jsonContentType: true }),
      body: JSON.stringify(
        adventureModuleUpdateFragmentRequestSchema.parse({
          content,
        }),
      ),
    },
  );
  return campaignGetResponseSchema.parse(payload);
};

export const createCampaignActor = async (
  campaignId: string,
  request: AdventureModuleCreateActorRequest,
  creatorToken?: string,
): Promise<CampaignDetail> => {
  const payload = await fetchJson(
    buildApiUrl(`/api/campaigns/${encodeURIComponent(campaignId)}/actors`),
    {
      method: "POST",
      headers: buildHeaders(creatorToken, { jsonContentType: true }),
      body: JSON.stringify(adventureModuleCreateActorRequestSchema.parse(request)),
    },
  );
  return campaignCreateResponseSchema.parse(payload);
};

export const updateCampaignActor = async (
  campaignId: string,
  actorSlug: string,
  request: {
    title: string;
    summary: string;
    baseLayerSlug: string;
    tacticalRoleSlug: string;
    tacticalSpecialSlug?: string | null;
    isPlayerCharacter: boolean;
    content: string;
  },
  creatorToken?: string,
): Promise<CampaignDetail> => {
  const payload = await fetchJson(
    buildApiUrl(
      `/api/campaigns/${encodeURIComponent(campaignId)}/actors/${encodeURIComponent(actorSlug)}`,
    ),
    {
      method: "PUT",
      headers: buildHeaders(creatorToken, { jsonContentType: true }),
      body: JSON.stringify(adventureModuleUpdateActorRequestSchema.parse(request)),
    },
  );
  return campaignGetResponseSchema.parse(payload);
};

export const deleteCampaignActor = async (
  campaignId: string,
  actorSlug: string,
  creatorToken?: string,
): Promise<CampaignDetail> => {
  const payload = await fetchJson(
    buildApiUrl(
      `/api/campaigns/${encodeURIComponent(campaignId)}/actors/${encodeURIComponent(actorSlug)}`,
    ),
    {
      method: "DELETE",
      headers: buildHeaders(creatorToken),
    },
  );
  return campaignGetResponseSchema.parse(payload);
};

export const createCampaignLocation = async (
  campaignId: string,
  request: AdventureModuleCreateLocationRequest,
  creatorToken?: string,
): Promise<CampaignDetail> => {
  const payload = await fetchJson(
    buildApiUrl(`/api/campaigns/${encodeURIComponent(campaignId)}/locations`),
    {
      method: "POST",
      headers: buildHeaders(creatorToken, { jsonContentType: true }),
      body: JSON.stringify(
        adventureModuleCreateLocationRequestSchema.parse(request),
      ),
    },
  );
  return campaignCreateResponseSchema.parse(payload);
};

export const updateCampaignLocation = async (
  campaignId: string,
  locationSlug: string,
  request: AdventureModuleUpdateLocationRequest,
  creatorToken?: string,
): Promise<CampaignDetail> => {
  const payload = await fetchJson(
    buildApiUrl(
      `/api/campaigns/${encodeURIComponent(campaignId)}/locations/${encodeURIComponent(locationSlug)}`,
    ),
    {
      method: "PUT",
      headers: buildHeaders(creatorToken, { jsonContentType: true }),
      body: JSON.stringify(
        adventureModuleUpdateLocationRequestSchema.parse(request),
      ),
    },
  );
  return campaignGetResponseSchema.parse(payload);
};

export const deleteCampaignLocation = async (
  campaignId: string,
  locationSlug: string,
  creatorToken?: string,
): Promise<CampaignDetail> => {
  const payload = await fetchJson(
    buildApiUrl(
      `/api/campaigns/${encodeURIComponent(campaignId)}/locations/${encodeURIComponent(locationSlug)}`,
    ),
    {
      method: "DELETE",
      headers: buildHeaders(creatorToken),
    },
  );
  return campaignGetResponseSchema.parse(payload);
};

export const createCampaignEncounter = async (
  campaignId: string,
  request: AdventureModuleCreateEncounterRequest,
  creatorToken?: string,
): Promise<CampaignDetail> => {
  const payload = await fetchJson(
    buildApiUrl(`/api/campaigns/${encodeURIComponent(campaignId)}/encounters`),
    {
      method: "POST",
      headers: buildHeaders(creatorToken, { jsonContentType: true }),
      body: JSON.stringify(
        adventureModuleCreateEncounterRequestSchema.parse(request),
      ),
    },
  );
  return campaignCreateResponseSchema.parse(payload);
};

export const updateCampaignEncounter = async (
  campaignId: string,
  encounterSlug: string,
  request: AdventureModuleUpdateEncounterRequest,
  creatorToken?: string,
): Promise<CampaignDetail> => {
  const payload = await fetchJson(
    buildApiUrl(
      `/api/campaigns/${encodeURIComponent(campaignId)}/encounters/${encodeURIComponent(encounterSlug)}`,
    ),
    {
      method: "PUT",
      headers: buildHeaders(creatorToken, { jsonContentType: true }),
      body: JSON.stringify(
        adventureModuleUpdateEncounterRequestSchema.parse(request),
      ),
    },
  );
  return campaignGetResponseSchema.parse(payload);
};

export const deleteCampaignEncounter = async (
  campaignId: string,
  encounterSlug: string,
  creatorToken?: string,
): Promise<CampaignDetail> => {
  const payload = await fetchJson(
    buildApiUrl(
      `/api/campaigns/${encodeURIComponent(campaignId)}/encounters/${encodeURIComponent(encounterSlug)}`,
    ),
    {
      method: "DELETE",
      headers: buildHeaders(creatorToken),
    },
  );
  return campaignGetResponseSchema.parse(payload);
};

export const createCampaignQuest = async (
  campaignId: string,
  request: AdventureModuleCreateQuestRequest,
  creatorToken?: string,
): Promise<CampaignDetail> => {
  const payload = await fetchJson(
    buildApiUrl(`/api/campaigns/${encodeURIComponent(campaignId)}/quests`),
    {
      method: "POST",
      headers: buildHeaders(creatorToken, { jsonContentType: true }),
      body: JSON.stringify(adventureModuleCreateQuestRequestSchema.parse(request)),
    },
  );
  return campaignCreateResponseSchema.parse(payload);
};

export const updateCampaignQuest = async (
  campaignId: string,
  questSlug: string,
  request: AdventureModuleUpdateQuestRequest,
  creatorToken?: string,
): Promise<CampaignDetail> => {
  const payload = await fetchJson(
    buildApiUrl(
      `/api/campaigns/${encodeURIComponent(campaignId)}/quests/${encodeURIComponent(questSlug)}`,
    ),
    {
      method: "PUT",
      headers: buildHeaders(creatorToken, { jsonContentType: true }),
      body: JSON.stringify(adventureModuleUpdateQuestRequestSchema.parse(request)),
    },
  );
  return campaignGetResponseSchema.parse(payload);
};

export const deleteCampaignQuest = async (
  campaignId: string,
  questSlug: string,
  creatorToken?: string,
): Promise<CampaignDetail> => {
  const payload = await fetchJson(
    buildApiUrl(
      `/api/campaigns/${encodeURIComponent(campaignId)}/quests/${encodeURIComponent(questSlug)}`,
    ),
    {
      method: "DELETE",
      headers: buildHeaders(creatorToken),
    },
  );
  return campaignGetResponseSchema.parse(payload);
};

export const createCampaignCounter = async (
  campaignId: string,
  request: AdventureModuleCreateCounterRequest,
  creatorToken?: string,
): Promise<CampaignDetail> => {
  const payload = await fetchJson(
    buildApiUrl(`/api/campaigns/${encodeURIComponent(campaignId)}/counters`),
    {
      method: "POST",
      headers: buildHeaders(creatorToken, { jsonContentType: true }),
      body: JSON.stringify(
        adventureModuleCreateCounterRequestSchema.parse(request),
      ),
    },
  );
  return campaignCreateResponseSchema.parse(payload);
};

export const updateCampaignCounter = async (
  campaignId: string,
  counterSlug: string,
  request: {
    title: string;
    iconSlug: string;
    currentValue: number;
    maxValue?: number | null;
    description: string;
  },
  creatorToken?: string,
): Promise<CampaignDetail> => {
  const payload = await fetchJson(
    buildApiUrl(
      `/api/campaigns/${encodeURIComponent(campaignId)}/counters/${encodeURIComponent(counterSlug)}`,
    ),
    {
      method: "PUT",
      headers: buildHeaders(creatorToken, { jsonContentType: true }),
      body: JSON.stringify(
        adventureModuleUpdateCounterRequestSchema.parse(request),
      ),
    },
  );
  return campaignGetResponseSchema.parse(payload);
};

export const deleteCampaignCounter = async (
  campaignId: string,
  counterSlug: string,
  creatorToken?: string,
): Promise<CampaignDetail> => {
  const payload = await fetchJson(
    buildApiUrl(
      `/api/campaigns/${encodeURIComponent(campaignId)}/counters/${encodeURIComponent(counterSlug)}`,
    ),
    {
      method: "DELETE",
      headers: buildHeaders(creatorToken),
    },
  );
  return campaignGetResponseSchema.parse(payload);
};

export const createCampaignAsset = async (
  campaignId: string,
  request: AdventureModuleCreateAssetRequest,
  creatorToken?: string,
): Promise<CampaignDetail> => {
  const payload = await fetchJson(
    buildApiUrl(`/api/campaigns/${encodeURIComponent(campaignId)}/assets`),
    {
      method: "POST",
      headers: buildHeaders(creatorToken, { jsonContentType: true }),
      body: JSON.stringify(adventureModuleCreateAssetRequestSchema.parse(request)),
    },
  );
  return campaignCreateResponseSchema.parse(payload);
};

export const updateCampaignAsset = async (
  campaignId: string,
  assetSlug: string,
  request: {
    title: string;
    summary: string;
    modifier: string;
    noun: string;
    nounDescription: string;
    adjectiveDescription: string;
    iconUrl: string;
    overlayUrl: string;
    content: string;
  },
  creatorToken?: string,
): Promise<CampaignDetail> => {
  const payload = await fetchJson(
    buildApiUrl(
      `/api/campaigns/${encodeURIComponent(campaignId)}/assets/${encodeURIComponent(assetSlug)}`,
    ),
    {
      method: "PUT",
      headers: buildHeaders(creatorToken, { jsonContentType: true }),
      body: JSON.stringify(adventureModuleUpdateAssetRequestSchema.parse(request)),
    },
  );
  return campaignGetResponseSchema.parse(payload);
};

export const deleteCampaignAsset = async (
  campaignId: string,
  assetSlug: string,
  creatorToken?: string,
): Promise<CampaignDetail> => {
  const payload = await fetchJson(
    buildApiUrl(
      `/api/campaigns/${encodeURIComponent(campaignId)}/assets/${encodeURIComponent(assetSlug)}`,
    ),
    {
      method: "DELETE",
      headers: buildHeaders(creatorToken),
    },
  );
  return campaignGetResponseSchema.parse(payload);
};

export const updateCampaignCoverImage = async (
  campaignId: string,
  request: AdventureModuleUpdateCoverImageRequest,
  creatorToken?: string,
): Promise<CampaignDetail> => {
  const payload = await fetchJson(
    buildApiUrl(`/api/campaigns/${encodeURIComponent(campaignId)}/cover-image`),
    {
      method: "PUT",
      headers: buildHeaders(creatorToken, { jsonContentType: true }),
      body: JSON.stringify(
        adventureModuleUpdateCoverImageRequestSchema.parse(request),
      ),
    },
  );
  return campaignGetResponseSchema.parse(payload);
};

export const createCampaignSession = async (
  campaignId: string,
  creatorToken?: string,
): Promise<CampaignSessionDetail> => {
  const payload = await fetchJson(
    buildApiUrl(`/api/campaigns/${encodeURIComponent(campaignId)}/sessions`),
    {
      method: "POST",
      headers: buildHeaders(creatorToken, { jsonContentType: true }),
      body: JSON.stringify({}),
    },
  );
  return campaignSessionResponseSchema.parse(payload);
};

export const listCampaignSessions = async (
  slug: string,
  creatorToken?: string,
): Promise<CampaignSessionSummary[]> => {
  const payload = await fetchJson(
    buildApiUrl(`/api/campaigns/by-slug/${encodeURIComponent(slug)}/sessions`),
    {
      headers: buildHeaders(creatorToken),
    },
  );
  return campaignListSessionsResponseSchema.parse(payload).sessions;
};

export const getCampaignSession = async (
  slug: string,
  sessionId: string,
  creatorToken?: string,
): Promise<CampaignSessionDetail> => {
  const payload = await fetchJson(
    buildApiUrl(
      `/api/campaigns/by-slug/${encodeURIComponent(slug)}/sessions/${encodeURIComponent(sessionId)}`,
    ),
    {
      headers: buildHeaders(creatorToken),
    },
  );
  return campaignSessionResponseSchema.parse(payload);
};

