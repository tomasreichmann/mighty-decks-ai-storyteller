import {
  AUTHORING_TAB_LABELS,
  AUTHORING_TABS,
  type AuthoringTab,
} from "../../lib/authoring/sharedAuthoring";

export const CAMPAIGN_DETAIL_TABS = [...AUTHORING_TABS, "sessions"] as const;
export const STORYTELLER_SESSION_TABS = [
  "chat",
  "base",
  "player-info",
  "storyteller-info",
  "outcomes",
  "effects",
  "stunts",
  "actors",
  "counters",
  "locations",
  "encounters",
  "quests",
  "static-assets",
  "assets",
] as const;

export type CampaignDetailTab = (typeof CAMPAIGN_DETAIL_TABS)[number];
export type StorytellerSessionTab = (typeof STORYTELLER_SESSION_TABS)[number];
export type CampaignTab = CampaignDetailTab | StorytellerSessionTab;

export const CAMPAIGN_TAB_LABELS: Record<CampaignTab, string> = {
  base: "Base",
  "player-info": AUTHORING_TAB_LABELS["player-info"],
  "storyteller-info": AUTHORING_TAB_LABELS["storyteller-info"],
  actors: AUTHORING_TAB_LABELS.actors,
  counters: AUTHORING_TAB_LABELS.counters,
  locations: AUTHORING_TAB_LABELS.locations,
  encounters: AUTHORING_TAB_LABELS.encounters,
  quests: AUTHORING_TAB_LABELS.quests,
  assets: AUTHORING_TAB_LABELS.assets,
  sessions: "Sessions",
  chat: "Chat",
  outcomes: "Outcomes",
  effects: "Effects",
  stunts: "Stunts",
  "static-assets": "Static Assets",
};

export const isCampaignDetailTab = (
  value: string | undefined,
): value is CampaignDetailTab =>
  Boolean(value && CAMPAIGN_DETAIL_TABS.includes(value as CampaignDetailTab));

export const isStorytellerSessionTab = (
  value: string | undefined,
): value is StorytellerSessionTab =>
  Boolean(
    value &&
      STORYTELLER_SESSION_TABS.includes(value as StorytellerSessionTab),
  );

export const isCommonAuthoringCampaignTab = (
  value: string | undefined,
): value is AuthoringTab => Boolean(value && AUTHORING_TABS.includes(value as AuthoringTab));
