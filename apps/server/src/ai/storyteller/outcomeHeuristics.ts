import type { TranscriptEntry } from "@mighty-decks/spec/adventureState";
import type {
  OutcomeCheckDecisionInput,
  OutcomeCheckDecisionResult,
} from "./types";

const OUTCOME_THREAT_KEYWORDS = [
  "attack",
  "ambush",
  "hazard",
  "trap",
  "collapse",
  "fire",
  "fight",
  "enemy",
  "monster",
  "guard",
  "chase",
  "storm",
  "wound",
  "explode",
  "fall",
];

const OUTCOME_UNCERTAINTY_KEYWORDS = [
  "attempt",
  "try",
  "sneak",
  "steal",
  "pick",
  "climb",
  "jump",
  "convince",
  "persuade",
  "guess",
  "investigate",
  "search",
  "cross",
  "dodge",
  "disarm",
  "risky",
  "careful",
  "carefully",
  "gamble",
];

const OUTCOME_CONTEST_KEYWORDS = [
  "sneak",
  "steal",
  "pick",
  "disarm",
  "climb",
  "jump",
  "convince",
  "persuade",
  "bluff",
  "threaten",
  "bargain",
  "negotiate",
  "duel",
  "fight",
  "attack",
  "rush",
  "charge",
  "cast",
  "grab",
  "intercept",
];

const OUTCOME_REWARD_KEYWORDS = [
  "treasure",
  "relic",
  "artifact",
  "vault",
  "key",
  "power",
  "breakthrough",
  "shortcut",
  "jackpot",
  "big score",
  "crystal",
  "legendary",
];

const OUTCOME_LOW_STAKES_KEYWORDS = [
  "look",
  "watch",
  "listen",
  "wait",
  "rest",
  "hide",
  "check map",
  "map",
  "plan",
  "discuss",
  "talk",
  "move carefully",
  "follow",
  "search for clues",
  "scan",
  "observe",
];

export const hasKeywordMatch = (value: string, keywords: string[]): boolean =>
  keywords.some((keyword) => value.includes(keyword));

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
  const action = input.actionText.toLowerCase();
  const threat = hasKeywordMatch(action, OUTCOME_THREAT_KEYWORDS);
  const uncertainty =
    hasKeywordMatch(action, OUTCOME_UNCERTAINTY_KEYWORDS) ||
    hasKeywordMatch(action, OUTCOME_CONTEST_KEYWORDS) ||
    action.includes("?") ||
    action.includes("if ");
  const highReward = hasKeywordMatch(action, OUTCOME_REWARD_KEYWORDS);
  const lowStakes = hasKeywordMatch(action, OUTCOME_LOW_STAKES_KEYWORDS);
  const repeatedCheck = hasRecentOutcomePrompt(input.transcriptTail);

  const shouldCheck = !lowStakes &&
    !repeatedCheck &&
    ((threat && uncertainty) || (highReward && uncertainty));

  if (!shouldCheck) {
    return {
      shouldCheck: false,
      reason:
        "No immediate dramatic risk or major upside warrants an Outcome card.",
      triggers: {
        threat,
        uncertainty,
        highReward,
      },
    };
  }

  const reasonParts: string[] = [];
  if (threat) {
    reasonParts.push("clear threat pressure");
  }
  if (uncertainty) {
    reasonParts.push("meaningful uncertainty");
  }
  if (highReward) {
    reasonParts.push("chance for a bigger reward");
  }

  return {
    shouldCheck: true,
    reason: `Stakes justify an Outcome card: ${reasonParts.join(", ")}.`,
    triggers: {
      threat,
      uncertainty,
      highReward,
    },
  };
};

export const refineModelOutcomeDecision = (
  parsed: OutcomeCheckDecisionResult,
  actionText: string,
  transcriptTail: TranscriptEntry[],
): OutcomeCheckDecisionResult => {
  const normalizedAction = actionText.toLowerCase();
  const directlyRisky = hasKeywordMatch(
    normalizedAction,
    OUTCOME_THREAT_KEYWORDS,
  ) || hasKeywordMatch(normalizedAction, OUTCOME_CONTEST_KEYWORDS);
  const explicitHighReward = hasKeywordMatch(
    normalizedAction,
    OUTCOME_REWARD_KEYWORDS,
  );
  const likelyLowStakes = hasKeywordMatch(
    normalizedAction,
    OUTCOME_LOW_STAKES_KEYWORDS,
  );
  const repeatedCheck = hasRecentOutcomePrompt(transcriptTail);
  const hasTrigger =
    parsed.triggers.threat ||
    parsed.triggers.uncertainty ||
    parsed.triggers.highReward;
  const shouldCheck = parsed.shouldCheck &&
    hasTrigger &&
    !likelyLowStakes &&
    !(
      repeatedCheck &&
      !parsed.triggers.highReward &&
      !explicitHighReward
    ) &&
    (directlyRisky || explicitHighReward);

  return {
    shouldCheck,
    reason: parsed.reason,
    triggers: parsed.triggers,
  };
};
