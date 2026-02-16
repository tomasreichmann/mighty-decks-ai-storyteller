import type { ImageModelSummary } from "@mighty-decks/spec/imageGeneration";

interface LeonardoClientOptions {
  apiKey: string | null;
  baseUrl: string;
  pollIntervalMs: number;
  pollTimeoutMs: number;
}

interface LeonardoGenerationRequest {
  prompt: string;
  model: string;
  resolution: {
    width: number;
    height: number;
  };
}

interface LeonardoGenerationResult {
  imageUrl: string;
  status: string;
}

type RecordLike = Record<string, unknown>;

const isRecord = (value: unknown): value is RecordLike =>
  typeof value === "object" && value !== null;

const readString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const readStringAtPath = (
  record: RecordLike,
  path: string[],
): string | null => {
  let current: unknown = record;
  for (const segment of path) {
    if (!isRecord(current)) {
      return null;
    }
    current = current[segment];
  }

  return readString(current);
};

const extractGenerationId = (payload: unknown): string | null => {
  if (!isRecord(payload)) {
    return null;
  }

  const paths = [
    ["sdGenerationJob", "generationId"],
    ["sdGenerationJob", "id"],
    ["generationId"],
    ["id"],
    ["data", "generationId"],
    ["data", "id"],
  ];
  for (const path of paths) {
    const value = readStringAtPath(payload, path);
    if (value) {
      return value;
    }
  }

  return null;
};

const extractStatus = (payload: unknown): string | null => {
  if (!isRecord(payload)) {
    return null;
  }

  const paths = [
    ["sdGenerationJob", "status"],
    ["generations_by_pk", "status"],
    ["status"],
    ["data", "status"],
  ];
  for (const path of paths) {
    const value = readStringAtPath(payload, path);
    if (value) {
      return value;
    }
  }

  return null;
};

const readImageUrlCandidate = (value: unknown): string | null => {
  if (typeof value === "string") {
    return readString(value);
  }

  if (!isRecord(value)) {
    return null;
  }

  const direct = readString(value.url);
  if (direct) {
    return direct;
  }

  const generated = readString(value.generated_image_url);
  if (generated) {
    return generated;
  }

  const camel = readString(value.imageUrl);
  if (camel) {
    return camel;
  }

  return null;
};

const readImageArrayFromCollection = (collection: unknown): string[] => {
  if (!Array.isArray(collection)) {
    return [];
  }

  const urls: string[] = [];
  for (const item of collection) {
    const resolved = readImageUrlCandidate(item);
    if (resolved) {
      urls.push(resolved);
    }
  }

  return urls;
};

const extractImageUrls = (payload: unknown): string[] => {
  if (!isRecord(payload)) {
    return [];
  }

  const direct = readImageUrlCandidate(payload);
  if (direct) {
    return [direct];
  }

  const candidateCollections: unknown[] = [
    payload.generated_images,
    payload.images,
    payload.outputs,
    payload.data,
    isRecord(payload.sdGenerationJob)
      ? payload.sdGenerationJob.generated_images
      : undefined,
    isRecord(payload.generations_by_pk)
      ? payload.generations_by_pk.generated_images
      : undefined,
  ];

  for (const collection of candidateCollections) {
    const urls = readImageArrayFromCollection(collection);
    if (urls.length > 0) {
      return urls;
    }
  }

  return [];
};

const isCompleteStatus = (status: string): boolean =>
  ["complete", "completed", "finished", "succeeded"].includes(
    status.toLowerCase(),
  );

const isFailureStatus = (status: string): boolean =>
  ["failed", "error", "cancelled", "canceled"].includes(status.toLowerCase());

const delay = async (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export class LeonardoClient {
  private readonly baseUrl: string;
  private readonly pollIntervalMs: number;
  private readonly pollTimeoutMs: number;

  public constructor(private readonly options: LeonardoClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.pollIntervalMs = Math.max(100, options.pollIntervalMs);
    this.pollTimeoutMs = Math.max(this.pollIntervalMs, options.pollTimeoutMs);
  }

  public hasApiKey(): boolean {
    return Boolean(this.options.apiKey);
  }

  public async listModels(): Promise<ImageModelSummary[]> {
    if (!this.options.apiKey) {
      return [];
    }

    const payload = await this.requestJson("/platformModels", {
      method: "GET",
    });
    if (!isRecord(payload)) {
      return [];
    }

    const collections: unknown[] = [
      payload.custom_models,
      payload.platformModels,
      payload.platform_models,
      payload.models,
      payload.data,
    ];

    const modelsById = new Map<string, ImageModelSummary>();
    for (const collection of collections) {
      if (!Array.isArray(collection)) {
        continue;
      }

      for (const candidate of collection) {
        if (!isRecord(candidate)) {
          continue;
        }

        const modelId =
          readString(candidate.id) ??
          readString(candidate.modelId) ??
          readString(candidate.model_id) ??
          readString(candidate.slug);
        if (!modelId) {
          continue;
        }

        const displayName =
          readString(candidate.name) ??
          readString(candidate.displayName) ??
          readString(candidate.title) ??
          modelId;
        const description =
          readString(candidate.description) ??
          readString(candidate.prompt) ??
          undefined;

        if (!modelsById.has(modelId)) {
          modelsById.set(modelId, {
            modelId,
            displayName,
            description,
          });
        }
      }
    }

    return [...modelsById.values()].sort((left, right) =>
      left.displayName.localeCompare(right.displayName),
    );
  }

  public async generateImage(
    request: LeonardoGenerationRequest,
  ): Promise<LeonardoGenerationResult> {
    if (!this.options.apiKey) {
      throw new Error("Leonardo API key missing.");
    }

    const createdPayload = await this.requestJson("/generations", {
      method: "POST",
      body: JSON.stringify({
        prompt: request.prompt,
        modelId: request.model,
        width: request.resolution.width,
        height: request.resolution.height,
        num_images: 1,
      }),
    });

    const createdImageUrls = extractImageUrls(createdPayload);
    if (createdImageUrls.length > 0) {
      return {
        imageUrl: createdImageUrls[0]!,
        status: extractStatus(createdPayload) ?? "completed",
      };
    }

    const generationId = extractGenerationId(createdPayload);
    if (!generationId) {
      throw new Error("Leonardo response did not include a generation id.");
    }

    return this.pollUntilComplete(generationId);
  }

  private async pollUntilComplete(
    generationId: string,
  ): Promise<LeonardoGenerationResult> {
    const startedAt = Date.now();

    while (Date.now() - startedAt <= this.pollTimeoutMs) {
      const payload = await this.requestJson(
        `/generations/${encodeURIComponent(generationId)}`,
        {
          method: "GET",
        },
      );

      const status = extractStatus(payload) ?? "unknown";
      const imageUrls = extractImageUrls(payload);
      if (imageUrls.length > 0 && !isFailureStatus(status)) {
        return {
          imageUrl: imageUrls[0]!,
          status,
        };
      }

      if (isFailureStatus(status)) {
        throw new Error(`Leonardo generation failed with status '${status}'.`);
      }

      if (isCompleteStatus(status) && imageUrls.length === 0) {
        throw new Error(
          "Leonardo generation completed but no image URL was returned.",
        );
      }

      await delay(this.pollIntervalMs);
    }

    throw new Error("Leonardo generation polling timed out.");
  }

  private async requestJson(
    path: string,
    init: RequestInit,
  ): Promise<unknown> {
    if (!this.options.apiKey) {
      return null;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this.options.apiKey}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
      },
      signal: AbortSignal.timeout(this.pollTimeoutMs),
    });
    const text = await response.text();

    if (!response.ok) {
      throw new Error(
        `Leonardo request failed (${response.status} ${response.statusText}): ${text.slice(0, 400)}`,
      );
    }

    if (text.trim().length === 0) {
      return null;
    }

    try {
      return JSON.parse(text) as unknown;
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? `Leonardo returned invalid JSON: ${error.message}`
          : "Leonardo returned invalid JSON.",
      );
    }
  }
}

export type { LeonardoGenerationRequest, LeonardoGenerationResult };
