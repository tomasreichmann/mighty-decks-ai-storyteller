import {
  AdventureState,
  defaultAiCostMetrics,
  defaultLatencyMetrics,
  RuntimeConfig,
} from "@mighty-decks/spec/adventureState";

export const createInitialAdventureState = (
  adventureId: string,
  runtimeConfig: RuntimeConfig,
  debugMode: boolean,
): AdventureState => {
  return {
    adventureId,
    phase: "lobby",
    roster: [],
    characterPortraitsByName: {},
    transcript: [],
    runtimeConfig,
    latencyMetrics: {
      ...defaultLatencyMetrics,
      updatedAtIso: new Date().toISOString(),
    },
    aiCostMetrics: {
      ...defaultAiCostMetrics,
      updatedAtIso: new Date().toISOString(),
    },
    debugMode,
    closed: false,
  };
};
