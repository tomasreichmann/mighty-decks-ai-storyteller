import { z } from "zod";

export const pitchArraySchema = z
  .array(
    z.object({
      title: z.string().min(1).max(100),
      description: z.string().min(1).max(400),
    }),
  )
  .min(2)
  .max(3);

export const sceneStartSchema = z.object({
  introProse: z.string().min(1).max(700),
  orientationBullets: z.array(z.string().min(1).max(160)).min(2).max(4),
  playerPrompt: z.string().min(1).max(320),
  tension: z.number().min(0).max(100).optional(),
  secrets: z.array(z.string()).optional(),
  pacingNotes: z.array(z.string()).optional(),
  continuityWarnings: z.array(z.string()).optional(),
});

export const continuitySchema = z.object({
  rollingSummary: z.string().min(1).max(1000),
  continuityWarnings: z.array(z.string()).default([]),
});

export const actionResponseSchema = z.object({
  text: z.string().min(1).max(900),
  closeScene: z.boolean(),
  sceneSummary: z.string().max(500).optional(),
  tension: z.number().min(0).max(100).optional(),
  secrets: z.array(z.string()).optional(),
  pacingNotes: z.array(z.string()).optional(),
  continuityWarnings: z.array(z.string()).optional(),
});

export const outcomeCheckDecisionSchema = z.object({
  shouldCheck: z.boolean(),
  reason: z.string().min(1).max(180),
  triggers: z.object({
    threat: z.boolean(),
    uncertainty: z.boolean(),
    highReward: z.boolean(),
  }),
});
