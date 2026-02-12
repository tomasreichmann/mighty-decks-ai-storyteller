import type { TranscriptEntry } from "@mighty-decks/spec/adventureState";
import type {
  OutcomeCheckDecisionInput,
  OutcomeCheckDecisionResult,
} from "./types";

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
  const repeatedCheck = hasRecentOutcomePrompt(input.transcriptTail);
  return {
    intent: "direct_action",
    responseMode: "concise",
    shouldCheck: false,
    reason: repeatedCheck
      ? "Skipping repeated Outcome card check without clear escalation."
      : "Fallback path: resolve action without Outcome card.",
    triggers: {
      threat: false,
      uncertainty: false,
      highReward: false,
    },
  };
};

export const refineModelOutcomeDecision = (
  parsed: OutcomeCheckDecisionResult,
  transcriptTail: TranscriptEntry[],
): OutcomeCheckDecisionResult => {
  const repeatedCheck = hasRecentOutcomePrompt(transcriptTail);
  const hasTrigger =
    parsed.triggers.threat ||
    parsed.triggers.uncertainty ||
    parsed.triggers.highReward;
  const normalizedIntent =
    parsed.intent === "information_request" ? "information_request" : "direct_action";
  const normalizedResponseMode =
    normalizedIntent === "information_request" ? "expanded" : parsed.responseMode;
  const shouldCheck = normalizedIntent === "information_request"
    ? parsed.shouldCheck && parsed.triggers.threat
    : parsed.shouldCheck;
  const allowCheck = shouldCheck && hasTrigger && !(
    repeatedCheck && !parsed.triggers.highReward
  );

  return {
    ...parsed,
    intent: normalizedIntent,
    responseMode: normalizedResponseMode,
    shouldCheck: allowCheck,
  };
};
