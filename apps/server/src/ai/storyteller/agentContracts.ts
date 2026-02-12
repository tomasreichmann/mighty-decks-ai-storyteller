import { z } from "zod";

export const storytellerModelConfigSchema = z.object({
  narrativeDirector: z.string().min(1),
  narrativeDirectorFallback: z.string().min(1),
  sceneController: z.string().min(1),
  sceneControllerFallback: z.string().min(1),
  outcomeDecider: z.string().min(1),
  outcomeDeciderFallback: z.string().min(1),
  continuityKeeper: z.string().min(1),
  continuityKeeperFallback: z.string().min(1),
  pitchGenerator: z.string().min(1),
  pitchGeneratorFallback: z.string().min(1),
  imageGenerator: z.string().min(1),
  imageGeneratorFallback: z.string().min(1).optional(),
});
export type StorytellerModelConfig = z.infer<typeof storytellerModelConfigSchema>;

export const storytellerAgentRoleSchema = z.enum([
  "pitch_generator",
  "narrative_director",
  "scene_controller",
  "outcome_decider",
  "continuity_keeper",
  "image_generator",
]);
export type StorytellerAgentRole = z.infer<typeof storytellerAgentRoleSchema>;

export interface StorytellerAgentInvocation {
  role: StorytellerAgentRole;
  model: string;
  timeoutMs: number;
  prompt: string;
}
