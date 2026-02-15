interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string | Array<{
        type?: string;
        text?: string;
        image_url?: string | { url?: string };
        imageUrl?: string;
        url?: string;
      }>;
      images?: Array<{
        image_url?: string | { url?: string };
        imageUrl?: string;
        url?: string;
      }>;
    };
  }>;
  usage?: unknown;
}

interface ChatCompletionStreamChunk {
  choices?: Array<{
    delta?: {
      content?: string | Array<{
        type?: string;
        text?: string;
      }>;
    };
    message?: {
      content?: string | Array<{
        type?: string;
        text?: string;
      }>;
    };
  }>;
  usage?: unknown;
}

interface ImageGenerationResponse {
  data?: Array<{
    url?: string;
    b64_json?: string;
  }>;
  images?: Array<{
    url?: string;
    b64_json?: string;
  }>;
  output?: Array<string | { url?: string; b64_json?: string }>;
  url?: string;
  usage?: unknown;
}

type MessageContent = string | Array<{ type?: string; text?: string }> | undefined;

interface TextRequest {
  model: string;
  prompt: string;
  timeoutMs: number;
  maxTokens: number;
  temperature: number;
}

interface ImageRequest {
  model: string;
  prompt: string;
  timeoutMs: number;
}

export interface OpenRouterUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  cachedTokens?: number;
  reasoningTokens?: number;
  costCredits?: number;
  upstreamInferenceCostCredits?: number;
}

export interface OpenRouterTextResult {
  text: string | null;
  usage?: OpenRouterUsage;
}

export interface OpenRouterImageResult {
  imageUrl: string | null;
  usage?: OpenRouterUsage;
}

export interface OpenRouterClientOptions {
  apiKey: string | null;
}

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

const parseMessageContent = (rawContent: MessageContent): string | null => {
  if (typeof rawContent === "string") {
    const trimmed = rawContent.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (!Array.isArray(rawContent)) {
    return null;
  }

  const flattened = rawContent
    .map((part) => part.text?.trim() ?? "")
    .filter((part) => part.length > 0)
    .join("\n")
    .trim();

  return flattened.length > 0 ? flattened : null;
};

const parseDeltaContent = (rawContent: MessageContent): string => {
  if (typeof rawContent === "string") {
    return rawContent;
  }

  if (!Array.isArray(rawContent)) {
    return "";
  }

  return rawContent.map((part) => part.text ?? "").join("");
};

const createTimeoutSignal = (timeoutMs: number): AbortSignal => {
  return AbortSignal.timeout(timeoutMs);
};

const MAX_ERROR_SNIPPET = 500;

const shorten = (value: string, maxLength: number): string =>
  value.length <= maxLength ? value : `${value.slice(0, maxLength)}...`;

const parseJsonSafe = (raw: string): unknown | null => {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const readNonnegativeInt = (value: unknown): number | undefined => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return undefined;
  }

  return Math.round(value);
};

const readNonnegativeNumber = (value: unknown): number | undefined => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return undefined;
  }

  return value;
};

const readValueAtPath = (
  record: Record<string, unknown>,
  path: string[],
): unknown => {
  let current: unknown = record;
  for (const segment of path) {
    if (!isRecord(current)) {
      return undefined;
    }

    current = current[segment];
  }

  return current;
};

const readFirstIntAtPaths = (
  record: Record<string, unknown>,
  paths: string[][],
): number | undefined => {
  for (const path of paths) {
    const value = readValueAtPath(record, path);
    const parsed = readNonnegativeInt(value);
    if (parsed !== undefined) {
      return parsed;
    }
  }

  return undefined;
};

const readFirstNumberAtPaths = (
  record: Record<string, unknown>,
  paths: string[][],
): number | undefined => {
  for (const path of paths) {
    const value = readValueAtPath(record, path);
    const parsed = readNonnegativeNumber(value);
    if (parsed !== undefined) {
      return parsed;
    }
  }

  return undefined;
};

const readUsage = (payload: unknown): OpenRouterUsage | undefined => {
  if (!isRecord(payload)) {
    return undefined;
  }

  const usage = payload.usage;
  if (!isRecord(usage)) {
    return undefined;
  }

  const promptTokens = readFirstIntAtPaths(usage, [
    ["prompt_tokens"],
    ["input_tokens"],
  ]);
  const completionTokens = readFirstIntAtPaths(usage, [
    ["completion_tokens"],
    ["output_tokens"],
  ]);
  const totalTokens = readFirstIntAtPaths(usage, [["total_tokens"]]);
  const cachedTokens = readFirstIntAtPaths(usage, [
    ["prompt_tokens_details", "cached_tokens"],
    ["input_tokens_details", "cached_tokens"],
    ["cache_read_input_tokens"],
  ]);
  const reasoningTokens = readFirstIntAtPaths(usage, [
    ["completion_tokens_details", "reasoning_tokens"],
    ["output_tokens_details", "reasoning_tokens"],
    ["reasoning_tokens"],
  ]);
  const costCredits = readFirstNumberAtPaths(usage, [
    ["cost"],
    ["total_cost"],
  ]);
  const upstreamInferenceCostCredits = readFirstNumberAtPaths(usage, [
    ["upstream_inference_cost"],
  ]);

  const hasAnyUsage = [
    promptTokens,
    completionTokens,
    totalTokens,
    cachedTokens,
    reasoningTokens,
    costCredits,
    upstreamInferenceCostCredits,
  ].some((value) => value !== undefined);
  if (!hasAnyUsage) {
    return undefined;
  }

  return {
    promptTokens,
    completionTokens,
    totalTokens,
    cachedTokens,
    reasoningTokens,
    costCredits,
    upstreamInferenceCostCredits,
  };
};

const readImageCandidate = (candidate: unknown): string | null => {
  if (typeof candidate === "string" && candidate.trim().length > 0) {
    return candidate.trim();
  }

  if (!isRecord(candidate)) {
    return null;
  }

  const directUrl = candidate.url;
  if (typeof directUrl === "string" && directUrl.trim().length > 0) {
    return directUrl.trim();
  }

  const camelUrl = candidate.imageUrl;
  if (typeof camelUrl === "string" && camelUrl.trim().length > 0) {
    return camelUrl.trim();
  }

  const snakeImageUrl = candidate.image_url;
  if (typeof snakeImageUrl === "string" && snakeImageUrl.trim().length > 0) {
    return snakeImageUrl.trim();
  }

  if (isRecord(snakeImageUrl)) {
    const nestedUrl = snakeImageUrl.url;
    if (typeof nestedUrl === "string" && nestedUrl.trim().length > 0) {
      return nestedUrl.trim();
    }
  }

  const b64 = candidate.b64_json;
  if (typeof b64 === "string" && b64.trim().length > 0) {
    return `data:image/png;base64,${b64}`;
  }

  return null;
};

const extractImageUrl = (payload: unknown): string | null => {
  if (!isRecord(payload)) {
    return null;
  }

  const direct = readImageCandidate(payload);
  if (direct) {
    return direct;
  }

  const collections: unknown[] = [payload.data, payload.images, payload.output];
  for (const collection of collections) {
    if (!Array.isArray(collection)) {
      continue;
    }

    for (const candidate of collection) {
      const resolved = readImageCandidate(candidate);
      if (resolved) {
        return resolved;
      }
    }
  }

  const choices = payload.choices;
  if (Array.isArray(choices)) {
    for (const choice of choices) {
      if (!isRecord(choice)) {
        continue;
      }

      const message = choice.message;
      const messageDirect = readImageCandidate(message);
      if (messageDirect) {
        return messageDirect;
      }

      if (!isRecord(message)) {
        continue;
      }

      const messageCollections: unknown[] = [message.images, message.content];
      for (const messageCollection of messageCollections) {
        if (!Array.isArray(messageCollection)) {
          continue;
        }

        for (const item of messageCollection) {
          const resolved = readImageCandidate(item);
          if (resolved) {
            return resolved;
          }
        }
      }
    }
  }

  return null;
};

const supportsImageOnlyHint = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.message.includes("No endpoints found that support the requested output modalities");
};

export class OpenRouterClient {
  public constructor(private readonly options: OpenRouterClientOptions) {}

  public hasApiKey(): boolean {
    return Boolean(this.options.apiKey);
  }

  public async completeText(request: TextRequest): Promise<string | null> {
    const result = await this.completeTextWithMetadata(request);
    return result?.text ?? null;
  }

  public async completeTextWithMetadata(
    request: TextRequest,
  ): Promise<OpenRouterTextResult | null> {
    if (!this.options.apiKey) {
      return null;
    }

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      signal: createTimeoutSignal(request.timeoutMs),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.options.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages: [
          {
            role: "user",
            content: request.prompt,
          },
        ],
        max_tokens: request.maxTokens,
        temperature: request.temperature,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as ChatCompletionResponse;
    const message = data.choices?.[0]?.message?.content;
    const usage = readUsage(data);
    if (!message) {
      return {
        text: null,
        usage,
      };
    }

    return {
      text: parseMessageContent(message),
      usage,
    };
  }

  public async completeTextStreamWithMetadata(
    request: TextRequest,
    onChunk: (chunk: string) => void,
  ): Promise<OpenRouterTextResult | null> {
    if (!this.options.apiKey) {
      return null;
    }

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      signal: createTimeoutSignal(request.timeoutMs),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.options.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages: [
          {
            role: "user",
            content: request.prompt,
          },
        ],
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        stream: true,
        stream_options: {
          include_usage: true,
        },
      }),
    });

    if (!response.ok || !response.body) {
      return null;
    }

    const decoder = new TextDecoder();
    const reader = response.body.getReader();
    let aggregate = "";
    let pending = "";
    let usage: OpenRouterUsage | undefined;

    const processLine = (line: string): void => {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) {
        return;
      }

      const payload = trimmed.slice("data:".length).trim();
      if (payload.length === 0 || payload === "[DONE]") {
        return;
      }

      const parsed = parseJsonSafe(payload) as ChatCompletionStreamChunk | null;
      if (!parsed) {
        return;
      }

      const chunkUsage = readUsage(parsed);
      if (chunkUsage) {
        usage = chunkUsage;
      }

      const delta = parseDeltaContent(
        parsed.choices?.[0]?.delta?.content ??
          parsed.choices?.[0]?.message?.content,
      );
      if (delta.length === 0) {
        return;
      }

      aggregate += delta;
      onChunk(delta);
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      pending += decoder.decode(value, { stream: true });
      let newlineIndex = pending.indexOf("\n");
      while (newlineIndex >= 0) {
        const line = pending.slice(0, newlineIndex);
        pending = pending.slice(newlineIndex + 1);
        processLine(line);
        newlineIndex = pending.indexOf("\n");
      }
    }

    const finalChunk = decoder.decode();
    if (finalChunk.length > 0) {
      pending += finalChunk;
    }
    if (pending.trim().length > 0) {
      processLine(pending);
    }

    const text = aggregate.trim().length > 0 ? aggregate : null;
    return {
      text,
      usage,
    };
  }

  public async generateImage(request: ImageRequest): Promise<string | null> {
    const result = await this.generateImageWithMetadata(request);
    return result?.imageUrl ?? null;
  }

  public async generateImageWithMetadata(
    request: ImageRequest,
  ): Promise<OpenRouterImageResult | null> {
    if (!this.options.apiKey) {
      return null;
    }

    try {
      return await this.generateImageWithModalities(request, ["image"]);
    } catch (error) {
      if (!supportsImageOnlyHint(error)) {
        throw error;
      }

      return this.generateImageWithModalities(request, ["image", "text"]);
    }
  }

  private async generateImageWithModalities(
    request: ImageRequest,
    modalities: Array<"image" | "text">,
  ): Promise<OpenRouterImageResult | null> {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      signal: createTimeoutSignal(request.timeoutMs),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.options.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model,
        messages: [
          {
            role: "user",
            content: request.prompt,
          },
        ],
        modalities,
        image_config: {
          aspect_ratio: "16:9",
        },
        max_tokens: 1,
      }),
    });

    const responseText = await response.text();
    if (!response.ok) {
      throw new Error(
        `Image request failed (${response.status} ${response.statusText}): ${shorten(responseText, MAX_ERROR_SNIPPET)}`,
      );
    }

    const data = parseJsonSafe(responseText) as ImageGenerationResponse | null;
    if (!data) {
      throw new Error(
        `Image response was not valid JSON: ${shorten(responseText, MAX_ERROR_SNIPPET)}`,
      );
    }

    const imageUrl = extractImageUrl(data);
    if (imageUrl) {
      return {
        imageUrl,
        usage: readUsage(data),
      };
    }

    throw new Error(
      `Image response had no usable URL or base64 payload: ${shorten(responseText, MAX_ERROR_SNIPPET)}`,
    );
  }
}
