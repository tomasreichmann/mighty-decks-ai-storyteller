import type {
  OpenRouterClient,
  OpenRouterUsage,
} from "../OpenRouterClient";
import type {
  WorkflowImageAdapterRequest,
  WorkflowImageAdapterResult,
  WorkflowTextAdapterRequest,
  WorkflowTextAdapterResult,
} from "../../workflow/types";

const toUsage = (usage: OpenRouterUsage | undefined) => {
  if (!usage) {
    return undefined;
  }
  return {
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
    totalTokens: usage.totalTokens,
    cachedTokens: usage.cachedTokens,
    reasoningTokens: usage.reasoningTokens,
    costCredits: usage.costCredits,
  };
};

const withAbortRace = async <T>(
  signal: AbortSignal,
  operation: () => Promise<T>,
): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason instanceof Error ? signal.reason : new Error("Aborted"));
      return;
    }
    let settled = false;
    const onAbort = (): void => {
      if (settled) {
        return;
      }
      settled = true;
      reject(signal.reason instanceof Error ? signal.reason : new Error("Aborted"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
    void operation()
      .then((value) => {
        if (settled) {
          return;
        }
        settled = true;
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      })
      .catch((error: unknown) => {
        if (settled) {
          return;
        }
        settled = true;
        signal.removeEventListener("abort", onAbort);
        reject(error);
      });
  });

export const createOpenRouterWorkflowTextAdapter = (openRouterClient: OpenRouterClient) =>
  async (request: WorkflowTextAdapterRequest): Promise<WorkflowTextAdapterResult> => {
    const runner = async (): Promise<WorkflowTextAdapterResult> => {
      const supportsStream =
        request.stream &&
        typeof openRouterClient.completeTextStreamWithMetadata === "function";
      if (supportsStream && request.onChunk) {
        const completion = await openRouterClient.completeTextStreamWithMetadata(
          {
            model: request.modelId,
            prompt: request.prompt,
            timeoutMs: request.timeoutMs,
            maxTokens: request.maxTokens ?? 2000,
            temperature: request.temperature ?? 0.3,
          },
          request.onChunk,
        );
        return {
          text: completion?.text ?? null,
          usage: toUsage(completion?.usage),
        };
      }

      const completion = await openRouterClient.completeTextWithMetadata({
        model: request.modelId,
        prompt: request.prompt,
        timeoutMs: request.timeoutMs,
        maxTokens: request.maxTokens ?? 2000,
        temperature: request.temperature ?? 0.3,
      });
      return {
        text: completion?.text ?? null,
        usage: toUsage(completion?.usage),
      };
    };

    return withAbortRace(request.signal, runner);
  };

export const createOpenRouterWorkflowImageAdapter = (openRouterClient: OpenRouterClient) =>
  async (request: WorkflowImageAdapterRequest): Promise<WorkflowImageAdapterResult> => {
    const runner = async (): Promise<WorkflowImageAdapterResult> => {
      const completion = await openRouterClient.generateImageWithMetadata({
        model: request.modelId,
        prompt: request.prompt,
        timeoutMs: request.timeoutMs,
      });
      return {
        imageUrl: completion?.imageUrl ?? null,
        usage: toUsage(completion?.usage),
      };
    };

    return withAbortRace(request.signal, runner);
  };

