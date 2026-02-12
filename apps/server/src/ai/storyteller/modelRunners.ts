import type { OpenRouterClient } from "../OpenRouterClient";
import { shorten } from "./text";
import type {
  AiRequestDebugEvent,
  ImageModelRequest,
  TextModelRequest,
} from "./types";

interface ModelRunnerDependencies {
  openRouterClient: OpenRouterClient;
  onAiRequest?: (entry: AiRequestDebugEvent) => void;
}

export const createAiRequestId = (): string =>
  `ai-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const uniqueModels = (models: Array<string | undefined>): string[] =>
  models.filter(
    (model, index, allModels): model is string =>
      Boolean(model) && allModels.indexOf(model) === index,
  );

const emitAiRequest = (
  dependencies: ModelRunnerDependencies,
  entry: AiRequestDebugEvent,
): void => {
  dependencies.onAiRequest?.(entry);
};

const isPermanentImageFailure = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  return /Image request failed \(4\d\d /.test(error.message);
};

const isModeratedImageFailure = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  return /Request Moderated/i.test(error.message);
};

export const runTextModelRequest = async (
  dependencies: ModelRunnerDependencies,
  request: TextModelRequest,
): Promise<string | null> => {
  if (!dependencies.openRouterClient.hasApiKey()) {
    if (request.context) {
      emitAiRequest(dependencies, {
        adventureId: request.context.adventureId,
        requestId: createAiRequestId(),
        createdAtIso: new Date().toISOString(),
        agent: request.agent,
        kind: "text",
        model: request.primaryModel,
        timeoutMs: request.runtimeConfig.textCallTimeoutMs,
        attempt: 1,
        fallback: false,
        status: "failed",
        error: "OpenRouter API key missing.",
      });
    }
    return null;
  }

  const attempts = Math.max(1, request.runtimeConfig.aiRetryCount + 1);
  const models = uniqueModels([request.primaryModel, request.fallbackModel]);

  for (const model of models) {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const requestId = createAiRequestId();
      const createdAtIso = new Date().toISOString();
      if (request.context) {
        emitAiRequest(dependencies, {
          adventureId: request.context.adventureId,
          requestId,
          createdAtIso,
          agent: request.agent,
          kind: "text",
          model,
          timeoutMs: request.runtimeConfig.textCallTimeoutMs,
          attempt: attempt + 1,
          fallback: model !== request.primaryModel,
          status: "started",
          prompt: request.prompt,
        });
      }

      try {
        const output = await dependencies.openRouterClient.completeText({
          model,
          prompt: request.prompt,
          timeoutMs: request.runtimeConfig.textCallTimeoutMs,
          maxTokens: request.maxTokens,
          temperature: request.temperature,
        });
        if (output && output.trim().length > 0) {
          if (request.context) {
            emitAiRequest(dependencies, {
              adventureId: request.context.adventureId,
              requestId,
              createdAtIso,
              agent: request.agent,
              kind: "text",
              model,
              timeoutMs: request.runtimeConfig.textCallTimeoutMs,
              attempt: attempt + 1,
              fallback: model !== request.primaryModel,
              status: "succeeded",
              response: shorten(output.trim(), 1800),
            });
          }
          return output.trim();
        }

        if (request.context) {
          emitAiRequest(dependencies, {
            adventureId: request.context.adventureId,
            requestId,
            createdAtIso,
            agent: request.agent,
            kind: "text",
            model,
            timeoutMs: request.runtimeConfig.textCallTimeoutMs,
            attempt: attempt + 1,
            fallback: model !== request.primaryModel,
            status: "failed",
            error: "No text returned by provider.",
          });
        }
      } catch (error) {
        if (request.context) {
          const isTimeout =
            error instanceof Error && error.name === "AbortError";
          emitAiRequest(dependencies, {
            adventureId: request.context.adventureId,
            requestId,
            createdAtIso,
            agent: request.agent,
            kind: "text",
            model,
            timeoutMs: request.runtimeConfig.textCallTimeoutMs,
            attempt: attempt + 1,
            fallback: model !== request.primaryModel,
            status: isTimeout ? "timeout" : "failed",
            error:
              error instanceof Error
                ? error.message
                : "Unknown text request error.",
          });
        }
      }
    }
  }

  return null;
};

export const runImageModelRequest = async (
  dependencies: ModelRunnerDependencies,
  request: ImageModelRequest,
): Promise<string | null> => {
  if (!dependencies.openRouterClient.hasApiKey()) {
    if (request.context) {
      emitAiRequest(dependencies, {
        adventureId: request.context.adventureId,
        requestId: createAiRequestId(),
        createdAtIso: new Date().toISOString(),
        agent: request.agent,
        kind: "image",
        model: request.primaryModel,
        timeoutMs: request.runtimeConfig.imageTimeoutMs,
        attempt: 1,
        fallback: false,
        status: "failed",
        error: "OpenRouter API key missing.",
      });
    }
    return null;
  }

  const attempts = Math.max(1, request.runtimeConfig.aiRetryCount + 1);
  const models = uniqueModels([request.primaryModel, request.fallbackModel]);

  for (const model of models) {
    const useFallbackModel = model !== request.primaryModel;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const requestId = createAiRequestId();
      const createdAtIso = new Date().toISOString();
      if (request.context) {
        emitAiRequest(dependencies, {
          adventureId: request.context.adventureId,
          requestId,
          createdAtIso,
          agent: request.agent,
          kind: "image",
          model,
          timeoutMs: request.runtimeConfig.imageTimeoutMs,
          attempt: attempt + 1,
          fallback: useFallbackModel,
          status: "started",
          prompt: request.prompt,
        });
      }

      try {
        const imageUrl = await dependencies.openRouterClient.generateImage({
          model,
          prompt: request.prompt,
          timeoutMs: request.runtimeConfig.imageTimeoutMs,
        });
        if (imageUrl) {
          if (request.context) {
            emitAiRequest(dependencies, {
              adventureId: request.context.adventureId,
              requestId,
              createdAtIso,
              agent: request.agent,
              kind: "image",
              model,
              timeoutMs: request.runtimeConfig.imageTimeoutMs,
              attempt: attempt + 1,
              fallback: useFallbackModel,
              status: "succeeded",
              response: imageUrl,
            });
          }
          return imageUrl;
        }

        if (request.context) {
          emitAiRequest(dependencies, {
            adventureId: request.context.adventureId,
            requestId,
            createdAtIso,
            agent: request.agent,
            kind: "image",
            model,
            timeoutMs: request.runtimeConfig.imageTimeoutMs,
            attempt: attempt + 1,
            fallback: useFallbackModel,
            status: "failed",
            error: "No image returned by provider.",
          });
        }
      } catch (error) {
        if (request.context) {
          const isTimeout = error instanceof Error && error.name === "AbortError";
          emitAiRequest(dependencies, {
            adventureId: request.context.adventureId,
            requestId,
            createdAtIso,
            agent: request.agent,
            kind: "image",
            model,
            timeoutMs: request.runtimeConfig.imageTimeoutMs,
            attempt: attempt + 1,
            fallback: useFallbackModel,
            status: isTimeout ? "timeout" : "failed",
            error:
              error instanceof Error
                ? error.message
                : "Unknown image request error.",
          });
        }

        if (isModeratedImageFailure(error) && !useFallbackModel) {
          // Moderation on the primary model should jump directly to fallback model.
          break;
        }

        if (isPermanentImageFailure(error)) {
          return null;
        }
      }
    }
  }

  return null;
};
