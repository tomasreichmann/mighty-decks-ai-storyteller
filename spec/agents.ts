import { z } from "zod";

export const modelAssignmentSchema = z.object({
  narrativeDirector: z.string().min(1),
  narrativeDirectorFallback: z.string().min(1),
  sceneController: z.string().min(1),
  sceneControllerFallback: z.string().min(1),
  continuityKeeper: z.string().min(1),
  continuityKeeperFallback: z.string().min(1),
  pitchGenerator: z.string().min(1),
  pitchGeneratorFallback: z.string().min(1),
  imageGenerator: z.string().min(1),
  imageGeneratorFallback: z.string().min(1).optional(),
});
export type ModelAssignment = z.infer<typeof modelAssignmentSchema>;

export const agentRoleSchema = z.enum([
  "pitch_generator",
  "narrative_director",
  "scene_controller",
  "continuity_keeper",
  "image_generator",
]);
export type AgentRole = z.infer<typeof agentRoleSchema>;

export interface AgentInvocation {
  role: AgentRole;
  model: string;
  timeoutMs: number;
  prompt: string;
}
