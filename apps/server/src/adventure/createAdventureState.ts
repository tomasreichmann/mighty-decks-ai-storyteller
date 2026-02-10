import {
  AdventureState,
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
    transcript: [],
    runtimeConfig,
    latencyMetrics: {
      ...defaultLatencyMetrics,
      updatedAtIso: new Date().toISOString(),
    },
    debugMode,
    closed: false,
  };
};
