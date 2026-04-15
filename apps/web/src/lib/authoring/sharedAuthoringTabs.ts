export const AUTHORING_TABS = [
  "base",
  "player-info",
  "storyteller-info",
  "actors",
  "counters",
  "assets",
  "locations",
  "encounters",
  "quests",
] as const;

export type AuthoringTab = (typeof AUTHORING_TABS)[number];

export const AUTHORING_TAB_LABELS: Record<AuthoringTab, string> = {
  base: "Base",
  "player-info": "Player Info",
  "storyteller-info": "Storyteller Info",
  actors: "Actors",
  counters: "Counters",
  locations: "Locations",
  encounters: "Encounters",
  quests: "Quests",
  assets: "Assets",
};

export const resolveCompactTitleInputSize = (title: string): number => {
  const trimmedLength = title.trim().length;

  return Math.min(Math.max(trimmedLength + 1, 5), 32);
};
