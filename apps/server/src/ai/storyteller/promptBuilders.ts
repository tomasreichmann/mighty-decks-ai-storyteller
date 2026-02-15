import type {
  ScenePublic,
  TranscriptEntry,
} from "@mighty-decks/spec/adventureState";
import type {
  ActionResponseInput,
  MetagameQuestionInput,
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

const formatBindingDirectives = (directives: string[] | undefined): string[] => {
  const cleaned = (directives ?? [])
    .map((directive) => directive.trim())
    .filter((directive) => directive.length > 0)
    .slice(-8);

  if (cleaned.length === 0) {
    return ["Binding metagame directives: none"];
  }

  return [
    "Binding metagame directives (must follow unless impossible from established facts):",
    ...cleaned.map((directive, index) => `${index + 1}. ${directive}`),
  ];
};

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
    "Calibrate opening tension by present scrutiny, not genre mood alone.",
    "Typical bands: 20-45 exploratory/setup, 46-70 active pressure with room to maneuver, 71-100 direct confrontation or countdown already underway.",
    "Do not set opening tension above 70 unless immediate direct scrutiny is already live at scene start.",
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
    "You are the Narrator for a GM-less story game.",
    "Your goal is to make the game fun and engaging.",
    "Respond in concise prose in lightweight markdown format; no JSON.",
    "Respond to the acting player character in 2nd person, you can mention other characters in 3rd person by their character's name.",
    "Do not roleplay dialogue as the acting player character.",
    "NPC dialogue in direct quotes is allowed for clarity or drama; keep quotes brief and purposeful.",
    "Reward player for good roleplay or smart actions.",
    "detailLevel controls scope: concise=fast beat, standard=clear development, expanded=richer detail with multiple actionable facts.",
    "If responseMode is expanded, favor expanded detailLevel unless contradicted by explicit detailLevel guidance.",
    "If responseMode is concise, keep pacing tight unless detailLevel is expanded.",
    "If outcome guidance includes Fumble or Chaos, include an explicit concrete consequence and fail-forward path.",
    "Agency guardrail: when no Outcome card is in play, do not hard-deny player intent by default.",
    "Without an Outcome card, only hard-deny when hardDenyWithoutOutcomeCheck=true and the attempt is outlandish or impossible from known facts.",
    "If hardDenyWithoutOutcomeCheck=false, always provide at least one concrete shift/progress/opening from the attempt even when costly.",
    "When outcomeCheckTriggered=false and hardDenyWithoutOutcomeCheck=false, end with one explicit actionable next move sentence.",
    "If hardDenyWithoutOutcomeCheck=true, explain the blocker briefly using known public/internal facts and give one actionable next move.",
    "Judge feasibility semantically from context, not by exact wording or keyword cues.",
    "Never output session summaries or labels like 'Scene 1'/'Scene 2'/'Session Summary'.",
    "Scene pacing target: close most scenes within 20-40 resolved direct actions.",
    "If this is a direct action and resolved direct actions are between 20 and 30, start converging unresolved threads toward a clear endgame beat.",
    "If this is a direct action and resolved direct actions are between 31 and 40, strongly favor decisive progress that sets up immediate scene closure.",
    "If this is a direct action and resolved direct actions exceed 40, prioritize closure-ready outcomes unless the core objective is clearly still unresolved.",
    ...formatBindingDirectives(input.bindingDirectives),
    `Response mode: ${input.responseMode}`,
    `Detail level target: ${
      input.detailLevel ??
      (input.responseMode === "expanded" ? "expanded" : "standard")
    }`,
    `Pitch title: ${input.pitchTitle}`,
    `Pitch description: ${input.pitchDescription}`,
    `Scene intro: ${input.scene.introProse}`,
    `Scene mode: ${input.scene.mode}`,
    `Scene tension: ${input.scene.tension}`,
    `Acting player character: ${input.actorCharacterName}`,
    `Action intent: ${input.actionIntent ?? "unknown"}`,
    `Resolved direct actions in this scene: ${input.directActionCountInScene ?? "unknown"}`,
    `Turn number in scene: ${input.turnNumber}`,
    `Rolling continuity summary: ${input.rollingSummary}`,
    `Player action: ${input.actionText}`,
    `Outcome card triggered this turn: ${input.outcomeCheckTriggered ? "true" : "false"}`,
    `Hard deny without Outcome card allowed: ${
      input.allowHardDenyWithoutOutcomeCheck ? "true" : "false"
    }`,
    `Hard deny rationale: ${input.hardDenyReason || "none"}`,
    "Recent transcript:",
    compactTranscript(input.transcriptTail) || "none",
    "Word budget: concise <= 120 words, standard <= 220 words, expanded <= 360 words.",
  ]);

export const buildSceneReactionPrompt = (
  promptTemplates: PromptTemplateMap,
  input: SceneReactionInput,
): string =>
  composePrompt(promptTemplates, "scene_controller", [
    "You are the Scene Controller for a GM-less story game.",
    "Decide world reaction after the player's resolved action to make it fun and engaging.",
    "Always keep play moving. Never dead-end mandatory progress.",
    "Treat tension as beat-level scrutiny and urgency, not ambient tone alone.",
    "Do not escalate tension just because prior tension is high.",
    "Scene pacing target: close most scenes within 20-40 resolved direct actions.",
    "If resolved direct actions are >=20 and the core objective is materially secured with immediate danger stabilized, bias closeScene=true.",
    "If resolved direct actions are >40, closeScene should usually be true unless the core objective is clearly unresolved or a fresh immediate threat just emerged.",
    "tensionBand meaning: low=no direct scrutiny, medium=watchful pressure without direct contest, high=direct confrontation/pursuit/countdown pressure now.",
    "turnOrderRequired must be true only when immediate exchanges need strict action order this beat.",
    "High tension can coexist with turnOrderRequired=false when pressure is indirect or not directly contesting the actor right now.",
    "Return JSON only with keys:",
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
    "tension?: number 0..100",
    "tensionReason?: string",
    "reasoning?: string[] (short screen-only rationale for key decisions)",
    "pacingNotes?: string[]",
    "continuityWarnings?: string[]",
    "Write npcBeat/consequence/reward as short in-world narration lines we can show players.",
    /* "Do not use meta labels or phrasing like 'Consequence:', 'NPC Move:', 'Reward:', 'raises urgency', or 'forces a response'.", */
    "If outcome is a failure or heavy cost, provide consequence and failForward=true.",
    "NPC beat should show NPC agenda pressure, not just mirror player action.",
    ...formatBindingDirectives(input.bindingDirectives),
    `Pitch title: ${input.pitchTitle}`,
    `Pitch description: ${input.pitchDescription}`,
    `Scene intro: ${input.scene.introProse}`,
    `Scene mode: ${input.scene.mode}`,
    `Current tension: ${input.scene.tension}`,
    `Action intent: ${input.actionIntent ?? "unknown"}`,
    `Resolved direct actions in this scene: ${input.directActionCountInScene ?? "unknown"}`,
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
    "Decide action intent, narration detail level, and whether the CURRENT action triggers an Outcome card check.",
    "Use conservative calibration.",
    "intent rules:",
    "- information_request: player seeks facts/clarity/details",
    "- direct_action: player attempts to change the world state",
    "detailLevel rules:",
    "- concise: short tactical beat",
    "- standard: default for most direct actions",
    "- expanded: information-rich explanation or when deep detail materially helps next decisions",
    "responseMode is a compatibility field for downstream systems:",
    "- set responseMode=expanded when detailLevel=expanded",
    "- otherwise set responseMode=concise",
    "Do not choose expanded solely from scene tension.",
    "Set shouldCheck=true only for immediate dramatic stakes in this action:",
    "1) threat: direct danger/opposition can cause a setback now",
    "2) uncertainty: the action is contested or risky enough to swing hard",
    "3) highReward: the action could win a major upside worth risking for",
    "Set shouldCheck=false for planning, observation, positioning, or low-stakes probing, especially information_request actions.",
    "If scene mode is high_tension and intent is direct_action, require explicit immediate scrutiny/opposition (detected, under fire, countdown, direct confrontation) before setting shouldCheck=true.",
    "In high_tension scenes, stealthy infiltration/repositioning without direct scrutiny should usually stay shouldCheck=false.",
    "Ambiguous cases should lean toward shouldCheck=false unless the current action text or immediate context clearly signals active threat right now.",
    "Set allowHardDenyWithoutOutcomeCheck=true only when the action is outlandish or impossible right now from known public/internal facts.",
    "Hard denial without an Outcome card must be rare.",
    "When allowHardDenyWithoutOutcomeCheck=true, include hardDenyReason with the concrete blocker and keep shouldCheck=false.",
    "Avoid repeated checks on consecutive low-stakes actions.",
    "Respect binding metagame directives while classifying stakes.",
    "Output compact JSON only. No markdown fences, no commentary, no extra keys.",
    "Return JSON only with keys:",
    "intent: 'information_request' | 'direct_action'",
    "detailLevel: 'concise' | 'standard' | 'expanded'",
    "responseMode: 'concise' | 'expanded'",
    "shouldCheck: boolean",
    "reason: string (max 140 chars)",
    "allowHardDenyWithoutOutcomeCheck: boolean",
    "hardDenyReason: string (max 140 chars; empty when allowHardDenyWithoutOutcomeCheck=false)",
    "triggers: { threat: boolean, uncertainty: boolean, highReward: boolean }",
    "Context: ",
    `Scene mode: ${input.scene.mode}`,
    `Scene tension: ${input.scene.tension}`,
    `Scene orientation: ${input.scene.orientationBullets.join(" | ")}`,
    `Actor: ${input.actorCharacterName}`,
    `Turn number: ${input.turnNumber}`,
    `Player action: ${actionText}`,
    `Internal secrets: ${input.sceneDebug?.secrets?.join(" | ") || "none"}`,
    `Internal continuity warnings: ${
      input.sceneDebug?.continuityWarnings?.join(" | ") || "none"
    }`,
    `Internal pacing notes: ${input.sceneDebug?.pacingNotes?.join(" | ") || "none"}`,
    ...formatBindingDirectives(input.bindingDirectives),
    "Recent narrative context:",
    recentNarrative,
  ]);

export const buildMetagameQuestionPrompt = (
  promptTemplates: PromptTemplateMap,
  input: MetagameQuestionInput,
): string =>
  composePrompt(promptTemplates, "narrative_director", [
    "You are answering an out-of-character metagame question from a player or calibrating the game based on player feedback.",
    "Answer truthfully using the internal session context provided below.",
    "If the player asks for hidden details, reveal them directly.",
    "Do not preserve mystery in metagame mode.",
    "Do not defend or justify previous adjudications.",
    "When the player gives feedback, acknowledge it and state concrete future adjustment(s).",
    "Prefer acceptance and actionable calibration over argument.",
    "If the answer is genuinely unknown from the supplied context, say exactly what is unknown.",
    "Keep the reply practical and concise (max 140 words).",
    "Accomomodate the player's feedback as best as you can.",
    "Return plain text only.",
    ...formatBindingDirectives(input.bindingDirectives),
    `Player asking: ${input.actorCharacterName}`,
    `Question: ${input.questionText}`,
    `Pitch title: ${input.pitchTitle}`,
    `Pitch description: ${input.pitchDescription}`,
    `Scene intro: ${input.scene.introProse}`,
    `Scene mode: ${input.scene.mode}`,
    `Scene tension: ${input.scene.tension}`,
    `Scene orientation: ${input.scene.orientationBullets.join(" | ")}`,
    `Internal secrets: ${input.sceneDebug?.secrets?.join(" | ") || "none"}`,
    `Internal pacing notes: ${input.sceneDebug?.pacingNotes?.join(" | ") || "none"}`,
    `Internal continuity warnings: ${
      input.sceneDebug?.continuityWarnings?.join(" | ") || "none"
    }`,
    `Rolling continuity summary: ${input.rollingSummary || "none"}`,
    `Active vote: ${input.activeVoteSummary}`,
    `Active outcome check: ${input.activeOutcomeSummary}`,
    `Pending scene closure: ${input.pendingSceneClosureSummary}`,
    "Recent transcript:",
    compactTranscript(input.transcriptTail) || "none",
  ]);

export const buildSessionSummaryPrompt = (
  promptTemplates: PromptTemplateMap,
  transcript: TranscriptEntry[],
): string =>
  composePrompt(promptTemplates, "scene_controller", [
    "Write a concise end-of-session summary in 4-6 sentences using lightweight markdown.",
    "Focus on what the players attempted, what changed, and unresolved threads.",
    "Use markdown paragraphs and optional emphasis only.",
    "No code fences or JSON.",
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
    "Return lightweight markdown only.",
    "Output exactly one sentence between 12 and 30 words.",
    "No code fences, no bullet points, no labels, no quotes.",
    "Optional emphasis is allowed.",
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
    "Infer style from scene intro.",
    "Do not include text overlays, UI elements, logos, or watermarks.",
    `Scene intro: ${scene.introProse}`,
    scene.summary ? `Scene resolution: ${scene.summary}` : "",
    ...scene.orientationBullets.map((bullet) => `Scene cue: ${bullet}`),
  ]);
