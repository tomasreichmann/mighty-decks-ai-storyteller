import { createHash } from "node:crypto";
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
  parseLooseSceneReaction,
  parseLooseSceneStart,
} from "./storyteller/parsers";
import {
  buildAdventurePitchesPrompt,
  buildContinuityPrompt,
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

const buildSceneReactionFallback = (
  input: SceneReactionInput,
): SceneReactionResult => {
  return {
    goalStatus: "advanced",
    failForward: false,
    tensionShift: "stable",
    tensionDelta: 0,
    sceneMode: input.scene.mode,
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
      const parsed = parseJson(modelText, sceneStartSchema);
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
      const parsed = parseJson(modelText, continuitySchema);
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
    const prompt = buildNarrateActionPrompt(this.promptTemplates, input);
    const maxTokens = input.responseMode === "expanded" ? 820 : 550;

    const modelText = await this.callTextModel({
      agent: "narrative_director",
      primaryModel: this.options.models.narrativeDirector,
      fallbackModel: this.options.models.narrativeDirectorFallback,
      prompt,
      runtimeConfig,
      maxTokens,
      temperature: 0.75,
      context,
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
      const parsed = parseJson(modelText, sceneReactionSchema);
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
          closeScene: parsed.closeScene ?? false,
          sceneSummary: parsed.sceneSummary
            ? trimLines(parsed.sceneSummary)
            : undefined,
          tension: targetTension,
          tensionReason: parsed.tensionReason
            ? trimLines(parsed.tensionReason)
            : undefined,
          reasoning: parsed.reasoning?.map((note) => trimLines(note)).filter((note) => note.length > 0) ?? [],
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

      const looseParsed = parseLooseSceneReaction(modelText);
      if (looseParsed) {
        const rawDelta = looseParsed.tensionDelta ?? 0;
        const boundedTensionDelta = Math.max(-35, Math.min(35, rawDelta));
        const targetTension = looseParsed.tension !== undefined
          ? clampTension(looseParsed.tension)
          : clampTension(input.scene.tension + boundedTensionDelta);

        return {
          npcBeat: looseParsed.npcBeat ? trimLines(looseParsed.npcBeat) : undefined,
          consequence: looseParsed.consequence
            ? trimLines(looseParsed.consequence)
            : undefined,
          reward: looseParsed.reward ? trimLines(looseParsed.reward) : undefined,
          goalStatus: looseParsed.goalStatus ?? "advanced",
          failForward: looseParsed.failForward ?? true,
          tensionShift: looseParsed.tensionShift ?? "stable",
          tensionDelta: boundedTensionDelta,
          sceneMode: looseParsed.sceneMode,
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

    const fastRuntimeConfig = {
      ...runtimeConfig,
      textCallTimeoutMs: Math.min(runtimeConfig.textCallTimeoutMs, 2500),
      aiRetryCount: 0,
    };

    const modelText = await this.callTextModel({
      agent: "outcome_decider",
      primaryModel: this.options.models.outcomeDecider,
      fallbackModel: this.options.models.outcomeDeciderFallback,
      prompt,
      runtimeConfig: fastRuntimeConfig,
      maxTokens: 90,
      temperature: 0,
      context,
    });

    if (modelText) {
      const parsed = parseJson(modelText, outcomeCheckDecisionSchema);
      if (parsed) {
        const normalized = refineModelOutcomeDecision(
          parsed,
          input.transcriptTail,
        );
        return {
          ...normalized,
          reason: trimLines(normalized.reason).slice(0, 180),
        };
      }
    }

    return decideOutcomeCheckByHeuristic(input);
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
      ? trimLines(modelText).replace(/^["'`]+|["'`]+$/g, "")
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
