import type {
  AiRequestAgent,
  AiRequestStatus,
  RuntimeConfig,
  SceneDebug,
  ScenePublic,
  TranscriptEntry,
} from "@mighty-decks/spec/adventureState";
import type { PromptKey, PromptTemplateMap } from "@mighty-decks/spec/prompts";
import { defaultPromptTemplates } from "@mighty-decks/spec/prompts";
import { z } from "zod";
import { OpenRouterClient } from "./OpenRouterClient";

export interface StorytellerModelConfig {
  narrativeDirector: string;
  narrativeDirectorFallback: string;
  sceneController: string;
  sceneControllerFallback: string;
  continuityKeeper: string;
  continuityKeeperFallback: string;
  pitchGenerator: string;
  pitchGeneratorFallback: string;
  imageGenerator: string;
  imageGeneratorFallback?: string;
}

export interface StorytellerServiceOptions {
  openRouterClient: OpenRouterClient;
  models: StorytellerModelConfig;
  promptTemplates?: Partial<PromptTemplateMap>;
  onAiRequest?: (entry: AiRequestDebugEvent) => void;
}

export interface StorytellerRequestContext {
  adventureId: string;
}

export interface AiRequestDebugEvent {
  requestId: string;
  createdAtIso: string;
  adventureId: string;
  agent: AiRequestAgent;
  kind: "text" | "image";
  model: string;
  timeoutMs: number;
  attempt: number;
  fallback: boolean;
  status: AiRequestStatus;
  prompt?: string;
  response?: string;
  error?: string;
}

export interface PitchInput {
  displayName: string;
  characterName: string;
  visualDescription: string;
  adventurePreference: string;
}

export interface PitchOption {
  title: string;
  description: string;
}

export interface SceneStartInput {
  pitchTitle: string;
  pitchDescription: string;
  sceneNumber: number;
  previousSceneSummary?: string;
  partyMembers: string[];
  transcriptTail: TranscriptEntry[];
}

export interface SceneStartResult {
  introProse: string;
  orientationBullets: string[];
  playerPrompt: string;
  debug: SceneDebug;
}

export interface ContinuityResult {
  rollingSummary: string;
  continuityWarnings: string[];
}

export interface ActionResponseInput {
  pitchTitle: string;
  pitchDescription: string;
  actorCharacterName: string;
  actionText: string;
  turnNumber: number;
  scene: ScenePublic;
  transcriptTail: TranscriptEntry[];
  rollingSummary: string;
}

export interface ActionResponseResult {
  text: string;
  closeScene: boolean;
  sceneSummary?: string;
  debug: SceneDebug;
}

interface TextModelRequest {
  agent: AiRequestAgent;
  primaryModel: string;
  fallbackModel: string;
  prompt: string;
  runtimeConfig: RuntimeConfig;
  maxTokens: number;
  temperature: number;
  context?: StorytellerRequestContext;
}

const pitchArraySchema = z
  .array(
    z.object({
      title: z.string().min(1).max(100),
      description: z.string().min(1).max(400),
    }),
  )
  .min(2)
  .max(3);

const sceneStartSchema = z.object({
  introProse: z.string().min(1).max(700),
  orientationBullets: z.array(z.string().min(1).max(160)).min(2).max(4),
  playerPrompt: z.string().min(1).max(320),
  tension: z.number().min(0).max(100).optional(),
  secrets: z.array(z.string()).optional(),
  pacingNotes: z.array(z.string()).optional(),
  continuityWarnings: z.array(z.string()).optional(),
});

const continuitySchema = z.object({
  rollingSummary: z.string().min(1).max(1000),
  continuityWarnings: z.array(z.string()).default([]),
});

const actionResponseSchema = z.object({
  text: z.string().min(1).max(900),
  closeScene: z.boolean(),
  sceneSummary: z.string().max(500).optional(),
  tension: z.number().min(0).max(100).optional(),
  secrets: z.array(z.string()).optional(),
  pacingNotes: z.array(z.string()).optional(),
  continuityWarnings: z.array(z.string()).optional(),
});

const trimLines = (value: string): string =>
  value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");

const AI_DEBUG_AUTHOR = "AI Debug";

const compactTranscript = (entries: TranscriptEntry[]): string =>
  entries
    .filter(
      (entry) => !(entry.kind === "system" && entry.author === AI_DEBUG_AUTHOR),
    )
    .slice(-8)
    .map((entry) => `${entry.kind}:${entry.author}: ${entry.text}`)
    .join("\n");

const DEFAULT_ORIENTATION_BULLETS = [
  "Goal: establish a concrete advantage before the situation worsens.",
  "Pressure: complications escalate if the group hesitates.",
  "Exits: risky direct move, careful investigation, or negotiated detour.",
];

const extractJsonCandidate = (raw: string): string | null => {
  const trimmed = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return trimmed;
  }

  const objectStart = trimmed.indexOf("{");
  const objectEnd = trimmed.lastIndexOf("}");
  if (objectStart >= 0 && objectEnd > objectStart) {
    return trimmed.slice(objectStart, objectEnd + 1);
  }

  const arrayStart = trimmed.indexOf("[");
  const arrayEnd = trimmed.lastIndexOf("]");
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    return trimmed.slice(arrayStart, arrayEnd + 1);
  }

  return null;
};

const createRequestId = (): string =>
  `ai-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const shorten = (value: string, maxLength: number): string =>
  value.length <= maxLength ? value : `${value.slice(0, maxLength)}...`;

const normalizeLabel = (value: string): string =>
  value.toLowerCase().replace(/[\s_-]/g, "");

const uniqueStrings = (values: string[]): string[] => {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const trimmed = trimLines(value);
    if (trimmed.length === 0 || seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    output.push(trimmed);
  }

  return output;
};

const parseInlineStringArray = (rawValue: string): string[] => {
  const trimmed = rawValue.trim();
  if (trimmed.length === 0) {
    return [];
  }

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (item): item is string => typeof item === "string",
        );
      }
    } catch {
      // Continue with plain-text parsing below.
    }
  }

  const splitCandidates = [" | ", "; "];
  for (const separator of splitCandidates) {
    if (trimmed.includes(separator)) {
      return trimmed
        .split(separator)
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }
  }

  return [trimmed];
};

interface LooseSceneStart {
  introProse?: string;
  orientationBullets?: string[];
  playerPrompt?: string;
  tension?: number;
  secrets?: string[];
  pacingNotes?: string[];
  continuityWarnings?: string[];
}

const parseLooseSceneStart = (raw: string): LooseSceneStart | null => {
  const cleaned = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  if (cleaned.length === 0) {
    return null;
  }

  const lines = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const introParts: string[] = [];
  const orientationBullets: string[] = [];
  const playerPromptParts: string[] = [];
  const secrets: string[] = [];
  const pacingNotes: string[] = [];
  const continuityWarnings: string[] = [];
  let tension: number | undefined;
  let section:
    | "introProse"
    | "orientationBullets"
    | "playerPrompt"
    | "secrets"
    | "pacingNotes"
    | "continuityWarnings"
    | null = null;

  for (const line of lines) {
    const keyMatch = line.match(/^([A-Za-z][A-Za-z0-9 _-]*):\s*(.*)$/);
    if (keyMatch) {
      const label = normalizeLabel(keyMatch[1] ?? "");
      const value = keyMatch[2]?.trim() ?? "";

      if (label === "introprose") {
        section = "introProse";
        if (value.length > 0) {
          introParts.push(value);
        }
        continue;
      }

      if (label === "orientationbullets") {
        section = "orientationBullets";
        orientationBullets.push(...parseInlineStringArray(value));
        continue;
      }

      if (
        label === "playerprompt" ||
        label === "actionprompt" ||
        label === "playeractionprompt"
      ) {
        section = "playerPrompt";
        if (value.length > 0) {
          playerPromptParts.push(value);
        }
        continue;
      }

      if (label === "tension") {
        section = null;
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
          tension = Math.max(0, Math.min(100, parsed));
        }
        continue;
      }

      if (label === "secrets") {
        section = "secrets";
        secrets.push(...parseInlineStringArray(value));
        continue;
      }

      if (label === "pacingnotes") {
        section = "pacingNotes";
        pacingNotes.push(...parseInlineStringArray(value));
        continue;
      }

      if (label === "continuitywarnings") {
        section = "continuityWarnings";
        continuityWarnings.push(...parseInlineStringArray(value));
        continue;
      }
    }

    const listLine = line
      .replace(/^[-*]\s+/, "")
      .replace(/^\d+\.\s+/, "")
      .trim();
    if (listLine.length === 0) {
      continue;
    }

    if (section === "orientationBullets") {
      orientationBullets.push(listLine);
      continue;
    }

    if (section === "playerPrompt") {
      playerPromptParts.push(listLine);
      continue;
    }

    if (section === "secrets") {
      secrets.push(listLine);
      continue;
    }

    if (section === "pacingNotes") {
      pacingNotes.push(listLine);
      continue;
    }

    if (section === "continuityWarnings") {
      continuityWarnings.push(listLine);
      continue;
    }

    if (section === "introProse") {
      introParts.push(listLine);
    }
  }

  const introProse = trimLines(introParts.join("\n")).slice(0, 700);
  const normalizedBullets = uniqueStrings(orientationBullets).slice(0, 4);
  const playerPrompt = trimLines(playerPromptParts.join("\n")).slice(0, 320);
  const normalizedSecrets = uniqueStrings(secrets);
  const normalizedPacingNotes = uniqueStrings(pacingNotes);
  const normalizedContinuityWarnings = uniqueStrings(continuityWarnings);

  if (introProse.length === 0 && normalizedBullets.length === 0) {
    return null;
  }

  return {
    introProse: introProse.length > 0 ? introProse : undefined,
    orientationBullets: normalizedBullets,
    playerPrompt: playerPrompt.length > 0 ? playerPrompt : undefined,
    tension,
    secrets: normalizedSecrets,
    pacingNotes: normalizedPacingNotes,
    continuityWarnings: normalizedContinuityWarnings,
  };
};

const buildFallbackScenePlayerPrompt = (partyMembers: string[]): string => {
  const namedParty = partyMembers
    .map((member) => member.trim())
    .filter((member) => member.length > 0)
    .slice(0, 5);
  const partyHint = namedParty.length > 0 ? ` (${namedParty.join(", ")})` : "";
  return `Each player${partyHint}, state why your character cares about this scene, then take one concrete action now.`;
};

const normalizeImagePrompt = (raw: string): string =>
  trimLines(
    raw
      .replace(/^prompt\s*:\s*/i, "")
      .replace(/^```(?:text)?/i, "")
      .replace(/```$/i, ""),
  ).slice(0, 900);

const isPermanentImageFailure = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  return /Image request failed \(4\d\d /.test(error.message);
};

const isModeratedImageFailure = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  return /Request Moderated/i.test(error.message);
};

const buildFallbackImagePrompt = (scene: ScenePublic): string => {
  const bulletHints = scene.orientationBullets.slice(0, 3).join(" ");
  const summaryHint = scene.summary
    ? `Resolution moment: ${scene.summary}`
    : "";
  return trimLines(
    [
      "Cinematic fantasy illustration, no text overlay, no logo, no watermark.",
      `Primary moment: ${scene.introProse}`,
      summaryHint,
      `Scene cues: ${bulletHints}`,
      "Moody volumetric lighting, rich environmental detail, dynamic composition, painterly realism.",
    ].join(" "),
  ).slice(0, 900);
};

const toDebugState = (source: {
  tension?: number;
  secrets?: string[];
  pacingNotes?: string[];
  continuityWarnings?: string[];
}): SceneDebug => ({
  tension: source.tension,
  secrets: source.secrets ?? [],
  pacingNotes: source.pacingNotes ?? [],
  continuityWarnings: source.continuityWarnings ?? [],
  aiRequests: [],
});

export class StorytellerService {
  private readonly promptTemplates: PromptTemplateMap;

  public constructor(private readonly options: StorytellerServiceOptions) {
    this.promptTemplates = {
      ...defaultPromptTemplates,
      ...(options.promptTemplates ?? {}),
    };
  }

  public async generateAdventurePitches(
    inputs: PitchInput[],
    runtimeConfig: RuntimeConfig,
    context?: StorytellerRequestContext,
  ): Promise<PitchOption[]> {
    const prompt = this.composePrompt("pitch_generator", [
      "You are the Pitch Generator for a GM-less adventure game.",
      "Return JSON only as an array with 3 distinct exciting adventure pitches.",
      "Each item must have: title, description.",
      "Description must be one concise paragraph under 240 characters including what is the player characters' role in the scene and why they care.",
      "Keep pitches distinct and one-session scoped.",
      "Player setup inputs:",
      ...inputs.map(
        (input, index) =>
          `${index + 1}. ${input.displayName} as ${input.characterName} | description: ${input.visualDescription || "none"} | preference: ${input.adventurePreference || "none"}`,
      ),
    ]);

    const modelText = await this.callTextModel({
      agent: "pitch_generator",
      primaryModel: this.options.models.pitchGenerator,
      fallbackModel: this.options.models.pitchGeneratorFallback,
      prompt,
      runtimeConfig,
      maxTokens: 500,
      temperature: 0.8,
      context,
    });

    if (modelText) {
      const parsed = this.parseJson(modelText, pitchArraySchema);
      if (parsed) {
        return parsed.map((item) => ({
          title: item.title.trim(),
          description: trimLines(item.description).slice(0, 400),
        }));
      }
    }

    return this.buildFallbackPitches(inputs);
  }

  public async generateSceneStart(
    input: SceneStartInput,
    runtimeConfig: RuntimeConfig,
    context?: StorytellerRequestContext,
  ): Promise<SceneStartResult> {
    const prompt = this.composePrompt("scene_controller", [
      "You are the Scene Controller for a text-first adventure game.",
      "Return JSON only with keys:",
      "introProse: string",
      "orientationBullets: string[2-4]",
      "playerPrompt: string",
      "tension: number 0-100",
      "secrets: string[]",
      "pacingNotes: string[]",
      "continuityWarnings: string[]",
      `Pitch title: ${input.pitchTitle}`,
      `Pitch description: ${input.pitchDescription}`,
      `Scene number: ${input.sceneNumber}`,
      `Previous scene summary: ${input.previousSceneSummary ?? "none"}`,
      `Party members: ${input.partyMembers.join(", ") || "unknown"}`,
      "Recent transcript:",
      compactTranscript(input.transcriptTail) || "none",
      "Keep intro prose under 90 words and orientation bullets under 18 words each.",
      "Do not output labels like 'Scene 1' or any session-level summary language.",
      "playerPrompt must ask players to act now and name why their characters want to get involved.",
      "Keep playerPrompt under 45 words.",
    ]);

    const modelText = await this.callTextModel({
      agent: "scene_controller",
      primaryModel: this.options.models.sceneController,
      fallbackModel: this.options.models.sceneControllerFallback,
      prompt,
      runtimeConfig,
      maxTokens: 650,
      temperature: 0.7,
      context,
    });

    if (modelText) {
      const parsed = this.parseJson(modelText, sceneStartSchema);
      if (parsed) {
        return {
          introProse: trimLines(parsed.introProse),
          orientationBullets: parsed.orientationBullets
            .map((bullet) => bullet.trim())
            .slice(0, 4),
          playerPrompt: trimLines(parsed.playerPrompt),
          debug: toDebugState(parsed),
        };
      }

      const looseParsed = parseLooseSceneStart(modelText);
      if (looseParsed?.introProse) {
        return {
          introProse: looseParsed.introProse,
          orientationBullets:
            looseParsed.orientationBullets &&
            looseParsed.orientationBullets.length >= 2
              ? looseParsed.orientationBullets
              : DEFAULT_ORIENTATION_BULLETS,
          playerPrompt:
            looseParsed.playerPrompt ??
            buildFallbackScenePlayerPrompt(input.partyMembers),
          debug: toDebugState(looseParsed),
        };
      }
    }

    const previousSummary = input.previousSceneSummary
      ? ` After ${input.previousSceneSummary.toLowerCase()}, the pressure shifts but does not break.`
      : "";

    return {
      introProse: `${input.pitchTitle} opens in a strained moment: ${input.pitchDescription}${previousSummary}`,
      orientationBullets: DEFAULT_ORIENTATION_BULLETS,
      playerPrompt: buildFallbackScenePlayerPrompt(input.partyMembers),
      debug: {
        tension: 52,
        secrets: ["A reliable ally is withholding one crucial detail."],
        pacingNotes: ["Offer one hard choice within the next two turns."],
        continuityWarnings: [],
        aiRequests: [],
      },
    };
  }

  public async updateContinuity(
    transcript: TranscriptEntry[],
    runtimeConfig: RuntimeConfig,
    context?: StorytellerRequestContext,
  ): Promise<ContinuityResult> {
    const prompt = this.composePrompt("continuity_keeper", [
      "You are the Continuity Keeper for a multiplayer story session.",
      "Return JSON only with keys:",
      "rollingSummary: string (<= 140 words)",
      "continuityWarnings: string[]",
      "Do not invent facts. Compress only what is already in transcript.",
      "Transcript:",
      compactTranscript(transcript) || "none",
    ]);

    const modelText = await this.callTextModel({
      agent: "continuity_keeper",
      primaryModel: this.options.models.continuityKeeper,
      fallbackModel: this.options.models.continuityKeeperFallback,
      prompt,
      runtimeConfig,
      maxTokens: 350,
      temperature: 0.3,
      context,
    });

    if (modelText) {
      const parsed = this.parseJson(modelText, continuitySchema);
      if (parsed) {
        return {
          rollingSummary: trimLines(parsed.rollingSummary),
          continuityWarnings: parsed.continuityWarnings ?? [],
        };
      }
    }

    const fallback = transcript
      .slice(-5)
      .map((entry) => `${entry.author}: ${entry.text}`)
      .join(" | ");

    return {
      rollingSummary:
        fallback.length > 0
          ? fallback
          : "The adventure has begun but no lasting facts are recorded yet.",
      continuityWarnings: [],
    };
  }

  public async narrateAction(
    input: ActionResponseInput,
    runtimeConfig: RuntimeConfig,
    context?: StorytellerRequestContext,
  ): Promise<ActionResponseResult> {
    const prompt = this.composePrompt("narrative_director", [
      "You are the Narrative Director for a GM-less story game.",
      "You are an external narrator, never a character in the scene.",
      "Respond in concise, fail-forward prose.",
      "Never speak in first person as any player character.",
      "Do not roleplay dialogue as the acting player character.",
      "Keep player characters in third-person narration by their exact names.",
      "Return JSON only with keys:",
      "text: string",
      "closeScene: boolean",
      "sceneSummary?: string when closeScene is true",
      "closeScene means only this scene is complete; it does not end the session.",
      "If closeScene is true, sceneSummary must summarize this scene only in 1-2 sentences.",
      "Never output session summaries or labels like 'Scene 1'/'Scene 2'/'Session Summary'.",
      "tension?: number 0-100",
      "secrets?: string[]",
      "pacingNotes?: string[]",
      "continuityWarnings?: string[]",
      `Pitch title: ${input.pitchTitle}`,
      `Pitch description: ${input.pitchDescription}`,
      `Scene intro: ${input.scene.introProse}`,
      `Acting player character: ${input.actorCharacterName}`,
      `Turn number in scene: ${input.turnNumber}`,
      `Rolling continuity summary: ${input.rollingSummary}`,
      `Player action: ${input.actionText}`,
      "Recent transcript:",
      compactTranscript(input.transcriptTail) || "none",
      "Keep text under 120 words.",
    ]);

    const modelText = await this.callTextModel({
      agent: "narrative_director",
      primaryModel: this.options.models.narrativeDirector,
      fallbackModel: this.options.models.narrativeDirectorFallback,
      prompt,
      runtimeConfig,
      maxTokens: 550,
      temperature: 0.75,
      context,
    });

    if (modelText) {
      const parsed = this.parseJson(modelText, actionResponseSchema);
      if (parsed) {
        return {
          text: trimLines(parsed.text),
          closeScene: parsed.closeScene,
          sceneSummary: parsed.sceneSummary
            ? trimLines(parsed.sceneSummary)
            : undefined,
          debug: toDebugState(parsed),
        };
      }
    }

    const lowerAction = input.actionText.toLowerCase();
    const keywordClose = [
      "end scene",
      "wrap up",
      "move on",
      "next scene",
      "leave",
    ].some((token) => lowerAction.includes(token));
    const shouldClose = keywordClose || input.turnNumber >= 3;
    const responseText = `You commit to the move. ${input.actionText} shifts the scene decisively, revealing a new consequence and a clear next choice for the group.`;

    return {
      text: responseText,
      closeScene: shouldClose,
      sceneSummary: shouldClose
        ? "The group changed the situation and uncovered a new direction, forcing a decision about what to tackle next."
        : undefined,
      debug: {
        tension: Math.min(85, 45 + input.turnNumber * 10),
        secrets: [],
        pacingNotes: shouldClose
          ? ["Trigger transition vote now that the scene question is resolved."]
          : ["Escalate external pressure on the next response."],
        continuityWarnings: [],
        aiRequests: [],
      },
    };
  }

  public async summarizeSession(
    transcript: TranscriptEntry[],
    runtimeConfig: RuntimeConfig,
    context?: StorytellerRequestContext,
  ): Promise<string> {
    const prompt = this.composePrompt("scene_controller", [
      "Write a concise end-of-session summary in 4-6 sentences.",
      "Focus on what the players attempted, what changed, and unresolved threads.",
      "Avoid bullet points.",
      "Transcript:",
      compactTranscript(transcript),
    ]);

    const modelText = await this.callTextModel({
      agent: "scene_controller",
      primaryModel: this.options.models.sceneController,
      fallbackModel: this.options.models.sceneControllerFallback,
      prompt,
      runtimeConfig,
      maxTokens: 500,
      temperature: 0.6,
      context,
    });

    if (modelText) {
      return trimLines(modelText).slice(0, 900);
    }

    const storytellerLines = transcript
      .filter((entry) => entry.kind === "storyteller")
      .slice(-3)
      .map((entry) => entry.text);
    if (storytellerLines.length > 0) {
      return storytellerLines.join(" ");
    }

    return "The session closed before a full arc formed, but the table established characters, shared stakes, and a direction worth revisiting.";
  }

  public async generateSceneImage(
    scene: ScenePublic,
    runtimeConfig: RuntimeConfig,
    context?: StorytellerRequestContext,
  ): Promise<string | null> {
    if (!this.options.openRouterClient.hasApiKey()) {
      if (context) {
        this.emitAiRequest({
          adventureId: context.adventureId,
          requestId: createRequestId(),
          createdAtIso: new Date().toISOString(),
          agent: "image_generator",
          kind: "image",
          model: this.options.models.imageGenerator,
          timeoutMs: runtimeConfig.imageTimeoutMs,
          attempt: 1,
          fallback: false,
          status: "failed",
          error: "OpenRouter API key missing.",
        });
      }
      return null;
    }

    const prompt = await this.buildSceneImagePrompt(
      scene,
      runtimeConfig,
      context,
    );

    const attempts = Math.max(1, runtimeConfig.aiRetryCount + 1);
    const models = [
      this.options.models.imageGenerator,
      this.options.models.imageGeneratorFallback,
    ].filter(
      (model, index, allModels): model is string =>
        Boolean(model) && allModels.indexOf(model) === index,
    );
    const primaryModel = this.options.models.imageGenerator;

    for (const model of models) {
      const useFallbackModel = model !== primaryModel;
      for (let attempt = 0; attempt < attempts; attempt += 1) {
        const requestId = createRequestId();
        const createdAtIso = new Date().toISOString();
        if (context) {
          this.emitAiRequest({
            adventureId: context.adventureId,
            requestId,
            createdAtIso,
            agent: "image_generator",
            kind: "image",
            model,
            timeoutMs: runtimeConfig.imageTimeoutMs,
            attempt: attempt + 1,
            fallback: useFallbackModel,
            status: "started",
            prompt,
          });
        }

        try {
          const imageUrl = await this.options.openRouterClient.generateImage({
            model,
            prompt,
            timeoutMs: runtimeConfig.imageTimeoutMs,
          });
          if (imageUrl) {
            if (context) {
              this.emitAiRequest({
                adventureId: context.adventureId,
                requestId,
                createdAtIso,
                agent: "image_generator",
                kind: "image",
                model,
                timeoutMs: runtimeConfig.imageTimeoutMs,
                attempt: attempt + 1,
                fallback: useFallbackModel,
                status: "succeeded",
                response: imageUrl,
              });
            }
            return imageUrl;
          }

          if (context) {
            this.emitAiRequest({
              adventureId: context.adventureId,
              requestId,
              createdAtIso,
              agent: "image_generator",
              kind: "image",
              model,
              timeoutMs: runtimeConfig.imageTimeoutMs,
              attempt: attempt + 1,
              fallback: useFallbackModel,
              status: "failed",
              error: "No image returned by provider.",
            });
          }
        } catch (error) {
          if (context) {
            const isTimeout =
              error instanceof Error && error.name === "AbortError";
            this.emitAiRequest({
              adventureId: context.adventureId,
              requestId,
              createdAtIso,
              agent: "image_generator",
              kind: "image",
              model,
              timeoutMs: runtimeConfig.imageTimeoutMs,
              attempt: attempt + 1,
              fallback: useFallbackModel,
              status: isTimeout ? "timeout" : "failed",
              error:
                error instanceof Error
                  ? error.message
                  : "Unknown image request error.",
            });
          }

          if (isModeratedImageFailure(error) && !useFallbackModel) {
            // Moderation on the primary model should jump directly to fallback model.
            break;
          }

          if (isPermanentImageFailure(error)) {
            return null;
          }
        }
      }
    }

    return null;
  }

  private async callTextModel(
    request: TextModelRequest,
  ): Promise<string | null> {
    if (!this.options.openRouterClient.hasApiKey()) {
      if (request.context) {
        this.emitAiRequest({
          adventureId: request.context.adventureId,
          requestId: createRequestId(),
          createdAtIso: new Date().toISOString(),
          agent: request.agent,
          kind: "text",
          model: request.primaryModel,
          timeoutMs: request.runtimeConfig.textCallTimeoutMs,
          attempt: 1,
          fallback: false,
          status: "failed",
          error: "OpenRouter API key missing.",
        });
      }
      return null;
    }

    const attempts = Math.max(1, request.runtimeConfig.aiRetryCount + 1);
    const models = [request.primaryModel, request.fallbackModel].filter(
      (model, index, allModels) => allModels.indexOf(model) === index,
    );

    for (const model of models) {
      for (let attempt = 0; attempt < attempts; attempt += 1) {
        const requestId = createRequestId();
        const createdAtIso = new Date().toISOString();
        if (request.context) {
          this.emitAiRequest({
            adventureId: request.context.adventureId,
            requestId,
            createdAtIso,
            agent: request.agent,
            kind: "text",
            model,
            timeoutMs: request.runtimeConfig.textCallTimeoutMs,
            attempt: attempt + 1,
            fallback: model !== request.primaryModel,
            status: "started",
            prompt: request.prompt,
          });
        }

        try {
          const output = await this.options.openRouterClient.completeText({
            model,
            prompt: request.prompt,
            timeoutMs: request.runtimeConfig.textCallTimeoutMs,
            maxTokens: request.maxTokens,
            temperature: request.temperature,
          });
          if (output && output.trim().length > 0) {
            if (request.context) {
              this.emitAiRequest({
                adventureId: request.context.adventureId,
                requestId,
                createdAtIso,
                agent: request.agent,
                kind: "text",
                model,
                timeoutMs: request.runtimeConfig.textCallTimeoutMs,
                attempt: attempt + 1,
                fallback: model !== request.primaryModel,
                status: "succeeded",
                response: shorten(output.trim(), 1800),
              });
            }
            return output.trim();
          }

          if (request.context) {
            this.emitAiRequest({
              adventureId: request.context.adventureId,
              requestId,
              createdAtIso,
              agent: request.agent,
              kind: "text",
              model,
              timeoutMs: request.runtimeConfig.textCallTimeoutMs,
              attempt: attempt + 1,
              fallback: model !== request.primaryModel,
              status: "failed",
              error: "No text returned by provider.",
            });
          }
        } catch (error) {
          if (request.context) {
            const isTimeout =
              error instanceof Error && error.name === "AbortError";
            this.emitAiRequest({
              adventureId: request.context.adventureId,
              requestId,
              createdAtIso,
              agent: request.agent,
              kind: "text",
              model,
              timeoutMs: request.runtimeConfig.textCallTimeoutMs,
              attempt: attempt + 1,
              fallback: model !== request.primaryModel,
              status: isTimeout ? "timeout" : "failed",
              error:
                error instanceof Error
                  ? error.message
                  : "Unknown text request error.",
            });
          }
        }
      }
    }

    return null;
  }

  private async buildSceneImagePrompt(
    scene: ScenePublic,
    runtimeConfig: RuntimeConfig,
    context?: StorytellerRequestContext,
  ): Promise<string> {
    const prompt = this.composePrompt("image_generator", [
      "You craft high-quality visual prompts for FLUX image generation.",
      "Return plain text only as one continuous prompt, 45-90 words.",
      "Include subject, environment, mood, lighting, composition, and camera framing.",
      "Avoid dialogue, game terms, markdown, JSON, bullet points, and field labels.",
      "Do not include text overlays, UI elements, logos, or watermarks.",
      `Scene intro: ${scene.introProse}`,
      scene.summary ? `Scene resolution: ${scene.summary}` : "",
      ...scene.orientationBullets.map((bullet) => `Scene cue: ${bullet}`),
    ]);

    const modelText = await this.callTextModel({
      agent: "scene_controller",
      primaryModel: this.options.models.sceneController,
      fallbackModel: this.options.models.sceneControllerFallback,
      prompt,
      runtimeConfig,
      maxTokens: 260,
      temperature: 0.4,
      context,
    });

    if (!modelText) {
      return buildFallbackImagePrompt(scene);
    }

    const normalized = normalizeImagePrompt(modelText);
    if (normalized.length < 24) {
      return buildFallbackImagePrompt(scene);
    }

    return normalized;
  }

  private parseJson<T>(raw: string, schema: z.ZodType<T>): T | null {
    const candidate = extractJsonCandidate(raw);
    if (!candidate) {
      return null;
    }

    try {
      const parsed = JSON.parse(candidate) as unknown;
      return schema.parse(parsed);
    } catch {
      return null;
    }
  }

  private composePrompt(templateKey: PromptKey, sections: string[]): string {
    return [this.promptTemplates[templateKey], ...sections]
      .map((section) => section.trim())
      .filter((section) => section.length > 0)
      .join("\n");
  }

  private emitAiRequest(entry: AiRequestDebugEvent): void {
    this.options.onAiRequest?.(entry);
  }

  private buildFallbackPitches(inputs: PitchInput[]): PitchOption[] {
    const preferenceHints = inputs
      .map((input) => input.adventurePreference.trim())
      .filter((value) => value.length > 0);
    const mergedHint =
      preferenceHints[0] ?? "tense mystery with escalating pressure";

    return [
      {
        title: "The Salt Clock",
        description: `A coastal city loses its tidal heartbeat overnight. The party must restore the clock before dawn while rival crews exploit the chaos. Tone hint: ${mergedHint}.`,
      },
      {
        title: "Ash Market",
        description:
          "At a midnight bazaar where memories are currency, someone is buying tomorrow's disasters in advance. The party must uncover who profits before the district burns.",
      },
      {
        title: "Lanterns Below",
        description:
          "An underground rail line starts delivering empty trains with fresh mud and unknown symbols. The party descends to trace the route before the next departure arrives occupied.",
      },
    ];
  }
}
