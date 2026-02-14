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
  text: z.string().min(1).max(1400),
  closeScene: z.boolean(),
  sceneSummary: z.string().max(500).optional(),
  tension: z.number().min(0).max(100).optional(),
  secrets: z.array(z.string()).optional(),
  pacingNotes: z.array(z.string()).optional(),
  continuityWarnings: z.array(z.string()).optional(),
});

export const sceneReactionSchema = z.object({
  npcBeat: z.string().min(1).max(360).optional(),
  consequence: z.string().min(1).max(320).optional(),
  reward: z.string().min(1).max(320).optional(),
  goalStatus: z.enum(["advanced", "completed", "blocked"]).default("advanced"),
  failForward: z.boolean().default(true),
  tensionShift: z.enum(["rise", "fall", "stable"]).default("stable"),
  tensionDelta: z.number().int().min(-35).max(35).default(0),
  sceneMode: z.enum(["low_tension", "high_tension"]).optional(),
  turnOrderRequired: z.boolean().optional(),
  tensionBand: z.enum(["low", "medium", "high"]).optional(),
  closeScene: z.boolean().default(false),
  sceneSummary: z.string().max(500).optional(),
  tension: z.number().min(0).max(100).optional(),
  tensionReason: z.string().max(180).optional(),
  reasoning: z.array(z.string()).optional(),
  pacingNotes: z.array(z.string()).optional(),
  continuityWarnings: z.array(z.string()).optional(),
});

export const outcomeCheckDecisionSchema = z.object({
  intent: z.enum(["information_request", "direct_action"]),
  responseMode: z.enum(["concise", "expanded"]).optional(),
  detailLevel: z.enum(["concise", "standard", "expanded"]).optional(),
  shouldCheck: z.boolean(),
  reason: z.string().min(1).max(180),
  allowHardDenyWithoutOutcomeCheck: z.boolean().default(false),
  hardDenyReason: z.string().max(180).default(""),
  triggers: z.object({
    threat: z.boolean(),
    uncertainty: z.boolean(),
    highReward: z.boolean(),
  }),
});
