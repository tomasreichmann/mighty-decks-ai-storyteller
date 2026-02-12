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
import { parseJson, parseLooseSceneStart } from "./storyteller/parsers";
import {
  buildAdventurePitchesPrompt,
  buildContinuityPrompt,
  buildNarrateActionPrompt,
  buildOutcomeCheckPrompt,
  buildSceneImagePromptRequest,
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
  SceneStartInput,
  SceneStartResult,
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
  SceneStartInput,
  SceneStartResult,
  StorytellerModelConfig,
  StorytellerRequestContext,
  StorytellerServiceOptions,
} from "./storyteller/types";

export class StorytellerService {
  private readonly options: StorytellerServiceOptions;
  private readonly promptTemplates: PromptTemplateMap;

  public constructor(options: StorytellerServiceOptions) {
    this.options = options;
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
    const prompt = buildAdventurePitchesPrompt(this.promptTemplates, inputs);

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
        return parsed.map((item) => ({
          title: item.title.trim(),
          description: trimLines(item.description).slice(0, 400),
        }));
      }
    }

    return buildFallbackPitches(inputs);
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
          actionText,
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

  public async generateSceneImage(
    scene: ScenePublic,
    runtimeConfig: RuntimeConfig,
    context?: StorytellerRequestContext,
  ): Promise<string | null> {
    if (!this.options.openRouterClient.hasApiKey()) {
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

    return runImageModelRequest(
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
}
