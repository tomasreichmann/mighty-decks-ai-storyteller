import type { ImageModelSummary } from "@mighty-decks/spec/imageGeneration";

interface FalClientOptions {
  apiKey: string | null;
  apiBaseUrl: string;
  queueBaseUrl: string;
  pollIntervalMs: number;
  pollTimeoutMs: number;
}

interface FalGenerationRequest {
  prompt: string;
  model: string;
  resolution: {
    width: number;
    height: number;
  };
}

interface FalGenerationResult {
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

const readStringAtPath = (record: RecordLike, path: string[]): string | null => {
  let current: unknown = record;
  for (const segment of path) {
    if (!isRecord(current)) {
      return null;
    }
    current = current[segment];
  }

  return readString(current);
};

const normalizeEndpointId = (model: string): string =>
  model
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");

const toEncodedEndpointPath = (model: string): string =>
  normalizeEndpointId(model)
    .split("/")
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

const extractRequestId = (payload: unknown): string | null => {
  if (!isRecord(payload)) {
    return null;
  }

  const paths = [
    ["request_id"],
    ["requestId"],
    ["data", "request_id"],
    ["data", "requestId"],
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
    ["status"],
    ["state"],
    ["data", "status"],
    ["data", "state"],
    ["response", "status"],
  ];
  for (const path of paths) {
    const value = readStringAtPath(payload, path);
    if (value) {
      return value;
    }
  }

  return null;
};

const extractStatusUrl = (payload: unknown): string | null => {
  if (!isRecord(payload)) {
    return null;
  }

  const paths = [
    ["status_url"],
    ["statusUrl"],
    ["data", "status_url"],
    ["data", "statusUrl"],
  ];
  for (const path of paths) {
    const value = readStringAtPath(payload, path);
    if (value) {
      return value;
    }
  }

  return null;
};

const extractResponseUrl = (payload: unknown): string | null => {
  if (!isRecord(payload)) {
    return null;
  }

  const paths = [
    ["response_url"],
    ["responseUrl"],
    ["data", "response_url"],
    ["data", "responseUrl"],
    ["result_url"],
    ["resultUrl"],
    ["data", "result_url"],
    ["data", "resultUrl"],
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

  const paths = [["url"], ["image_url"], ["imageUrl"], ["src"]];
  for (const path of paths) {
    const resolved = readStringAtPath(value, path);
    if (resolved) {
      return resolved;
    }
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
    payload.images,
    payload.outputs,
    payload.data,
    isRecord(payload.data) ? payload.data.images : undefined,
    isRecord(payload.response) ? payload.response.images : undefined,
    isRecord(payload.result) ? payload.result.images : undefined,
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
  ["completed", "complete", "succeeded", "success"].includes(
    status.toLowerCase(),
  );

const isFailureStatus = (status: string): boolean =>
  ["failed", "error", "cancelled", "canceled"].includes(status.toLowerCase());

const delay = async (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export class FalClient {
  private readonly apiBaseUrl: string;
  private readonly queueBaseUrl: string;
  private readonly pollIntervalMs: number;
  private readonly pollTimeoutMs: number;

  public constructor(private readonly options: FalClientOptions) {
    this.apiBaseUrl = options.apiBaseUrl.replace(/\/+$/, "");
    this.queueBaseUrl = options.queueBaseUrl.replace(/\/+$/, "");
    this.pollIntervalMs = Math.max(100, options.pollIntervalMs);
    this.pollTimeoutMs = Math.max(this.pollIntervalMs, options.pollTimeoutMs);
  }

  public async listModels(): Promise<ImageModelSummary[]> {
    if (!this.options.apiKey) {
      return [];
    }

    const payload = await this.requestJson(
      `${this.apiBaseUrl}/models?category=text-to-image&status=active&is_private=false&limit=100`,
      {
        method: "GET",
      },
    );

    const collection = Array.isArray(payload)
      ? payload
      : isRecord(payload) && Array.isArray(payload.models)
        ? payload.models
        : isRecord(payload) && Array.isArray(payload.data)
          ? payload.data
          : [];

    const modelsById = new Map<string, ImageModelSummary>();
    for (const candidate of collection) {
      if (!isRecord(candidate)) {
        continue;
      }

      const metadata = isRecord(candidate.metadata) ? candidate.metadata : null;

      const modelId =
        readString(candidate.endpoint_id) ??
        readString(candidate.model_id) ??
        readString(candidate.id) ??
        readString(candidate.slug);
      if (!modelId) {
        continue;
      }

      const displayName =
        (metadata ? readString(metadata.display_name) : null) ??
        (metadata ? readString(metadata.name) : null) ??
        (metadata ? readString(metadata.title) : null) ??
        readString(candidate.title) ??
        readString(candidate.name) ??
        readString(candidate.display_name) ??
        modelId;
      const description =
        (metadata ? readString(metadata.description) : null) ??
        readString(candidate.description) ??
        undefined;

      if (!modelsById.has(modelId)) {
        modelsById.set(modelId, {
          modelId,
          displayName,
          description,
        });
      }
    }

    return [...modelsById.values()].sort((left, right) =>
      left.displayName.localeCompare(right.displayName),
    );
  }

  public async generateImage(
    request: FalGenerationRequest,
  ): Promise<FalGenerationResult> {
    if (!this.options.apiKey) {
      throw new Error("fal.ai API key missing.");
    }

    const endpointPath = toEncodedEndpointPath(request.model);
    if (endpointPath.length === 0) {
      throw new Error("fal.ai model id is required.");
    }

    const submitUrl = `${this.queueBaseUrl}/${endpointPath}`;
    const submitPayload = await this.submitGeneration(submitUrl, request);
    const submitImageUrls = extractImageUrls(submitPayload);
    if (submitImageUrls.length > 0) {
      return {
        imageUrl: submitImageUrls[0]!,
        status: extractStatus(submitPayload) ?? "completed",
      };
    }

    const requestId = extractRequestId(submitPayload);
    if (!requestId) {
      throw new Error("fal.ai response did not include a request id.");
    }

    return this.pollUntilComplete(
      submitUrl,
      requestId,
      extractStatusUrl(submitPayload),
      extractResponseUrl(submitPayload),
    );
  }

  private async submitGeneration(
    submitUrl: string,
    request: FalGenerationRequest,
  ): Promise<unknown> {
    try {
      return await this.requestJson(submitUrl, {
        method: "POST",
        body: JSON.stringify({
          prompt: request.prompt,
          image_size: {
            width: request.resolution.width,
            height: request.resolution.height,
          },
        }),
      });
    } catch (firstError) {
      const firstMessage =
        firstError instanceof Error ? firstError.message.toLowerCase() : "";
      const imageSizeRejected =
        firstMessage.includes("image_size") &&
        (firstMessage.includes("unexpected") || firstMessage.includes("unknown"));
      if (!imageSizeRejected) {
        throw firstError;
      }

      return this.requestJson(submitUrl, {
        method: "POST",
        body: JSON.stringify({
          prompt: request.prompt,
          width: request.resolution.width,
          height: request.resolution.height,
        }),
      });
    }
  }

  private async pollUntilComplete(
    submitUrl: string,
    requestId: string,
    statusUrlOverride: string | null,
    responseUrlOverride: string | null,
  ): Promise<FalGenerationResult> {
    const startedAt = Date.now();
    const statusUrl =
      statusUrlOverride ??
      `${submitUrl}/requests/${encodeURIComponent(requestId)}/status`;
    const resultUrl =
      responseUrlOverride ?? `${submitUrl}/requests/${encodeURIComponent(requestId)}`;

    while (Date.now() - startedAt <= this.pollTimeoutMs) {
      const statusPayload = await this.requestJson(statusUrl, {
        method: "GET",
      });
      const status = extractStatus(statusPayload) ?? "unknown";
      if (isFailureStatus(status)) {
        throw new Error(`fal.ai generation failed with status '${status}'.`);
      }

      if (isCompleteStatus(status)) {
        const resultPayload = await this.requestJson(resultUrl, {
          method: "GET",
        });
        const imageUrls = extractImageUrls(resultPayload);
        if (imageUrls.length === 0) {
          throw new Error(
            "fal.ai generation completed but no image URL was returned.",
          );
        }

        return {
          imageUrl: imageUrls[0]!,
          status,
        };
      }

      await delay(this.pollIntervalMs);
    }

    throw new Error("fal.ai generation polling timed out.");
  }

  private async requestJson(url: string, init: RequestInit): Promise<unknown> {
    if (!this.options.apiKey) {
      return null;
    }

    const response = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Key ${this.options.apiKey}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
      },
      signal: AbortSignal.timeout(this.pollTimeoutMs),
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(
        `fal.ai request failed (${response.status} ${response.statusText}): ${text.slice(0, 400)}`,
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
          ? `fal.ai returned invalid JSON: ${error.message}`
          : "fal.ai returned invalid JSON.",
      );
    }
  }
}

export type { FalGenerationRequest, FalGenerationResult };
