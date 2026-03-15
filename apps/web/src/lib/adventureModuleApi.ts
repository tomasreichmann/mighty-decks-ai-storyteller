import {
  adventureModuleCreateActorRequestSchema,
  adventureModuleCreateCounterRequestSchema,
  adventureModuleCloneRequestSchema,
  adventureModuleCreateRequestSchema,
  adventureModuleCreateResponseSchema,
  adventureModuleGetResponseSchema,
  adventureModuleListResponseSchema,
  adventureModulePreviewResponseSchema,
  adventureModuleSlugAvailabilityResponseSchema,
  adventureModuleUpdateActorRequestSchema,
  adventureModuleUpdateActorResponseSchema,
  adventureModuleUpdateCounterRequestSchema,
  adventureModuleUpdateCounterResponseSchema,
  adventureModuleUpdateFragmentRequestSchema,
  adventureModuleUpdateCoverImageRequestSchema,
  adventureModuleUpdateIndexRequestSchema,
  adventureModuleUpdateResponseSchema,
  type AdventureModuleCreateActorRequest,
  type AdventureModuleCreateCounterRequest,
  type AdventureModuleUpdateCoverImageRequest,
  type AdventureModuleCloneRequest,
  type AdventureModuleCreateRequest,
  type AdventureModuleCreateResponse,
  type AdventureModuleDetail,
  type AdventureModuleListItem,
  type AdventureModulePreviewResponse,
  type AdventureModuleSlugAvailabilityResponse,
} from "@mighty-decks/spec/adventureModuleAuthoring";
import type { AdventureModuleIndex } from "@mighty-decks/spec/adventureModule";
import { resolveServerUrl } from "./socket";
import { ADVENTURE_MODULE_CREATOR_TOKEN_HEADER } from "./adventureModuleIdentity";

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

export const buildHeaders = (
  creatorToken?: string,
  options: {
    jsonContentType?: boolean;
  } = {},
): HeadersInit => {
  const headers: Record<string, string> = {};
  if (options.jsonContentType) {
    headers["Content-Type"] = "application/json";
  }
  if (creatorToken && creatorToken.trim().length > 0) {
    headers[ADVENTURE_MODULE_CREATOR_TOKEN_HEADER] = creatorToken;
  }
  return headers;
};

export const listAdventureModules = async (
  creatorToken?: string,
): Promise<AdventureModuleListItem[]> => {
  const payload = await fetchJson(buildApiUrl("/api/adventure-modules"), {
    headers: buildHeaders(creatorToken),
  });
  return adventureModuleListResponseSchema.parse(payload).modules;
};

export const getAdventureModuleSlugAvailability = async (
  slug: string,
  creatorToken?: string,
): Promise<AdventureModuleSlugAvailabilityResponse> => {
  const url = new URL(buildApiUrl("/api/adventure-modules/slug-availability"));
  url.searchParams.set("slug", slug);
  const payload = await fetchJson(url, {
    headers: buildHeaders(creatorToken),
  });
  return adventureModuleSlugAvailabilityResponseSchema.parse(payload);
};

export const createAdventureModule = async (
  request: AdventureModuleCreateRequest,
  creatorToken?: string,
): Promise<AdventureModuleCreateResponse> => {
  const payload = await fetchJson(buildApiUrl("/api/adventure-modules"), {
    method: "POST",
    headers: buildHeaders(creatorToken, { jsonContentType: true }),
    body: JSON.stringify(adventureModuleCreateRequestSchema.parse(request)),
  });
  return adventureModuleCreateResponseSchema.parse(payload);
};

export const cloneAdventureModule = async (
  moduleId: string,
  request: AdventureModuleCloneRequest,
  creatorToken?: string,
): Promise<AdventureModuleCreateResponse> => {
  const payload = await fetchJson(
    buildApiUrl(`/api/adventure-modules/${encodeURIComponent(moduleId)}/clone`),
    {
      method: "POST",
      headers: buildHeaders(creatorToken, { jsonContentType: true }),
      body: JSON.stringify(adventureModuleCloneRequestSchema.parse(request)),
    },
  );
  return adventureModuleCreateResponseSchema.parse(payload);
};

export const getAdventureModule = async (
  moduleId: string,
  creatorToken?: string,
): Promise<AdventureModuleDetail> => {
  const payload = await fetchJson(
    buildApiUrl(`/api/adventure-modules/${encodeURIComponent(moduleId)}`),
    {
      headers: buildHeaders(creatorToken),
    },
  );
  return adventureModuleGetResponseSchema.parse(payload);
};

export const getAdventureModuleBySlug = async (
  slug: string,
  creatorToken?: string,
): Promise<AdventureModuleDetail> => {
  const payload = await fetchJson(
    buildApiUrl(`/api/adventure-modules/by-slug/${encodeURIComponent(slug)}`),
    {
      headers: buildHeaders(creatorToken),
    },
  );
  return adventureModuleGetResponseSchema.parse(payload);
};

export const updateAdventureModuleIndex = async (
  moduleId: string,
  index: AdventureModuleIndex,
  creatorToken?: string,
): Promise<AdventureModuleDetail> => {
  const payload = await fetchJson(
    buildApiUrl(`/api/adventure-modules/${encodeURIComponent(moduleId)}/index`),
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
  return adventureModuleUpdateResponseSchema.parse(payload);
};

export const updateAdventureModuleFragment = async (
  moduleId: string,
  fragmentId: string,
  content: string,
  creatorToken?: string,
): Promise<AdventureModuleDetail> => {
  const payload = await fetchJson(
    buildApiUrl(
      `/api/adventure-modules/${encodeURIComponent(moduleId)}/fragments/${encodeURIComponent(fragmentId)}`,
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
  return adventureModuleUpdateResponseSchema.parse(payload);
};

export const createAdventureModuleActor = async (
  moduleId: string,
  request: AdventureModuleCreateActorRequest,
  creatorToken?: string,
): Promise<AdventureModuleDetail> => {
  const payload = await fetchJson(
    buildApiUrl(`/api/adventure-modules/${encodeURIComponent(moduleId)}/actors`),
    {
      method: "POST",
      headers: buildHeaders(creatorToken, { jsonContentType: true }),
      body: JSON.stringify(adventureModuleCreateActorRequestSchema.parse(request)),
    },
  );
  return adventureModuleCreateResponseSchema.parse(payload);
};

export const updateAdventureModuleActor = async (
  moduleId: string,
  actorSlug: string,
  request: {
    title: string;
    summary: string;
    baseLayerSlug: string;
    tacticalRoleSlug: string;
    tacticalSpecialSlug?: string | null;
    content: string;
  },
  creatorToken?: string,
): Promise<AdventureModuleDetail> => {
  const payload = await fetchJson(
    buildApiUrl(
      `/api/adventure-modules/${encodeURIComponent(moduleId)}/actors/${encodeURIComponent(actorSlug)}`,
    ),
    {
      method: "PUT",
      headers: buildHeaders(creatorToken, { jsonContentType: true }),
      body: JSON.stringify(adventureModuleUpdateActorRequestSchema.parse(request)),
    },
  );
  return adventureModuleUpdateActorResponseSchema.parse(payload);
};

export const deleteAdventureModuleActor = async (
  moduleId: string,
  actorSlug: string,
  creatorToken?: string,
): Promise<AdventureModuleDetail> => {
  const payload = await fetchJson(
    buildApiUrl(
      `/api/adventure-modules/${encodeURIComponent(moduleId)}/actors/${encodeURIComponent(actorSlug)}`,
    ),
    {
      method: "DELETE",
      headers: buildHeaders(creatorToken),
    },
  );
  return adventureModuleUpdateResponseSchema.parse(payload);
};

export const createAdventureModuleCounter = async (
  moduleId: string,
  request: AdventureModuleCreateCounterRequest,
  creatorToken?: string,
): Promise<AdventureModuleDetail> => {
  const payload = await fetchJson(
    buildApiUrl(`/api/adventure-modules/${encodeURIComponent(moduleId)}/counters`),
    {
      method: "POST",
      headers: buildHeaders(creatorToken, { jsonContentType: true }),
      body: JSON.stringify(
        adventureModuleCreateCounterRequestSchema.parse(request),
      ),
    },
  );
  return adventureModuleCreateResponseSchema.parse(payload);
};

export const updateAdventureModuleCounter = async (
  moduleId: string,
  counterSlug: string,
  request: {
    title: string;
    iconSlug: string;
    currentValue: number;
    maxValue?: number | null;
    description: string;
  },
  creatorToken?: string,
): Promise<AdventureModuleDetail> => {
  const payload = await fetchJson(
    buildApiUrl(
      `/api/adventure-modules/${encodeURIComponent(moduleId)}/counters/${encodeURIComponent(counterSlug)}`,
    ),
    {
      method: "PUT",
      headers: buildHeaders(creatorToken, { jsonContentType: true }),
      body: JSON.stringify(
        adventureModuleUpdateCounterRequestSchema.parse(request),
      ),
    },
  );
  return adventureModuleUpdateCounterResponseSchema.parse(payload);
};

export const deleteAdventureModuleCounter = async (
  moduleId: string,
  counterSlug: string,
  creatorToken?: string,
): Promise<AdventureModuleDetail> => {
  const payload = await fetchJson(
    buildApiUrl(
      `/api/adventure-modules/${encodeURIComponent(moduleId)}/counters/${encodeURIComponent(counterSlug)}`,
    ),
    {
      method: "DELETE",
      headers: buildHeaders(creatorToken),
    },
  );
  return adventureModuleUpdateResponseSchema.parse(payload);
};

export const updateAdventureModuleCoverImage = async (
  moduleId: string,
  request: AdventureModuleUpdateCoverImageRequest,
  creatorToken?: string,
): Promise<AdventureModuleDetail> => {
  const payload = await fetchJson(
    buildApiUrl(`/api/adventure-modules/${encodeURIComponent(moduleId)}/cover-image`),
    {
      method: "PUT",
      headers: buildHeaders(creatorToken, { jsonContentType: true }),
      body: JSON.stringify(
        adventureModuleUpdateCoverImageRequestSchema.parse(request),
      ),
    },
  );
  return adventureModuleUpdateResponseSchema.parse(payload);
};

export const getAdventureModulePreview = async (
  moduleId: string,
  options: {
    showSpoilers?: boolean;
  } = {},
  creatorToken?: string,
): Promise<AdventureModulePreviewResponse> => {
  const url = new URL(
    buildApiUrl(`/api/adventure-modules/${encodeURIComponent(moduleId)}/preview`),
  );
  if (typeof options.showSpoilers === "boolean") {
    url.searchParams.set("showSpoilers", options.showSpoilers ? "true" : "false");
  }
  const payload = await fetchJson(url, {
    headers: buildHeaders(creatorToken),
  });
  return adventureModulePreviewResponseSchema.parse(payload);
};
