import { z } from "zod";

const hashSchema = z
  .string()
  .regex(/^[a-f0-9]{64}$/i, "Expected a SHA-256 hash.");

export const imageProviderSchema = z.enum(["fal", "leonardo"]);
export type ImageProvider = z.infer<typeof imageProviderSchema>;

export const imageResolutionSchema = z.object({
  width: z.number().int().min(64).max(4096),
  height: z.number().int().min(64).max(4096),
});
export type ImageResolution = z.infer<typeof imageResolutionSchema>;

export const imageGenerateJobRequestSchema = z.object({
  provider: imageProviderSchema.default("fal"),
  prompt: z.string().min(1).max(4000),
  resolution: imageResolutionSchema,
  model: z.string().min(1).max(200),
  useCache: z.boolean().default(true),
  amount: z.number().int().min(1).max(8),
});
export type ImageGenerateJobRequest = z.infer<
  typeof imageGenerateJobRequestSchema
>;

export const generatedImageAssetSchema = z.object({
  provider: imageProviderSchema.default("fal"),
  imageId: z.string().min(1),
  groupKey: z.string().min(1),
  promptHash: hashSchema,
  modelHash: hashSchema,
  cacheKey: z.string().min(1),
  prompt: z.string().min(1),
  model: z.string().min(1),
  batchIndex: z.number().int().nonnegative(),
  imageIndex: z.number().int().nonnegative(),
  width: z.number().int().min(1),
  height: z.number().int().min(1),
  fileName: z.string().min(1),
  metadataFileName: z.string().min(1),
  fileUrl: z.string().min(1),
  contentType: z.string().min(1),
  sourceUrl: z.string().min(1).optional(),
  createdAtIso: z.string().datetime(),
});
export type GeneratedImageAsset = z.infer<typeof generatedImageAssetSchema>;

export const generatedImageGroupSchema = z.object({
  provider: imageProviderSchema.default("fal"),
  groupKey: z.string().min(1),
  prompt: z.string().min(1),
  promptHash: hashSchema,
  model: z.string().min(1),
  modelHash: hashSchema,
  nextBatchIndex: z.number().int().nonnegative(),
  activeImageId: z.string().min(1).optional(),
  images: z.array(generatedImageAssetSchema).default([]),
});
export type GeneratedImageGroup = z.infer<typeof generatedImageGroupSchema>;

export const imageJobItemStatusSchema = z.enum([
  "pending",
  "running",
  "cached",
  "succeeded",
  "failed",
]);
export type ImageJobItemStatus = z.infer<typeof imageJobItemStatusSchema>;

export const imageJobItemProgressSchema = z.object({
  requestIndex: z.number().int().nonnegative(),
  status: imageJobItemStatusSchema,
  batchIndex: z.number().int().nonnegative().optional(),
  imageIndex: z.number().int().nonnegative().optional(),
  imageId: z.string().min(1).optional(),
  error: z.string().min(1).optional(),
});
export type ImageJobItemProgress = z.infer<typeof imageJobItemProgressSchema>;

export const imageJobStatusSchema = z.enum(["running", "completed", "failed"]);
export type ImageJobStatus = z.infer<typeof imageJobStatusSchema>;

export const imageJobSchema = z.object({
  jobId: z.string().min(1),
  createdAtIso: z.string().datetime(),
  updatedAtIso: z.string().datetime(),
  groupKey: z.string().min(1),
  promptHash: hashSchema,
  modelHash: hashSchema,
  request: imageGenerateJobRequestSchema,
  status: imageJobStatusSchema,
  totalRequested: z.number().int().min(1),
  cachedCount: z.number().int().nonnegative(),
  generatedCount: z.number().int().nonnegative(),
  succeededCount: z.number().int().nonnegative(),
  failedCount: z.number().int().nonnegative(),
  items: z.array(imageJobItemProgressSchema),
});
export type ImageJob = z.infer<typeof imageJobSchema>;

export const imageModelSummarySchema = z.object({
  modelId: z.string().min(1),
  displayName: z.string().min(1),
  description: z.string().min(1).optional(),
});
export type ImageModelSummary = z.infer<typeof imageModelSummarySchema>;

export const imageModelsResponseSchema = z.object({
  models: z.array(imageModelSummarySchema),
});
export type ImageModelsResponse = z.infer<typeof imageModelsResponseSchema>;

export const imageLookupGroupRequestSchema = z.object({
  provider: imageProviderSchema.default("fal"),
  prompt: z.string().min(1).max(4000),
  model: z.string().min(1).max(200),
});
export type ImageLookupGroupRequest = z.infer<
  typeof imageLookupGroupRequestSchema
>;

export const imageSetActiveRequestSchema = z.object({
  imageId: z.string().min(1),
});
export type ImageSetActiveRequest = z.infer<typeof imageSetActiveRequestSchema>;

export const imageGroupResponseSchema = z.object({
  group: generatedImageGroupSchema.nullable(),
});
export type ImageGroupResponse = z.infer<typeof imageGroupResponseSchema>;

export const imageJobResponseSchema = z.object({
  job: imageJobSchema,
});
export type ImageJobResponse = z.infer<typeof imageJobResponseSchema>;
