import type { ScenePublic, TranscriptEntry } from "@mighty-decks/spec/adventureState";
import type {
  ActionResponseInput,
  SceneReactionInput,
  OutcomeCheckDecisionInput,
  PitchInput,
  SceneStartInput,
} from "./types";
import type { PromptKey, PromptTemplateMap } from "./prompts";
import { compactTranscript } from "./text";

const composePrompt = (
  promptTemplates: PromptTemplateMap,
  templateKey: PromptKey,
  sections: string[],
): string =>
  [promptTemplates[templateKey], ...sections]
    .map((section) => section.trim())
    .filter((section) => section.length > 0)
    .join("\n");

export const buildAdventurePitchesPrompt = (
  promptTemplates: PromptTemplateMap,
  inputs: PitchInput[],
): string =>
  composePrompt(promptTemplates, "pitch_generator", [
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

export const buildSceneStartPrompt = (
  promptTemplates: PromptTemplateMap,
  input: SceneStartInput,
): string =>
  composePrompt(promptTemplates, "scene_controller", [
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

export const buildContinuityPrompt = (
  promptTemplates: PromptTemplateMap,
  transcript: TranscriptEntry[],
): string =>
  composePrompt(promptTemplates, "continuity_keeper", [
    "You are the Continuity Keeper for a multiplayer story session.",
    "Return JSON only with keys:",
    "rollingSummary: string (<= 140 words)",
    "continuityWarnings: string[]",
    "Do not invent facts. Compress only what is already in transcript.",
    "Transcript:",
    compactTranscript(transcript) || "none",
  ]);

export const buildNarrateActionPrompt = (
  promptTemplates: PromptTemplateMap,
  input: ActionResponseInput,
): string =>
  composePrompt(promptTemplates, "narrative_director", [
    "You are the Narrative Director for a GM-less story game.",
    "You are an external narrator, never a character in the scene.",
    "Respond in concise, fail-forward prose.",
    "Never speak in first person as any player character.",
    "Do not roleplay dialogue as the acting player character.",
    "Keep player characters in third-person narration by their exact names.",
    "If responseMode is expanded, provide concrete information players can immediately use.",
    "If responseMode is concise, keep pacing tight and actionable.",
    "If outcome guidance includes Fumble or Chaos, include an explicit concrete consequence and fail-forward path.",
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
    `Response mode: ${input.responseMode}`,
    `Pitch title: ${input.pitchTitle}`,
    `Pitch description: ${input.pitchDescription}`,
    `Scene intro: ${input.scene.introProse}`,
    `Scene mode: ${input.scene.mode}`,
    `Scene tension: ${input.scene.tension}`,
    `Acting player character: ${input.actorCharacterName}`,
    `Turn number in scene: ${input.turnNumber}`,
    `Rolling continuity summary: ${input.rollingSummary}`,
    `Player action: ${input.actionText}`,
    "Recent transcript:",
    compactTranscript(input.transcriptTail) || "none",
    "Word budget: concise <= 120 words, expanded <= 220 words.",
  ]);

export const buildSceneReactionPrompt = (
  promptTemplates: PromptTemplateMap,
  input: SceneReactionInput,
): string =>
  composePrompt(promptTemplates, "scene_controller", [
    "You are the Scene Controller for a GM-less story game.",
    "Decide world reaction after the player's resolved action.",
    "Always keep play moving. Never dead-end mandatory progress.",
    "Rewards are granted only when goalStatus is completed.",
    "In high tension, maintain clear action cadence and NPC pressure.",
    "Return JSON only with keys:",
    "npcBeat?: string",
    "consequence?: string",
    "reward?: string",
    "goalStatus: 'advanced' | 'completed' | 'blocked'",
    "failForward: boolean",
    "tensionShift: 'rise' | 'fall' | 'stable'",
    "tensionDelta: integer -35..35",
    "sceneMode?: 'low_tension' | 'high_tension'",
    "closeScene: boolean",
    "sceneSummary?: string",
    "tension?: number 0..100",
    "tensionReason?: string",
    "reasoning?: string[] (short screen-only rationale for key decisions)",
    "pacingNotes?: string[]",
    "continuityWarnings?: string[]",
    "Write npcBeat/consequence/reward as short in-world narration lines we can show players.",
    "Do not use meta labels or phrasing like 'Consequence:', 'NPC Move:', 'Reward:', 'raises urgency', or 'forces a response'.",
    "If goalStatus is not completed, reward must be omitted.",
    "If outcome is a failure or heavy cost, provide consequence and failForward=true.",
    "NPC beat should show NPC agenda pressure, not just mirror player action.",
    `Pitch title: ${input.pitchTitle}`,
    `Pitch description: ${input.pitchDescription}`,
    `Scene intro: ${input.scene.introProse}`,
    `Scene mode: ${input.scene.mode}`,
    `Current tension: ${input.scene.tension}`,
    `Acting character: ${input.actorCharacterName}`,
    `Turn number: ${input.turnNumber}`,
    `Player action: ${input.actionText}`,
    `Resolved action text: ${input.actionResponseText}`,
    `Rolling continuity summary: ${input.rollingSummary}`,
    "Recent transcript:",
    compactTranscript(input.transcriptTail) || "none",
  ]);

export const buildOutcomeCheckPrompt = (
  promptTemplates: PromptTemplateMap,
  input: OutcomeCheckDecisionInput,
  actionText: string,
  recentNarrative: string,
): string =>
  composePrompt(promptTemplates, "outcome_decider", [
    "You are an intent and stakes classifier for a GM-less adventure game.",
    "Decide action intent, narration verbosity, and whether the CURRENT action triggers an Outcome card check.",
    "Use conservative calibration.",
    "intent rules:",
    "- information_request: player seeks facts/clarity/details",
    "- direct_action: player attempts to change the world state",
    "responseMode rules:",
    "- expanded for information_request",
    "- concise for direct_action unless extra detail is necessary",
    "Set shouldCheck=true only for immediate dramatic stakes in this action:",
    "1) threat: direct danger/opposition can cause a setback now",
    "2) uncertainty: the action is contested or risky enough to swing hard",
    "3) highReward: the action could win a major upside worth risking for",
    "Set shouldCheck=false for planning, observation, positioning, or low-stakes probing, especially information_request actions.",
    "Do not trigger based only on ambient scene danger.",
    "Avoid repeated checks on consecutive low-stakes actions.",
    "Return JSON only with keys:",
    "intent: 'information_request' | 'direct_action'",
    "responseMode: 'concise' | 'expanded'",
    "shouldCheck: boolean",
    "reason: string (max 140 chars)",
    "triggers: { threat: boolean, uncertainty: boolean, highReward: boolean }",
    `Actor: ${input.actorCharacterName}`,
    `Turn number: ${input.turnNumber}`,
    `Player action: ${actionText}`,
    "Recent narrative context:",
    recentNarrative,
  ]);

export const buildSessionSummaryPrompt = (
  promptTemplates: PromptTemplateMap,
  transcript: TranscriptEntry[],
): string =>
  composePrompt(promptTemplates, "scene_controller", [
    "Write a concise end-of-session summary in 4-6 sentences.",
    "Focus on what the players attempted, what changed, and unresolved threads.",
    "Avoid bullet points.",
    "Transcript:",
    compactTranscript(transcript),
  ]);

export const buildSessionForwardHookPrompt = (
  promptTemplates: PromptTemplateMap,
  transcript: TranscriptEntry[],
  sessionSummary: string,
): string =>
  composePrompt(promptTemplates, "scene_controller", [
    "Write a forward-looking hook for what may happen next in this adventure.",
    "Return plain text only.",
    "Output exactly one sentence between 12 and 30 words.",
    "No markdown, no bullet points, no labels, no quotes.",
    "Focus on unresolved danger, mystery, or opportunity.",
    `Session summary: ${sessionSummary}`,
    "Recent transcript:",
    compactTranscript(transcript.slice(-14)) || "none",
  ]);

export const buildSceneImagePromptRequest = (
  promptTemplates: PromptTemplateMap,
  scene: ScenePublic,
): string =>
  composePrompt(promptTemplates, "image_generator", [
    "You craft high-quality visual prompts for FLUX image generation.",
    "Return plain text only as one continuous prompt, 45-90 words.",
    "Include subject, environment, mood, lighting, composition, and camera framing.",
    "Avoid dialogue, game terms, markdown, JSON, bullet points, and field labels.",
    "Do not include text overlays, UI elements, logos, or watermarks.",
    `Scene intro: ${scene.introProse}`,
    scene.summary ? `Scene resolution: ${scene.summary}` : "",
    ...scene.orientationBullets.map((bullet) => `Scene cue: ${bullet}`),
  ]);
