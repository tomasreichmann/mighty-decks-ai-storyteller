import type {
  GeneratedImageGroup,
  ImageGenerateJobRequest,
  ImageJob,
  ImageLookupGroupRequest,
  ImageModelSummary,
  ImageProvider,
} from "@mighty-decks/spec/imageGeneration";
import {
  imageGroupResponseSchema,
  imageJobResponseSchema,
  imageModelsResponseSchema,
} from "@mighty-decks/spec/imageGeneration";
import { resolveServerUrl } from "./socket";

const buildApiUrl = (path: string): string =>
  new URL(path, resolveServerUrl()).toString();

const fetchJson = async (input: RequestInfo | URL, init?: RequestInit): Promise<unknown> => {
  const response = await fetch(input, init);
  const text = await response.text();
  const payload = text.trim().length > 0 ? JSON.parse(text) as unknown : null;
  if (!response.ok) {
    const errorMessage =
      payload &&
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : `Request failed (${response.status})`;
    throw new Error(errorMessage);
  }

  return payload;
};

export const fetchImageModels = async (
  provider: ImageProvider,
): Promise<ImageModelSummary[]> => {
  const payload = await fetchJson(
    buildApiUrl(`/api/image/models?provider=${encodeURIComponent(provider)}`),
  );
  const parsed = imageModelsResponseSchema.parse(payload);
  return parsed.models;
};

export const lookupImageGroup = async (
  request: ImageLookupGroupRequest,
): Promise<GeneratedImageGroup | null> => {
  const payload = await fetchJson(buildApiUrl("/api/image/groups/lookup"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });
  return imageGroupResponseSchema.parse(payload).group;
};

export const fetchImageGroup = async (
  groupKey: string,
): Promise<GeneratedImageGroup> => {
  const payload = await fetchJson(
    buildApiUrl(`/api/image/groups/${encodeURIComponent(groupKey)}`),
  );
  const group = imageGroupResponseSchema.parse(payload).group;
  if (!group) {
    throw new Error("Image group not found.");
  }

  return group;
};

export const createImageJob = async (
  request: ImageGenerateJobRequest,
): Promise<ImageJob> => {
  const payload = await fetchJson(buildApiUrl("/api/image/jobs"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });
  return imageJobResponseSchema.parse(payload).job;
};

export const fetchImageJob = async (jobId: string): Promise<ImageJob> => {
  const payload = await fetchJson(
    buildApiUrl(`/api/image/jobs/${encodeURIComponent(jobId)}`),
  );
  return imageJobResponseSchema.parse(payload).job;
};

export const setActiveImage = async (
  groupKey: string,
  imageId: string,
): Promise<GeneratedImageGroup> => {
  const payload = await fetchJson(
    buildApiUrl(`/api/image/groups/${encodeURIComponent(groupKey)}/active`),
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageId }),
    },
  );

  const group = imageGroupResponseSchema.parse(payload).group;
  if (!group) {
    throw new Error("Image group not found.");
  }

  return group;
};

export const deleteImageFromGroup = async (
  groupKey: string,
  imageId: string,
): Promise<GeneratedImageGroup> => {
  const payload = await fetchJson(
    buildApiUrl(
      `/api/image/groups/${encodeURIComponent(groupKey)}/images/${encodeURIComponent(imageId)}`,
    ),
    {
      method: "DELETE",
    },
  );
  const group = imageGroupResponseSchema.parse(payload).group;
  if (!group) {
    throw new Error("Image group not found.");
  }

  return group;
};

export const deleteBatchFromGroup = async (
  groupKey: string,
  batchIndex: number,
): Promise<GeneratedImageGroup> => {
  const payload = await fetchJson(
    buildApiUrl(
      `/api/image/groups/${encodeURIComponent(groupKey)}/batches/${batchIndex}`,
    ),
    {
      method: "DELETE",
    },
  );
  const group = imageGroupResponseSchema.parse(payload).group;
  if (!group) {
    throw new Error("Image group not found.");
  }

  return group;
};
