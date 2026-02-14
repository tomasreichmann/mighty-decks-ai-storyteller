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
  const recent = entries.slice(-3);
  return recent.some(
    (entry) =>
      entry.kind === "system" &&
      entry.author === "System" &&
      entry.text.toLowerCase().includes("outcome check:"),
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

export const refineModelOutcomeDecision = (
  parsed: ModelOutcomeDecision,
  input: OutcomeCheckDecisionInput,
): OutcomeCheckDecisionResult => {
  void input;

  const normalizedIntent =
    parsed.intent === "information_request"
      ? "information_request"
      : "direct_action";
  const detailLevel = resolveDetailLevel(parsed);
  const responseMode =
    parsed.responseMode ?? (detailLevel === "expanded" ? "expanded" : "concise");
  const finalShouldCheck = Boolean(parsed.shouldCheck);
  const finalReason = parsed.reason.trim();
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
    triggers: {
      threat: Boolean(parsed.triggers?.threat),
      uncertainty: Boolean(parsed.triggers?.uncertainty),
      highReward: Boolean(parsed.triggers?.highReward),
    },
  };
};
