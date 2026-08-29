import { z } from "zod";

export const readinessResponseSchema = z.object({
  ok: z.literal(true),
  status: z.literal("ready"),
  service: z.literal("mighty-decks-ai-storyteller"),
  timestamp: z.string().datetime(),
});
export type ReadinessResponse = z.infer<typeof readinessResponseSchema>;
