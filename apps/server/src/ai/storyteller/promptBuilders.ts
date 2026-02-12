import type { ScenePublic, TranscriptEntry } from "@mighty-decks/spec/adventureState";
import type {
  ActionResponseInput,
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

export const buildOutcomeCheckPrompt = (
  promptTemplates: PromptTemplateMap,
  input: OutcomeCheckDecisionInput,
  actionText: string,
  recentNarrative: string,
): string =>
  composePrompt(promptTemplates, "outcome_decider", [
    "You are a fast Outcome-check classifier for a GM-less adventure game.",
    "Decide whether the CURRENT player action should trigger an Outcome card check.",
    "Use conservative calibration.",
    "Set shouldCheck=true only for immediate dramatic stakes in this action:",
    "1) threat: direct danger/opposition can cause a setback now",
    "2) uncertainty: the action is contested or risky enough to swing hard",
    "3) highReward: the action could win a major upside worth risking for",
    "Set shouldCheck=false for planning, observation, positioning, or low-stakes probing.",
    "Do not trigger based only on ambient scene danger.",
    "Avoid repeated checks on consecutive low-stakes actions.",
    "Return JSON only with keys:",
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
