import { createHash } from "node:crypto";
import { z } from "zod";
import type {
  RuntimeConfig,
  ScenePublic,
  TranscriptEntry,
} from "@mighty-decks/spec/adventureState";
import {
  buildFallbackImagePrompt,
  buildFallbackPitches,
  buildFallbackScenePlayerPrompt,
  DEFAULT_ORIENTATION_BULLETS,
  normalizeImagePrompt,
  toDebugState,
} from "./storyteller/fallbacks";
import {
  createAiRequestId,
  runImageModelRequest,
  runTextModelRequest,
} from "./storyteller/modelRunners";
import {
  decideOutcomeCheckByHeuristic,
  refineModelOutcomeDecision,
} from "./storyteller/outcomeHeuristics";
import {
  parseJson,
  parseLooseActionResponse,
  parseLooseOutcomeCheckDecision,
  parseLooseSceneReaction,
  parseLooseSceneStart,
} from "./storyteller/parsers";
import {
  buildAdventurePitchesPrompt,
  buildContinuityPrompt,
  buildMetagameQuestionPrompt,
  buildNarrateActionPrompt,
  buildOutcomeCheckPrompt,
  buildSceneReactionPrompt,
  buildSceneImagePromptRequest,
  buildSessionForwardHookPrompt,
  buildSceneStartPrompt,
  buildSessionSummaryPrompt,
} from "./storyteller/promptBuilders";
import {
  defaultPromptTemplates,
  type PromptTemplateMap,
} from "./storyteller/prompts";
import {
  actionResponseSchema,
  continuitySchema,
  outcomeCheckDecisionSchema,
  pitchArraySchema,
  sceneReactionSchema,
  sceneStartSchema,
} from "./storyteller/schemas";
import {
  getNarrativeTailForOutcomeDecision,
  trimLines,
} from "./storyteller/text";
import type {
  ActionResponseInput,
  ActionResponseResult,
  ContinuityResult,
  MetagameQuestionInput,
  NarrateActionOptions,
  OutcomeCheckDecisionInput,
  OutcomeCheckDecisionResult,
  PitchInput,
  PitchOption,
  SceneReactionInput,
  SceneReactionResult,
  SceneStartInput,
  SceneStartResult,
  StorytellerCostControls,
  StorytellerRequestContext,
  StorytellerServiceOptions,
  TextModelRequest,
} from "./storyteller/types";

export type {
  ActionResponseInput,
  ActionResponseResult,
  AiRequestDebugEvent,
  ContinuityResult,
  MetagameQuestionInput,
  NarrateActionOptions,
  OutcomeCheckDecisionInput,
  OutcomeCheckDecisionResult,
  PitchInput,
  PitchOption,
  SceneReactionInput,
  SceneReactionResult,
  SceneStartInput,
  SceneStartResult,
  StorytellerCostControls,
  StorytellerModelConfig,
  StorytellerRequestContext,
  StorytellerServiceOptions,
} from "./storyteller/types";

const clampTension = (value: number): number => Math.max(0, Math.min(100, value));
const hashCacheKey = (value: string): string =>
  createHash("sha1").update(value).digest("hex");
const normalizeCostControls = (
  controls: StorytellerCostControls | undefined,
): Required<StorytellerCostControls> => ({
  disableImageGeneration: controls?.disableImageGeneration ?? false,
  pitchCacheTtlMs: Math.max(0, controls?.pitchCacheTtlMs ?? 0),
  imageCacheTtlMs: Math.max(0, controls?.imageCacheTtlMs ?? 0),
});

const SCENE_START_SCHEMA_GUIDE = [
  "introProse: string",
  "orientationBullets: string[2-4]",
  "playerPrompt: string",
  "tension?: number 0-100",
  "secrets?: string[]",
  "pacingNotes?: string[]",
  "continuityWarnings?: string[]",
].join("\n");

const CONTINUITY_SCHEMA_GUIDE = [
  "rollingSummary: string",
  "continuityWarnings: string[]",
].join("\n");

const SCENE_REACTION_SCHEMA_GUIDE = [
  "npcBeat?: string",
  "consequence?: string",
  "reward?: string",
  "goalStatus: 'advanced' | 'completed' | 'blocked'",
  "failForward: boolean",
  "tensionShift: 'rise' | 'fall' | 'stable'",
  "tensionDelta: integer -35..35",
  "tensionBand?: 'low' | 'medium' | 'high'",
  "sceneMode?: 'low_tension' | 'high_tension'",
  "turnOrderRequired?: boolean",
  "closeScene: boolean",
  "sceneSummary?: string",
  "tension?: number 0-100",
  "tensionReason?: string",
  "reasoning?: string[]",
  "pacingNotes?: string[]",
  "continuityWarnings?: string[]",
].join("\n");

const OUTCOME_DECISION_SCHEMA_GUIDE = [
  "intent: 'information_request' | 'direct_action'",
  "detailLevel?: 'concise' | 'standard' | 'expanded'",
  "responseMode?: 'concise' | 'expanded'",
  "shouldCheck: boolean",
  "reason: string",
  "allowHardDenyWithoutOutcomeCheck: boolean",
  "hardDenyReason: string",
  "triggers: { threat: boolean, uncertainty: boolean, highReward: boolean }",
].join("\n");

const stripCodeFence = (raw: string): string =>
  raw
    .trim()
    .replace(/^```(?:json|markdown|md|text)?/i, "")
    .replace(/```$/i, "")
    .trim();

const extractJsonCandidate = (raw: string): string | null => {
  const cleaned = stripCodeFence(raw);
  if (cleaned.startsWith("{") || cleaned.startsWith("[")) {
    return cleaned;
  }

  const objectStart = cleaned.indexOf("{");
  const objectEnd = cleaned.lastIndexOf("}");
  if (objectStart >= 0 && objectEnd > objectStart) {
    return cleaned.slice(objectStart, objectEnd + 1);
  }

  const arrayStart = cleaned.indexOf("[");
  const arrayEnd = cleaned.lastIndexOf("]");
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    return cleaned.slice(arrayStart, arrayEnd + 1);
  }

  return null;
};

const formatZodIssuePath = (path: (string | number)[]): string => {
  if (path.length === 0) {
    return "$";
  }

  return path
    .map((segment) =>
      typeof segment === "number" ? `[${segment}]` : `.${segment}`,
    )
    .join("")
    .replace(/^\./, "");
};

const describeStructuredParseFailure = <T>(
  raw: string,
  schema: z.ZodType<T>,
): string => {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return "Response was empty.";
  }

  const candidate = extractJsonCandidate(raw);
  if (!candidate) {
    return "No JSON object or array was found in the response.";
  }

  try {
    const parsed = JSON.parse(candidate) as unknown;
    const validation = schema.safeParse(parsed);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      if (issue) {
        return `Schema validation failed at '${formatZodIssuePath(
          issue.path,
        )}': ${issue.message}`;
      }

      return "Schema validation failed.";
    }

    return "JSON parsed but did not match required schema.";
  } catch (error) {
    return error instanceof Error
      ? `JSON parse error: ${error.message}`
      : "JSON parse error.";
  }
};

const normalizeNarrativeText = (value: string): string =>
  trimLines(
    value
      .trim()
      .replace(/^```(?:markdown|md|text)?/i, "")
      .replace(/```$/i, "")
      .trim(),
  );

const looksJsonLike = (value: string): boolean => {
  const trimmed = value.trim();
  return (
    trimmed.startsWith("{") ||
    trimmed.startsWith("[") ||
    /^```json/i.test(trimmed)
  );
};

const buildSceneReactionFallback = (
  input: SceneReactionInput,
): SceneReactionResult => {
  return {
    goalStatus: "advanced",
    failForward: false,
    tensionShift: "stable",
    tensionDelta: 0,
    sceneMode: input.scene.mode,
    turnOrderRequired: input.scene.mode === "high_tension",
    tensionBand: input.scene.mode === "high_tension" ? "high" : "low",
    tension: clampTension(input.scene.tension),
    reasoning: [
      "Fallback reaction used because Scene Controller output was unavailable or unparsable.",
    ],
    closeScene: false,
    debug: {
      tension: clampTension(input.scene.tension),
      secrets: [],
      pacingNotes: ["Apply NPC agenda pressure every turn to keep momentum."],
      continuityWarnings: [],
      aiRequests: [],
      recentDecisions: [],
    },
  };
};

export class StorytellerService {
  private readonly options: StorytellerServiceOptions;
  private readonly promptTemplates: PromptTemplateMap;
  private readonly costControls: Required<StorytellerCostControls>;
  private readonly pitchCache = new Map<
    string,
    { expiresAtMs: number; value: PitchOption[] }
  >();
  private readonly imageCache = new Map<
    string,
    { expiresAtMs: number; value: string | null }
  >();

  public constructor(options: StorytellerServiceOptions) {
    this.options = options;
    this.promptTemplates = {
      ...defaultPromptTemplates,
      ...(options.promptTemplates ?? {}),
    };
    this.costControls = normalizeCostControls(options.costControls);
  }

  public async generateAdventurePitches(
    inputs: PitchInput[],
    runtimeConfig: RuntimeConfig,
    context?: StorytellerRequestContext,
  ): Promise<PitchOption[]> {
    const prompt = buildAdventurePitchesPrompt(this.promptTemplates, inputs);
    const pitchCacheKey = hashCacheKey(
      JSON.stringify({
        model: this.options.models.pitchGenerator,
        fallbackModel: this.options.models.pitchGeneratorFallback,
        prompt,
      }),
    );

    const cachedPitches = this.readFromCache(
      this.pitchCache,
      pitchCacheKey,
    );
    if (cachedPitches) {
      return cachedPitches.map((pitch) => ({ ...pitch }));
    }

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
      const parsed = parseJson(modelText, pitchArraySchema);
      if (parsed) {
        const generatedPitches = parsed.map((item) => ({
          title: item.title.trim(),
          description: trimLines(item.description).slice(0, 400),
        }));
        this.writeToCache(
          this.pitchCache,
          pitchCacheKey,
          generatedPitches,
          this.costControls.pitchCacheTtlMs,
        );
        return generatedPitches.map((pitch) => ({ ...pitch }));
      }
    }

    const fallbackPitches = buildFallbackPitches(inputs);
    this.writeToCache(
      this.pitchCache,
      pitchCacheKey,
      fallbackPitches,
      this.costControls.pitchCacheTtlMs,
    );
    return fallbackPitches.map((pitch) => ({ ...pitch }));
  }

  public async generateSceneStart(
    input: SceneStartInput,
    runtimeConfig: RuntimeConfig,
    context?: StorytellerRequestContext,
  ): Promise<SceneStartResult> {
    const prompt = buildSceneStartPrompt(this.promptTemplates, input);
    const parseSceneStart = (raw: string): SceneStartResult | null => {
      const parsed = parseJson(raw, sceneStartSchema);
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

      const looseParsed = parseLooseSceneStart(raw);
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

      return null;
    };

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
      const parsedResult = parseSceneStart(modelText);
      if (parsedResult) {
        return parsedResult;
      }

      const repairedText = await this.retryStructuredJsonOnce({
        agent: "scene_controller",
        primaryModel: this.options.models.sceneController,
        fallbackModel: this.options.models.sceneControllerFallback,
        runtimeConfig,
        maxTokens: 650,
        context,
        schemaGuide: SCENE_START_SCHEMA_GUIDE,
        parseError: describeStructuredParseFailure(modelText, sceneStartSchema),
        invalidResponse: modelText,
      });
      if (repairedText) {
        const repairedResult = parseSceneStart(repairedText);
        if (repairedResult) {
          return repairedResult;
        }
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
        recentDecisions: [],
      },
    };
  }

  public async updateContinuity(
    transcript: TranscriptEntry[],
    runtimeConfig: RuntimeConfig,
    context?: StorytellerRequestContext,
  ): Promise<ContinuityResult> {
    const prompt = buildContinuityPrompt(this.promptTemplates, transcript);
    const parseContinuity = (raw: string): ContinuityResult | null => {
      const parsed = parseJson(raw, continuitySchema);
      if (!parsed) {
        return null;
      }

      return {
        rollingSummary: trimLines(parsed.rollingSummary),
        continuityWarnings: parsed.continuityWarnings ?? [],
      };
    };

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
      const parsedResult = parseContinuity(modelText);
      if (parsedResult) {
        return parsedResult;
      }

      const repairedText = await this.retryStructuredJsonOnce({
        agent: "continuity_keeper",
        primaryModel: this.options.models.continuityKeeper,
        fallbackModel: this.options.models.continuityKeeperFallback,
        runtimeConfig,
        maxTokens: 350,
        context,
        schemaGuide: CONTINUITY_SCHEMA_GUIDE,
        parseError: describeStructuredParseFailure(modelText, continuitySchema),
        invalidResponse: modelText,
      });
      if (repairedText) {
        const repairedResult = parseContinuity(repairedText);
        if (repairedResult) {
          return repairedResult;
        }
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
    options?: NarrateActionOptions,
  ): Promise<ActionResponseResult> {
    const detailLevel =
      input.detailLevel ??
      (input.responseMode === "expanded" ? "expanded" : "standard");
    const prompt = buildNarrateActionPrompt(this.promptTemplates, input);
    const maxTokens =
      detailLevel === "expanded"
        ? 1100
        : detailLevel === "standard"
          ? 760
          : 550;

    const modelText = await this.callTextModel({
      agent: "narrative_director",
      primaryModel: this.options.models.narrativeDirector,
      fallbackModel: this.options.models.narrativeDirectorFallback,
      prompt,
      runtimeConfig,
      maxTokens,
      temperature: 0.75,
      context,
      onStreamChunk: options?.onChunk,
    });

    if (modelText) {
      const parsed = parseJson(modelText, actionResponseSchema);
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

      const looseParsed = parseLooseActionResponse(modelText);
      if (looseParsed?.text) {
        return {
          text: trimLines(looseParsed.text),
          closeScene: looseParsed.closeScene ?? false,
          sceneSummary: looseParsed.sceneSummary
            ? trimLines(looseParsed.sceneSummary)
            : undefined,
          debug: toDebugState(looseParsed),
        };
      }

      const narrativeText = normalizeNarrativeText(modelText);
      if (narrativeText.length > 0 && !looksJsonLike(modelText)) {
        return {
          text: narrativeText.slice(0, 1400),
          closeScene: false,
          sceneSummary: undefined,
          debug: {
            tension: clampTension(input.scene.tension),
            secrets: [],
            pacingNotes: [],
            continuityWarnings: [],
            aiRequests: [],
            recentDecisions: [],
          },
        };
      }
    }

    const responseText = input.responseMode === "expanded"
      ? `${input.actorCharacterName} presses for details and uncovers usable intelligence: one clear clue, one hidden pressure, and one immediate next move.`
      : `${input.actorCharacterName} commits to the action, shifting the situation and forcing an urgent follow-up choice.`;

    return {
      text: responseText,
      closeScene: false,
      sceneSummary: undefined,
      debug: {
        tension: Math.min(85, 45 + input.turnNumber * 10),
        secrets: [],
        pacingNotes: ["Escalate external pressure on the next response."],
        continuityWarnings: [],
        aiRequests: [],
        recentDecisions: [],
      },
    };
  }

  public async resolveSceneReaction(
    input: SceneReactionInput,
    runtimeConfig: RuntimeConfig,
    context?: StorytellerRequestContext,
  ): Promise<SceneReactionResult> {
    const prompt = buildSceneReactionPrompt(this.promptTemplates, input);
    const parseSceneReaction = (raw: string): SceneReactionResult | null => {
      const parsed = parseJson(raw, sceneReactionSchema);
      if (parsed) {
        const boundedTensionDelta = Math.max(
          -35,
          Math.min(35, parsed.tensionDelta ?? 0),
        );
        const targetTension = parsed.tension !== undefined
          ? clampTension(parsed.tension)
          : clampTension(input.scene.tension + boundedTensionDelta);

        return {
          npcBeat: parsed.npcBeat ? trimLines(parsed.npcBeat) : undefined,
          consequence: parsed.consequence
            ? trimLines(parsed.consequence)
            : undefined,
          reward: parsed.reward ? trimLines(parsed.reward) : undefined,
          goalStatus: parsed.goalStatus ?? "advanced",
          failForward: parsed.failForward ?? true,
          tensionShift: parsed.tensionShift ?? "stable",
          tensionDelta: boundedTensionDelta,
          sceneMode: parsed.sceneMode,
          turnOrderRequired: parsed.turnOrderRequired,
          tensionBand: parsed.tensionBand,
          closeScene: parsed.closeScene ?? false,
          sceneSummary: parsed.sceneSummary
            ? trimLines(parsed.sceneSummary)
            : undefined,
          tension: targetTension,
          tensionReason: parsed.tensionReason
            ? trimLines(parsed.tensionReason)
            : undefined,
          reasoning:
            parsed.reasoning
              ?.map((note) => trimLines(note))
              .filter((note) => note.length > 0) ?? [],
          debug: {
            tension: targetTension,
            secrets: [],
            pacingNotes: parsed.pacingNotes ?? [],
            continuityWarnings: parsed.continuityWarnings ?? [],
            aiRequests: [],
            recentDecisions: [],
          },
        };
      }

      const looseParsed = parseLooseSceneReaction(raw);
      if (looseParsed) {
        const rawDelta = looseParsed.tensionDelta ?? 0;
        const boundedTensionDelta = Math.max(-35, Math.min(35, rawDelta));
        const targetTension = looseParsed.tension !== undefined
          ? clampTension(looseParsed.tension)
          : clampTension(input.scene.tension + boundedTensionDelta);

        return {
          npcBeat: looseParsed.npcBeat
            ? trimLines(looseParsed.npcBeat)
            : undefined,
          consequence: looseParsed.consequence
            ? trimLines(looseParsed.consequence)
            : undefined,
          reward: looseParsed.reward ? trimLines(looseParsed.reward) : undefined,
          goalStatus: looseParsed.goalStatus ?? "advanced",
          failForward: looseParsed.failForward ?? true,
          tensionShift: looseParsed.tensionShift ?? "stable",
          tensionDelta: boundedTensionDelta,
          sceneMode: looseParsed.sceneMode,
          turnOrderRequired: looseParsed.turnOrderRequired,
          tensionBand: looseParsed.tensionBand,
          closeScene: looseParsed.closeScene ?? false,
          sceneSummary: looseParsed.sceneSummary
            ? trimLines(looseParsed.sceneSummary)
            : undefined,
          tension: targetTension,
          tensionReason: looseParsed.tensionReason
            ? trimLines(looseParsed.tensionReason)
            : undefined,
          reasoning:
            looseParsed.reasoning
              ?.map((note) => trimLines(note))
              .filter((note) => note.length > 0) ?? [],
          debug: {
            tension: targetTension,
            secrets: [],
            pacingNotes: looseParsed.pacingNotes ?? [],
            continuityWarnings: looseParsed.continuityWarnings ?? [],
            aiRequests: [],
            recentDecisions: [],
          },
        };
      }

      return null;
    };

    const modelText = await this.callTextModel({
      agent: "scene_controller",
      primaryModel: this.options.models.sceneController,
      fallbackModel: this.options.models.sceneControllerFallback,
      prompt,
      runtimeConfig,
      maxTokens: 320,
      temperature: 0.35,
      context,
    });

    if (modelText) {
      const parsedResult = parseSceneReaction(modelText);
      if (parsedResult) {
        return parsedResult;
      }

      const repairedText = await this.retryStructuredJsonOnce({
        agent: "scene_controller",
        primaryModel: this.options.models.sceneController,
        fallbackModel: this.options.models.sceneControllerFallback,
        runtimeConfig,
        maxTokens: 320,
        context,
        schemaGuide: SCENE_REACTION_SCHEMA_GUIDE,
        parseError: describeStructuredParseFailure(modelText, sceneReactionSchema),
        invalidResponse: modelText,
      });
      if (repairedText) {
        const repairedResult = parseSceneReaction(repairedText);
        if (repairedResult) {
          return repairedResult;
        }
      }
    }

    return buildSceneReactionFallback(input);
  }

  public async decideOutcomeCheckForPlayerAction(
    input: OutcomeCheckDecisionInput,
    runtimeConfig: RuntimeConfig,
    context?: StorytellerRequestContext,
  ): Promise<OutcomeCheckDecisionResult> {
    const actionText = trimLines(input.actionText).slice(0, 260);
    const recentNarrative = getNarrativeTailForOutcomeDecision(
      input.transcriptTail,
    );
    const prompt = buildOutcomeCheckPrompt(
      this.promptTemplates,
      input,
      actionText,
      recentNarrative,
    );
    const parseOutcomeDecision = (
      raw: string,
    ): OutcomeCheckDecisionResult | null => {
      const parsed = parseJson(raw, outcomeCheckDecisionSchema);
      if (parsed) {
        const normalized = refineModelOutcomeDecision(
          parsed,
          input,
        );
        return {
          ...normalized,
          reason: trimLines(normalized.reason).slice(0, 180),
        };
      }

      const looseParsed = parseLooseOutcomeCheckDecision(raw);
      if (looseParsed?.intent && typeof looseParsed.shouldCheck === "boolean") {
        const normalized = refineModelOutcomeDecision(
          {
            intent: looseParsed.intent,
            responseMode: looseParsed.responseMode,
            detailLevel: looseParsed.detailLevel,
            shouldCheck: looseParsed.shouldCheck,
            reason:
              looseParsed.reason ??
              "Outcome classifier returned a partial decision.",
            allowHardDenyWithoutOutcomeCheck:
              looseParsed.allowHardDenyWithoutOutcomeCheck,
            hardDenyReason: looseParsed.hardDenyReason,
            triggers: {
              threat: Boolean(looseParsed.triggers?.threat),
              uncertainty: Boolean(looseParsed.triggers?.uncertainty),
              highReward: Boolean(looseParsed.triggers?.highReward),
            },
          },
          input,
        );
        return {
          ...normalized,
          reason: trimLines(normalized.reason).slice(0, 180),
        };
      }

      return null;
    };

    const fastRuntimeConfig = {
      ...runtimeConfig,
      textCallTimeoutMs: Math.min(runtimeConfig.textCallTimeoutMs, 4500),
      aiRetryCount: 0,
    };

    const modelText = await this.callTextModel({
      agent: "outcome_decider",
      primaryModel: this.options.models.outcomeDecider,
      fallbackModel: this.options.models.outcomeDeciderFallback,
      prompt,
      runtimeConfig: fastRuntimeConfig,
      maxTokens: 260,
      temperature: 0,
      context,
    });

    if (modelText) {
      const parsedResult = parseOutcomeDecision(modelText);
      if (parsedResult) {
        return parsedResult;
      }

      const repairedText = await this.retryStructuredJsonOnce({
        agent: "outcome_decider",
        primaryModel: this.options.models.outcomeDecider,
        fallbackModel: this.options.models.outcomeDeciderFallback,
        runtimeConfig: fastRuntimeConfig,
        maxTokens: 260,
        context,
        schemaGuide: OUTCOME_DECISION_SCHEMA_GUIDE,
        parseError: describeStructuredParseFailure(
          modelText,
          outcomeCheckDecisionSchema,
        ),
        invalidResponse: modelText,
      });
      if (repairedText) {
        const repairedResult = parseOutcomeDecision(repairedText);
        if (repairedResult) {
          return repairedResult;
        }
      }
    }

    return decideOutcomeCheckByHeuristic(input);
  }

  public async answerMetagameQuestion(
    input: MetagameQuestionInput,
    runtimeConfig: RuntimeConfig,
    context?: StorytellerRequestContext,
  ): Promise<string> {
    const prompt = buildMetagameQuestionPrompt(this.promptTemplates, input);

    const modelText = await this.callTextModel({
      agent: "narrative_director",
      primaryModel: this.options.models.narrativeDirector,
      fallbackModel: this.options.models.narrativeDirectorFallback,
      prompt,
      runtimeConfig,
      maxTokens: 380,
      temperature: 0.2,
      context,
    });

    const parsedModelText = modelText
      ? trimLines(modelText).replace(/^["'`]+|["'`]+$/g, "")
      : "";
    if (parsedModelText.length > 0) {
      return parsedModelText.slice(0, 1000);
    }

    const fallbackSecret = input.sceneDebug?.secrets?.[0];
    if (fallbackSecret && fallbackSecret.trim().length > 0) {
      return `Truthfully: ${fallbackSecret.trim()}`;
    }

    return "I cannot answer that truthfully from the current recorded context. Ask again after the scene reveals more internal details.";
  }

  public async summarizeSession(
    transcript: TranscriptEntry[],
    runtimeConfig: RuntimeConfig,
    context?: StorytellerRequestContext,
  ): Promise<string> {
    const prompt = buildSessionSummaryPrompt(this.promptTemplates, transcript);

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
      return normalizeNarrativeText(modelText).slice(0, 900);
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

  public async craftSessionForwardHook(
    transcript: TranscriptEntry[],
    sessionSummary: string,
    runtimeConfig: RuntimeConfig,
    context?: StorytellerRequestContext,
  ): Promise<string> {
    const prompt = buildSessionForwardHookPrompt(
      this.promptTemplates,
      transcript,
      sessionSummary,
    );

    const modelText = await this.callTextModel({
      agent: "scene_controller",
      primaryModel: this.options.models.sceneController,
      fallbackModel: this.options.models.sceneControllerFallback,
      prompt,
      runtimeConfig,
      maxTokens: 120,
      temperature: 0.65,
      context,
    });

    const parsedModelText = modelText
      ? normalizeNarrativeText(modelText).replace(/^["'`]+|["'`]+$/g, "")
      : "";
    if (parsedModelText.length > 0) {
      return parsedModelText.slice(0, 280);
    }

    const normalizedSummary = trimLines(sessionSummary);
    if (normalizedSummary.length > 0) {
      const summarySentences = normalizedSummary
        .split(/(?<=[.!?])\s+/)
        .map((sentence) => sentence.trim())
        .filter((sentence) => sentence.length > 0);
      const fallbackSentence =
        summarySentences[summarySentences.length - 1] ?? normalizedSummary;
      return fallbackSentence.slice(0, 280);
    }

    return "Unfinished threads remain, and the next chapter will decide what those signs were warning about.";
  }

  public async generateSceneImage(
    scene: ScenePublic,
    runtimeConfig: RuntimeConfig,
    context?: StorytellerRequestContext,
  ): Promise<string | null> {
    const imageCacheKey = hashCacheKey(
      JSON.stringify({
        model: this.options.models.imageGenerator,
        fallbackModel: this.options.models.imageGeneratorFallback,
        introProse: scene.introProse,
        orientationBullets: scene.orientationBullets,
        summary: scene.summary ?? null,
        mode: scene.mode,
        tension: scene.tension,
      }),
    );
    const cachedImageUrl = this.readFromCache(this.imageCache, imageCacheKey);
    if (cachedImageUrl !== undefined) {
      return cachedImageUrl;
    }

    if (this.costControls.disableImageGeneration) {
      this.writeToCache(
        this.imageCache,
        imageCacheKey,
        null,
        this.costControls.imageCacheTtlMs,
      );
      if (context) {
        this.options.onAiRequest?.({
          adventureId: context.adventureId,
          requestId: createAiRequestId(),
          createdAtIso: new Date().toISOString(),
          agent: "image_generator",
          kind: "image",
          model: this.options.models.imageGenerator,
          timeoutMs: runtimeConfig.imageTimeoutMs,
          attempt: 1,
          fallback: false,
          status: "failed",
          error: "Image generation disabled by configuration.",
        });
      }
      return null;
    }

    if (!this.options.openRouterClient.hasApiKey()) {
      this.writeToCache(
        this.imageCache,
        imageCacheKey,
        null,
        this.costControls.imageCacheTtlMs,
      );
      if (context) {
        this.options.onAiRequest?.({
          adventureId: context.adventureId,
          requestId: createAiRequestId(),
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

    const imageUrl = await runImageModelRequest(
      {
        openRouterClient: this.options.openRouterClient,
        onAiRequest: this.options.onAiRequest,
      },
      {
        agent: "image_generator",
        primaryModel: this.options.models.imageGenerator,
        fallbackModel: this.options.models.imageGeneratorFallback,
        prompt,
        runtimeConfig,
        context,
      },
    );
    this.writeToCache(
      this.imageCache,
      imageCacheKey,
      imageUrl,
      this.costControls.imageCacheTtlMs,
    );
    return imageUrl;
  }

  private async callTextModel(
    request: TextModelRequest,
  ): Promise<string | null> {
    return runTextModelRequest(
      {
        openRouterClient: this.options.openRouterClient,
        onAiRequest: this.options.onAiRequest,
      },
      request,
    );
  }

  private async retryStructuredJsonOnce(
    request: {
      agent: TextModelRequest["agent"];
      primaryModel: string;
      fallbackModel: string;
      runtimeConfig: RuntimeConfig;
      maxTokens: number;
      context?: StorytellerRequestContext;
      schemaGuide: string;
      parseError: string;
      invalidResponse: string;
    },
  ): Promise<string | null> {
    const repairPrompt = [
      "Your previous response failed strict JSON parsing.",
      `Parse error: ${request.parseError}`,
      "Return corrected JSON only.",
      "Do not include markdown fences, explanation, or extra keys.",
      "Required fields:",
      request.schemaGuide,
      "Previous invalid response:",
      request.invalidResponse.slice(0, 2600),
    ].join("\n");

    return this.callTextModel({
      agent: request.agent,
      primaryModel: request.primaryModel,
      fallbackModel: request.fallbackModel,
      prompt: repairPrompt,
      runtimeConfig: {
        ...request.runtimeConfig,
        aiRetryCount: 0,
      },
      maxTokens: Math.max(220, request.maxTokens),
      temperature: 0,
      context: request.context,
    });
  }

  private async buildSceneImagePrompt(
    scene: ScenePublic,
    runtimeConfig: RuntimeConfig,
    context?: StorytellerRequestContext,
  ): Promise<string> {
    const prompt = buildSceneImagePromptRequest(this.promptTemplates, scene);

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

  private readFromCache<T>(
    cache: Map<string, { expiresAtMs: number; value: T }>,
    key: string,
  ): T | undefined {
    const cached = cache.get(key);
    if (!cached) {
      return undefined;
    }

    if (cached.expiresAtMs <= Date.now()) {
      cache.delete(key);
      return undefined;
    }

    return cached.value;
  }

  private writeToCache<T>(
    cache: Map<string, { expiresAtMs: number; value: T }>,
    key: string,
    value: T,
    ttlMs: number,
  ): void {
    if (ttlMs <= 0) {
      return;
    }

    cache.set(key, {
      expiresAtMs: Date.now() + ttlMs,
      value,
    });
  }
}
