import {
  createTimeoutSignal,
  parseDeltaContent,
  parseJsonSafe,
  parseMessageContent,
  readUsage,
  type ChatCompletionResponse,
  type ChatCompletionStreamChunk,
  type OpenRouterTextResult,
  type OpenRouterUsage,
  type TextCompletionClient,
  type TextRequest,
} from "./OpenRouterClient";

export interface GroqClientOptions {
  apiKey: string | null;
  baseUrl?: string;
}

const GROQ_DEFAULT_BASE_URL = "https://api.groq.com/openai/v1";

const isGptOssModel = (model: string): boolean =>
  model.startsWith("openai/gpt-oss");

const buildRequestBody = (
  request: TextRequest,
  extras: Record<string, unknown> = {},
): Record<string, unknown> => {
  const body: Record<string, unknown> = {
    model: request.model,
    messages: [{ role: "user", content: request.prompt }],
    max_tokens: request.maxTokens,
    temperature: request.temperature,
    ...extras,
  };

  if (isGptOssModel(request.model)) {
    body.reasoning_effort = "low";
    body.include_reasoning = false;
  }

  return body;
};

export class GroqClient implements TextCompletionClient {
  private readonly baseUrl: string;

  public constructor(private readonly options: GroqClientOptions) {
    this.baseUrl = options.baseUrl ?? GROQ_DEFAULT_BASE_URL;
  }

  public hasApiKey(): boolean {
    return Boolean(this.options.apiKey);
  }

  public isAvailable(): boolean {
    return this.hasApiKey();
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

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      signal: createTimeoutSignal(request.timeoutMs),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.options.apiKey}`,
      },
      body: JSON.stringify(buildRequestBody(request)),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `Groq text request failed (${response.status} ${response.statusText}) for model "${request.model}": ${body.slice(0, 500)}`,
      );
    }

    const data = (await response.json()) as ChatCompletionResponse;
    const message = data.choices?.[0]?.message?.content;
    const usage = readUsage(data);
    if (!message) {
      return { text: null, usage };
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

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      signal: createTimeoutSignal(request.timeoutMs),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.options.apiKey}`,
      },
      body: JSON.stringify(
        buildRequestBody(request, {
          stream: true,
          stream_options: { include_usage: true },
        }),
      ),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(
        `Groq streaming request failed (${response.status} ${response.statusText}) for model "${request.model}": ${body.slice(0, 500)}`,
      );
    }
    if (!response.body) {
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
    return { text, usage };
  }
}
