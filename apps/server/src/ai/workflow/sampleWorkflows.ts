import { z } from "zod";
import type { JsonValue } from "@mighty-decks/spec/workflowLab";
import type { WorkflowDef, WorkflowModelPreferences } from "../../workflow/types";
import {
  ADVENTURE_MODULE_ACTOR_FROM_PROMPT_WORKFLOW_ID,
  adventureModuleActorFromPromptDefaultInputExample,
  adventureModuleActorFromPromptDefaultModelOverrides,
  adventureModuleActorFromPromptInputSchemaJson,
  createAdventureModuleActorFromPromptWorkflow,
} from "../../adventureModule/authoring/actorFromPromptWorkflow";

interface WorkflowDefinitionRegistration {
  workflowId: string;
  createDefinition: () => WorkflowDef;
  defaultInputExample: JsonValue;
  inputSchemaJson: JsonValue;
  defaultModelOverrides?: WorkflowModelPreferences;
}

const imageFromProseInputSchema = z.object({
  prose: z.string().min(1).max(2000),
  styleHint: z.string().max(400).optional(),
});

const outlineSchema = z.object({
  title: z.string().min(1),
  tone: z.string().min(1).default("adventure"),
  locations: z.array(z.string().min(1)).min(1).max(6),
  characters: z.array(z.string().min(1)).min(1).max(6),
});

const consistencySchema = z.object({
  issues: z.array(z.string()).default([]),
  recommendedInvalidations: z.array(z.string()).default([]),
});

const asRecord = (value: JsonValue | undefined): Record<string, JsonValue> =>
  typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, JsonValue>)
    : {};

const asStringArray = (value: JsonValue | undefined): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const createImageFromProseWorkflow = (): WorkflowDef => ({
  workflowId: "image_from_prose",
  name: "Image From Prose",
  version: "1",
  description: "Generate an image prompt from prose, then create an image.",
  inputSchema: imageFromProseInputSchema as unknown as z.ZodType<JsonValue>,
  defaultInputExample: {
    prose: "A moonlit harbor where smugglers unload glowing crates while gulls circle above.",
    styleHint: "cinematic painterly fantasy",
  },
  steps: [
    {
      id: "image_prompt_generator",
      name: "Image Prompt",
      description: "Turns narrative prose into a concise visual prompt for image generation.",
      kind: "llm_text",
      mode: "text",
      modelSlot: "fast_text_model",
      timeoutMs: 30_000,
      retryCount: 1,
      buildPrompt: ({ input }) => {
        const parsed = imageFromProseInputSchema.parse(input);
        return [
          "Convert the narrative prose into a single strong image-generation prompt.",
          "Return plain text only. Include composition, mood, lighting, and key subjects.",
          parsed.styleHint ? `Style hint: ${parsed.styleHint}` : "Style hint: none",
          `Narrative prose: ${parsed.prose}`,
        ].join("\n");
      },
    },
    {
      id: "image_generator",
      name: "Generate Image",
      description: "Generates an image using the prompt produced by the previous step.",
      kind: "llm_image",
      modelSlot: "fast_image_model",
      timeoutMs: 120_000,
      retryCount: 1,
      buildPrompt: ({ getStepOutput }) => {
        const prompt = getStepOutput("image_prompt_generator");
        return typeof prompt === "string" ? prompt : JSON.stringify(prompt);
      },
    },
  ],
  edges: [
    {
      fromStepId: "image_prompt_generator",
      toStepId: "image_generator",
    },
  ],
  outputSelectors: {
    imagePrompt: ({ getStepOutput }) =>
      (getStepOutput("image_prompt_generator") ?? "") as JsonValue,
    image: ({ getStepOutput }) => (getStepOutput("image_generator") ?? null) as JsonValue,
  },
});

const createAdventureArtifactWorkflow = (): WorkflowDef => ({
  workflowId: "adventure_artifact_package",
  name: "Adventure Artifact Package",
  version: "1",
  description:
    "Builds a structured adventure artifact bundle with outline, prose expansions, checks, and optional images.",
  inputSchema: z
    .object({
      adventurePrompt: z.string().min(1).max(4000),
      styleGuide: z.string().max(1000).optional(),
      maxArtifacts: z.number().int().min(1).max(6).default(3),
      generateImages: z.boolean().default(true),
    })
    .transform((value) => value as unknown as JsonValue),
  defaultInputExample: {
    adventurePrompt:
      "A haunted sky-train crosses a storm wall. The crew must stop a saboteur before the train reaches a floating city.",
    styleGuide: "Pulp fantasy, mysterious but playful, short evocative prose.",
    maxArtifacts: 3,
    generateImages: true,
  },
  steps: [
    {
      id: "director_outline",
      name: "Director Outline",
      description: "Creates the initial adventure title, tone, key locations, and key characters.",
      kind: "llm_text",
      mode: "text",
      modelSlot: "fast_text_model",
      timeoutMs: 45_000,
      retryCount: 1,
      outputSchema: outlineSchema as unknown as z.ZodType<JsonValue>,
      buildPrompt: ({ input }) => {
        const data = asRecord(input);
        return [
          "Create an adventure production outline as JSON.",
          "Return valid JSON only with keys: title, tone, locations (1-6 strings), characters (1-6 strings).",
          "Keep names concrete and memorable. No markdown.",
          `Adventure prompt: ${String(data.adventurePrompt ?? "")}`,
          `Style guide: ${String(data.styleGuide ?? "") || "none"}`,
        ].join("\n");
      },
    },
    {
      id: "location_copy",
      name: "Location Copy",
      description: "Expands each location into short vivid prose, feeding previous results as rolling context.",
      kind: "map",
      mode: "sequential",
      concurrency: 1,
      timeoutMs: 90_000,
      retryCount: 0,
      getItems: ({ getStepOutput, input }) => {
        const outline = asRecord(getStepOutput("director_outline"));
        const maxArtifacts = Number(asRecord(input).maxArtifacts ?? 3);
        return asStringArray(outline.locations).slice(0, Math.max(1, maxArtifacts));
      },
      runItem: async ({ item, previousResults, helpers }) => {
        const label = String(item);
        const outline = asRecord(helpers.getStepOutput("director_outline"));
        const priorSummary = previousResults
          .map((entry) => asRecord(entry))
          .map((entry) => `${String(entry.name ?? "")}: ${String(entry.prose ?? "")}`)
          .join("\n");
        const prompt = [
          "Write one compact GM-facing location card paragraph (70-140 words).",
          "Include what players notice, pressure, and one interactive hook.",
          "Return plain text only.",
          `Adventure title: ${String(outline.title ?? "")}`,
          `Location name: ${label}`,
          priorSummary ? `Previous location cards:\n${priorSummary}` : "",
        ]
          .filter(Boolean)
          .join("\n");
        const modelId = helpers.resolveModel("fast_text_model");
        const result = await helpers.adapters.text({
          modelId,
          prompt,
          timeoutMs: 30_000,
          signal: helpers.abortSignal,
        });
        return {
          type: "location",
          name: label,
          prose: (result.text ?? `A notable place called ${label}.`).trim(),
        };
      },
      aggregate: ({ itemResults }) => ({ locations: itemResults }),
    },
    {
      id: "character_copy",
      name: "Character Copy",
      description: "Expands each character into short vivid prose, using prior character outputs as rolling context.",
      kind: "map",
      mode: "sequential",
      concurrency: 1,
      timeoutMs: 90_000,
      retryCount: 0,
      getItems: ({ getStepOutput, input }) => {
        const outline = asRecord(getStepOutput("director_outline"));
        const maxArtifacts = Number(asRecord(input).maxArtifacts ?? 3);
        return asStringArray(outline.characters).slice(0, Math.max(1, maxArtifacts));
      },
      runItem: async ({ item, previousResults, helpers }) => {
        const label = String(item);
        const outline = asRecord(helpers.getStepOutput("director_outline"));
        const priorSummary = previousResults
          .map((entry) => asRecord(entry))
          .map((entry) => `${String(entry.name ?? "")}: ${String(entry.prose ?? "")}`)
          .join("\n");
        const prompt = [
          "Write one compact character card paragraph (70-140 words).",
          "Include motive, behavior under pressure, and one connection to the adventure.",
          "Return plain text only.",
          `Adventure title: ${String(outline.title ?? "")}`,
          `Character name: ${label}`,
          priorSummary ? `Previous character cards:\n${priorSummary}` : "",
        ]
          .filter(Boolean)
          .join("\n");
        const modelId = helpers.resolveModel("fast_text_model");
        const result = await helpers.adapters.text({
          modelId,
          prompt,
          timeoutMs: 30_000,
          signal: helpers.abortSignal,
        });
        return {
          type: "character",
          name: label,
          prose: (result.text ?? `A character named ${label}.`).trim(),
        };
      },
      aggregate: ({ itemResults }) => ({ characters: itemResults }),
    },
    {
      id: "consistency_check",
      name: "Consistency Check",
      description: "Checks generated prose for contradictions and suggests which steps should be invalidated.",
      kind: "llm_text",
      mode: "text",
      modelSlot: "hq_text_model",
      timeoutMs: 45_000,
      retryCount: 0,
      outputSchema: consistencySchema as unknown as z.ZodType<JsonValue>,
      buildPrompt: ({ getStepOutput }) => {
        const outline = getStepOutput("director_outline");
        const locations = getStepOutput("location_copy");
        const characters = getStepOutput("character_copy");
        return [
          "Review the generated adventure artifacts for inconsistencies.",
          "Return JSON only: { issues: string[], recommendedInvalidations: string[] }",
          "recommendedInvalidations may include only these step ids: location_copy, character_copy",
          `Outline: ${JSON.stringify(outline)}`,
          `Locations: ${JSON.stringify(locations)}`,
          `Characters: ${JSON.stringify(characters)}`,
        ].join("\n");
      },
    },
    {
      id: "repair_decision",
      name: "Repair Decision",
      description: "Summarizes repair recommendations into a deterministic action plan for manual reruns.",
      kind: "code",
      timeoutMs: 5000,
      retryCount: 0,
      run: async ({ getStepOutput, patchSharedState }) => {
        const consistency = asRecord(getStepOutput("consistency_check"));
        const suggested = asStringArray(consistency.recommendedInvalidations);
        patchSharedState({
          suggestedInvalidations: suggested,
        });
        return {
          output: {
            issues: asStringArray(consistency.issues),
            suggestedInvalidations: suggested,
            autoRepairApplied: false,
          },
          summary: suggested.length > 0 ? `Suggested invalidations: ${suggested.join(", ")}` : "No repairs suggested.",
        };
      },
    },
    {
      id: "artifact_image_prompts",
      name: "Artifact Image Prompts",
      description: "Builds image prompts for generated location and character artifacts.",
      kind: "code",
      timeoutMs: 5000,
      retryCount: 0,
      run: async ({ getStepOutput, input }) => {
        const locations = asRecord(getStepOutput("location_copy")).locations;
        const characters = asRecord(getStepOutput("character_copy")).characters;
        const items = [...(Array.isArray(locations) ? locations : []), ...(Array.isArray(characters) ? characters : [])]
          .map((entry) => asRecord(entry))
          .map((entry, index) => ({
            artifactId: `${String(entry.type ?? "artifact")}-${index + 1}`,
            type: String(entry.type ?? "artifact"),
            name: String(entry.name ?? `Artifact ${index + 1}`),
            prompt: `Illustration of ${String(entry.name ?? "artifact")}. ${String(entry.prose ?? "")}`.slice(0, 1000),
            generateImages: Boolean(asRecord(input).generateImages ?? true),
          }));
        return {
          output: { items },
          summary: `Prepared ${items.length} image prompts`,
        };
      },
    },
    {
      id: "artifact_images",
      name: "Artifact Images",
      description: "Generates images for artifact prompts and streams progress as each image completes.",
      kind: "map",
      mode: "parallel",
      concurrency: 2,
      timeoutMs: 180_000,
      retryCount: 0,
      getItems: () => [], // replaced after workflow construction
      runItem: async ({ item }) => item,
      aggregate: ({ itemResults }) => ({ items: itemResults }),
    },
    {
      id: "render_aggregate",
      name: "Render Aggregate",
      description: "Combines all generated artifacts into a page-ready payload for inspection and rendering.",
      kind: "code",
      timeoutMs: 5000,
      retryCount: 0,
      run: async ({ getStepOutput }) => {
        const outline = getStepOutput("director_outline") ?? null;
        const locations = getStepOutput("location_copy") ?? null;
        const characters = getStepOutput("character_copy") ?? null;
        const consistency = getStepOutput("consistency_check") ?? null;
        const repair = getStepOutput("repair_decision") ?? null;
        const imagePrompts = getStepOutput("artifact_image_prompts") ?? null;
        const images = getStepOutput("artifact_images") ?? null;
        return {
          output: {
            outline,
            locations,
            characters,
            consistency,
            repair,
            imagePrompts,
            images,
          },
          summary: "Rendered final artifact package payload.",
        };
      },
    },
  ],
  edges: [
    { fromStepId: "director_outline", toStepId: "location_copy" },
    { fromStepId: "director_outline", toStepId: "character_copy" },
    { fromStepId: "director_outline", toStepId: "consistency_check" },
    { fromStepId: "location_copy", toStepId: "consistency_check" },
    { fromStepId: "character_copy", toStepId: "consistency_check" },
    { fromStepId: "consistency_check", toStepId: "repair_decision" },
    { fromStepId: "location_copy", toStepId: "artifact_image_prompts" },
    { fromStepId: "character_copy", toStepId: "artifact_image_prompts" },
    { fromStepId: "artifact_image_prompts", toStepId: "artifact_images" },
    { fromStepId: "director_outline", toStepId: "render_aggregate" },
    { fromStepId: "repair_decision", toStepId: "render_aggregate" },
    { fromStepId: "artifact_image_prompts", toStepId: "render_aggregate" },
    { fromStepId: "artifact_images", toStepId: "render_aggregate" },
  ],
  outputSelectors: {
    package: ({ getStepOutput }) => (getStepOutput("render_aggregate") ?? null) as JsonValue,
    suggestedInvalidations: ({ sharedState }) => asRecord(sharedState).suggestedInvalidations ?? [],
  },
  createInitialSharedState: () => ({
    suggestedInvalidations: [],
  }),
});

// Patch the artifact_images step implementation after workflow construction to keep the main definition readable.
const attachArtifactImageGenerationBehavior = (definition: WorkflowDef): WorkflowDef => {
  const artifactImagesStepIndex = definition.steps.findIndex((step) => step.id === "artifact_images");
  if (artifactImagesStepIndex < 0) {
    return definition;
  }
  const step = definition.steps[artifactImagesStepIndex];
  if (!step || step.kind !== "map") {
    return definition;
  }

  step.getItems = ({ getStepOutput }) => {
    const promptBundle = asRecord(getStepOutput("artifact_image_prompts"));
    const items = Array.isArray(promptBundle.items) ? promptBundle.items : [];
    return items.map((item) => (isJsonObject(item) ? item : { raw: item }));
  };
  step.runItem = async ({ item, helpers }) => {
    const record = asRecord(item);
    if (!Boolean(record.generateImages ?? true)) {
      return {
        ...record,
        imageUrl: null,
        skipped: true,
      };
    }
    const prompt = String(record.prompt ?? "");
    const imageResult = await helpers.adapters.image({
      modelId: helpers.resolveModel("fast_image_model"),
      prompt,
      timeoutMs: 120_000,
      signal: helpers.abortSignal,
    });
    helpers.emitProgress({
      message: `Image created for ${String(record.name ?? "artifact")}`,
      data: {
        artifactId: String(record.artifactId ?? ""),
        imageUrl: imageResult.imageUrl ?? null,
      },
    });
    return {
      ...record,
      imageUrl: imageResult.imageUrl,
    };
  };
  step.aggregate = ({ itemResults }) => ({ items: itemResults });
  return definition;
};

const adventureModuleSeedScaffoldOutputSchema = z.object({
  title: z.string().min(1).max(120),
  summary: z.string().min(1).max(500),
  intent: z.string().min(1).max(500),
  dos: z.array(z.string().min(1).max(160)).max(8).default([]),
  donts: z.array(z.string().min(1).max(160)).max(8).default([]),
  tags: z.array(z.string().min(1).max(40)).max(12).default([]),
  starterFragments: z
    .array(
      z.object({
        kind: z.string().min(1).max(60),
        title: z.string().min(1).max(120),
        summary: z.string().min(1).max(300),
        containsSpoilers: z.boolean().default(false),
        intendedAudience: z
          .enum(["players", "storyteller", "shared"])
          .default("shared"),
      }),
    )
    .min(3)
    .max(16),
});

const brainstormOptionsOutputSchema = z.object({
  target: z.string().min(1).max(80),
  options: z
    .array(
      z.object({
        optionId: z.string().min(1).max(80),
        title: z.string().min(1).max(140),
        rationale: z.string().min(1).max(260),
        candidateText: z.string().min(1).max(1200),
      }),
    )
    .min(2)
    .max(6),
});

const expandFragmentsOutputSchema = z.object({
  fragments: z
    .array(
      z.object({
        kind: z.string().min(1).max(60),
        title: z.string().min(1).max(120),
        summary: z.string().min(1).max(300),
        containsSpoilers: z.boolean().default(false),
        intendedAudience: z
          .enum(["players", "storyteller", "shared"])
          .default("shared"),
        content: z.string().min(1).max(4000),
      }),
    )
    .min(1)
    .max(30),
});

const polishContinuityOutputSchema = z.object({
  issues: z.array(z.string().min(1).max(260)).max(20).default([]),
  revisions: z
    .array(
      z.object({
        fragmentId: z.string().min(1).max(120),
        reason: z.string().min(1).max(260),
        revisedContent: z.string().min(1).max(4000),
      }),
    )
    .max(40)
    .default([]),
});

const createAdventureModuleSeedScaffoldWorkflow = (): WorkflowDef => ({
  workflowId: "adventure_module_seed_scaffold",
  name: "Adventure Module Seed Scaffold",
  version: "1",
  description:
    "Turns a seed prompt into module-level metadata and starter fragment guidance.",
  inputSchema: z
    .object({
      seedPrompt: z.string().min(1).max(4000),
      titleHint: z.string().min(1).max(120).optional(),
      toneHint: z.string().min(1).max(200).optional(),
    })
    .transform((value) => value as unknown as JsonValue),
  defaultInputExample: {
    seedPrompt:
      "A drowned observatory city bargains with memory merchants while flood sirens forecast collapse.",
    titleHint: "Siren Market at Drowned Glass",
    toneHint: "Tense but hopeful, with ethical tradeoffs.",
  },
  steps: [
    {
      id: "seed_scaffold",
      name: "Seed Scaffold",
      description: "Builds a coherent module scaffold from a raw seed idea.",
      kind: "llm_text",
      mode: "text",
      modelSlot: "fast_text_model",
      timeoutMs: 45_000,
      retryCount: 1,
      outputSchema: adventureModuleSeedScaffoldOutputSchema as unknown as z.ZodType<JsonValue>,
      buildPrompt: ({ input }) => {
        const data = asRecord(input);
        return [
          "Create a playable Adventure Module scaffold.",
          "Return strict JSON only with keys:",
          "title, summary, intent, dos[], donts[], tags[], starterFragments[].",
          "Each starterFragments item must include: kind, title, summary, containsSpoilers, intendedAudience.",
          "Kinds should prioritize: player_summary, storyteller_summary, palette, setting, location, actor, encounter, quest.",
          `Seed prompt: ${String(data.seedPrompt ?? "")}`,
          `Title hint: ${String(data.titleHint ?? "") || "none"}`,
          `Tone hint: ${String(data.toneHint ?? "") || "none"}`,
        ].join("\n");
      },
    },
  ],
  edges: [],
  outputSelectors: {
    scaffold: ({ getStepOutput }) => (getStepOutput("seed_scaffold") ?? null) as JsonValue,
  },
});

const createAdventureModuleBrainstormWorkflow = (): WorkflowDef => ({
  workflowId: "adventure_module_brainstorm_options",
  name: "Adventure Module Brainstorm Options",
  version: "1",
  description: "Generates curated authoring options for a specific target area.",
  inputSchema: z
    .object({
      target: z.enum(["palette", "hooks", "tone", "setting", "summary"]),
      moduleTitle: z.string().min(1).max(120).optional(),
      contextText: z.string().min(1).max(5000),
    })
    .transform((value) => value as unknown as JsonValue),
  defaultInputExample: {
    target: "hooks",
    moduleTitle: "Siren Market at Drowned Glass",
    contextText: "Flood sirens, black-market memory trade, factions racing to secure evacuation routes.",
  },
  steps: [
    {
      id: "brainstorm",
      name: "Brainstorm",
      description: "Produces 2-6 actionable candidate options for the selected target.",
      kind: "llm_text",
      mode: "text",
      modelSlot: "fast_text_model",
      timeoutMs: 45_000,
      retryCount: 1,
      outputSchema: brainstormOptionsOutputSchema as unknown as z.ZodType<JsonValue>,
      buildPrompt: ({ input }) => {
        const data = asRecord(input);
        return [
          "Generate multiple Adventure Module authoring options.",
          "Return strict JSON only with keys: target, options[].",
          "Each option must include optionId, title, rationale, candidateText.",
          "candidateText should be directly usable in an editor with minimal cleanup.",
          `Target: ${String(data.target ?? "summary")}`,
          `Module title: ${String(data.moduleTitle ?? "") || "untitled"}`,
          `Context: ${String(data.contextText ?? "")}`,
        ].join("\n");
      },
    },
  ],
  edges: [],
  outputSelectors: {
    options: ({ getStepOutput }) => (getStepOutput("brainstorm") ?? null) as JsonValue,
  },
});

const createAdventureModuleExpandWorkflow = (): WorkflowDef => ({
  workflowId: "adventure_module_expand_fragments",
  name: "Adventure Module Expand Fragments",
  version: "1",
  description:
    "Expands selected fragment kinds into ready-to-edit draft prose and metadata hints.",
  inputSchema: z
    .object({
      moduleTitle: z.string().min(1).max(120),
      moduleSummary: z.string().min(1).max(500),
      fragmentKinds: z.array(z.string().min(1).max(60)).min(1).max(20),
      contextText: z.string().max(6000).optional(),
    })
    .transform((value) => value as unknown as JsonValue),
  defaultInputExample: {
    moduleTitle: "Siren Market at Drowned Glass",
    moduleSummary: "A one-night crisis in a flooded market city where memories are currency.",
    fragmentKinds: ["location", "actor", "encounter", "quest"],
    contextText: "Include one fail-forward branch in each expanded fragment.",
  },
  steps: [
    {
      id: "expand_fragments",
      name: "Expand Fragments",
      description: "Creates draft fragment content for chosen fragment kinds.",
      kind: "llm_text",
      mode: "text",
      modelSlot: "hq_text_model",
      timeoutMs: 60_000,
      retryCount: 1,
      outputSchema: expandFragmentsOutputSchema as unknown as z.ZodType<JsonValue>,
      buildPrompt: ({ input }) => {
        const data = asRecord(input);
        const fragmentKinds = asStringArray(data.fragmentKinds).join(", ");
        return [
          "Expand Adventure Module fragments.",
          "Return strict JSON only with key fragments[].",
          "Each fragment item must include: kind, title, summary, containsSpoilers, intendedAudience, content.",
          "content should be concise but ready for immediate editor review.",
          `Module title: ${String(data.moduleTitle ?? "")}`,
          `Module summary: ${String(data.moduleSummary ?? "")}`,
          `Requested fragment kinds: ${fragmentKinds}`,
          `Extra context: ${String(data.contextText ?? "") || "none"}`,
        ].join("\n");
      },
    },
  ],
  edges: [],
  outputSelectors: {
    fragments: ({ getStepOutput }) => (getStepOutput("expand_fragments") ?? null) as JsonValue,
  },
});

const createAdventureModulePolishWorkflow = (): WorkflowDef => ({
  workflowId: "adventure_module_polish_continuity",
  name: "Adventure Module Polish Continuity",
  version: "1",
  description:
    "Finds continuity issues and proposes revised content for selected fragments.",
  inputSchema: z
    .object({
      moduleTitle: z.string().min(1).max(120),
      fragments: z
        .array(
          z.object({
            fragmentId: z.string().min(1).max(120),
            title: z.string().min(1).max(120),
            content: z.string().min(1).max(6000),
          }),
        )
        .min(1)
        .max(40),
      styleHint: z.string().max(300).optional(),
    })
    .transform((value) => value as unknown as JsonValue),
  defaultInputExample: {
    moduleTitle: "Siren Market at Drowned Glass",
    fragments: [
      {
        fragmentId: "frag-location-main",
        title: "Flood Bazaar",
        content:
          "The flood bazaar is loud, smoke-lit, and unstable. Factions clash over evacuation manifests.",
      },
    ],
    styleHint: "Keep prose concrete and table-usable.",
  },
  steps: [
    {
      id: "continuity_polish",
      name: "Continuity Polish",
      description: "Reviews selected fragments and proposes continuity-safe rewrites.",
      kind: "llm_text",
      mode: "text",
      modelSlot: "hq_text_model",
      timeoutMs: 60_000,
      retryCount: 1,
      outputSchema: polishContinuityOutputSchema as unknown as z.ZodType<JsonValue>,
      buildPrompt: ({ input }) => {
        const data = asRecord(input);
        return [
          "Review these Adventure Module fragments for continuity and clarity issues.",
          "Return strict JSON only with keys: issues[], revisions[].",
          "Each revision item must include fragmentId, reason, revisedContent.",
          "Do not invent new fragment ids.",
          `Module title: ${String(data.moduleTitle ?? "")}`,
          `Style hint: ${String(data.styleHint ?? "") || "none"}`,
          `Fragments JSON: ${JSON.stringify(data.fragments ?? [])}`,
        ].join("\n");
      },
    },
  ],
  edges: [],
  outputSelectors: {
    polish: ({ getStepOutput }) => (getStepOutput("continuity_polish") ?? null) as JsonValue,
  },
});

const premiseTransformOutputSchema = z.object({
  text: z.string().min(1).max(500),
});

const createAdventureModulePremiseMakeChangesWorkflow = (): WorkflowDef => ({
  workflowId: "adventure_module_premise_make_changes",
  name: "Adventure Module Premise Make Changes",
  version: "1",
  description: "Applies explicit revision instructions to premise text and returns updated copy.",
  inputSchema: z
    .object({
      text: z.string().min(1).max(4000),
      instruction: z.string().min(1).max(600),
      contextDescription: z.string().max(1000).optional(),
    })
    .transform((value) => value as unknown as JsonValue),
  defaultInputExample: {
    text: "A flooded market city where memory merchants trade escape routes.",
    instruction: "Add stronger urgency and a clear player-facing objective.",
  },
  steps: [
    {
      id: "transform_premise",
      name: "Transform Premise",
      description: "Rewrites premise according to explicit author instructions.",
      kind: "llm_text",
      mode: "text",
      modelSlot: "fast_text_model",
      timeoutMs: 45_000,
      retryCount: 1,
      outputSchema: premiseTransformOutputSchema as unknown as z.ZodType<JsonValue>,
      buildPrompt: ({ input }) => {
        const data = asRecord(input);
        return [
          "Rewrite the premise text based on the change request.",
          "Return strict JSON only: {\"text\":\"...\"}.",
          "The text must be plain prose, concise, and 1-500 characters.",
          "Do not include markdown, bullet markers, or extra keys.",
          `Premise text: ${String(data.text ?? "")}`,
          String(data.contextDescription ?? "").trim().length > 0
            ? `Author context: ${String(data.contextDescription ?? "").trim()}`
            : "",
          `Change request: ${String(data.instruction ?? "")}`,
        ]
          .filter((line) => line.length > 0)
          .join("\n");
      },
    },
  ],
  edges: [],
  outputSelectors: {
    transformed: ({ getStepOutput }) => (getStepOutput("transform_premise") ?? null) as JsonValue,
  },
});

const createAdventureModulePremiseToProseWorkflow = (): WorkflowDef => ({
  workflowId: "adventure_module_premise_to_prose",
  name: "Adventure Module Premise To Prose",
  version: "1",
  description: "Converts premise text into a compact prose paragraph.",
  inputSchema: z
    .object({
      text: z.string().min(1).max(4000),
      contextDescription: z.string().max(1000).optional(),
    })
    .transform((value) => value as unknown as JsonValue),
  defaultInputExample: {
    text: "- Flood sirens - collapsing districts - memory market factions",
  },
  steps: [
    {
      id: "transform_premise",
      name: "Transform Premise",
      description: "Converts mixed text into concise prose.",
      kind: "llm_text",
      mode: "text",
      modelSlot: "fast_text_model",
      timeoutMs: 45_000,
      retryCount: 1,
      outputSchema: premiseTransformOutputSchema as unknown as z.ZodType<JsonValue>,
      buildPrompt: ({ input }) => {
        const data = asRecord(input);
        return [
          "Convert the premise into a single cohesive prose paragraph.",
          "Return strict JSON only: {\"text\":\"...\"}.",
          "The text must be plain prose, concise, and 1-500 characters.",
          "Do not include bullet markers or extra keys.",
          `Premise text: ${String(data.text ?? "")}`,
          String(data.contextDescription ?? "").trim().length > 0
            ? `Author context: ${String(data.contextDescription ?? "").trim()}`
            : "",
        ]
          .filter((line) => line.length > 0)
          .join("\n");
      },
    },
  ],
  edges: [],
  outputSelectors: {
    transformed: ({ getStepOutput }) => (getStepOutput("transform_premise") ?? null) as JsonValue,
  },
});

const createAdventureModulePremiseToBulletsWorkflow = (): WorkflowDef => ({
  workflowId: "adventure_module_premise_to_bullets",
  name: "Adventure Module Premise To Bullets",
  version: "1",
  description: "Converts premise text into concise bullet-style lines.",
  inputSchema: z
    .object({
      text: z.string().min(1).max(4000),
      contextDescription: z.string().max(1000).optional(),
    })
    .transform((value) => value as unknown as JsonValue),
  defaultInputExample: {
    text: "A flood-struck city bargains away memories while sirens count down district collapse.",
  },
  steps: [
    {
      id: "transform_premise",
      name: "Transform Premise",
      description: "Rewrites premise as compact bullet points.",
      kind: "llm_text",
      mode: "text",
      modelSlot: "fast_text_model",
      timeoutMs: 45_000,
      retryCount: 1,
      outputSchema: premiseTransformOutputSchema as unknown as z.ZodType<JsonValue>,
      buildPrompt: ({ input }) => {
        const data = asRecord(input);
        return [
          "Convert the premise into 2-5 compact bullet lines.",
          "Return strict JSON only: {\"text\":\"...\"}.",
          "Use newline-separated lines starting with '- '.",
          "Keep total text length between 1 and 500 characters.",
          "Do not include extra keys.",
          `Premise text: ${String(data.text ?? "")}`,
          String(data.contextDescription ?? "").trim().length > 0
            ? `Author context: ${String(data.contextDescription ?? "").trim()}`
            : "",
        ]
          .filter((line) => line.length > 0)
          .join("\n");
      },
    },
  ],
  edges: [],
  outputSelectors: {
    transformed: ({ getStepOutput }) => (getStepOutput("transform_premise") ?? null) as JsonValue,
  },
});

const createAdventureModulePremiseExpandWorkflow = (): WorkflowDef => ({
  workflowId: "adventure_module_premise_expand",
  name: "Adventure Module Premise Expand",
  version: "1",
  description: "Expands premise detail by a target percentage while preserving core intent.",
  inputSchema: z
    .object({
      text: z.string().min(1).max(4000),
      percent: z.number().int().min(1).max(200),
      contextDescription: z.string().max(1000).optional(),
    })
    .transform((value) => value as unknown as JsonValue),
  defaultInputExample: {
    text: "A flood market city trades memories while factions race to control evacuation sirens.",
    percent: 20,
  },
  steps: [
    {
      id: "transform_premise",
      name: "Transform Premise",
      description: "Expands premise with more concrete detail.",
      kind: "llm_text",
      mode: "text",
      modelSlot: "fast_text_model",
      timeoutMs: 45_000,
      retryCount: 1,
      outputSchema: premiseTransformOutputSchema as unknown as z.ZodType<JsonValue>,
      buildPrompt: ({ input }) => {
        const data = asRecord(input);
        const percent = Number(data.percent ?? 20);
        return [
          "Expand the premise text while preserving original meaning.",
          "Target roughly the requested increase in length.",
          "Return strict JSON only: {\"text\":\"...\"}.",
          "The final text must be between 1 and 500 characters.",
          "Do not include extra keys.",
          `Requested expansion percent: ${Number.isFinite(percent) ? percent : 20}`,
          `Premise text: ${String(data.text ?? "")}`,
          String(data.contextDescription ?? "").trim().length > 0
            ? `Author context: ${String(data.contextDescription ?? "").trim()}`
            : "",
        ]
          .filter((line) => line.length > 0)
          .join("\n");
      },
    },
  ],
  edges: [],
  outputSelectors: {
    transformed: ({ getStepOutput }) => (getStepOutput("transform_premise") ?? null) as JsonValue,
  },
});

const createAdventureModulePremiseCompactWorkflow = (): WorkflowDef => ({
  workflowId: "adventure_module_premise_compact",
  name: "Adventure Module Premise Compact",
  version: "1",
  description: "Compacts premise text by a target percentage while preserving key information.",
  inputSchema: z
    .object({
      text: z.string().min(1).max(4000),
      percent: z.number().int().min(1).max(200),
      contextDescription: z.string().max(1000).optional(),
    })
    .transform((value) => value as unknown as JsonValue),
  defaultInputExample: {
    text: "A flood market city trades memories while factions race to control evacuation sirens and exploit panic.",
    percent: 20,
  },
  steps: [
    {
      id: "transform_premise",
      name: "Transform Premise",
      description: "Compacts premise into denser and shorter wording.",
      kind: "llm_text",
      mode: "text",
      modelSlot: "fast_text_model",
      timeoutMs: 45_000,
      retryCount: 1,
      outputSchema: premiseTransformOutputSchema as unknown as z.ZodType<JsonValue>,
      buildPrompt: ({ input }) => {
        const data = asRecord(input);
        const percent = Number(data.percent ?? 20);
        return [
          "Compact the premise text while preserving key meaning and tone.",
          "Target roughly the requested reduction in length.",
          "Return strict JSON only: {\"text\":\"...\"}.",
          "The final text must be between 1 and 500 characters.",
          "Do not include extra keys.",
          `Requested compact percent: ${Number.isFinite(percent) ? percent : 20}`,
          `Premise text: ${String(data.text ?? "")}`,
          String(data.contextDescription ?? "").trim().length > 0
            ? `Author context: ${String(data.contextDescription ?? "").trim()}`
            : "",
        ]
          .filter((line) => line.length > 0)
          .join("\n");
      },
    },
  ],
  edges: [],
  outputSelectors: {
    transformed: ({ getStepOutput }) => (getStepOutput("transform_premise") ?? null) as JsonValue,
  },
});

const isJsonObject = (value: JsonValue): value is Record<string, JsonValue> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const createWorkflowDefinitionRegistrations = (): WorkflowDefinitionRegistration[] => [
  {
    workflowId: ADVENTURE_MODULE_ACTOR_FROM_PROMPT_WORKFLOW_ID,
    createDefinition: createAdventureModuleActorFromPromptWorkflow,
    defaultInputExample: adventureModuleActorFromPromptDefaultInputExample,
    inputSchemaJson: adventureModuleActorFromPromptInputSchemaJson,
    defaultModelOverrides: adventureModuleActorFromPromptDefaultModelOverrides,
  },
  {
    workflowId: "image_from_prose",
    createDefinition: createImageFromProseWorkflow,
    defaultInputExample: {
      prose: "A moonlit harbor where smugglers unload glowing crates while gulls circle above.",
      styleHint: "cinematic painterly fantasy",
    },
    inputSchemaJson: {
      type: "object",
      properties: {
        prose: { type: "string" },
        styleHint: { type: "string" },
      },
      required: ["prose"],
    },
  },
  {
    workflowId: "adventure_artifact_package",
    createDefinition: () => attachArtifactImageGenerationBehavior(createAdventureArtifactWorkflow()),
    defaultInputExample: {
      adventurePrompt:
        "A haunted sky-train crosses a storm wall. The crew must stop a saboteur before the train reaches a floating city.",
      styleGuide: "Pulp fantasy, mysterious but playful, short evocative prose.",
      maxArtifacts: 3,
      generateImages: true,
    },
    inputSchemaJson: {
      type: "object",
      properties: {
        adventurePrompt: { type: "string" },
        styleGuide: { type: "string" },
        maxArtifacts: { type: "number" },
        generateImages: { type: "boolean" },
      },
      required: ["adventurePrompt"],
    },
    defaultModelOverrides: {
      fast_image_model: "fal-ai/flux/schnell",
    },
  },
  {
    workflowId: "adventure_module_seed_scaffold",
    createDefinition: createAdventureModuleSeedScaffoldWorkflow,
    defaultInputExample: {
      seedPrompt:
        "A drowned observatory city bargains with memory merchants while flood sirens forecast collapse.",
      titleHint: "Siren Market at Drowned Glass",
      toneHint: "Tense but hopeful, with ethical tradeoffs.",
    },
    inputSchemaJson: {
      type: "object",
      properties: {
        seedPrompt: { type: "string" },
        titleHint: { type: "string" },
        toneHint: { type: "string" },
      },
      required: ["seedPrompt"],
    },
  },
  {
    workflowId: "adventure_module_brainstorm_options",
    createDefinition: createAdventureModuleBrainstormWorkflow,
    defaultInputExample: {
      target: "hooks",
      moduleTitle: "Siren Market at Drowned Glass",
      contextText:
        "Flood sirens, black-market memory trade, factions racing to secure evacuation routes.",
    },
    inputSchemaJson: {
      type: "object",
      properties: {
        target: { type: "string", enum: ["palette", "hooks", "tone", "setting", "summary"] },
        moduleTitle: { type: "string" },
        contextText: { type: "string" },
      },
      required: ["target", "contextText"],
    },
  },
  {
    workflowId: "adventure_module_expand_fragments",
    createDefinition: createAdventureModuleExpandWorkflow,
    defaultInputExample: {
      moduleTitle: "Siren Market at Drowned Glass",
      moduleSummary:
        "A one-night crisis in a flooded market city where memories are currency.",
      fragmentKinds: ["location", "actor", "encounter", "quest"],
      contextText: "Include one fail-forward branch in each expanded fragment.",
    },
    inputSchemaJson: {
      type: "object",
      properties: {
        moduleTitle: { type: "string" },
        moduleSummary: { type: "string" },
        fragmentKinds: { type: "array", items: { type: "string" } },
        contextText: { type: "string" },
      },
      required: ["moduleTitle", "moduleSummary", "fragmentKinds"],
    },
  },
  {
    workflowId: "adventure_module_polish_continuity",
    createDefinition: createAdventureModulePolishWorkflow,
    defaultInputExample: {
      moduleTitle: "Siren Market at Drowned Glass",
      fragments: [
        {
          fragmentId: "frag-location-main",
          title: "Flood Bazaar",
          content:
            "The flood bazaar is loud, smoke-lit, and unstable. Factions clash over evacuation manifests.",
        },
      ],
      styleHint: "Keep prose concrete and table-usable.",
    },
    inputSchemaJson: {
      type: "object",
      properties: {
        moduleTitle: { type: "string" },
        fragments: {
          type: "array",
          items: {
            type: "object",
            properties: {
              fragmentId: { type: "string" },
              title: { type: "string" },
              content: { type: "string" },
            },
            required: ["fragmentId", "title", "content"],
          },
        },
        styleHint: { type: "string" },
      },
      required: ["moduleTitle", "fragments"],
    },
  },
  {
    workflowId: "adventure_module_premise_make_changes",
    createDefinition: createAdventureModulePremiseMakeChangesWorkflow,
    defaultInputExample: {
      text: "A flooded market city where memory merchants trade escape routes.",
      instruction: "Add stronger urgency and a clear player-facing objective.",
    },
    inputSchemaJson: {
      type: "object",
      properties: {
        text: { type: "string" },
        instruction: { type: "string" },
        contextDescription: { type: "string" },
      },
      required: ["text", "instruction"],
    },
  },
  {
    workflowId: "adventure_module_premise_to_prose",
    createDefinition: createAdventureModulePremiseToProseWorkflow,
    defaultInputExample: {
      text: "- Flood sirens - collapsing districts - memory market factions",
    },
    inputSchemaJson: {
      type: "object",
      properties: {
        text: { type: "string" },
        contextDescription: { type: "string" },
      },
      required: ["text"],
    },
  },
  {
    workflowId: "adventure_module_premise_to_bullets",
    createDefinition: createAdventureModulePremiseToBulletsWorkflow,
    defaultInputExample: {
      text: "A flood-struck city bargains away memories while sirens count down district collapse.",
    },
    inputSchemaJson: {
      type: "object",
      properties: {
        text: { type: "string" },
        contextDescription: { type: "string" },
      },
      required: ["text"],
    },
  },
  {
    workflowId: "adventure_module_premise_expand",
    createDefinition: createAdventureModulePremiseExpandWorkflow,
    defaultInputExample: {
      text: "A flood market city trades memories while factions race to control evacuation sirens.",
      percent: 20,
    },
    inputSchemaJson: {
      type: "object",
      properties: {
        text: { type: "string" },
        percent: { type: "number" },
        contextDescription: { type: "string" },
      },
      required: ["text", "percent"],
    },
  },
  {
    workflowId: "adventure_module_premise_compact",
    createDefinition: createAdventureModulePremiseCompactWorkflow,
    defaultInputExample: {
      text: "A flood market city trades memories while factions race to control evacuation sirens and exploit panic.",
      percent: 20,
    },
    inputSchemaJson: {
      type: "object",
      properties: {
        text: { type: "string" },
        percent: { type: "number" },
        contextDescription: { type: "string" },
      },
      required: ["text", "percent"],
    },
  },
];

export type { WorkflowDefinitionRegistration };
