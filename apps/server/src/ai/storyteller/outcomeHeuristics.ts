import type { TranscriptEntry } from "@mighty-decks/spec/adventureState";
import type {
  NarrativeDetailLevel,
  OutcomeCheckDecisionInput,
  OutcomeCheckDecisionResult,
} from "./types";

type ModelOutcomeDecision = {
  intent: "information_request" | "direct_action";
  responseMode?: "concise" | "expanded";
  detailLevel?: NarrativeDetailLevel;
  shouldCheck: boolean;
  reason: string;
  allowHardDenyWithoutOutcomeCheck?: boolean;
  hardDenyReason?: string;
  triggers?: {
    threat?: boolean;
    uncertainty?: boolean;
    highReward?: boolean;
  };
};

export const hasRecentOutcomePrompt = (entries: TranscriptEntry[]): boolean => {
  const recent = entries.slice(-6);
  return recent.some(
    (entry) => {
      const normalizedText = entry.text.toLowerCase();
      if (entry.kind === "system" && entry.author === "System") {
        return normalizedText.includes("outcome check:");
      }

      if (entry.kind === "storyteller") {
        return normalizedText.includes("play an outcome card");
      }

      if (entry.kind === "player") {
        return normalizedText.includes("played outcome card:");
      }

      return false;
    },
  );
};

export const decideOutcomeCheckByHeuristic = (
  input: OutcomeCheckDecisionInput,
): OutcomeCheckDecisionResult => {
  void input;

  return {
    intent: "direct_action",
    responseMode: "concise",
    detailLevel: "standard",
    shouldCheck: false,
    reason:
      "Outcome classifier unavailable; continue without an Outcome card unless players or fiction escalate.",
    allowHardDenyWithoutOutcomeCheck: false,
    hardDenyReason: "",
    triggers: {
      threat: false,
      uncertainty: false,
      highReward: false,
    },
  };
};

const resolveDetailLevel = (
  decision: ModelOutcomeDecision,
): NarrativeDetailLevel => {
  if (
    decision.detailLevel === "concise" ||
    decision.detailLevel === "standard" ||
    decision.detailLevel === "expanded"
  ) {
    return decision.detailLevel;
  }

  if (decision.responseMode === "expanded") {
    return "expanded";
  }

  if (decision.intent === "information_request") {
    return "expanded";
  }

  return "standard";
};

const IMMEDIATE_THREAT_SIGNAL_REGEX =
  /\b(under fire|crossfire|countdown|detected|spotted|caught|pursuit|chase|ambush|attack|attacks|attacked|strike|strikes|struck|alarm|collapse|explosion|gunfire)\b/i;

const hasImmediateThreatSignal = (
  input: OutcomeCheckDecisionInput,
): boolean =>
  IMMEDIATE_THREAT_SIGNAL_REGEX.test(
    `${input.actionText}\n${input.rollingSummary}`,
  );

export const refineModelOutcomeDecision = (
  parsed: ModelOutcomeDecision,
  input: OutcomeCheckDecisionInput,
): OutcomeCheckDecisionResult => {
  const normalizedIntent =
    parsed.intent === "information_request"
      ? "information_request"
      : "direct_action";
  const detailLevel = resolveDetailLevel(parsed);
  const responseMode =
    parsed.responseMode ?? (detailLevel === "expanded" ? "expanded" : "concise");
  const finalReason = parsed.reason.trim();
  const triggers = {
    threat: Boolean(parsed.triggers?.threat),
    uncertainty: Boolean(parsed.triggers?.uncertainty),
    highReward: Boolean(parsed.triggers?.highReward),
  };
  const hasPrimaryTrigger = triggers.threat || triggers.highReward;
  const uncertaintyOnly = triggers.uncertainty && !hasPrimaryTrigger;
  const hasAnyTrigger = hasPrimaryTrigger || triggers.uncertainty;
  const lowTensionBeat =
    input.scene.mode === "low_tension" && input.scene.tension <= 60;
  const repeatedOutcomeActivity = hasRecentOutcomePrompt(input.transcriptTail);
  const immediateThreatSignal = hasImmediateThreatSignal(input);
  let finalShouldCheck = Boolean(parsed.shouldCheck);

  if (normalizedIntent !== "direct_action") {
    finalShouldCheck = false;
  }

  if (finalShouldCheck) {
    if (!hasAnyTrigger) {
      finalShouldCheck = false;
    } else if (uncertaintyOnly) {
      finalShouldCheck = false;
    } else if (!hasPrimaryTrigger && lowTensionBeat) {
      finalShouldCheck = false;
    } else if (
      lowTensionBeat &&
      triggers.threat &&
      !triggers.highReward &&
      !immediateThreatSignal
    ) {
      finalShouldCheck = false;
    } else if (!hasPrimaryTrigger && repeatedOutcomeActivity) {
      finalShouldCheck = false;
    }
  }

  const hardDenyRationale = parsed.hardDenyReason?.trim() || finalReason;
  const allowHardDenyWithoutOutcomeCheck =
    normalizedIntent === "direct_action" &&
    !finalShouldCheck &&
    Boolean(parsed.allowHardDenyWithoutOutcomeCheck);
  const hardDenyReason = allowHardDenyWithoutOutcomeCheck
    ? hardDenyRationale
    : "";

  return {
    intent: normalizedIntent,
    responseMode,
    detailLevel,
    shouldCheck: finalShouldCheck,
    reason: finalReason,
    allowHardDenyWithoutOutcomeCheck,
    hardDenyReason,
    triggers,
  };
};
