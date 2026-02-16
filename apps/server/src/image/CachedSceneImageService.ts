import type { ImageJob, ImageProvider, ImageResolution } from "@mighty-decks/spec/imageGeneration";
import { toCacheKey } from "./ImageNaming";
import type { ImageGenerationService } from "./ImageGenerationService";
import { resolvePortraitModelId } from "./characterPortraitConfig";

export interface CachedSceneImageServiceOptions {
  imageGenerationService: ImageGenerationService;
  provider?: ImageProvider;
  resolution?: ImageResolution;
  pollIntervalMs?: number;
  modelCacheTtlMs?: number;
}

export interface CachedSceneImageResult {
  imageUrl: string | null;
  model: string;
  fromCache: boolean;
  error?: string;
}

const DEFAULT_PROVIDER: ImageProvider = "fal";
const DEFAULT_RESOLUTION: ImageResolution = {
  width: 1280,
  height: 720,
};
const DEFAULT_POLL_INTERVAL_MS = 250;
const DEFAULT_MODEL_CACHE_TTL_MS = 5 * 60 * 1000;
const INTERNAL_CLIENT_IP = "internal:scene-image";

const delay = async (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Scene image generation failed.";

interface CachedModelEntry {
  model: string;
  expiresAtMs: number;
}

export class CachedSceneImageService {
  private readonly provider: ImageProvider;
  private readonly resolution: ImageResolution;
  private readonly pollIntervalMs: number;
  private readonly modelCacheTtlMs: number;
  private readonly modelCacheByProvider = new Map<ImageProvider, CachedModelEntry>();

  public constructor(private readonly options: CachedSceneImageServiceOptions) {
    this.provider = options.provider ?? DEFAULT_PROVIDER;
    this.resolution = options.resolution ?? DEFAULT_RESOLUTION;
    this.pollIntervalMs = Math.max(100, options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS);
    this.modelCacheTtlMs = Math.max(1000, options.modelCacheTtlMs ?? DEFAULT_MODEL_CACHE_TTL_MS);
  }

  public async generateImage(input: {
    prompt: string;
    timeoutMs: number;
  }): Promise<CachedSceneImageResult> {
    const normalizedPrompt = input.prompt.trim();
    const model = await this.resolveModelId(this.provider);
    if (normalizedPrompt.length === 0) {
      return {
        imageUrl: null,
        model,
        fromCache: false,
        error: "Scene image prompt is empty.",
      };
    }

    let job: ImageJob;
    try {
      job = await this.options.imageGenerationService.createJob(
        {
          provider: this.provider,
          prompt: normalizedPrompt,
          model,
          resolution: this.resolution,
          useCache: true,
          amount: 1,
        },
        INTERNAL_CLIENT_IP,
      );
    } catch (error) {
      return {
        imageUrl: null,
        model,
        fromCache: false,
        error: getErrorMessage(error),
      };
    }

    const completedJob = await this.waitForCompletion(job, input.timeoutMs);
    if (!completedJob) {
      return {
        imageUrl: null,
        model,
        fromCache: false,
        error: "Scene image generation timed out.",
      };
    }

    if (completedJob.status === "failed") {
      const firstFailure = completedJob.items.find((item) => item.status === "failed");
      return {
        imageUrl: null,
        model,
        fromCache: false,
        error: firstFailure?.error ?? "Scene image generation failed.",
      };
    }

    const group = this.options.imageGenerationService.getGroup(completedJob.groupKey);
    if (!group) {
      return {
        imageUrl: null,
        model,
        fromCache: false,
        error: "Generated image group could not be loaded.",
      };
    }

    const requestCacheKey = toCacheKey(
      normalizedPrompt,
      this.provider,
      model,
      this.resolution,
    );
    const matchingImages = group.images
      .filter((image) => image.cacheKey === requestCacheKey)
      .sort((left, right) => {
        if (left.batchIndex !== right.batchIndex) {
          return left.batchIndex - right.batchIndex;
        }
        if (left.imageIndex !== right.imageIndex) {
          return left.imageIndex - right.imageIndex;
        }
        return left.createdAtIso.localeCompare(right.createdAtIso);
      });
    if (matchingImages.length === 0) {
      return {
        imageUrl: null,
        model,
        fromCache: false,
        error: "No matching generated image was found in cache group.",
      };
    }

    const producedImageIds = new Set(
      completedJob.items
        .map((item) => item.imageId)
        .filter((imageId): imageId is string => Boolean(imageId)),
    );
    const fromJob = matchingImages.find((image) => producedImageIds.has(image.imageId));
    const activeMatching = group.activeImageId
      ? matchingImages.find((image) => image.imageId === group.activeImageId)
      : undefined;
    const resolvedImage = fromJob ?? activeMatching ?? matchingImages[0];

    return {
      imageUrl: resolvedImage.fileUrl,
      model,
      fromCache: completedJob.items.some((item) => item.status === "cached"),
    };
  }

  private async resolveModelId(provider: ImageProvider): Promise<string> {
    const cached = this.modelCacheByProvider.get(provider);
    if (cached && cached.expiresAtMs > Date.now()) {
      return cached.model;
    }

    try {
      const models = await this.options.imageGenerationService.listModels(provider);
      const resolvedModel = resolvePortraitModelId(provider, models);
      this.modelCacheByProvider.set(provider, {
        model: resolvedModel,
        expiresAtMs: Date.now() + this.modelCacheTtlMs,
      });
      return resolvedModel;
    } catch {
      const fallbackModel = resolvePortraitModelId(provider, []);
      this.modelCacheByProvider.set(provider, {
        model: fallbackModel,
        expiresAtMs: Date.now() + this.modelCacheTtlMs,
      });
      return fallbackModel;
    }
  }

  private async waitForCompletion(
    job: ImageJob,
    timeoutMs: number,
  ): Promise<ImageJob | null> {
    if (job.status !== "running") {
      return job;
    }

    const deadline = Date.now() + Math.max(this.pollIntervalMs, timeoutMs);
    while (Date.now() < deadline) {
      await delay(this.pollIntervalMs);
      const nextJob = this.options.imageGenerationService.getJob(job.jobId);
      if (!nextJob) {
        return null;
      }
      if (nextJob.status !== "running") {
        return nextJob;
      }
    }

    return null;
  }
}

