import type { OpenRouterClient } from "../OpenRouterClient";
import { shorten } from "./text";
import type {
  AiRequestDebugEvent,
  ImageModelRequest,
  TextModelRequest,
} from "./types";
import { hasInlineDataImage } from "../../persistence/dataImageRewrite";

interface ModelRunnerDependencies {
  openRouterClient: OpenRouterClient;
  onAiRequest?: (entry: AiRequestDebugEvent) => void;
  inlineImageResolver?: {
    persistDataImageUri: (
      dataImageUri: string,
      options?: { hint?: string },
    ) => Promise<{ fileName: string; fileUrl: string }>;
  };
}

export interface ImageModelRequestResult {
  imageUrl: string | null;
  error?: string;
}

export const createAiRequestId = (): string =>
  `ai-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const resolveInlineImageUrl = async (
  dependencies: ModelRunnerDependencies,
  imageUrl: string | null,
): Promise<string | null> => {
  if (!imageUrl || !hasInlineDataImage(imageUrl)) {
    return imageUrl;
  }

  if (!dependencies.inlineImageResolver) {
    return null;
  }

  const persisted = await dependencies.inlineImageResolver.persistDataImageUri(
    imageUrl,
    { hint: "ai-inline" },
  );
  return persisted.fileUrl;
};

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

const completeTextWithUsage = async (
  client: OpenRouterClient,
  request: {
    model: string;
    prompt: string;
    timeoutMs: number;
    maxTokens: number;
    temperature: number;
    onStreamChunk?: (chunk: string) => void;
  },
): Promise<{ text: string | null; usage?: AiRequestDebugEvent["usage"] } | null> => {
  const metadataClient = client as OpenRouterClient & {
    completeTextWithMetadata?: (request: {
      model: string;
      prompt: string;
      timeoutMs: number;
      maxTokens: number;
      temperature: number;
    }) => Promise<{ text: string | null; usage?: AiRequestDebugEvent["usage"] } | null>;
    completeTextStreamWithMetadata?: (
      request: {
        model: string;
        prompt: string;
        timeoutMs: number;
        maxTokens: number;
        temperature: number;
      },
      onChunk: (chunk: string) => void,
    ) => Promise<{ text: string | null; usage?: AiRequestDebugEvent["usage"] } | null>;
  };

  if (
    request.onStreamChunk &&
    typeof metadataClient.completeTextStreamWithMetadata === "function"
  ) {
    return metadataClient.completeTextStreamWithMetadata(
      request,
      request.onStreamChunk,
    );
  }

  if (typeof metadataClient.completeTextWithMetadata === "function") {
    return metadataClient.completeTextWithMetadata(request);
  }

  const text = await client.completeText(request);
  return {
    text,
  };
};

const generateImageWithUsage = async (
  client: OpenRouterClient,
  request: {
    model: string;
    prompt: string;
    timeoutMs: number;
  },
): Promise<{ imageUrl: string | null; usage?: AiRequestDebugEvent["usage"] } | null> => {
  const metadataClient = client as OpenRouterClient & {
    generateImageWithMetadata?: (request: {
      model: string;
      prompt: string;
      timeoutMs: number;
    }) => Promise<{ imageUrl: string | null; usage?: AiRequestDebugEvent["usage"] } | null>;
  };
  if (typeof metadataClient.generateImageWithMetadata === "function") {
    return metadataClient.generateImageWithMetadata(request);
  }

  const imageUrl = await client.generateImage(request);
  return {
    imageUrl,
  };
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
        const completion = await completeTextWithUsage(
          dependencies.openRouterClient,
          {
            model,
            prompt: request.prompt,
            timeoutMs: request.runtimeConfig.textCallTimeoutMs,
            maxTokens: request.maxTokens,
            temperature: request.temperature,
            onStreamChunk: request.onStreamChunk,
          },
        );
        const output = completion?.text;
        const usage = completion?.usage;
        if (output && output.trim().length > 0) {
          const trimmedOutput = output.trim();
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
              response: shorten(trimmedOutput, 1800),
              usage,
            });
          }
          return trimmedOutput;
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
            usage,
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
  const result = await runImageModelRequestWithDetails(dependencies, request);
  return result.imageUrl;
};

export const runImageModelRequestWithDetails = async (
  dependencies: ModelRunnerDependencies,
  request: ImageModelRequest,
): Promise<ImageModelRequestResult> => {
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
    return {
      imageUrl: null,
      error: "OpenRouter API key missing.",
    };
  }

  const attempts = Math.max(1, request.runtimeConfig.aiRetryCount + 1);
  const models = uniqueModels([request.primaryModel, request.fallbackModel]);
  let lastError: string | undefined;

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
          prompt: request.prompt,
          timeoutMs: request.runtimeConfig.imageTimeoutMs,
          attempt: attempt + 1,
          fallback: useFallbackModel,
          status: "started",
        });
      }

      try {
        const generated = await generateImageWithUsage(
          dependencies.openRouterClient,
          {
            model,
            prompt: request.prompt,
            timeoutMs: request.runtimeConfig.imageTimeoutMs,
          },
        );
        const imageUrl = await resolveInlineImageUrl(
          dependencies,
          generated?.imageUrl ?? null,
        );
        const usage = generated?.usage;
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
              response: shorten(imageUrl, 1800),
              usage,
            });
          }
          return {
            imageUrl,
          };
        }

        lastError = "No image returned by provider.";
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
            usage,
          });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Unknown image request error.";
        lastError = errorMessage;
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
            error: errorMessage,
          });
        }

        if (isModeratedImageFailure(error) && !useFallbackModel) {
          // Moderation on the primary model should jump directly to fallback model.
          break;
        }

        if (isPermanentImageFailure(error)) {
          return {
            imageUrl: null,
            error: lastError ?? "Image generation failed.",
          };
        }
      }
    }
  }

  return {
    imageUrl: null,
    error: lastError ?? "Image generation failed.",
  };
};
