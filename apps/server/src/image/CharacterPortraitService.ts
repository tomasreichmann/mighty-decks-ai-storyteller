import type {
  CharacterPortraitStatus,
} from "@mighty-decks/spec/adventureState";
import type { ImageModelSummary, ImageProvider } from "@mighty-decks/spec/imageGeneration";
import type { OpenRouterClient } from "../ai/OpenRouterClient";
import { toCacheKey } from "./ImageNaming";
import type { FalClient } from "./FalClient";
import type { LeonardoClient } from "./LeonardoClient";
import type { ImageStore } from "./ImageStore";
import {
  CHARACTER_PORTRAIT_BASE_PROMPT,
  CHARACTER_PORTRAIT_IMAGE_TIMEOUT_MS,
  CHARACTER_PORTRAIT_PLACEHOLDER_URL,
  CHARACTER_PORTRAIT_PROMPT_MODEL,
  CHARACTER_PORTRAIT_PROMPT_TIMEOUT_MS,
  CHARACTER_PORTRAIT_PROVIDER,
  CHARACTER_PORTRAIT_RESOLUTION,
  resolvePortraitModelId,
} from "./characterPortraitConfig";
import type { CharacterPortraitCache } from "./CharacterPortraitCache";

interface ImageProviderClient {
  listModels(): Promise<ImageModelSummary[]>;
  generateImage(request: {
    prompt: string;
    model: string;
    resolution: { width: number; height: number };
  }): Promise<{
    imageUrl: string;
    status: string;
  }>;
}

export interface EnsureCharacterPortraitInput {
  characterName: string;
  visualDescription: string;
}

export interface CharacterPortraitResult {
  characterNameKey: string;
  characterName: string;
  imageUrl: string;
  status: CharacterPortraitStatus;
}

export interface CharacterPortraitServiceOptions {
  falClient: FalClient;
  leonardoClient: LeonardoClient;
  imageStore: ImageStore;
  cache: CharacterPortraitCache;
  openRouterClient: OpenRouterClient;
  disableImageGeneration: boolean;
  provider?: ImageProvider;
}

export const normalizeCharacterNameKey = (value: string): string =>
  value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const normalizePromptLine = (value: string): string =>
  value.replace(/\s+/g, " ").trim();

const delay = async (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export class CharacterPortraitService {
  private readonly disableImageGeneration: boolean;
  private readonly provider: ImageProvider;
  private readonly inFlightByName = new Map<string, Promise<CharacterPortraitResult>>();

  public constructor(private readonly options: CharacterPortraitServiceOptions) {
    this.disableImageGeneration = options.disableImageGeneration;
    this.provider = options.provider ?? CHARACTER_PORTRAIT_PROVIDER;
  }

  public async ensurePortrait(
    input: EnsureCharacterPortraitInput,
  ): Promise<CharacterPortraitResult> {
    const characterName = input.characterName.trim();
    const characterNameKey = normalizeCharacterNameKey(characterName);
    if (!characterName || !characterNameKey) {
      return {
        characterNameKey,
        characterName,
        imageUrl: CHARACTER_PORTRAIT_PLACEHOLDER_URL,
        status: "placeholder",
      };
    }

    const existing = this.inFlightByName.get(characterNameKey);
    if (existing) {
      return existing;
    }

    const running = this.resolvePortrait({
      characterName,
      characterNameKey,
      visualDescription: input.visualDescription.trim(),
    });
    this.inFlightByName.set(characterNameKey, running);
    try {
      return await running;
    } finally {
      this.inFlightByName.delete(characterNameKey);
    }
  }

  private async resolvePortrait(input: {
    characterName: string;
    characterNameKey: string;
    visualDescription: string;
  }): Promise<CharacterPortraitResult> {
    const cached = await this.options.cache.getByCharacterNameKey(
      input.characterNameKey,
    );
    if (cached) {
      return {
        characterNameKey: input.characterNameKey,
        characterName: input.characterName,
        imageUrl: cached.fileUrl,
        status: "ready",
      };
    }

    if (this.disableImageGeneration) {
      return {
        characterNameKey: input.characterNameKey,
        characterName: input.characterName,
        imageUrl: CHARACTER_PORTRAIT_PLACEHOLDER_URL,
        status: "disabled",
      };
    }

    try {
      const prompt = await this.buildPortraitPrompt(
        input.characterName,
        input.visualDescription,
      );
      const providerClient = this.resolveProviderClient(this.provider);
      const model = await this.resolveModelId(this.provider, providerClient);
      const generated = await providerClient.generateImage({
        prompt,
        model,
        resolution: CHARACTER_PORTRAIT_RESOLUTION,
      });

      // Some upstream providers need short eventual-consistency delay before image fetch.
      await delay(120);
      const downloaded = await this.downloadImage(generated.imageUrl);
      const batchReservation = await this.options.imageStore.reserveBatchIndex({
        provider: this.provider,
        prompt,
        model,
      });
      const cacheKey = toCacheKey(
        prompt,
        this.provider,
        model,
        CHARACTER_PORTRAIT_RESOLUTION,
      );
      const stored = await this.options.imageStore.saveGeneratedImage({
        provider: this.provider,
        prompt,
        model,
        promptHash: batchReservation.promptHash,
        modelHash: batchReservation.modelHash,
        groupKey: batchReservation.groupKey,
        cacheKey,
        batchIndex: batchReservation.batchIndex,
        imageIndex: 0,
        resolution: CHARACTER_PORTRAIT_RESOLUTION,
        sourceUrl: generated.imageUrl,
        imageBuffer: downloaded.imageBuffer,
        contentType: downloaded.contentType,
      });

      await this.options.cache.save({
        characterNameKey: input.characterNameKey,
        characterName: input.characterName,
        provider: this.provider,
        model,
        groupKey: stored.group.groupKey,
        imageId: stored.image.imageId,
        fileName: stored.image.fileName,
        fileUrl: stored.image.fileUrl,
      });

      return {
        characterNameKey: input.characterNameKey,
        characterName: input.characterName,
        imageUrl: stored.image.fileUrl,
        status: "ready",
      };
    } catch {
      return {
        characterNameKey: input.characterNameKey,
        characterName: input.characterName,
        imageUrl: CHARACTER_PORTRAIT_PLACEHOLDER_URL,
        status: "failed",
      };
    }
  }

  private async buildPortraitPrompt(
    characterName: string,
    visualDescription: string,
  ): Promise<string> {
    const deterministicFallback = normalizePromptLine(
      `${CHARACTER_PORTRAIT_BASE_PROMPT} Character name: ${characterName}. Visual description: ${visualDescription || "unspecified"}.`,
    );
    if (!this.options.openRouterClient.hasApiKey()) {
      return deterministicFallback;
    }

    const promptRequest = [
      "You write concise image-generation prompts for character portraits.",
      "Return exactly one paragraph and no markdown or code fences.",
      "Keep the pose and orientation constraints explicit and preserved.",
      `Base style instruction: ${CHARACTER_PORTRAIT_BASE_PROMPT}`,
      `Character name: ${characterName}`,
      `Visual description: ${visualDescription || "unspecified"}`,
      "Generate one final production-ready prompt now.",
    ].join("\n");

    const completion = await this.options.openRouterClient.completeText({
      model: CHARACTER_PORTRAIT_PROMPT_MODEL,
      prompt: promptRequest,
      timeoutMs: CHARACTER_PORTRAIT_PROMPT_TIMEOUT_MS,
      maxTokens: 240,
      temperature: 0.35,
    });

    const normalized = completion ? normalizePromptLine(completion) : "";
    return normalized.length > 0 ? normalized : deterministicFallback;
  }

  private async resolveModelId(
    provider: ImageProvider,
    providerClient: ImageProviderClient,
  ): Promise<string> {
    try {
      const models = await providerClient.listModels();
      return resolvePortraitModelId(provider, models);
    } catch {
      return resolvePortraitModelId(provider, []);
    }
  }

  private resolveProviderClient(provider: ImageProvider): ImageProviderClient {
    if (provider === "leonardo") {
      return this.options.leonardoClient;
    }

    return this.options.falClient;
  }

  private async downloadImage(sourceUrl: string): Promise<{
    imageBuffer: Buffer;
    contentType: string;
  }> {
    const response = await fetch(sourceUrl, {
      method: "GET",
      signal: AbortSignal.timeout(CHARACTER_PORTRAIT_IMAGE_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(
        `Portrait image download failed (${response.status} ${response.statusText}).`,
      );
    }

    const contentTypeHeader = response.headers.get("content-type");
    const contentType = contentTypeHeader
      ? contentTypeHeader.split(";")[0]!.trim().toLowerCase()
      : "application/octet-stream";
    const imageBuffer = Buffer.from(await response.arrayBuffer());
    if (imageBuffer.length === 0) {
      throw new Error("Portrait image download returned an empty payload.");
    }

    return {
      imageBuffer,
      contentType,
    };
  }
}
