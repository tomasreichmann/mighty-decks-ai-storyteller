import { z } from "zod";

export const modelPresetIdSchema = z.enum([
  "fastCheapProse", "fastOrchestrator", "smartThinker", "fastVisionProse",
]);
export type ModelPresetId = z.infer<typeof modelPresetIdSchema>;

export const modelPresetSchema = z.object({
  id: modelPresetIdSchema,
  configVersion: z.string().min(1),
  provider: z.string().min(1),
  model: z.string().min(1),
  settings: z.object({
    temperature: z.number().finite().min(0).max(2),
    maxOutputTokens: z.number().int().positive(),
    timeoutMs: z.number().int().positive(),
    retryCount: z.number().int().nonnegative(),
    inputTokenBudget: z.number().int().positive(),
  }).strict(),
  providerOptions: z.record(z.unknown()).optional(),
}).strict();
export type ModelPreset = z.infer<typeof modelPresetSchema>;
