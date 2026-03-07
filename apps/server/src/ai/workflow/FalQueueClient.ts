interface FalQueueClientOptions {
  apiKey: string | null;
  apiBaseUrl: string;
  queueBaseUrl: string;
  pollIntervalMs: number;
  pollTimeoutMs: number;
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

const readAtPath = (value: unknown, path: string[]): unknown => {
  let current = value;
  for (const segment of path) {
    if (!isRecord(current)) {
      return undefined;
    }
    current = current[segment];
  }
  return current;
};

const readStringAtPath = (value: unknown, path: string[]): string | null =>
  readString(readAtPath(value, path));

const normalizeEndpoint = (endpoint: string): string =>
  endpoint
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");

const endpointPath = (endpoint: string): string =>
  normalizeEndpoint(endpoint)
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

const extractRequestId = (payload: unknown): string | null => {
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

const extractUrl = (payload: unknown, paths: string[][]): string | null => {
  for (const path of paths) {
    const value = readStringAtPath(payload, path);
    if (value) {
      return value;
    }
  }
  return null;
};

const isCompleteStatus = (status: string): boolean =>
  ["completed", "complete", "succeeded", "success"].includes(status.toLowerCase());
const isFailureStatus = (status: string): boolean =>
  ["failed", "error", "cancelled", "canceled"].includes(status.toLowerCase());

const sleep = async (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const combineAbortSignals = (signals: AbortSignal[]): AbortSignal => {
  const active = signals.filter((signal) => !signal.aborted);
  if (active.length === 0) {
    return AbortSignal.abort();
  }
  if (active.length === 1) {
    return active[0]!;
  }
  const controller = new AbortController();
  const onAbort = (event: Event): void => {
    const source = event.target;
    if (source instanceof AbortSignal) {
      controller.abort(source.reason);
    } else {
      controller.abort();
    }
  };
  for (const signal of active) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      break;
    }
    signal.addEventListener("abort", onAbort, { once: true });
  }
  return controller.signal;
};

export interface FalQueueInvocationResult {
  submitPayload: unknown;
  resultPayload: unknown;
  status: string;
}

export class FalQueueClient {
  private readonly apiBaseUrl: string;
  private readonly queueBaseUrl: string;
  private readonly pollIntervalMs: number;
  private readonly pollTimeoutMs: number;

  public constructor(private readonly options: FalQueueClientOptions) {
    this.apiBaseUrl = options.apiBaseUrl.replace(/\/+$/, "");
    this.queueBaseUrl = options.queueBaseUrl.replace(/\/+$/, "");
    this.pollIntervalMs = Math.max(100, options.pollIntervalMs);
    this.pollTimeoutMs = Math.max(this.pollIntervalMs, options.pollTimeoutMs);
  }

  public hasApiKey(): boolean {
    return Boolean(this.options.apiKey);
  }

  public getModelsUrl(category: string): string {
    return `${this.apiBaseUrl}/models?category=${encodeURIComponent(category)}&status=active&is_private=false&limit=100`;
  }

  public async invokeQueuedEndpoint(
    endpoint: string,
    body: Record<string, unknown>,
    options: {
      timeoutMs: number;
      signal: AbortSignal;
    },
  ): Promise<FalQueueInvocationResult> {
    if (!this.options.apiKey) {
      throw new Error("fal.ai API key missing.");
    }

    const encodedEndpoint = endpointPath(endpoint);
    if (!encodedEndpoint) {
      throw new Error("fal.ai endpoint is required.");
    }
    const submitUrl = `${this.queueBaseUrl}/${encodedEndpoint}`;
    const combinedSignal = combineAbortSignals([
      options.signal,
      AbortSignal.timeout(Math.max(1000, options.timeoutMs)),
    ]);

    const submitPayload = await this.requestJson(
      submitUrl,
      {
        method: "POST",
        body: JSON.stringify(body),
      },
      combinedSignal,
    );

    const requestId = extractRequestId(submitPayload);
    if (!requestId) {
      return {
        submitPayload,
        resultPayload: submitPayload,
        status: extractStatus(submitPayload) ?? "completed",
      };
    }

    const statusUrl =
      extractUrl(submitPayload, [
        ["status_url"],
        ["statusUrl"],
        ["data", "status_url"],
        ["data", "statusUrl"],
      ]) ?? `${submitUrl}/requests/${encodeURIComponent(requestId)}/status`;
    const resultUrl =
      extractUrl(submitPayload, [
        ["response_url"],
        ["responseUrl"],
        ["result_url"],
        ["resultUrl"],
        ["data", "response_url"],
        ["data", "responseUrl"],
        ["data", "result_url"],
        ["data", "resultUrl"],
      ]) ?? `${submitUrl}/requests/${encodeURIComponent(requestId)}`;

    const startedAt = Date.now();
    while (Date.now() - startedAt <= this.pollTimeoutMs) {
      if (combinedSignal.aborted) {
        throw combinedSignal.reason instanceof Error
          ? combinedSignal.reason
          : new Error("fal.ai request aborted.");
      }
      const statusPayload = await this.requestJson(statusUrl, { method: "GET" }, combinedSignal);
      const status = extractStatus(statusPayload) ?? "unknown";
      if (isFailureStatus(status)) {
        throw new Error(`fal.ai request failed with status '${status}'.`);
      }
      if (isCompleteStatus(status)) {
        const resultPayload = await this.requestJson(resultUrl, { method: "GET" }, combinedSignal);
        return {
          submitPayload,
          resultPayload,
          status,
        };
      }
      await sleep(this.pollIntervalMs);
    }

    throw new Error("fal.ai polling timed out.");
  }

  private async requestJson(
    url: string,
    init: RequestInit,
    signal: AbortSignal,
  ): Promise<unknown> {
    const response = await fetch(url, {
      ...init,
      signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${this.options.apiKey}`,
        ...(init.headers ?? {}),
      },
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
    } catch {
      return { rawText: text };
    }
  }
}

