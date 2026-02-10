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
    if (!message) {
      return null;
    }

    return parseMessageContent(message);
  }

  public async generateImage(request: ImageRequest): Promise<string | null> {
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
  ): Promise<string | null> {
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
      return imageUrl;
    }

    throw new Error(
      `Image response had no usable URL or base64 payload: ${shorten(responseText, MAX_ERROR_SNIPPET)}`,
    );
  }
}
