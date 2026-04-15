import { z } from "zod";
import {
  actorBaseLayerSlugSchema,
  actorBaseLayerSlugs,
  actorTacticalRoleSlugSchema,
  actorTacticalRoleSlugs,
  actorTacticalSpecialSlugSchema,
  actorTacticalSpecialSlugs,
} from "@mighty-decks/spec/actorCards";
import type { JsonValue } from "@mighty-decks/spec/workflowLab";
import type {
  WorkflowDef,
  WorkflowModelPreferences,
} from "../../workflow/types";

export const ADVENTURE_MODULE_ACTOR_FROM_PROMPT_WORKFLOW_ID =
  "adventure_module_actor_from_prompt";

export const adventureModuleActorFromPromptOutputSchema = z.object({
  title: z.string().min(1).max(120),
  summary: z.string().min(1).max(500),
  content: z.string().min(1).max(4000),
  baseLayerSlug: actorBaseLayerSlugSchema,
  tacticalRoleSlug: actorTacticalRoleSlugSchema,
  tacticalSpecialSlug: actorTacticalSpecialSlugSchema.optional(),
  isPlayerCharacter: z.boolean().default(false),
});
export type AdventureModuleActorFromPromptOutput = z.infer<
  typeof adventureModuleActorFromPromptOutputSchema
>;

const adventureModuleActorFromPromptInputSchema = z
  .object({
    moduleTitle: z.string().min(1).max(120),
    moduleSummary: z.string().min(1).max(500),
    existingActors: z.array(z.string().min(1).max(120)).max(20).default([]),
    prompt: z.string().min(1).max(1000),
  })
  .transform((value) => value as unknown as JsonValue);

export const adventureModuleActorFromPromptDefaultInputExample: JsonValue = {
  moduleTitle: "Exiles of the Hungry Void",
  moduleSummary:
    "A shipbound survival mini-campaign where exiles repair a corvette and outrun the Void.",
  existingActors: ["Primary Actor"],
  prompt: "A charismatic death cultist philosopher.",
};

export const adventureModuleActorFromPromptInputSchemaJson = {
  type: "object",
  properties: {
    moduleTitle: { type: "string" },
    moduleSummary: { type: "string" },
    existingActors: {
      type: "array",
      items: { type: "string" },
    },
    prompt: { type: "string" },
  },
  required: ["moduleTitle", "moduleSummary", "prompt"],
} as const satisfies JsonValue;

export const adventureModuleActorFromPromptDefaultModelOverrides: WorkflowModelPreferences =
  {
    hq_text_model: "anthropic/claude-sonnet-4.6",
  };

export const createAdventureModuleActorFromPromptWorkflow = (): WorkflowDef => ({
  workflowId: ADVENTURE_MODULE_ACTOR_FROM_PROMPT_WORKFLOW_ID,
  name: "Adventure Module Actor From Prompt",
  version: "1",
  description: "Drafts a typed actor record for module authoring from a free-text prompt.",
  inputSchema: adventureModuleActorFromPromptInputSchema,
  defaultInputExample: adventureModuleActorFromPromptDefaultInputExample,
  steps: [
    {
      id: "draft_actor",
      name: "Draft Actor",
      description: "Turns a free-text actor idea into typed authoring fields.",
      kind: "llm_text",
      mode: "text",
      modelSlot: "hq_text_model",
      timeoutMs: 45_000,
      retryCount: 1,
      outputSchema:
        adventureModuleActorFromPromptOutputSchema as unknown as z.ZodType<JsonValue>,
      buildPrompt: ({ input }) => {
        const data = input as {
          moduleTitle: string;
          moduleSummary: string;
          existingActors?: string[];
          prompt: string;
        };
        return [
          "Create a new Adventure Module actor as strict JSON only.",
          "Return exactly these keys: title, summary, content, baseLayerSlug, tacticalRoleSlug, tacticalSpecialSlug, isPlayerCharacter.",
          "title must be concise and memorable.",
          "summary must be 1 sentence and table-usable.",
          "content must be markdown beginning with '# <title>' and cover public face, pressure, leverage, and one roleplaying cue.",
          "Use baseLayerSlug and tacticalRoleSlug only from these enums:",
          `baseLayerSlug: ${actorBaseLayerSlugs.join(", ")}`,
          `tacticalRoleSlug: ${actorTacticalRoleSlugs.join(", ")}`,
          `tacticalSpecialSlug: ${actorTacticalSpecialSlugs.join(", ")}`,
          "If no tactical special is needed, omit tacticalSpecialSlug.",
          "Prefer isPlayerCharacter=false unless the prompt clearly asks for a player character.",
          `Module title: ${data.moduleTitle}`,
          `Module summary: ${data.moduleSummary}`,
          `Existing actors: ${(data.existingActors ?? []).join(", ") || "none"}`,
          `New actor prompt: ${data.prompt}`,
        ].join("\n");
      },
    },
  ],
  edges: [],
  outputSelectors: {
    actor: ({ getStepOutput }) =>
      (getStepOutput("draft_actor") ?? null) as JsonValue,
  },
});
