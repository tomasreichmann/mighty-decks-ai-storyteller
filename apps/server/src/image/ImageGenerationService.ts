import { randomUUID } from "node:crypto";
import type {
  GeneratedImageGroup,
  ImageGenerateJobRequest,
  ImageJob,
  ImageJobItemProgress,
  ImageLookupGroupRequest,
  ImageModelSummary,
  ImageProvider,
  ImageResolution,
  ImageSetActiveRequest,
} from "@mighty-decks/spec/imageGeneration";
import {
  imageGenerateJobRequestSchema,
  imageLookupGroupRequestSchema,
  imageSetActiveRequestSchema,
} from "@mighty-decks/spec/imageGeneration";
import {
  toCacheKey,
  toGroupKey,
  toModelHash,
  toPromptHash,
} from "./ImageNaming";
import type { FalClient } from "./FalClient";
import type { LeonardoClient } from "./LeonardoClient";
import type { ImageFileRecord, ImageStore } from "./ImageStore";

interface ImageGenerationServiceOptions {
  falClient: FalClient;
  leonardoClient: LeonardoClient;
  imageStore: ImageStore;
  maxActiveJobs: number;
  rateLimitPerMinute: number;
  downloadTimeoutMs: number;
}

interface ImageProviderClient {
  listModels(): Promise<ImageModelSummary[]>;
  generateImage(request: {
    prompt: string;
    model: string;
    resolution: ImageResolution;
  }): Promise<{
    imageUrl: string;
    status: string;
  }>;
}

export class ImageGenerationError extends Error {
  public constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
  }
}

interface JobExecutionPlan {
  provider: ImageProvider;
  prompt: string;
  model: string;
  resolution: ImageResolution;
  groupKey: string;
  promptHash: string;
  modelHash: string;
  cacheKey: string;
  batchIndex: number;
  missingRequestIndices: number[];
}

const cloneImageJob = (job: ImageJob): ImageJob => ({
  ...job,
  request: {
    ...job.request,
    resolution: {
      ...job.request.resolution,
    },
  },
  items: job.items.map((item) => ({ ...item })),
});

const normalizeIpKey = (value: string): string => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "unknown";
};

export class ImageGenerationService {
  private readonly jobs = new Map<string, ImageJob>();
  private readonly activeJobIds = new Set<string>();
  private readonly requestTimestampsByIp = new Map<string, number[]>();
  private readonly maxActiveJobs: number;
  private readonly rateLimitPerMinute: number;
  private readonly downloadTimeoutMs: number;

  public constructor(private readonly options: ImageGenerationServiceOptions) {
    this.maxActiveJobs = Math.max(1, options.maxActiveJobs);
    this.rateLimitPerMinute = Math.max(1, options.rateLimitPerMinute);
    this.downloadTimeoutMs = Math.max(1000, options.downloadTimeoutMs);
  }

  public async listModels(provider: ImageProvider): Promise<ImageModelSummary[]> {
    return this.resolveProviderClient(provider).listModels();
  }

  public lookupGroup(input: ImageLookupGroupRequest): GeneratedImageGroup | null {
    const parsed = imageLookupGroupRequestSchema.parse(input);
    return this.options.imageStore.lookupGroup(
      parsed.provider,
      parsed.prompt,
      parsed.model,
    );
  }

  public getGroup(groupKey: string): GeneratedImageGroup | null {
    return this.options.imageStore.getGroup(groupKey);
  }

  public async createJob(
    request: ImageGenerateJobRequest,
    clientIp: string,
  ): Promise<ImageJob> {
    const parsed = imageGenerateJobRequestSchema.parse(request);
    this.enforceRateLimit(clientIp);

    const provider = parsed.provider;
    const prompt = parsed.prompt;
    const model = parsed.model.trim();
    const promptHash = toPromptHash(prompt);
    const modelHash = toModelHash(model);
    const groupKey = toGroupKey(prompt, provider, model);
    const cacheKey = toCacheKey(prompt, provider, model, parsed.resolution);

    const cachedImages = parsed.useCache
      ? this.options.imageStore.getCachedImages({
          provider,
          prompt,
          model,
          resolution: parsed.resolution,
        })
      : [];
    const selectedCachedImages = cachedImages.slice(0, parsed.amount);
    const missingCount = Math.max(0, parsed.amount - selectedCachedImages.length);

    let executionPlan: JobExecutionPlan | null = null;
    if (missingCount > 0) {
      if (this.activeJobIds.size >= this.maxActiveJobs) {
        throw new ImageGenerationError(
          "Image generation is at capacity. Try again in a moment.",
          429,
        );
      }

      const reservation = await this.options.imageStore.reserveBatchIndex({
        provider,
        prompt,
        model,
      });
      const missingRequestIndices: number[] = [];
      for (let index = selectedCachedImages.length; index < parsed.amount; index += 1) {
        missingRequestIndices.push(index);
      }
      executionPlan = {
        provider,
        prompt,
        model,
        resolution: parsed.resolution,
        groupKey: reservation.groupKey,
        promptHash: reservation.promptHash,
        modelHash: reservation.modelHash,
        cacheKey,
        batchIndex: reservation.batchIndex,
        missingRequestIndices,
      };
    }

    const nowIso = new Date().toISOString();
    const jobId = `imgjob-${randomUUID()}`;
    const items: ImageJobItemProgress[] = [];

    for (let index = 0; index < parsed.amount; index += 1) {
      const cached = selectedCachedImages[index];
      if (cached) {
        items.push({
          requestIndex: index,
          status: "cached",
          imageId: cached.imageId,
          batchIndex: cached.batchIndex,
          imageIndex: cached.imageIndex,
        });
        continue;
      }

      items.push({
        requestIndex: index,
        status: "pending",
      });
    }

    const job: ImageJob = {
      jobId,
      createdAtIso: nowIso,
      updatedAtIso: nowIso,
      groupKey: executionPlan?.groupKey ?? groupKey,
      promptHash: executionPlan?.promptHash ?? promptHash,
      modelHash: executionPlan?.modelHash ?? modelHash,
      request: parsed,
      status: missingCount === 0 ? "completed" : "running",
      totalRequested: parsed.amount,
      cachedCount: selectedCachedImages.length,
      generatedCount: 0,
      succeededCount: selectedCachedImages.length,
      failedCount: 0,
      items,
    };
    this.jobs.set(job.jobId, job);

    if (executionPlan) {
      this.activeJobIds.add(job.jobId);
      void this.executeJob(job.jobId, executionPlan);
    }

    return cloneImageJob(job);
  }

  public getJob(jobId: string): ImageJob | null {
    const job = this.jobs.get(jobId);
    return job ? cloneImageJob(job) : null;
  }

  public async setActiveImage(
    groupKey: string,
    input: ImageSetActiveRequest,
  ): Promise<GeneratedImageGroup> {
    const parsed = imageSetActiveRequestSchema.parse(input);
    try {
      return await this.options.imageStore.setActiveImage(groupKey, parsed.imageId);
    } catch (error) {
      throw this.mapStoreError(error, "Could not set active image.");
    }
  }

  public async deleteImage(
    groupKey: string,
    imageId: string,
  ): Promise<GeneratedImageGroup> {
    try {
      return await this.options.imageStore.deleteImage(groupKey, imageId);
    } catch (error) {
      throw this.mapStoreError(error, "Could not delete image.");
    }
  }

  public async deleteBatch(
    groupKey: string,
    batchIndex: number,
  ): Promise<GeneratedImageGroup> {
    try {
      return await this.options.imageStore.deleteBatch(groupKey, batchIndex);
    } catch (error) {
      throw this.mapStoreError(error, "Could not delete batch.");
    }
  }

  public async getImageFileRecord(fileName: string): Promise<ImageFileRecord | null> {
    return this.options.imageStore.getImageFileRecord(fileName);
  }

  private async executeJob(jobId: string, plan: JobExecutionPlan): Promise<void> {
    try {
      await Promise.all(
        plan.missingRequestIndices.map((requestIndex, generatedIndex) =>
          this.executeJobItem(jobId, plan, requestIndex, generatedIndex),
        ),
      );
      this.mutateJob(jobId, (job) => {
        job.status = job.failedCount > 0 ? "failed" : "completed";
      });
    } finally {
      this.activeJobIds.delete(jobId);
    }
  }

  private async executeJobItem(
    jobId: string,
    plan: JobExecutionPlan,
    requestIndex: number,
    generatedIndex: number,
  ): Promise<void> {
    this.mutateJob(jobId, (job) => {
      const item = job.items.find((candidate) => candidate.requestIndex === requestIndex);
      if (!item) {
        return;
      }
      item.status = "running";
      item.batchIndex = plan.batchIndex;
      item.imageIndex = generatedIndex;
      delete item.error;
    });

    try {
      const generated = await this.resolveProviderClient(plan.provider).generateImage({
        prompt: plan.prompt,
        model: plan.model,
        resolution: plan.resolution,
      });
      const downloaded = await this.downloadImage(generated.imageUrl);
      const stored = await this.options.imageStore.saveGeneratedImage({
        provider: plan.provider,
        prompt: plan.prompt,
        model: plan.model,
        promptHash: plan.promptHash,
        modelHash: plan.modelHash,
        groupKey: plan.groupKey,
        cacheKey: plan.cacheKey,
        batchIndex: plan.batchIndex,
        imageIndex: generatedIndex,
        resolution: plan.resolution,
        sourceUrl: generated.imageUrl,
        imageBuffer: downloaded.imageBuffer,
        contentType: downloaded.contentType,
      });

      this.mutateJob(jobId, (job) => {
        const item = job.items.find(
          (candidate) => candidate.requestIndex === requestIndex,
        );
        if (!item) {
          return;
        }
        item.status = "succeeded";
        item.imageId = stored.image.imageId;
        item.batchIndex = stored.image.batchIndex;
        item.imageIndex = stored.image.imageIndex;
        job.generatedCount += 1;
        job.succeededCount += 1;
      });
    } catch (error) {
      this.mutateJob(jobId, (job) => {
        const item = job.items.find(
          (candidate) => candidate.requestIndex === requestIndex,
        );
        if (!item) {
          return;
        }
        item.status = "failed";
        item.error = error instanceof Error ? error.message : "Image generation failed.";
        job.failedCount += 1;
      });
    }
  }

  private mutateJob(jobId: string, mutate: (job: ImageJob) => void): void {
    const job = this.jobs.get(jobId);
    if (!job) {
      return;
    }

    mutate(job);
    job.updatedAtIso = new Date().toISOString();
  }

  private enforceRateLimit(clientIp: string): void {
    const now = Date.now();
    const cutoff = now - 60_000;
    const ipKey = normalizeIpKey(clientIp);
    const existing = this.requestTimestampsByIp.get(ipKey) ?? [];
    const recent = existing.filter((timestamp) => timestamp > cutoff);
    if (recent.length >= this.rateLimitPerMinute) {
      throw new ImageGenerationError(
        "Rate limit exceeded. Please wait before creating another image job.",
        429,
      );
    }

    recent.push(now);
    this.requestTimestampsByIp.set(ipKey, recent);
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
      signal: AbortSignal.timeout(this.downloadTimeoutMs),
    });
    if (!response.ok) {
      throw new Error(
        `Image download failed (${response.status} ${response.statusText}).`,
      );
    }

    const contentTypeHeader = response.headers.get("content-type");
    const contentType = contentTypeHeader
      ? contentTypeHeader.split(";")[0]!.trim().toLowerCase()
      : "application/octet-stream";
    const imageBuffer = Buffer.from(await response.arrayBuffer());
    if (imageBuffer.length === 0) {
      throw new Error("Image download returned an empty payload.");
    }

    return {
      imageBuffer,
      contentType,
    };
  }

  private mapStoreError(error: unknown, fallbackMessage: string): ImageGenerationError {
    if (!(error instanceof Error)) {
      return new ImageGenerationError(fallbackMessage, 500);
    }

    const message = error.message.toLowerCase();
    if (message.includes("not found")) {
      return new ImageGenerationError(error.message, 404);
    }
    if (message.includes("mismatch")) {
      return new ImageGenerationError(error.message, 400);
    }

    return new ImageGenerationError(error.message, 500);
  }
}
