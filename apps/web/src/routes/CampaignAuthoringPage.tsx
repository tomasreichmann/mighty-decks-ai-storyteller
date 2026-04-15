import {
  type KeyboardEvent,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import type {
  CampaignDetail,
  CampaignSessionStatus,
  CampaignSessionTableCardReference,
  CampaignSessionTableTarget,
} from "@mighty-decks/spec/campaign";
import type { AdventureModuleIndex } from "@mighty-decks/spec/adventureModule";
import { Message } from "../components/common/Message";
import { Panel } from "../components/common/Panel";
import { Section } from "../components/common/Section";
import { Text } from "../components/common/Text";
import { Button } from "../components/common/Button";
import { ConnectionStatusPill } from "../components/common/ConnectionStatusPill";
import { DepressedInput } from "../components/common/DepressedInput";
import { CampaignSessionTranscriptFeed } from "../components/CampaignSessionTranscriptFeed";
import { MarkdownImageInsertButton } from "../components/MarkdownImageInsertButton";
import { AdventureModuleActorEditor } from "../components/adventure-module/AdventureModuleActorEditor";
import { AdventureModuleActorsTabPanel } from "../components/adventure-module/AdventureModuleActorsTabPanel";
import { AdventureModuleAssetEditor } from "../components/adventure-module/AdventureModuleAssetEditor";
import { AdventureModuleAssetsTabPanel } from "../components/adventure-module/AdventureModuleAssetsTabPanel";
import { AdventureModuleCounterEditor } from "../components/adventure-module/AdventureModuleCounterEditor";
import { AdventureModuleCountersTabPanel } from "../components/adventure-module/AdventureModuleCountersTabPanel";
import { AdventureModuleEncounterEditor } from "../components/adventure-module/AdventureModuleEncounterEditor";
import { AdventureModuleEncountersTabPanel } from "../components/adventure-module/AdventureModuleEncountersTabPanel";
import { AdventureModuleLocationEditor } from "../components/adventure-module/AdventureModuleLocationEditor";
import { AdventureModuleLocationsTabPanel } from "../components/adventure-module/AdventureModuleLocationsTabPanel";
import { AdventureModuleQuestEditor } from "../components/adventure-module/AdventureModuleQuestEditor";
import { AdventureModuleQuestsTabPanel } from "../components/adventure-module/AdventureModuleQuestsTabPanel";
import {
  AutosaveStatusBadge,
  type AutosaveStatus,
} from "../components/adventure-module/AutosaveStatusBadge";
import { AdventureModuleBaseTabPanel } from "../components/adventure-module/AdventureModuleBaseTabPanel";
import { AdventureModulePlayerInfoTabPanel } from "../components/adventure-module/AdventureModulePlayerInfoTabPanel";
import { AdventureModuleStorytellerInfoTabPanel } from "../components/adventure-module/AdventureModuleStorytellerInfoTabPanel";
import {
  AdventureModuleTabNav,
  type AdventureModuleTabItem,
} from "../components/adventure-module/AdventureModuleTabNav";
import { AdventureModuleTabPlaceholder } from "../components/adventure-module/AdventureModuleTabPlaceholder";
import {
  type EntityListItem,
  type EntityListTab,
} from "../components/adventure-module/EntityList";
import type { AdventureModuleLocationPinTarget } from "../components/adventure-module/AdventureModuleLocationMapEditor";
import { CampaignSessionChatLayout } from "../components/session/CampaignSessionChatLayout";
import {
  CampaignSessionSelectionStrip,
  type CampaignSessionSelectionEntry,
} from "../components/session/CampaignSessionSelectionStrip";
import { CampaignSessionTable } from "../components/session/CampaignSessionTable";
import {
  createCampaignActor,
  createCampaignAsset,
  createCampaignCounter,
  createCampaignEncounter,
  createCampaignLocation,
  createCampaignQuest,
  createCampaignSession,
  deleteCampaignActor,
  deleteCampaignAsset,
  deleteCampaignCounter,
  deleteCampaignEncounter,
  deleteCampaignLocation,
  deleteCampaignQuest,
  getCampaignBySlug,
  updateCampaignAsset,
  updateCampaignCounter,
  updateCampaignEncounter,
  updateCampaignActor,
  updateCampaignLocation,
  updateCampaignQuest,
  updateCampaignCoverImage,
  updateCampaignFragment,
  updateCampaignIndex,
} from "../lib/campaignApi";
import { getAdventureModuleCreatorToken } from "../lib/adventureModuleIdentity";
import { getCampaignSessionIdentity } from "../lib/campaignSessionIdentity";
import { normalizeLegacyGameCardMarkdown } from "../lib/gameCardMarkdown";
import { createGameCardCatalogContextValue } from "../lib/gameCardCatalogContext";
import { appendMarkdownSnippet } from "../lib/markdownImage";
import { toMarkdownPlainTextSnippet } from "../lib/markdownSnippet";
import type { SmartInputDocumentContext } from "../lib/smartInputContext";
import { useCampaignSession } from "../hooks/useCampaignSession";
import { useCampaignWatch } from "../hooks/useCampaignWatch";
import { RulesAssetsContent } from "./RulesAssetsPage";
import { RulesEffectsContent } from "./RulesEffectsPage";
import { RulesOutcomesContent } from "./RulesOutcomesPage";
import { RulesStuntsContent } from "./RulesStuntsPage";

const AUTHORING_TABS = [
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

const CAMPAIGN_DETAIL_TABS = [...AUTHORING_TABS, "sessions"] as const;
const STORYTELLER_SESSION_TABS = [
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

type AuthoringTab = (typeof AUTHORING_TABS)[number];
type CampaignDetailTab = (typeof CAMPAIGN_DETAIL_TABS)[number];
type StorytellerSessionTab = (typeof STORYTELLER_SESSION_TABS)[number];
type CampaignTab = CampaignDetailTab | StorytellerSessionTab;

const TAB_LABELS: Record<CampaignTab, string> = {
  base: "Base",
  "player-info": "Player Info",
  "storyteller-info": "Storyteller Info",
  actors: "Actors",
  counters: "Counters",
  locations: "Locations",
  encounters: "Encounters",
  quests: "Quests",
  assets: "Assets",
  sessions: "Sessions",
  chat: "Chat",
  outcomes: "Outcomes",
  effects: "Effects",
  stunts: "Stunts",
  "static-assets": "Static Assets",
};

const resolveCompactTitleInputSize = (title: string): number => {
  const trimmedLength = title.trim().length;

  return Math.min(Math.max(trimmedLength + 1, 5), 32);
};

const formatSessionCreatedAt = (createdAtIso: string): string => {
  const parsed = new Date(createdAtIso);
  if (Number.isNaN(parsed.getTime())) {
    return createdAtIso;
  }

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const resolveSessionStatusTone = (
  status: CampaignSessionStatus,
): "connected" | "reconnecting" | "offline" => {
  switch (status) {
    case "active":
      return "connected";
    case "setup":
      return "reconnecting";
    case "closed":
      return "offline";
    default:
      return "offline";
  }
};

const createTableSelectionId = (): string =>
  `table-selection-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const formatTableSelectionLabel = (
  card: CampaignSessionTableCardReference,
): string => {
  if (card.type === "AssetCard" && card.modifierSlug) {
    return `Asset ${card.slug}/${card.modifierSlug}`;
  }
  return `${card.type.replace("Card", "")} ${card.slug}`;
};

interface StorytellerTableSelectionEntry extends CampaignSessionSelectionEntry {
  card: CampaignSessionTableCardReference;
}

const isCampaignDetailTab = (
  value: string | undefined,
): value is CampaignDetailTab =>
  Boolean(value && CAMPAIGN_DETAIL_TABS.includes(value as CampaignDetailTab));

const isStorytellerSessionTab = (
  value: string | undefined,
): value is StorytellerSessionTab =>
  Boolean(
    value &&
      STORYTELLER_SESSION_TABS.includes(value as StorytellerSessionTab),
  );

const ENTITY_LIST_TABS: EntityListTab[] = [
  "actors",
  "locations",
  "encounters",
  "quests",
];

const isEntityListTab = (
  value: CampaignTab | AuthoringTab,
): value is EntityListTab =>
  ENTITY_LIST_TABS.includes(value as EntityListTab);

const EntityList = lazy(async () => ({
  default: (await import("../components/adventure-module/EntityList")).EntityList,
}));

type EntitySeed = Omit<EntityListItem, "imageUrl">;

const PLACEHOLDER_ENTITY_IMAGE_URLS = [
  "/sample-scene-image.png",
  "/scenes/a-lone-adventurer-among-treasure.png",
  "/scenes/defeating-a-dragon.png",
  "/scenes/defending-an-underground-village.jpg",
] as const;

const withPlaceholderImages = (items: EntitySeed[]): EntityListItem[] =>
  items.map((item, index) => ({
    ...item,
    imageUrl:
      PLACEHOLDER_ENTITY_IMAGE_URLS[
        index % PLACEHOLDER_ENTITY_IMAGE_URLS.length
      ],
  }));

interface EntityTabConfig {
  tabLabel: string;
  singularLabel: string;
  createLabel: string;
  items: EntityListItem[];
}

const ENTITY_TAB_CONFIG: Record<EntityListTab, EntityTabConfig> = {
  actors: {
    tabLabel: "Actors",
    singularLabel: "Actor",
    createLabel: "Create Actor",
    items: withPlaceholderImages([
      {
        slug: "watch-captain-ivra",
        title: "Watch Captain Ivra",
        description:
          "Disciplined city guard captain juggling duty and hidden debt.",
      },
      {
        slug: "clocktower-oracle",
        title: "Clocktower Oracle",
        description: "Reclusive seer who predicts disasters one hour too late.",
      },
      {
        slug: "ragpicker-voss",
        title: "Ragpicker Voss",
        description: "Street informant with a map of every forgotten passage.",
      },
      {
        slug: "lantern-apprentice",
        title: "Lantern Apprentice",
        description: "Young alchemist maintaining unstable city ward-lights.",
      },
      {
        slug: "guild-broker-elm",
        title: "Guild Broker Elm",
        description: "Soft-spoken negotiator who profits from rival panic.",
      },
      {
        slug: "river-smuggler-nyra",
        title: "River Smuggler Nyra",
        description: "Boat pilot moving contraband through flood tunnels.",
      },
      {
        slug: "silent-bailiff",
        title: "Silent Bailiff",
        description:
          "Masked enforcer collecting debts without speaking a word.",
      },
      {
        slug: "choir-archivist",
        title: "Choir Archivist",
        description: "Keeper of forbidden hymns that unlock old machinery.",
      },
    ]),
  },
  locations: {
    tabLabel: "Locations",
    singularLabel: "Location",
    createLabel: "Create Location",
    items: withPlaceholderImages([
      {
        slug: "drowned-gate",
        title: "Drowned Gate",
        description:
          "Half-submerged entry district guarded by rusted portcullis chains.",
      },
      {
        slug: "brass-market",
        title: "Brass Market",
        description: "Noisy bazaar where favors and spare parts trade equally.",
      },
      {
        slug: "ash-cistern",
        title: "Ash Cistern",
        description:
          "Underground reservoir where embers float atop black water.",
      },
      {
        slug: "mirror-bridge",
        title: "Mirror Bridge",
        description:
          "Glass-and-steel crossing reflecting threats before they appear.",
      },
      {
        slug: "hushed-archive",
        title: "Hushed Archive",
        description:
          "Silent library storing censored records and missing names.",
      },
      {
        slug: "smoke-harbor",
        title: "Smoke Harbor",
        description: "Fog-choked docks with hidden berths for illegal cargo.",
      },
      {
        slug: "sunken-courtyard",
        title: "Sunken Courtyard",
        description: "Collapsed plaza now used for midnight negotiations.",
      },
      {
        slug: "catacomb-lift",
        title: "Catacomb Lift",
        description:
          "Ancient freight elevator connecting crypts to upper wards.",
      },
    ]),
  },
  encounters: {
    tabLabel: "Encounters",
    singularLabel: "Encounter",
    createLabel: "Create Encounter",
    items: withPlaceholderImages([
      {
        slug: "bridge-tribute-checkpoint",
        title: "Bridge Tribute Checkpoint",
        description: "Pay, bluff, or fight through an armored toll blockade.",
      },
      {
        slug: "clockwork-blackout",
        title: "Clockwork Blackout",
        description: "Power outage triggers panic while hidden doors unlock.",
      },
      {
        slug: "collapsed-causeway",
        title: "Collapsed Causeway",
        description: "Cross a broken span while debris keeps falling.",
      },
      {
        slug: "market-stampede",
        title: "Market Stampede",
        description:
          "A frightened crowd surges as saboteurs vanish into chaos.",
      },
      {
        slug: "vault-seal-breach",
        title: "Vault Seal Breach",
        description: "Contain a breached relic vault before pressure erupts.",
      },
      {
        slug: "smuggler-ambush",
        title: "Smuggler Ambush",
        description: "River skiffs surround the party in tight canal turns.",
      },
      {
        slug: "catacomb-riddle-lock",
        title: "Catacomb Riddle Lock",
        description: "Solve shifting epitaph clues while pursuers close in.",
      },
      {
        slug: "riot-at-ember-square",
        title: "Riot at Ember Square",
        description: "Choose who to protect when protests become violent.",
      },
    ]),
  },
  quests: {
    tabLabel: "Quests",
    singularLabel: "Quest",
    createLabel: "Create Quest",
    items: withPlaceholderImages([
      {
        slug: "recover-the-shard",
        title: "Recover the Shard",
        description:
          "Retrieve a stolen lantern shard before rival factions claim it.",
      },
      {
        slug: "quiet-the-iron-bell",
        title: "Quiet the Iron Bell",
        description: "Stop a cursed bell toll that attracts night predators.",
      },
      {
        slug: "escort-the-defector",
        title: "Escort the Defector",
        description:
          "Smuggle a guild defector to safety through hostile wards.",
      },
      {
        slug: "break-the-ledger-ring",
        title: "Break the Ledger Ring",
        description:
          "Expose debt-forged contracts controlling local officials.",
      },
      {
        slug: "rebuild-the-sky-pump",
        title: "Rebuild the Sky Pump",
        description:
          "Repair weather engines before toxic fog locks down the city.",
      },
      {
        slug: "seal-the-ember-rift",
        title: "Seal the Ember Rift",
        description:
          "Close a widening fissure feeding heat into old catacombs.",
      },
      {
        slug: "free-the-lantern-choir",
        title: "Free the Lantern Choir",
        description: "Rescue imprisoned singers powering arcane ward systems.",
      },
      {
        slug: "map-the-lost-aqueduct",
        title: "Map the Lost Aqueduct",
        description:
          "Chart hidden channels needed for a final evacuation route.",
      },
    ]),
  },
};

interface BaseFormState {
  title: string;
  premise: string;
  haveTags: string[];
  avoidTags: string[];
}

interface PlayerInfoFormState {
  summary: string;
  infoText: string;
}

interface StorytellerInfoFormState {
  summary: string;
  infoText: string;
}

interface ActorFormState {
  fragmentId: string;
  actorSlug: string;
  title: string;
  summary: string;
  baseLayerSlug: CampaignDetail["actors"][number]["baseLayerSlug"];
  tacticalRoleSlug: CampaignDetail["actors"][number]["tacticalRoleSlug"];
  tacticalSpecialSlug?: CampaignDetail["actors"][number]["tacticalSpecialSlug"];
  isPlayerCharacter: boolean;
  content: string;
}

interface CounterFormState {
  slug: string;
  title: string;
  iconSlug: CampaignDetail["counters"][number]["iconSlug"];
  currentValue: number;
  maxValue?: number;
  description: string;
}

interface AssetFormState {
  fragmentId: string;
  assetSlug: string;
  title: string;
  summary: string;
  modifier: string;
  noun: string;
  nounDescription: string;
  adjectiveDescription: string;
  iconUrl: string;
  overlayUrl: string;
  content: string;
  reauthorRequired: boolean;
}

interface LocationFormState {
  fragmentId: string;
  locationSlug: string;
  title: string;
  summary: string;
  titleImageUrl: string;
  introductionMarkdown: string;
  descriptionMarkdown: string;
  mapImageUrl: string;
  mapPins: CampaignDetail["locations"][number]["mapPins"];
}

interface EncounterFormState {
  fragmentId: string;
  encounterSlug: string;
  title: string;
  summary: string;
  prerequisites: string;
  titleImageUrl: string;
  content: string;
}

interface QuestFormState {
  fragmentId: string;
  questSlug: string;
  title: string;
  summary: string;
  titleImageUrl: string;
  content: string;
}

const toBaseFormState = (index: AdventureModuleIndex): BaseFormState => ({
  title: index.title,
  premise: index.premise,
  haveTags: [...index.dos],
  avoidTags: [...index.donts],
});

const resolvePlayerSummaryState = (
  detail: CampaignDetail,
): {
  summaryMarkdown: string;
  summaryPreview: string;
  infoText: string;
  fragmentId: string;
} | null => {
  const fragmentId = detail.index.playerSummaryFragmentId;
  const fragmentRef = detail.index.fragments.find(
    (fragment) => fragment.fragmentId === fragmentId,
  );
  const fragmentRecord = detail.fragments.find(
    (fragment) => fragment.fragment.fragmentId === fragmentId,
  );
  if (!fragmentRef || !fragmentRecord) {
    return null;
  }
  const summaryMarkdown =
    detail.index.playerSummaryMarkdown.trim().length > 0
      ? detail.index.playerSummaryMarkdown
      : (fragmentRef.summary ?? "");
  return {
    fragmentId,
    summaryMarkdown,
    summaryPreview: fragmentRef.summary ?? "",
    infoText: fragmentRecord.content,
  };
};

const toPlayerInfoFormState = (
  detail: CampaignDetail,
): PlayerInfoFormState => {
  const summaryState = resolvePlayerSummaryState(detail);
  if (!summaryState) {
    return {
      summary: "",
      infoText: "",
    };
  }
  return {
    summary: normalizeLegacyGameCardMarkdown(summaryState.summaryMarkdown),
    infoText: normalizeLegacyGameCardMarkdown(summaryState.infoText),
  };
};

const resolveStorytellerSummaryState = (
  detail: CampaignDetail,
): {
  summaryMarkdown: string;
  summaryPreview: string;
  infoText: string;
  fragmentId: string;
} | null => {
  const fragmentId = detail.index.storytellerSummaryFragmentId;
  const fragmentRef = detail.index.fragments.find(
    (fragment) => fragment.fragmentId === fragmentId,
  );
  const fragmentRecord = detail.fragments.find(
    (fragment) => fragment.fragment.fragmentId === fragmentId,
  );
  if (!fragmentRef || !fragmentRecord) {
    return null;
  }
  const summaryMarkdown =
    detail.index.storytellerSummaryMarkdown.trim().length > 0
      ? detail.index.storytellerSummaryMarkdown
      : (fragmentRef.summary ?? "");
  return {
    fragmentId,
    summaryMarkdown,
    summaryPreview: fragmentRef.summary ?? "",
    infoText: fragmentRecord.content,
  };
};

const toStorytellerInfoFormState = (
  detail: CampaignDetail,
): StorytellerInfoFormState => {
  const summaryState = resolveStorytellerSummaryState(detail);
  if (!summaryState) {
    return {
      summary: "",
      infoText: "",
    };
  }
  return {
    summary: normalizeLegacyGameCardMarkdown(summaryState.summaryMarkdown),
    infoText: normalizeLegacyGameCardMarkdown(summaryState.infoText),
  };
};

const toActorFormState = (
  actor: CampaignDetail["actors"][number],
): ActorFormState => ({
  fragmentId: actor.fragmentId,
  actorSlug: actor.actorSlug,
  title: actor.title,
  summary: actor.summary ?? "",
  baseLayerSlug: actor.baseLayerSlug,
  tacticalRoleSlug: actor.tacticalRoleSlug,
  tacticalSpecialSlug: actor.tacticalSpecialSlug,
  isPlayerCharacter: actor.isPlayerCharacter,
  content: normalizeLegacyGameCardMarkdown(actor.content),
});

const toCounterFormState = (
  counter: CampaignDetail["counters"][number],
): CounterFormState => ({
  slug: counter.slug,
  title: counter.title,
  iconSlug: counter.iconSlug,
  currentValue: counter.currentValue,
  maxValue: counter.maxValue,
  description: counter.description ?? "",
});

const toAssetFormState = (
  asset: CampaignDetail["assets"][number],
): AssetFormState => ({
  fragmentId: asset.fragmentId,
  assetSlug: asset.assetSlug,
  title: asset.title,
  summary: asset.summary ?? "",
  modifier: asset.kind === "custom" ? asset.modifier : "",
  noun: asset.kind === "custom" ? asset.noun : "",
  nounDescription: asset.kind === "custom" ? asset.nounDescription : "",
  adjectiveDescription:
    asset.kind === "custom" ? asset.adjectiveDescription : "",
  iconUrl: asset.kind === "custom" ? asset.iconUrl : "",
  overlayUrl: asset.kind === "custom" ? asset.overlayUrl : "",
  content: normalizeLegacyGameCardMarkdown(asset.content),
  reauthorRequired: asset.kind === "legacy_layered",
});

const toLocationFormState = (
  location: CampaignDetail["locations"][number],
): LocationFormState => ({
  fragmentId: location.fragmentId,
  locationSlug: location.locationSlug,
  title: location.title,
  summary: location.summary ?? "",
  titleImageUrl: location.titleImageUrl ?? "",
  introductionMarkdown: normalizeLegacyGameCardMarkdown(
    location.introductionMarkdown,
  ),
  descriptionMarkdown: normalizeLegacyGameCardMarkdown(
    location.descriptionMarkdown,
  ),
  mapImageUrl: location.mapImageUrl ?? "",
  mapPins: location.mapPins.map((pin) => ({ ...pin })),
});

const toEncounterFormState = (
  encounter: CampaignDetail["encounters"][number],
): EncounterFormState => ({
  fragmentId: encounter.fragmentId,
  encounterSlug: encounter.encounterSlug,
  title: encounter.title,
  summary: encounter.summary ?? "",
  prerequisites: encounter.prerequisites,
  titleImageUrl: encounter.titleImageUrl ?? "",
  content: normalizeLegacyGameCardMarkdown(encounter.content),
});

const toQuestFormState = (
  quest: CampaignDetail["quests"][number],
): QuestFormState => ({
  fragmentId: quest.fragmentId,
  questSlug: quest.questSlug,
  title: quest.title,
  summary: quest.summary ?? "",
  titleImageUrl: quest.titleImageUrl ?? "",
  content: normalizeLegacyGameCardMarkdown(quest.content),
});

const clampCounterValue = (currentValue: number, maxValue?: number): number => {
  const normalizedCurrentValue = Math.max(0, Math.trunc(currentValue));
  if (typeof maxValue !== "number") {
    return normalizedCurrentValue;
  }
  return Math.min(normalizedCurrentValue, Math.max(0, Math.trunc(maxValue)));
};

const toEntitySlug = (value: string): string => {
  const normalized = value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized.length > 0 ? normalized.slice(0, 120) : "untitled";
};

const makeUniqueCounterSlug = (
  title: string,
  detail: CampaignDetail,
  excludeSlug: string,
): string => {
  const baseSlug = toEntitySlug(title);
  const existingSlugs = new Set(
    detail.counters
      .filter((counter) => counter.slug !== excludeSlug)
      .map((counter) => counter.slug),
  );

  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  for (let suffix = 2; suffix < 10_000; suffix += 1) {
    const candidate = toEntitySlug(`${baseSlug}-${suffix}`);
    if (!existingSlugs.has(candidate)) {
      return candidate;
    }
  }

  return baseSlug;
};

const makeUniqueAssetSlug = (
  title: string,
  detail: CampaignDetail,
  excludeSlug: string,
): string => {
  const baseSlug = toEntitySlug(title);
  const existingSlugs = new Set(
    detail.assets
      .filter((asset) => asset.assetSlug !== excludeSlug)
      .map((asset) => asset.assetSlug),
  );

  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  for (let suffix = 2; suffix < 10_000; suffix += 1) {
    const candidate = toEntitySlug(`${baseSlug}-${suffix}`);
    if (!existingSlugs.has(candidate)) {
      return candidate;
    }
  }

  return baseSlug;
};

const replaceCounterInDetail = (
  detail: CampaignDetail,
  nextCounter: CampaignDetail["counters"][number],
): CampaignDetail => ({
  ...detail,
  index: {
    ...detail.index,
    counters: detail.index.counters.map((counter) =>
      counter.slug === nextCounter.slug ? nextCounter : counter,
    ),
  },
  counters: detail.counters.map((counter) =>
    counter.slug === nextCounter.slug ? nextCounter : counter,
  ),
});

const normalizeTagEntry = (value: string): string =>
  value.trim().replace(/\s+/g, " ");

const parseTagEntries = (
  values: string[],
  label: "Have" | "Avoid",
): { entries: string[]; error?: string } => {
  const entries: string[] = [];
  const seen = new Set<string>();

  for (const [index, rawEntry] of values.entries()) {
    const entry = normalizeTagEntry(rawEntry);
    if (!entry) {
      continue;
    }

    if (entry.length > 160) {
      return {
        entries,
        error: `${label} tag ${index + 1} exceeds 160 characters.`,
      };
    }

    const key = entry.toLocaleLowerCase();
    if (seen.has(key)) {
      return {
        entries,
        error: `${label} has duplicate tag "${entry}".`,
      };
    }
    seen.add(key);
    entries.push(entry);
  }

  if (entries.length > 12) {
    return {
      entries,
      error: `${label} can have at most 12 tags.`,
    };
  }

  return { entries };
};

const validateBaseForm = (
  form: BaseFormState,
): {
  title: string;
  premise: string;
  dos: string[];
  donts: string[];
  error?: string;
} => {
  const title = form.title.trim();
  if (title.length === 0) {
    return {
      title,
      premise: form.premise.trim(),
      dos: [],
      donts: [],
      error: "Title is required.",
    };
  }
  if (title.length > 120) {
    return {
      title,
      premise: form.premise.trim(),
      dos: [],
      donts: [],
      error: "Title must be at most 120 characters.",
    };
  }

  const premise = form.premise.trim();
  if (premise.length === 0) {
    return {
      title,
      premise,
      dos: [],
      donts: [],
      error: "Premise is required.",
    };
  }
  if (premise.length > 500) {
    return {
      title,
      premise,
      dos: [],
      donts: [],
      error: "Premise must be at most 500 characters.",
    };
  }

  const parsedHave = parseTagEntries(form.haveTags, "Have");
  if (parsedHave.error) {
    return {
      title,
      premise,
      dos: parsedHave.entries,
      donts: [],
      error: parsedHave.error,
    };
  }

  const parsedAvoid = parseTagEntries(form.avoidTags, "Avoid");
  if (parsedAvoid.error) {
    return {
      title,
      premise,
      dos: parsedHave.entries,
      donts: parsedAvoid.entries,
      error: parsedAvoid.error,
    };
  }

  return {
    title,
    premise,
    dos: parsedHave.entries,
    donts: parsedAvoid.entries,
  };
};

const validatePlayerInfoForm = (
  form: PlayerInfoFormState,
): {
  summary: string;
  infoText: string;
  error?: string;
} => {
  const summary = form.summary;
  const normalizedSummary = normalizeLegacyGameCardMarkdown(summary);
  if (normalizedSummary.length > 200000) {
    return {
      summary: normalizedSummary,
      infoText: form.infoText,
      error: "Player summary markdown must be at most 200000 characters.",
    };
  }
  const normalizedInfoText = normalizeLegacyGameCardMarkdown(form.infoText);
  if (normalizedInfoText.length > 200000) {
    return {
      summary: normalizedSummary,
      infoText: normalizedInfoText,
      error: "Player info text must be at most 200000 characters.",
    };
  }
  return {
    summary: normalizedSummary,
    infoText: normalizedInfoText,
  };
};

const validateStorytellerInfoForm = (
  form: StorytellerInfoFormState,
): {
  summary: string;
  infoText: string;
  error?: string;
} => {
  const summary = form.summary;
  const normalizedSummary = normalizeLegacyGameCardMarkdown(summary);
  if (normalizedSummary.length > 200000) {
    return {
      summary: normalizedSummary,
      infoText: form.infoText,
      error: "Storyteller summary markdown must be at most 200000 characters.",
    };
  }
  const normalizedInfoText = normalizeLegacyGameCardMarkdown(form.infoText);
  if (normalizedInfoText.length > 200000) {
    return {
      summary: normalizedSummary,
      infoText: normalizedInfoText,
      error: "Storyteller info text must be at most 200000 characters.",
    };
  }
  return {
    summary: normalizedSummary,
    infoText: normalizedInfoText,
  };
};

const validateActorForm = (
  form: ActorFormState,
): {
  title: string;
  summary: string;
  baseLayerSlug: ActorFormState["baseLayerSlug"];
  tacticalRoleSlug: ActorFormState["tacticalRoleSlug"];
  tacticalSpecialSlug?: ActorFormState["tacticalSpecialSlug"];
  isPlayerCharacter: boolean;
  content: string;
  error?: string;
} => {
  const title = form.title.trim();
  if (title.length === 0) {
    return {
      title,
      summary: form.summary.trim(),
      baseLayerSlug: form.baseLayerSlug,
      tacticalRoleSlug: form.tacticalRoleSlug,
      tacticalSpecialSlug: form.tacticalSpecialSlug,
      isPlayerCharacter: form.isPlayerCharacter,
      content: normalizeLegacyGameCardMarkdown(form.content),
      error: "Actor name is required.",
    };
  }
  if (title.length > 120) {
    return {
      title,
      summary: form.summary.trim(),
      baseLayerSlug: form.baseLayerSlug,
      tacticalRoleSlug: form.tacticalRoleSlug,
      tacticalSpecialSlug: form.tacticalSpecialSlug,
      isPlayerCharacter: form.isPlayerCharacter,
      content: normalizeLegacyGameCardMarkdown(form.content),
      error: "Actor name must be at most 120 characters.",
    };
  }

  const summary = form.summary.trim();
  if (summary.length > 500) {
    return {
      title,
      summary,
      baseLayerSlug: form.baseLayerSlug,
      tacticalRoleSlug: form.tacticalRoleSlug,
      tacticalSpecialSlug: form.tacticalSpecialSlug,
      isPlayerCharacter: form.isPlayerCharacter,
      content: normalizeLegacyGameCardMarkdown(form.content),
      error: "Actor summary must be at most 500 characters.",
    };
  }

  const content = normalizeLegacyGameCardMarkdown(form.content);
  if (content.length > 200_000) {
    return {
      title,
      summary,
      baseLayerSlug: form.baseLayerSlug,
      tacticalRoleSlug: form.tacticalRoleSlug,
      tacticalSpecialSlug: form.tacticalSpecialSlug,
      isPlayerCharacter: form.isPlayerCharacter,
      content,
      error: "Actor markdown must be at most 200000 characters.",
    };
  }

  return {
    title,
    summary,
    baseLayerSlug: form.baseLayerSlug,
    tacticalRoleSlug: form.tacticalRoleSlug,
    tacticalSpecialSlug: form.tacticalSpecialSlug,
    isPlayerCharacter: form.isPlayerCharacter,
    content,
  };
};

const validateCounterForm = (
  form: CounterFormState,
): {
  title: string;
  iconSlug: CounterFormState["iconSlug"];
  currentValue: number;
  maxValue?: number;
  description: string;
  error?: string;
} => {
  const title = form.title.trim();
  if (title.length === 0) {
    return {
      title,
      iconSlug: form.iconSlug,
      currentValue: clampCounterValue(form.currentValue, form.maxValue),
      maxValue: form.maxValue,
      description: form.description.trim(),
      error: "Counter name is required.",
    };
  }
  if (title.length > 120) {
    return {
      title,
      iconSlug: form.iconSlug,
      currentValue: clampCounterValue(form.currentValue, form.maxValue),
      maxValue: form.maxValue,
      description: form.description.trim(),
      error: "Counter name must be at most 120 characters.",
    };
  }

  const description = form.description.trim();
  if (description.length > 500) {
    return {
      title,
      iconSlug: form.iconSlug,
      currentValue: clampCounterValue(form.currentValue, form.maxValue),
      maxValue: form.maxValue,
      description,
      error: "Counter description must be at most 500 characters.",
    };
  }

  const maxValue =
    typeof form.maxValue === "number" ? Math.max(0, Math.trunc(form.maxValue)) : undefined;
  const currentValue = clampCounterValue(form.currentValue, maxValue);

  return {
    title,
    iconSlug: form.iconSlug,
    currentValue,
    maxValue,
    description,
  };
};

const validateAssetForm = (
  form: AssetFormState,
): {
  title: string;
  summary: string;
  modifier: string;
  noun: string;
  nounDescription: string;
  adjectiveDescription: string;
  iconUrl: string;
  overlayUrl: string;
  content: string;
  error?: string;
} => {
  const title = form.title.trim();
  const summary = form.summary.trim();
  const modifier = form.modifier.trim();
  const noun = form.noun.trim();
  const nounDescription = form.nounDescription.trim();
  const adjectiveDescription = form.adjectiveDescription.trim();
  const iconUrl = form.iconUrl.trim();
  const overlayUrl = form.overlayUrl.trim();
  const content = normalizeLegacyGameCardMarkdown(form.content);

  if (title.length === 0) {
    return {
      title,
      summary,
      modifier,
      noun,
      nounDescription,
      adjectiveDescription,
      iconUrl,
      overlayUrl,
      content,
      error: "Asset name is required.",
    };
  }
  if (title.length > 120) {
    return {
      title,
      summary,
      modifier,
      noun,
      nounDescription,
      adjectiveDescription,
      iconUrl,
      overlayUrl,
      content,
      error: "Asset name must be at most 120 characters.",
    };
  }

  if (summary.length > 500) {
    return {
      title,
      summary,
      modifier,
      noun,
      nounDescription,
      adjectiveDescription,
      iconUrl,
      overlayUrl,
      content,
      error: "Asset summary must be at most 500 characters.",
    };
  }

  if (modifier.length > 120) {
    return {
      title,
      summary,
      modifier,
      noun,
      nounDescription,
      adjectiveDescription,
      iconUrl,
      overlayUrl,
      content,
      error: "Asset modifier must be at most 120 characters.",
    };
  }

  if (noun.length === 0) {
    return {
      title,
      summary,
      modifier,
      noun,
      nounDescription,
      adjectiveDescription,
      iconUrl,
      overlayUrl,
      content,
      error: "Asset noun is required.",
    };
  }

  if (noun.length > 120) {
    return {
      title,
      summary,
      modifier,
      noun,
      nounDescription,
      adjectiveDescription,
      iconUrl,
      overlayUrl,
      content,
      error: "Asset noun must be at most 120 characters.",
    };
  }

  if (nounDescription.length === 0) {
    return {
      title,
      summary,
      modifier,
      noun,
      nounDescription,
      adjectiveDescription,
      iconUrl,
      overlayUrl,
      content,
      error: "Asset noun description is required.",
    };
  }

  if (nounDescription.length > 500) {
    return {
      title,
      summary,
      modifier,
      noun,
      nounDescription,
      adjectiveDescription,
      iconUrl,
      overlayUrl,
      content,
      error: "Asset noun description must be at most 500 characters.",
    };
  }

  if (adjectiveDescription.length > 500) {
    return {
      title,
      summary,
      modifier,
      noun,
      nounDescription,
      adjectiveDescription,
      iconUrl,
      overlayUrl,
      content,
      error: "Asset adjective description must be at most 500 characters.",
    };
  }

  if (iconUrl.length === 0) {
    return {
      title,
      summary,
      modifier,
      noun,
      nounDescription,
      adjectiveDescription,
      iconUrl,
      overlayUrl,
      content,
      error: "Asset icon URL is required.",
    };
  }

  if (iconUrl.length > 500) {
    return {
      title,
      summary,
      modifier,
      noun,
      nounDescription,
      adjectiveDescription,
      iconUrl,
      overlayUrl,
      content,
      error: "Asset icon URL must be at most 500 characters.",
    };
  }

  if (overlayUrl.length > 500) {
    return {
      title,
      summary,
      modifier,
      noun,
      nounDescription,
      adjectiveDescription,
      iconUrl,
      overlayUrl,
      content,
      error: "Asset overlay URL must be at most 500 characters.",
    };
  }

  if (content.length > 200_000) {
    return {
      title,
      summary,
      modifier,
      noun,
      nounDescription,
      adjectiveDescription,
      iconUrl,
      overlayUrl,
      content,
      error: "Asset markdown must be at most 200000 characters.",
    };
  }

  return {
    title,
    summary,
    modifier,
    noun,
    nounDescription,
    adjectiveDescription,
    iconUrl,
    overlayUrl,
    content,
  };
};

const validateLocationForm = (
  form: LocationFormState,
): {
  title: string;
  summary: string;
  titleImageUrl: string | null;
  introductionMarkdown: string;
  descriptionMarkdown: string;
  mapImageUrl: string | null;
  mapPins: LocationFormState["mapPins"];
  error?: string;
} => {
  const title = form.title.trim();
  if (title.length === 0) {
    return {
      title,
      summary: form.summary.trim(),
      titleImageUrl: form.titleImageUrl.trim() || null,
      introductionMarkdown: normalizeLegacyGameCardMarkdown(
        form.introductionMarkdown,
      ),
      descriptionMarkdown: normalizeLegacyGameCardMarkdown(
        form.descriptionMarkdown,
      ),
      mapImageUrl: form.mapImageUrl.trim() || null,
      mapPins: form.mapPins.map((pin) => ({ ...pin })),
      error: "Location name is required.",
    };
  }
  if (title.length > 120) {
    return {
      title,
      summary: form.summary.trim(),
      titleImageUrl: form.titleImageUrl.trim() || null,
      introductionMarkdown: normalizeLegacyGameCardMarkdown(
        form.introductionMarkdown,
      ),
      descriptionMarkdown: normalizeLegacyGameCardMarkdown(
        form.descriptionMarkdown,
      ),
      mapImageUrl: form.mapImageUrl.trim() || null,
      mapPins: form.mapPins.map((pin) => ({ ...pin })),
      error: "Location name must be at most 120 characters.",
    };
  }

  const summary = form.summary.trim();
  if (summary.length > 500) {
    return {
      title,
      summary,
      titleImageUrl: form.titleImageUrl.trim() || null,
      introductionMarkdown: normalizeLegacyGameCardMarkdown(
        form.introductionMarkdown,
      ),
      descriptionMarkdown: normalizeLegacyGameCardMarkdown(
        form.descriptionMarkdown,
      ),
      mapImageUrl: form.mapImageUrl.trim() || null,
      mapPins: form.mapPins.map((pin) => ({ ...pin })),
      error: "Location summary must be at most 500 characters.",
    };
  }

  const titleImageUrl = form.titleImageUrl.trim();
  if (titleImageUrl.length > 500) {
    return {
      title,
      summary,
      titleImageUrl: titleImageUrl.slice(0, 500),
      introductionMarkdown: normalizeLegacyGameCardMarkdown(
        form.introductionMarkdown,
      ),
      descriptionMarkdown: normalizeLegacyGameCardMarkdown(
        form.descriptionMarkdown,
      ),
      mapImageUrl: form.mapImageUrl.trim() || null,
      mapPins: form.mapPins.map((pin) => ({ ...pin })),
      error: "Title image URL must be at most 500 characters.",
    };
  }

  const introductionMarkdown = normalizeLegacyGameCardMarkdown(
    form.introductionMarkdown,
  );
  if (introductionMarkdown.length > 200_000) {
    return {
      title,
      summary,
      titleImageUrl: titleImageUrl || null,
      introductionMarkdown,
      descriptionMarkdown: normalizeLegacyGameCardMarkdown(
        form.descriptionMarkdown,
      ),
      mapImageUrl: form.mapImageUrl.trim() || null,
      mapPins: form.mapPins.map((pin) => ({ ...pin })),
      error: "Introduction markdown must be at most 200000 characters.",
    };
  }

  const descriptionMarkdown = normalizeLegacyGameCardMarkdown(
    form.descriptionMarkdown,
  );
  if (descriptionMarkdown.length > 200_000) {
    return {
      title,
      summary,
      titleImageUrl: titleImageUrl || null,
      introductionMarkdown,
      descriptionMarkdown,
      mapImageUrl: form.mapImageUrl.trim() || null,
      mapPins: form.mapPins.map((pin) => ({ ...pin })),
      error: "Description markdown must be at most 200000 characters.",
    };
  }

  const mapImageUrl = form.mapImageUrl.trim();
  if (mapImageUrl.length > 500) {
    return {
      title,
      summary,
      titleImageUrl: titleImageUrl || null,
      introductionMarkdown,
      descriptionMarkdown,
      mapImageUrl: mapImageUrl.slice(0, 500),
      mapPins: form.mapPins.map((pin) => ({ ...pin })),
      error: "Map image URL must be at most 500 characters.",
    };
  }

  return {
    title,
    summary,
    titleImageUrl: titleImageUrl || null,
    introductionMarkdown,
    descriptionMarkdown,
    mapImageUrl: mapImageUrl || null,
    mapPins: form.mapPins.map((pin) => ({ ...pin })),
  };
};

const validateEncounterForm = (
  form: EncounterFormState,
): {
  title: string;
  summary: string;
  prerequisites: string;
  titleImageUrl: string | null;
  content: string;
  error?: string;
} => {
  const title = form.title.trim();
  if (title.length === 0) {
    return {
      title,
      summary: form.summary.trim(),
      prerequisites: form.prerequisites.trim(),
      titleImageUrl: form.titleImageUrl.trim() || null,
      content: normalizeLegacyGameCardMarkdown(form.content),
      error: "Encounter name is required.",
    };
  }
  if (title.length > 120) {
    return {
      title,
      summary: form.summary.trim(),
      prerequisites: form.prerequisites.trim(),
      titleImageUrl: form.titleImageUrl.trim() || null,
      content: normalizeLegacyGameCardMarkdown(form.content),
      error: "Encounter name must be at most 120 characters.",
    };
  }

  const summary = form.summary.trim();
  if (summary.length > 500) {
    return {
      title,
      summary,
      prerequisites: form.prerequisites.trim(),
      titleImageUrl: form.titleImageUrl.trim() || null,
      content: normalizeLegacyGameCardMarkdown(form.content),
      error: "Encounter summary must be at most 500 characters.",
    };
  }

  const prerequisites = form.prerequisites.trim();
  if (prerequisites.length > 240) {
    return {
      title,
      summary,
      prerequisites: prerequisites.slice(0, 240),
      titleImageUrl: form.titleImageUrl.trim() || null,
      content: normalizeLegacyGameCardMarkdown(form.content),
      error: "Encounter prerequisites must be at most 240 characters.",
    };
  }

  const titleImageUrl = form.titleImageUrl.trim();
  if (titleImageUrl.length > 500) {
    return {
      title,
      summary,
      prerequisites,
      titleImageUrl: titleImageUrl.slice(0, 500),
      content: normalizeLegacyGameCardMarkdown(form.content),
      error: "Title image URL must be at most 500 characters.",
    };
  }

  const content = normalizeLegacyGameCardMarkdown(form.content);
  if (content.length > 200_000) {
    return {
      title,
      summary,
      prerequisites,
      titleImageUrl: titleImageUrl || null,
      content,
      error: "Encounter markdown must be at most 200000 characters.",
    };
  }

  return {
    title,
    summary,
    prerequisites,
    titleImageUrl: titleImageUrl || null,
    content,
  };
};

const validateQuestForm = (
  form: QuestFormState,
): {
  title: string;
  summary: string;
  titleImageUrl: string | null;
  content: string;
  error?: string;
} => {
  const title = form.title.trim();
  if (title.length === 0) {
    return {
      title,
      summary: form.summary.trim(),
      titleImageUrl: form.titleImageUrl.trim() || null,
      content: normalizeLegacyGameCardMarkdown(form.content),
      error: "Quest name is required.",
    };
  }
  if (title.length > 120) {
    return {
      title,
      summary: form.summary.trim(),
      titleImageUrl: form.titleImageUrl.trim() || null,
      content: normalizeLegacyGameCardMarkdown(form.content),
      error: "Quest name must be at most 120 characters.",
    };
  }

  const summary = form.summary.trim();
  if (summary.length > 500) {
    return {
      title,
      summary,
      titleImageUrl: form.titleImageUrl.trim() || null,
      content: normalizeLegacyGameCardMarkdown(form.content),
      error: "Quest summary must be at most 500 characters.",
    };
  }

  const titleImageUrl = form.titleImageUrl.trim();
  if (titleImageUrl.length > 500) {
    return {
      title,
      summary,
      titleImageUrl: titleImageUrl.slice(0, 500),
      content: normalizeLegacyGameCardMarkdown(form.content),
      error: "Title image URL must be at most 500 characters.",
    };
  }

  const content = normalizeLegacyGameCardMarkdown(form.content);
  if (content.length > 200_000) {
    return {
      title,
      summary,
      titleImageUrl: titleImageUrl || null,
      content,
      error: "Quest markdown must be at most 200000 characters.",
    };
  }

  return {
    title,
    summary,
    titleImageUrl: titleImageUrl || null,
    content,
  };
};

export const CampaignAuthoringPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { slug, campaignSlug, sessionId, tab, entityId } = useParams<{
    slug?: string;
    campaignSlug?: string;
    sessionId?: string;
    tab?: string;
    entityId?: string;
  }>();
  const creatorToken = useMemo(() => getAdventureModuleCreatorToken(), []);
  const routeSlug = campaignSlug ?? slug;
  const storytellerSessionMode = Boolean(campaignSlug && sessionId);
  const storytellerIdentity = useMemo(
    () =>
      storytellerSessionMode && routeSlug && sessionId
        ? getCampaignSessionIdentity(routeSlug, sessionId, "storyteller")
        : null,
    [routeSlug, sessionId, storytellerSessionMode],
  );
  const [moduleDetail, setModuleDetail] =
    useState<CampaignDetail | null>(null);
  const [baseForm, setBaseForm] = useState<BaseFormState>({
    title: "",
    premise: "",
    haveTags: [],
    avoidTags: [],
  });
  const [playerInfoForm, setPlayerInfoForm] = useState<PlayerInfoFormState>({
    summary: "",
    infoText: "",
  });
  const [storytellerInfoForm, setStorytellerInfoForm] =
    useState<StorytellerInfoFormState>({
      summary: "",
      infoText: "",
    });
  const [actorForm, setActorForm] = useState<ActorFormState | null>(null);
  const [locationForm, setLocationForm] = useState<LocationFormState | null>(
    null,
  );
  const [encounterForm, setEncounterForm] = useState<EncounterFormState | null>(
    null,
  );
  const [questForm, setQuestForm] = useState<QuestFormState | null>(null);
  const [counterForm, setCounterForm] = useState<CounterFormState | null>(null);
  const [assetForm, setAssetForm] = useState<AssetFormState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [baseDirty, setBaseDirty] = useState(false);
  const [playerInfoDirty, setPlayerInfoDirty] = useState(false);
  const [storytellerInfoDirty, setStorytellerInfoDirty] = useState(false);
  const [actorDirty, setActorDirty] = useState(false);
  const [locationDirty, setLocationDirty] = useState(false);
  const [encounterDirty, setEncounterDirty] = useState(false);
  const [questDirty, setQuestDirty] = useState(false);
  const [counterDirty, setCounterDirty] = useState(false);
  const [assetDirty, setAssetDirty] = useState(false);
  const [baseValidationMessage, setBaseValidationMessage] = useState<
    string | null
  >(null);
  const [playerInfoValidationMessage, setPlayerInfoValidationMessage] =
    useState<string | null>(null);
  const [
    storytellerInfoValidationMessage,
    setStorytellerInfoValidationMessage,
  ] = useState<string | null>(null);
  const [actorValidationMessage, setActorValidationMessage] = useState<
    string | null
  >(null);
  const [locationValidationMessage, setLocationValidationMessage] = useState<
    string | null
  >(null);
  const [encounterValidationMessage, setEncounterValidationMessage] = useState<
    string | null
  >(null);
  const [questValidationMessage, setQuestValidationMessage] = useState<
    string | null
  >(null);
  const [counterValidationMessage, setCounterValidationMessage] = useState<string | null>(
    null,
  );
  const [assetValidationMessage, setAssetValidationMessage] = useState<string | null>(
    null,
  );
  const [actorCreateError, setActorCreateError] = useState<string | null>(null);
  const [locationCreateError, setLocationCreateError] = useState<string | null>(
    null,
  );
  const [encounterCreateError, setEncounterCreateError] = useState<string | null>(
    null,
  );
  const [questCreateError, setQuestCreateError] = useState<string | null>(null);
  const [counterCreateError, setCounterCreateError] = useState<string | null>(null);
  const [assetCreateError, setAssetCreateError] = useState<string | null>(null);
  const [creatingActor, setCreatingActor] = useState(false);
  const [creatingLocation, setCreatingLocation] = useState(false);
  const [creatingEncounter, setCreatingEncounter] = useState(false);
  const [creatingQuest, setCreatingQuest] = useState(false);
  const [creatingCounter, setCreatingCounter] = useState(false);
  const [creatingAsset, setCreatingAsset] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>("idle");
  const [autosaveMessage, setAutosaveMessage] = useState<string | undefined>(
    undefined,
  );
  const [creatingSession, setCreatingSession] = useState(false);
  const [chatDraft, setChatDraft] = useState("");
  const [tableSelection, setTableSelection] = useState<
    StorytellerTableSelectionEntry[]
  >([]);
  const saveTimerRef = useRef<number | null>(null);
  const savingRef = useRef(false);
  const sessionRealtime = useCampaignSession({
    campaignSlug: routeSlug ?? "campaign",
    sessionId: sessionId ?? "session",
    enabled: storytellerSessionMode && Boolean(routeSlug && sessionId),
  });
  const campaignWatch = useCampaignWatch({
    enabled: !storytellerSessionMode && Boolean(routeSlug),
  });
  const campaignWatchConnected = campaignWatch.connected;
  const watchedCampaignUpdatedAtIso = campaignWatch.campaignUpdatedAtIso;
  const watchCampaign = campaignWatch.watchCampaign;
  const unwatchCampaign = campaignWatch.unwatchCampaign;
  const storytellerSessionUpdatedAtIso = sessionRealtime.campaignUpdatedAtIso;
  const storytellerSessionConnected = sessionRealtime.connected;
  const ensureStorytellerSessionRole = sessionRealtime.ensureSessionRole;
  const validTab = storytellerSessionMode
    ? isStorytellerSessionTab(tab)
    : isCampaignDetailTab(tab);

  useEffect(() => {
    if (storytellerSessionMode || !routeSlug || !campaignWatchConnected) {
      return;
    }

    watchCampaign(routeSlug);

    return () => {
      unwatchCampaign(routeSlug);
    };
  }, [
    campaignWatchConnected,
    routeSlug,
    storytellerSessionMode,
    unwatchCampaign,
    watchCampaign,
  ]);

  useEffect(() => {
    if (!routeSlug || validTab) {
      return;
    }
    navigate(
      storytellerSessionMode && sessionId
        ? `/campaign/${encodeURIComponent(routeSlug)}/session/${encodeURIComponent(sessionId)}/storyteller/chat`
        : `/campaign/${encodeURIComponent(routeSlug)}/player-info`,
      {
        replace: true,
      },
    );
  }, [navigate, routeSlug, sessionId, storytellerSessionMode, validTab]);

  const activeTab: CampaignTab = storytellerSessionMode
    ? isStorytellerSessionTab(tab)
      ? tab
      : "chat"
    : isCampaignDetailTab(tab)
      ? tab
      : "player-info";
  const tabItems = useMemo<AdventureModuleTabItem[]>(
    () =>
      (storytellerSessionMode
        ? STORYTELLER_SESSION_TABS
        : CAMPAIGN_DETAIL_TABS
      ).map((tabId) => ({
        id: tabId,
        label:
          storytellerSessionMode && tabId === "assets"
            ? "Custom Assets"
            : TAB_LABELS[tabId],
      })),
    [storytellerSessionMode],
  );
  const buildCampaignRoute = useCallback(
    (
      nextSlug: string,
      nextTab: CampaignTab | AuthoringTab,
      nextEntityId?: string,
    ): string => {
      const encodedSlug = encodeURIComponent(nextSlug);
      const suffix = nextEntityId ? `/${encodeURIComponent(nextEntityId)}` : "";

      if (storytellerSessionMode && sessionId) {
        return `/campaign/${encodedSlug}/session/${encodeURIComponent(sessionId)}/storyteller/${nextTab}${suffix}`;
      }

      return `/campaign/${encodedSlug}/${nextTab}${suffix}`;
    },
    [sessionId, storytellerSessionMode],
  );
  const normalizedEntityId = useMemo(() => {
    if (!entityId) {
      return undefined;
    }
    try {
      return decodeURIComponent(entityId);
    } catch {
      return entityId;
    }
  }, [entityId]);
  const activeEntityTab = isEntityListTab(activeTab) ? activeTab : null;
  const activeEntityTabConfig = activeEntityTab
    ? ENTITY_TAB_CONFIG[activeEntityTab]
    : null;
  const storytellerSession = storytellerSessionMode
    ? sessionRealtime.session
    : null;
  const storytellerRealtimeError = storytellerSessionMode
    ? sessionRealtime.error
    : null;

  useEffect(() => {
    if (!routeSlug) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void getCampaignBySlug(routeSlug, creatorToken)
      .then((detail) => {
        if (cancelled) {
          return;
        }
        setModuleDetail(detail);
        setBaseForm(toBaseFormState(detail.index));
        setPlayerInfoForm(toPlayerInfoFormState(detail));
        setStorytellerInfoForm(toStorytellerInfoFormState(detail));
        setBaseDirty(false);
        setPlayerInfoDirty(false);
        setStorytellerInfoDirty(false);
        setActorDirty(false);
        setLocationDirty(false);
        setEncounterDirty(false);
        setQuestDirty(false);
        setCounterDirty(false);
        setAssetDirty(false);
        setBaseValidationMessage(null);
        setPlayerInfoValidationMessage(null);
        setStorytellerInfoValidationMessage(null);
        setActorValidationMessage(null);
        setLocationValidationMessage(null);
        setEncounterValidationMessage(null);
        setQuestValidationMessage(null);
        setCounterValidationMessage(null);
        setAssetValidationMessage(null);
        setActorCreateError(null);
        setLocationCreateError(null);
        setEncounterCreateError(null);
        setQuestCreateError(null);
        setCounterCreateError(null);
        setAssetCreateError(null);
        setAutosaveStatus("idle");
        setAutosaveMessage(undefined);
      })
      .catch((loadError) => {
        if (cancelled) {
          return;
        }
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load campaign.",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    watchedCampaignUpdatedAtIso,
    creatorToken,
    routeSlug,
    storytellerSessionUpdatedAtIso,
  ]);

  useEffect(() => {
    if (
      !storytellerSessionMode ||
      !sessionId ||
      !storytellerIdentity ||
      !storytellerSessionConnected
    ) {
      return;
    }

    ensureStorytellerSessionRole({
      participantId: storytellerIdentity.participantId,
      displayName: storytellerIdentity.displayName,
      role: "storyteller",
    });
  }, [
    ensureStorytellerSessionRole,
    sessionId,
    storytellerIdentity,
    storytellerSessionConnected,
    storytellerSessionMode,
  ]);

  const activeActor = useMemo(() => {
    if (activeTab !== "actors" || !normalizedEntityId || !moduleDetail) {
      return null;
    }
    return (
      moduleDetail.actors.find((actor) => actor.actorSlug === normalizedEntityId) ??
      null
    );
  }, [activeTab, moduleDetail, normalizedEntityId]);

  const activeLocation = useMemo(() => {
    if (activeTab !== "locations" || !normalizedEntityId || !moduleDetail) {
      return null;
    }
    return (
      moduleDetail.locations.find(
        (location) => location.locationSlug === normalizedEntityId,
      ) ?? null
    );
  }, [activeTab, moduleDetail, normalizedEntityId]);

  const activeEncounter = useMemo(() => {
    if (activeTab !== "encounters" || !normalizedEntityId || !moduleDetail) {
      return null;
    }
    return (
      moduleDetail.encounters.find(
        (encounter) => encounter.encounterSlug === normalizedEntityId,
      ) ?? null
    );
  }, [activeTab, moduleDetail, normalizedEntityId]);

  const activeQuest = useMemo(() => {
    if (activeTab !== "quests" || !normalizedEntityId || !moduleDetail) {
      return null;
    }
    return (
      moduleDetail.quests.find((quest) => quest.questSlug === normalizedEntityId) ??
      null
    );
  }, [activeTab, moduleDetail, normalizedEntityId]);

  const activeCounter = useMemo(() => {
    if (activeTab !== "counters" || !normalizedEntityId || !moduleDetail) {
      return null;
    }
    return (
      moduleDetail.counters.find((counter) => counter.slug === normalizedEntityId) ?? null
    );
  }, [activeTab, moduleDetail, normalizedEntityId]);

  const activeAsset = useMemo(() => {
    if (activeTab !== "assets" || !normalizedEntityId || !moduleDetail) {
      return null;
    }
    return (
      moduleDetail.assets.find((asset) => asset.assetSlug === normalizedEntityId) ?? null
    );
  }, [activeTab, moduleDetail, normalizedEntityId]);

  useEffect(() => {
    if (activeTab !== "actors" || !normalizedEntityId) {
      setActorForm(null);
      setActorDirty(false);
      setActorValidationMessage(null);
      return;
    }
    if (!activeActor) {
      setActorForm(null);
      setActorDirty(false);
      return;
    }
    setActorForm(toActorFormState(activeActor));
    setActorDirty(false);
    setActorValidationMessage(null);
  }, [activeActor, activeTab, normalizedEntityId]);

  useEffect(() => {
    if (activeTab !== "locations" || !normalizedEntityId) {
      setLocationForm(null);
      setLocationDirty(false);
      setLocationValidationMessage(null);
      return;
    }
    if (!activeLocation) {
      setLocationForm(null);
      setLocationDirty(false);
      return;
    }
    setLocationForm(toLocationFormState(activeLocation));
    setLocationDirty(false);
    setLocationValidationMessage(null);
  }, [activeLocation, activeTab, normalizedEntityId]);

  useEffect(() => {
    if (activeTab !== "encounters" || !normalizedEntityId) {
      setEncounterForm(null);
      setEncounterDirty(false);
      setEncounterValidationMessage(null);
      return;
    }
    if (!activeEncounter) {
      setEncounterForm(null);
      setEncounterDirty(false);
      return;
    }
    setEncounterForm(toEncounterFormState(activeEncounter));
    setEncounterDirty(false);
    setEncounterValidationMessage(null);
  }, [activeEncounter, activeTab, normalizedEntityId]);

  useEffect(() => {
    if (activeTab !== "quests" || !normalizedEntityId) {
      setQuestForm(null);
      setQuestDirty(false);
      setQuestValidationMessage(null);
      return;
    }
    if (!activeQuest) {
      setQuestForm(null);
      setQuestDirty(false);
      return;
    }
    setQuestForm(toQuestFormState(activeQuest));
    setQuestDirty(false);
    setQuestValidationMessage(null);
  }, [activeQuest, activeTab, normalizedEntityId]);

  useEffect(() => {
    if (activeTab !== "counters" || !normalizedEntityId) {
      setCounterForm(null);
      setCounterDirty(false);
      setCounterValidationMessage(null);
      return;
    }
    if (!activeCounter) {
      setCounterForm(null);
      setCounterDirty(false);
      return;
    }
    setCounterForm(toCounterFormState(activeCounter));
    setCounterDirty(false);
    setCounterValidationMessage(null);
  }, [activeCounter, activeTab, normalizedEntityId]);

  useEffect(() => {
    if (activeTab !== "assets" || !normalizedEntityId) {
      setAssetForm(null);
      setAssetDirty(false);
      setAssetValidationMessage(null);
      return;
    }
    if (!activeAsset) {
      setAssetForm(null);
      setAssetDirty(false);
      return;
    }
    setAssetForm(toAssetFormState(activeAsset));
    setAssetDirty(false);
    setAssetValidationMessage(null);
  }, [activeAsset, activeTab, normalizedEntityId]);

  const persistBase = useCallback(async (): Promise<void> => {
    if (!moduleDetail || !moduleDetail.ownedByRequester) {
      return;
    }
    if (savingRef.current) {
      return;
    }

    const validated = validateBaseForm(baseForm);
    if (validated.error) {
      setBaseValidationMessage(validated.error);
      setAutosaveStatus("error");
      setAutosaveMessage(validated.error);
      return;
    }

    savingRef.current = true;
    setBaseValidationMessage(null);
    setAutosaveStatus("saving");
    setAutosaveMessage(undefined);
    setError(null);

    try {
      const nextIndex: AdventureModuleIndex = {
        ...moduleDetail.index,
        title: validated.title,
        premise: validated.premise,
        dos: validated.dos,
        donts: validated.donts,
      };
      const saved = await updateCampaignIndex(
        moduleDetail.index.moduleId,
        nextIndex,
        creatorToken,
      );
      setModuleDetail(saved);
      setBaseForm(toBaseFormState(saved.index));
      setBaseDirty(false);
      setAutosaveStatus("saved");
      setAutosaveMessage(`at ${new Date().toLocaleTimeString()}`);
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Autosave failed.";
      setError(message);
      setAutosaveStatus("error");
      setAutosaveMessage(message);
    } finally {
      savingRef.current = false;
    }
  }, [baseForm, creatorToken, moduleDetail]);

  const persistPlayerInfo = useCallback(async (): Promise<void> => {
    if (!moduleDetail || !moduleDetail.ownedByRequester) {
      return;
    }
    if (savingRef.current) {
      return;
    }

    const validated = validatePlayerInfoForm(playerInfoForm);
    if (validated.error) {
      setPlayerInfoValidationMessage(validated.error);
      setAutosaveStatus("error");
      setAutosaveMessage(validated.error);
      return;
    }

    const playerSummaryState = resolvePlayerSummaryState(moduleDetail);
    if (!playerSummaryState) {
      const message = "Player summary fragment is missing from this module.";
      setError(message);
      setAutosaveStatus("error");
      setAutosaveMessage(message);
      return;
    }

    const summaryChanged =
      validated.summary !== playerSummaryState.summaryMarkdown ||
      validated.summary !== moduleDetail.index.playerSummaryMarkdown;
    const infoTextChanged = validated.infoText !== playerSummaryState.infoText;
    if (!summaryChanged && !infoTextChanged) {
      setPlayerInfoValidationMessage(null);
      setPlayerInfoDirty(false);
      setAutosaveStatus("saved");
      setAutosaveMessage(`at ${new Date().toLocaleTimeString()}`);
      return;
    }

    savingRef.current = true;
    setPlayerInfoValidationMessage(null);
    setAutosaveStatus("saving");
    setAutosaveMessage(undefined);
    setError(null);

    try {
      let nextDetail = moduleDetail;

      if (summaryChanged) {
        const nextSummarySnippet = toMarkdownPlainTextSnippet(
          validated.summary,
          500,
        );
        const nextIndexFragments = nextDetail.index.fragments.map(
          (fragment) => {
            if (fragment.fragmentId !== playerSummaryState.fragmentId) {
              return fragment;
            }
            return {
              ...fragment,
              summary:
                nextSummarySnippet.length > 0 ? nextSummarySnippet : undefined,
            };
          },
        );

        const nextIndex: AdventureModuleIndex = {
          ...nextDetail.index,
          playerSummaryMarkdown: validated.summary,
          fragments: nextIndexFragments,
        };

        nextDetail = await updateCampaignIndex(
          nextDetail.index.moduleId,
          nextIndex,
          creatorToken,
        );
      }

      if (infoTextChanged) {
        nextDetail = await updateCampaignFragment(
          nextDetail.index.moduleId,
          playerSummaryState.fragmentId,
          validated.infoText,
          creatorToken,
        );
      }

      setModuleDetail(nextDetail);
      setPlayerInfoForm(toPlayerInfoFormState(nextDetail));
      setPlayerInfoDirty(false);
      setAutosaveStatus("saved");
      setAutosaveMessage(`at ${new Date().toLocaleTimeString()}`);
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Autosave failed.";
      setError(message);
      setAutosaveStatus("error");
      setAutosaveMessage(message);
    } finally {
      savingRef.current = false;
    }
  }, [creatorToken, moduleDetail, playerInfoForm]);

  const persistStorytellerInfo = useCallback(async (): Promise<void> => {
    if (!moduleDetail || !moduleDetail.ownedByRequester) {
      return;
    }
    if (savingRef.current) {
      return;
    }

    const validated = validateStorytellerInfoForm(storytellerInfoForm);
    if (validated.error) {
      setStorytellerInfoValidationMessage(validated.error);
      setAutosaveStatus("error");
      setAutosaveMessage(validated.error);
      return;
    }

    const storytellerSummaryState =
      resolveStorytellerSummaryState(moduleDetail);
    if (!storytellerSummaryState) {
      const message =
        "Storyteller summary fragment is missing from this module.";
      setError(message);
      setAutosaveStatus("error");
      setAutosaveMessage(message);
      return;
    }

    const summaryChanged =
      validated.summary !== storytellerSummaryState.summaryMarkdown ||
      validated.summary !== moduleDetail.index.storytellerSummaryMarkdown;
    const infoTextChanged =
      validated.infoText !== storytellerSummaryState.infoText;
    if (!summaryChanged && !infoTextChanged) {
      setStorytellerInfoValidationMessage(null);
      setStorytellerInfoDirty(false);
      setAutosaveStatus("saved");
      setAutosaveMessage(`at ${new Date().toLocaleTimeString()}`);
      return;
    }

    savingRef.current = true;
    setStorytellerInfoValidationMessage(null);
    setAutosaveStatus("saving");
    setAutosaveMessage(undefined);
    setError(null);

    try {
      let nextDetail = moduleDetail;

      if (summaryChanged) {
        const nextSummarySnippet = toMarkdownPlainTextSnippet(
          validated.summary,
          500,
        );
        const nextIndexFragments = nextDetail.index.fragments.map(
          (fragment) => {
            if (fragment.fragmentId !== storytellerSummaryState.fragmentId) {
              return fragment;
            }
            return {
              ...fragment,
              summary:
                nextSummarySnippet.length > 0 ? nextSummarySnippet : undefined,
            };
          },
        );

        const nextIndex: AdventureModuleIndex = {
          ...nextDetail.index,
          storytellerSummaryMarkdown: validated.summary,
          fragments: nextIndexFragments,
        };

        nextDetail = await updateCampaignIndex(
          nextDetail.index.moduleId,
          nextIndex,
          creatorToken,
        );
      }

      if (infoTextChanged) {
        nextDetail = await updateCampaignFragment(
          nextDetail.index.moduleId,
          storytellerSummaryState.fragmentId,
          validated.infoText,
          creatorToken,
        );
      }

      setModuleDetail(nextDetail);
      setStorytellerInfoForm(toStorytellerInfoFormState(nextDetail));
      setStorytellerInfoDirty(false);
      setAutosaveStatus("saved");
      setAutosaveMessage(`at ${new Date().toLocaleTimeString()}`);
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Autosave failed.";
      setError(message);
      setAutosaveStatus("error");
      setAutosaveMessage(message);
    } finally {
      savingRef.current = false;
    }
  }, [creatorToken, moduleDetail, storytellerInfoForm]);

  const persistActor = useCallback(async (): Promise<void> => {
    if (
      !moduleDetail ||
      !moduleDetail.ownedByRequester ||
      activeTab !== "actors" ||
      !actorForm
    ) {
      return;
    }
    if (savingRef.current) {
      return;
    }

    const validated = validateActorForm(actorForm);
    if (validated.error) {
      setActorValidationMessage(validated.error);
      setAutosaveStatus("error");
      setAutosaveMessage(validated.error);
      return;
    }

    savingRef.current = true;
    setActorValidationMessage(null);
    setAutosaveStatus("saving");
    setAutosaveMessage(undefined);
    setError(null);
    setActorCreateError(null);

    try {
      const nextDetail = await updateCampaignActor(
        moduleDetail.index.moduleId,
        actorForm.actorSlug,
        {
          title: validated.title,
          summary: validated.summary,
          baseLayerSlug: validated.baseLayerSlug,
          tacticalRoleSlug: validated.tacticalRoleSlug,
          tacticalSpecialSlug: validated.tacticalSpecialSlug ?? null,
          isPlayerCharacter: validated.isPlayerCharacter,
          content: validated.content,
        },
        creatorToken,
      );

      setModuleDetail(nextDetail);
      const nextActor =
        nextDetail.actors.find(
          (resolvedActor) => resolvedActor.fragmentId === actorForm.fragmentId,
        ) ?? null;
      setActorForm(nextActor ? toActorFormState(nextActor) : null);
      setActorDirty(false);
      if (
        nextActor &&
        nextActor.actorSlug !== actorForm.actorSlug &&
        activeTab === "actors" &&
        normalizedEntityId === actorForm.actorSlug
      ) {
        navigate(
          buildCampaignRoute(nextDetail.index.slug, "actors", nextActor.actorSlug),
          { replace: true },
        );
      }
      setAutosaveStatus("saved");
      setAutosaveMessage(`at ${new Date().toLocaleTimeString()}`);
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Autosave failed.";
      setError(message);
      setAutosaveStatus("error");
      setAutosaveMessage(message);
    } finally {
      savingRef.current = false;
    }
  }, [activeTab, actorForm, creatorToken, moduleDetail, navigate, normalizedEntityId]);

  const persistLocation = useCallback(async (): Promise<void> => {
    if (
      !moduleDetail ||
      !moduleDetail.ownedByRequester ||
      activeTab !== "locations" ||
      !locationForm
    ) {
      return;
    }
    if (savingRef.current) {
      return;
    }

    const validated = validateLocationForm(locationForm);
    if (validated.error) {
      setLocationValidationMessage(validated.error);
      setAutosaveStatus("error");
      setAutosaveMessage(validated.error);
      return;
    }

    savingRef.current = true;
    setLocationValidationMessage(null);
    setAutosaveStatus("saving");
    setAutosaveMessage(undefined);
    setError(null);
    setLocationCreateError(null);

    try {
      const nextDetail = await updateCampaignLocation(
        moduleDetail.index.moduleId,
        locationForm.locationSlug,
        {
          title: validated.title,
          summary: validated.summary,
          titleImageUrl: validated.titleImageUrl,
          introductionMarkdown: validated.introductionMarkdown,
          descriptionMarkdown: validated.descriptionMarkdown,
          mapImageUrl: validated.mapImageUrl,
          mapPins: validated.mapPins,
        },
        creatorToken,
      );

      setModuleDetail(nextDetail);
      const nextLocation =
        nextDetail.locations.find(
          (resolvedLocation) =>
            resolvedLocation.fragmentId === locationForm.fragmentId,
        ) ?? null;
      setLocationForm(nextLocation ? toLocationFormState(nextLocation) : null);
      setLocationDirty(false);
      if (
        nextLocation &&
        nextLocation.locationSlug !== locationForm.locationSlug &&
        activeTab === "locations" &&
        normalizedEntityId === locationForm.locationSlug
      ) {
        navigate(
          buildCampaignRoute(nextDetail.index.slug, "locations", nextLocation.locationSlug),
          { replace: true },
        );
      }
      setAutosaveStatus("saved");
      setAutosaveMessage(`at ${new Date().toLocaleTimeString()}`);
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Autosave failed.";
      setError(message);
      setAutosaveStatus("error");
      setAutosaveMessage(message);
    } finally {
      savingRef.current = false;
    }
  }, [
    activeTab,
    creatorToken,
    locationForm,
    moduleDetail,
    navigate,
    normalizedEntityId,
  ]);

  const persistEncounter = useCallback(async (): Promise<void> => {
    if (
      !moduleDetail ||
      !moduleDetail.ownedByRequester ||
      activeTab !== "encounters" ||
      !encounterForm
    ) {
      return;
    }
    if (savingRef.current) {
      return;
    }

    const validated = validateEncounterForm(encounterForm);
    if (validated.error) {
      setEncounterValidationMessage(validated.error);
      setAutosaveStatus("error");
      setAutosaveMessage(validated.error);
      return;
    }

    savingRef.current = true;
    setEncounterValidationMessage(null);
    setAutosaveStatus("saving");
    setAutosaveMessage(undefined);
    setError(null);
    setEncounterCreateError(null);

    try {
      const nextDetail = await updateCampaignEncounter(
        moduleDetail.index.moduleId,
        encounterForm.encounterSlug,
        {
          title: validated.title,
          summary: validated.summary,
          prerequisites: validated.prerequisites,
          titleImageUrl: validated.titleImageUrl,
          content: validated.content,
        },
        creatorToken,
      );

      setModuleDetail(nextDetail);
      const nextEncounter =
        nextDetail.encounters.find(
          (resolvedEncounter) =>
            resolvedEncounter.fragmentId === encounterForm.fragmentId,
        ) ?? null;
      setEncounterForm(nextEncounter ? toEncounterFormState(nextEncounter) : null);
      setEncounterDirty(false);
      if (
        nextEncounter &&
        nextEncounter.encounterSlug !== encounterForm.encounterSlug &&
        activeTab === "encounters" &&
        normalizedEntityId === encounterForm.encounterSlug
      ) {
        navigate(
          buildCampaignRoute(nextDetail.index.slug, "encounters", nextEncounter.encounterSlug),
          { replace: true },
        );
      }
      setAutosaveStatus("saved");
      setAutosaveMessage(`at ${new Date().toLocaleTimeString()}`);
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Autosave failed.";
      setError(message);
      setAutosaveStatus("error");
      setAutosaveMessage(message);
    } finally {
      savingRef.current = false;
    }
  }, [
    activeTab,
    creatorToken,
    encounterForm,
    moduleDetail,
    navigate,
    normalizedEntityId,
  ]);

  const persistQuest = useCallback(async (): Promise<void> => {
    if (
      !moduleDetail ||
      !moduleDetail.ownedByRequester ||
      activeTab !== "quests" ||
      !questForm
    ) {
      return;
    }
    if (savingRef.current) {
      return;
    }

    const validated = validateQuestForm(questForm);
    if (validated.error) {
      setQuestValidationMessage(validated.error);
      setAutosaveStatus("error");
      setAutosaveMessage(validated.error);
      return;
    }

    savingRef.current = true;
    setQuestValidationMessage(null);
    setAutosaveStatus("saving");
    setAutosaveMessage(undefined);
    setError(null);
    setQuestCreateError(null);

    try {
      const nextDetail = await updateCampaignQuest(
        moduleDetail.index.moduleId,
        questForm.questSlug,
        {
          title: validated.title,
          summary: validated.summary,
          titleImageUrl: validated.titleImageUrl,
          content: validated.content,
        },
        creatorToken,
      );

      setModuleDetail(nextDetail);
      const nextQuest =
        nextDetail.quests.find(
          (resolvedQuest) => resolvedQuest.fragmentId === questForm.fragmentId,
        ) ?? null;
      setQuestForm(nextQuest ? toQuestFormState(nextQuest) : null);
      setQuestDirty(false);
      if (
        nextQuest &&
        nextQuest.questSlug !== questForm.questSlug &&
        activeTab === "quests" &&
        normalizedEntityId === questForm.questSlug
      ) {
        navigate(
          buildCampaignRoute(nextDetail.index.slug, "quests", nextQuest.questSlug),
          { replace: true },
        );
      }
      setAutosaveStatus("saved");
      setAutosaveMessage(`at ${new Date().toLocaleTimeString()}`);
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Autosave failed.";
      setError(message);
      setAutosaveStatus("error");
      setAutosaveMessage(message);
    } finally {
      savingRef.current = false;
    }
  }, [activeTab, creatorToken, moduleDetail, navigate, normalizedEntityId, questForm]);

  const persistCounter = useCallback(async (): Promise<void> => {
    if (
      !moduleDetail ||
      !moduleDetail.ownedByRequester ||
      activeTab !== "counters" ||
      !counterForm
    ) {
      return;
    }
    if (savingRef.current) {
      return;
    }

    const validated = validateCounterForm(counterForm);
    if (validated.error) {
      setCounterValidationMessage(validated.error);
      setAutosaveStatus("error");
      setAutosaveMessage(validated.error);
      return;
    }

    savingRef.current = true;
    setCounterValidationMessage(null);
    setAutosaveStatus("saving");
    setAutosaveMessage(undefined);
    setError(null);
    setCounterCreateError(null);

    try {
      const expectedCounterSlug = makeUniqueCounterSlug(
        validated.title,
        moduleDetail,
        counterForm.slug,
      );
      const nextDetail = await updateCampaignCounter(
        moduleDetail.index.moduleId,
        counterForm.slug,
        {
          title: validated.title,
          iconSlug: validated.iconSlug,
          currentValue: validated.currentValue,
          maxValue: validated.maxValue ?? null,
          description: validated.description,
        },
        creatorToken,
      );

      setModuleDetail(nextDetail);
      const nextCounter =
        nextDetail.counters.find(
          (resolvedCounter) => resolvedCounter.slug === expectedCounterSlug,
        ) ??
        nextDetail.counters.find(
          (resolvedCounter) => resolvedCounter.slug === counterForm.slug,
        ) ??
        null;
      setCounterForm(nextCounter ? toCounterFormState(nextCounter) : null);
      setCounterDirty(false);
      if (
        nextCounter &&
        nextCounter.slug !== counterForm.slug &&
        activeTab === "counters" &&
        normalizedEntityId === counterForm.slug
      ) {
        navigate(
          buildCampaignRoute(nextDetail.index.slug, "counters", nextCounter.slug),
          { replace: true },
        );
      }
      setAutosaveStatus("saved");
      setAutosaveMessage(`at ${new Date().toLocaleTimeString()}`);
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Autosave failed.";
      setError(message);
      setAutosaveStatus("error");
      setAutosaveMessage(message);
    } finally {
      savingRef.current = false;
    }
  }, [activeTab, counterForm, creatorToken, moduleDetail, navigate, normalizedEntityId]);

  const persistAsset = useCallback(async (): Promise<void> => {
    if (
      !moduleDetail ||
      !moduleDetail.ownedByRequester ||
      activeTab !== "assets" ||
      !assetForm
    ) {
      return;
    }
    if (savingRef.current) {
      return;
    }

    const validated = validateAssetForm(assetForm);
    if (validated.error) {
      setAssetValidationMessage(validated.error);
      setAutosaveStatus("error");
      setAutosaveMessage(validated.error);
      return;
    }

    savingRef.current = true;
    setAssetValidationMessage(null);
    setAutosaveStatus("saving");
    setAutosaveMessage(undefined);
    setError(null);
    setAssetCreateError(null);

    try {
      const expectedAssetSlug = makeUniqueAssetSlug(
        validated.title,
        moduleDetail,
        assetForm.assetSlug,
      );
      const nextDetail = await updateCampaignAsset(
        moduleDetail.index.moduleId,
        assetForm.assetSlug,
        {
          title: validated.title,
          summary: validated.summary,
          modifier: validated.modifier,
          noun: validated.noun,
          nounDescription: validated.nounDescription,
          adjectiveDescription: validated.adjectiveDescription,
          iconUrl: validated.iconUrl,
          overlayUrl: validated.overlayUrl,
          content: validated.content,
        },
        creatorToken,
      );

      setModuleDetail(nextDetail);
      const nextAsset =
        nextDetail.assets.find(
          (resolvedAsset) => resolvedAsset.assetSlug === expectedAssetSlug,
        ) ??
        nextDetail.assets.find(
          (resolvedAsset) => resolvedAsset.fragmentId === assetForm.fragmentId,
        ) ??
        null;
      setAssetForm(nextAsset ? toAssetFormState(nextAsset) : null);
      setAssetDirty(false);
      if (
        nextAsset &&
        nextAsset.assetSlug !== assetForm.assetSlug &&
        activeTab === "assets" &&
        normalizedEntityId === assetForm.assetSlug
      ) {
        navigate(
          buildCampaignRoute(nextDetail.index.slug, "assets", nextAsset.assetSlug),
          { replace: true },
        );
      }
      setAutosaveStatus("saved");
      setAutosaveMessage(`at ${new Date().toLocaleTimeString()}`);
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Autosave failed.";
      setError(message);
      setAutosaveStatus("error");
      setAutosaveMessage(message);
    } finally {
      savingRef.current = false;
    }
  }, [activeTab, assetForm, creatorToken, moduleDetail, navigate, normalizedEntityId]);

  const handleCreateActor = useCallback(async (): Promise<void> => {
    if (!moduleDetail?.ownedByRequester || creatingActor) {
      return;
    }

    setCreatingActor(true);
    setActorCreateError(null);
    setError(null);

    try {
      const nextDetail = await createCampaignActor(
        moduleDetail.index.moduleId,
        {
          title: "New Actor",
          isPlayerCharacter: false,
        },
        creatorToken,
      );
      setModuleDetail(nextDetail);
      const createdActor = nextDetail.actors[nextDetail.actors.length - 1];
      if (!createdActor) {
        throw new Error("Created actor could not be resolved.");
      }
      setActorForm(toActorFormState(createdActor));
      setActorDirty(false);
      navigate(
        buildCampaignRoute(nextDetail.index.slug, "actors", createdActor.actorSlug),
      );
      setAutosaveStatus("saved");
      setAutosaveMessage(`at ${new Date().toLocaleTimeString()}`);
    } catch (createError) {
      const message =
        createError instanceof Error ? createError.message : "Could not create actor.";
      setActorCreateError(message);
      setAutosaveStatus("error");
      setAutosaveMessage(message);
    } finally {
      setCreatingActor(false);
    }
  }, [creatingActor, creatorToken, moduleDetail, navigate]);

  const handleCreateLocation = useCallback(async (): Promise<void> => {
    if (!moduleDetail?.ownedByRequester || creatingLocation) {
      return;
    }

    setCreatingLocation(true);
    setLocationCreateError(null);
    setError(null);

    try {
      const nextDetail = await createCampaignLocation(
        moduleDetail.index.moduleId,
        { title: "New Location" },
        creatorToken,
      );
      setModuleDetail(nextDetail);
      const createdLocation =
        nextDetail.locations[nextDetail.locations.length - 1];
      if (!createdLocation) {
        throw new Error("Created location could not be resolved.");
      }
      setLocationForm(toLocationFormState(createdLocation));
      setLocationDirty(false);
      navigate(
        buildCampaignRoute(nextDetail.index.slug, "locations", createdLocation.locationSlug),
      );
      setAutosaveStatus("saved");
      setAutosaveMessage(`at ${new Date().toLocaleTimeString()}`);
    } catch (createError) {
      const message =
        createError instanceof Error
          ? createError.message
          : "Could not create location.";
      setLocationCreateError(message);
      setAutosaveStatus("error");
      setAutosaveMessage(message);
    } finally {
      setCreatingLocation(false);
    }
  }, [creatingLocation, creatorToken, moduleDetail, navigate]);

  const handleCreateEncounter = useCallback(async (): Promise<void> => {
    if (!moduleDetail?.ownedByRequester || creatingEncounter) {
      return;
    }

    setCreatingEncounter(true);
    setEncounterCreateError(null);
    setError(null);

    try {
      const nextDetail = await createCampaignEncounter(
        moduleDetail.index.moduleId,
        { title: "New Encounter" },
        creatorToken,
      );
      setModuleDetail(nextDetail);
      const createdEncounter =
        nextDetail.encounters[nextDetail.encounters.length - 1];
      if (!createdEncounter) {
        throw new Error("Created encounter could not be resolved.");
      }
      setEncounterForm(toEncounterFormState(createdEncounter));
      setEncounterDirty(false);
      navigate(
        buildCampaignRoute(nextDetail.index.slug, "encounters", createdEncounter.encounterSlug),
      );
      setAutosaveStatus("saved");
      setAutosaveMessage(`at ${new Date().toLocaleTimeString()}`);
    } catch (createError) {
      const message =
        createError instanceof Error
          ? createError.message
          : "Could not create encounter.";
      setEncounterCreateError(message);
      setAutosaveStatus("error");
      setAutosaveMessage(message);
    } finally {
      setCreatingEncounter(false);
    }
  }, [creatingEncounter, creatorToken, moduleDetail, navigate]);

  const handleCreateQuest = useCallback(async (): Promise<void> => {
    if (!moduleDetail?.ownedByRequester || creatingQuest) {
      return;
    }

    setCreatingQuest(true);
    setQuestCreateError(null);
    setError(null);

    try {
      const nextDetail = await createCampaignQuest(
        moduleDetail.index.moduleId,
        { title: "New Quest" },
        creatorToken,
      );
      setModuleDetail(nextDetail);
      const createdQuest = nextDetail.quests[nextDetail.quests.length - 1];
      if (!createdQuest) {
        throw new Error("Created quest could not be resolved.");
      }
      setQuestForm(toQuestFormState(createdQuest));
      setQuestDirty(false);
      navigate(
        buildCampaignRoute(nextDetail.index.slug, "quests", createdQuest.questSlug),
      );
      setAutosaveStatus("saved");
      setAutosaveMessage(`at ${new Date().toLocaleTimeString()}`);
    } catch (createError) {
      const message =
        createError instanceof Error ? createError.message : "Could not create quest.";
      setQuestCreateError(message);
      setAutosaveStatus("error");
      setAutosaveMessage(message);
    } finally {
      setCreatingQuest(false);
    }
  }, [creatingQuest, creatorToken, moduleDetail, navigate]);

  const handleCreateCounter = useCallback(async (): Promise<void> => {
    if (!moduleDetail?.ownedByRequester || creatingCounter) {
      return;
    }

    setCreatingCounter(true);
    setCounterCreateError(null);
    setError(null);

    try {
      const nextDetail = await createCampaignCounter(
        moduleDetail.index.moduleId,
        { title: "New Counter" },
        creatorToken,
      );
      setModuleDetail(nextDetail);
      const createdCounter = nextDetail.counters[nextDetail.counters.length - 1];
      if (!createdCounter) {
        throw new Error("Created counter could not be resolved.");
      }
      setCounterForm(toCounterFormState(createdCounter));
      setCounterDirty(false);
      navigate(
        buildCampaignRoute(nextDetail.index.slug, "counters", createdCounter.slug),
      );
      setAutosaveStatus("saved");
      setAutosaveMessage(`at ${new Date().toLocaleTimeString()}`);
    } catch (createError) {
      const message =
        createError instanceof Error ? createError.message : "Could not create counter.";
      setCounterCreateError(message);
      setAutosaveStatus("error");
      setAutosaveMessage(message);
    } finally {
      setCreatingCounter(false);
    }
  }, [creatingCounter, creatorToken, moduleDetail, navigate]);

  const handleCreateAsset = useCallback(async (): Promise<void> => {
    if (!moduleDetail?.ownedByRequester || creatingAsset) {
      return;
    }

    setCreatingAsset(true);
    setAssetCreateError(null);
    setError(null);

    try {
      const nextDetail = await createCampaignAsset(
        moduleDetail.index.moduleId,
        { title: "New Asset" },
        creatorToken,
      );
      setModuleDetail(nextDetail);
      const createdAsset = nextDetail.assets[nextDetail.assets.length - 1];
      if (!createdAsset) {
        throw new Error("Created asset could not be resolved.");
      }
      setAssetForm(toAssetFormState(createdAsset));
      setAssetDirty(false);
      navigate(
        buildCampaignRoute(nextDetail.index.slug, "assets", createdAsset.assetSlug),
      );
      setAutosaveStatus("saved");
      setAutosaveMessage(`at ${new Date().toLocaleTimeString()}`);
    } catch (createError) {
      const message =
        createError instanceof Error ? createError.message : "Could not create asset.";
      setAssetCreateError(message);
      setAutosaveStatus("error");
      setAutosaveMessage(message);
    } finally {
      setCreatingAsset(false);
    }
  }, [creatingAsset, creatorToken, moduleDetail, navigate]);

  const handleDeleteActor = useCallback(
    async (actorSlug: string, title: string): Promise<void> => {
      if (!moduleDetail?.ownedByRequester) {
        return;
      }
      if (!window.confirm(`Delete "${title}"?`)) {
        return;
      }

      setError(null);
      setActorCreateError(null);
      setAutosaveStatus("saving");
      setAutosaveMessage(undefined);

      try {
        const nextDetail = await deleteCampaignActor(
          moduleDetail.index.moduleId,
          actorSlug,
          creatorToken,
        );
        setModuleDetail(nextDetail);
        setActorDirty(false);
        setActorValidationMessage(null);
        if (activeTab === "actors" && normalizedEntityId === actorSlug) {
          setActorForm(null);
          navigate(
            buildCampaignRoute(nextDetail.index.slug, "actors"),
          );
        }
        setAutosaveStatus("saved");
        setAutosaveMessage(`at ${new Date().toLocaleTimeString()}`);
      } catch (deleteError) {
        const message =
          deleteError instanceof Error ? deleteError.message : "Could not delete actor.";
        setError(message);
        setAutosaveStatus("error");
        setAutosaveMessage(message);
      }
    },
    [activeTab, creatorToken, moduleDetail, navigate, normalizedEntityId],
  );

  const handleDeleteLocation = useCallback(
    async (locationSlug: string, title: string): Promise<void> => {
      if (!moduleDetail?.ownedByRequester) {
        return;
      }
      if (!window.confirm(`Delete "${title}"?`)) {
        return;
      }

      setError(null);
      setLocationCreateError(null);
      setAutosaveStatus("saving");
      setAutosaveMessage(undefined);

      try {
        const nextDetail = await deleteCampaignLocation(
          moduleDetail.index.moduleId,
          locationSlug,
          creatorToken,
        );
        setModuleDetail(nextDetail);
        setLocationDirty(false);
        setLocationValidationMessage(null);
        if (activeTab === "locations" && normalizedEntityId === locationSlug) {
          setLocationForm(null);
          navigate(
            buildCampaignRoute(nextDetail.index.slug, "locations"),
          );
        }
        setAutosaveStatus("saved");
        setAutosaveMessage(`at ${new Date().toLocaleTimeString()}`);
      } catch (deleteError) {
        const message =
          deleteError instanceof Error
            ? deleteError.message
            : "Could not delete location.";
        setError(message);
        setAutosaveStatus("error");
        setAutosaveMessage(message);
      }
    },
    [activeTab, creatorToken, moduleDetail, navigate, normalizedEntityId],
  );

  const handleDeleteEncounter = useCallback(
    async (encounterSlug: string, title: string): Promise<void> => {
      if (!moduleDetail?.ownedByRequester) {
        return;
      }
      if (!window.confirm(`Delete "${title}"?`)) {
        return;
      }

      setError(null);
      setEncounterCreateError(null);
      setAutosaveStatus("saving");
      setAutosaveMessage(undefined);

      try {
        const nextDetail = await deleteCampaignEncounter(
          moduleDetail.index.moduleId,
          encounterSlug,
          creatorToken,
        );
        setModuleDetail(nextDetail);
        setEncounterDirty(false);
        setEncounterValidationMessage(null);
        if (activeTab === "encounters" && normalizedEntityId === encounterSlug) {
          setEncounterForm(null);
          navigate(
            buildCampaignRoute(nextDetail.index.slug, "encounters"),
          );
        }
        setAutosaveStatus("saved");
        setAutosaveMessage(`at ${new Date().toLocaleTimeString()}`);
      } catch (deleteError) {
        const message =
          deleteError instanceof Error
            ? deleteError.message
            : "Could not delete encounter.";
        setError(message);
        setAutosaveStatus("error");
        setAutosaveMessage(message);
      }
    },
    [activeTab, creatorToken, moduleDetail, navigate, normalizedEntityId],
  );

  const handleDeleteQuest = useCallback(
    async (questSlug: string, title: string): Promise<void> => {
      if (!moduleDetail?.ownedByRequester) {
        return;
      }
      if (!window.confirm(`Delete "${title}"?`)) {
        return;
      }

      setError(null);
      setQuestCreateError(null);
      setAutosaveStatus("saving");
      setAutosaveMessage(undefined);

      try {
        const nextDetail = await deleteCampaignQuest(
          moduleDetail.index.moduleId,
          questSlug,
          creatorToken,
        );
        setModuleDetail(nextDetail);
        setQuestDirty(false);
        setQuestValidationMessage(null);
        if (activeTab === "quests" && normalizedEntityId === questSlug) {
          setQuestForm(null);
          navigate(
            buildCampaignRoute(nextDetail.index.slug, "quests"),
          );
        }
        setAutosaveStatus("saved");
        setAutosaveMessage(`at ${new Date().toLocaleTimeString()}`);
      } catch (deleteError) {
        const message =
          deleteError instanceof Error ? deleteError.message : "Could not delete quest.";
        setError(message);
        setAutosaveStatus("error");
        setAutosaveMessage(message);
      }
    },
    [activeTab, creatorToken, moduleDetail, navigate, normalizedEntityId],
  );

  const handleDeleteCounter = useCallback(
    async (counterSlug: string, title: string): Promise<void> => {
      if (!moduleDetail?.ownedByRequester) {
        return;
      }
      if (!window.confirm(`Delete "${title}"?`)) {
        return;
      }

      setError(null);
      setCounterCreateError(null);
      setAutosaveStatus("saving");
      setAutosaveMessage(undefined);

      try {
        const nextDetail = await deleteCampaignCounter(
          moduleDetail.index.moduleId,
          counterSlug,
          creatorToken,
        );
        setModuleDetail(nextDetail);
        setCounterDirty(false);
        setCounterValidationMessage(null);
        if (activeTab === "counters" && normalizedEntityId === counterSlug) {
          setCounterForm(null);
          navigate(
            buildCampaignRoute(nextDetail.index.slug, "counters"),
          );
        }
        setAutosaveStatus("saved");
        setAutosaveMessage(`at ${new Date().toLocaleTimeString()}`);
      } catch (deleteError) {
        const message =
          deleteError instanceof Error ? deleteError.message : "Could not delete counter.";
        setError(message);
        setAutosaveStatus("error");
        setAutosaveMessage(message);
      }
    },
    [activeTab, creatorToken, moduleDetail, navigate, normalizedEntityId],
  );

  const handleDeleteAsset = useCallback(
    async (assetSlug: string, title: string): Promise<void> => {
      if (!moduleDetail?.ownedByRequester) {
        return;
      }
      if (!window.confirm(`Delete "${title}"?`)) {
        return;
      }

      setError(null);
      setAssetCreateError(null);
      setAutosaveStatus("saving");
      setAutosaveMessage(undefined);

      try {
        const nextDetail = await deleteCampaignAsset(
          moduleDetail.index.moduleId,
          assetSlug,
          creatorToken,
        );
        setModuleDetail(nextDetail);
        setAssetDirty(false);
        setAssetValidationMessage(null);
        if (activeTab === "assets" && normalizedEntityId === assetSlug) {
          setAssetForm(null);
          navigate(
            buildCampaignRoute(nextDetail.index.slug, "assets"),
          );
        }
        setAutosaveStatus("saved");
        setAutosaveMessage(`at ${new Date().toLocaleTimeString()}`);
      } catch (deleteError) {
        const message =
          deleteError instanceof Error ? deleteError.message : "Could not delete asset.";
        setError(message);
        setAutosaveStatus("error");
        setAutosaveMessage(message);
      }
    },
    [activeTab, creatorToken, moduleDetail, navigate, normalizedEntityId],
  );

  const handleAdjustCounterValue = useCallback(
    async (
      counterSlug: string,
      delta: number,
      target: "current" | "max" = "current",
    ): Promise<void> => {
      if (!moduleDetail?.ownedByRequester || savingRef.current) {
        return;
      }

      const persistedCounter =
        moduleDetail.counters.find((counter) => counter.slug === counterSlug) ?? null;
      if (!persistedCounter) {
        return;
      }

      let nextPayload = {
        title: persistedCounter.title,
        iconSlug: persistedCounter.iconSlug,
        currentValue: persistedCounter.currentValue,
        maxValue: persistedCounter.maxValue,
        description: persistedCounter.description ?? "",
      };

      if (activeTab === "counters" && counterForm?.slug === counterSlug) {
        const validated = validateCounterForm(counterForm);
        if (!validated.error) {
          nextPayload = {
            title: validated.title,
            iconSlug: validated.iconSlug,
            currentValue: validated.currentValue,
            maxValue: validated.maxValue,
            description: validated.description,
          };
        }
      }

      if (target === "max") {
        const nextMaxValue = Math.max(
          0,
          Math.trunc(
            (typeof nextPayload.maxValue === "number"
              ? nextPayload.maxValue
              : nextPayload.currentValue) + delta,
          ),
        );
        nextPayload = {
          ...nextPayload,
          maxValue: nextMaxValue,
          currentValue: clampCounterValue(nextPayload.currentValue, nextMaxValue),
        };
      } else {
        nextPayload = {
          ...nextPayload,
          currentValue: clampCounterValue(
            nextPayload.currentValue + delta,
            nextPayload.maxValue,
          ),
        };
      }

      const previousDetail = moduleDetail;
      const optimisticCounter = {
        slug: counterSlug,
        title: nextPayload.title,
        iconSlug: nextPayload.iconSlug,
        currentValue: nextPayload.currentValue,
        ...(typeof nextPayload.maxValue === "number"
          ? { maxValue: nextPayload.maxValue }
          : {}),
        description: nextPayload.description,
      };

      setModuleDetail(replaceCounterInDetail(previousDetail, optimisticCounter));
      setCounterForm((current) =>
        current && current.slug === counterSlug
          ? {
              ...current,
              title: nextPayload.title,
              iconSlug: nextPayload.iconSlug,
              currentValue: nextPayload.currentValue,
              maxValue: nextPayload.maxValue,
              description: nextPayload.description,
            }
          : current,
      );

      savingRef.current = true;
      setAutosaveStatus("saving");
      setAutosaveMessage(undefined);
      setError(null);

      try {
        const nextDetail = await updateCampaignCounter(
          previousDetail.index.moduleId,
          counterSlug,
          {
            title: nextPayload.title,
            iconSlug: nextPayload.iconSlug,
            currentValue: nextPayload.currentValue,
            maxValue: nextPayload.maxValue ?? null,
            description: nextPayload.description,
          },
          creatorToken,
        );
        setModuleDetail(nextDetail);
        setCounterForm((current) => {
          if (!current || current.slug !== counterSlug) {
            return current;
          }
          const savedCounter =
            nextDetail.counters.find((counter) => counter.slug === counterSlug) ?? null;
          return savedCounter ? toCounterFormState(savedCounter) : current;
        });
        setAutosaveStatus("saved");
        setAutosaveMessage(`at ${new Date().toLocaleTimeString()}`);
      } catch (saveError) {
        const message =
          saveError instanceof Error ? saveError.message : "Could not update counter.";
        setModuleDetail(previousDetail);
        setCounterForm((current) => {
          if (!current || current.slug !== counterSlug) {
            return current;
          }
          const previousCounter =
            previousDetail.counters.find((counter) => counter.slug === counterSlug) ?? null;
          return previousCounter ? toCounterFormState(previousCounter) : current;
        });
        setError(message);
        setAutosaveStatus("error");
        setAutosaveMessage(message);
      } finally {
        savingRef.current = false;
      }
    },
    [activeTab, counterForm, creatorToken, moduleDetail],
  );

  useEffect(() => {
    if (
      !baseDirty ||
      !moduleDetail?.ownedByRequester ||
      activeTab !== "base" ||
      Boolean(entityId)
    ) {
      return;
    }

    setAutosaveStatus("queued");
    setAutosaveMessage("pending");
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      void persistBase();
    }, 1000);

    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [
    activeTab,
    baseDirty,
    entityId,
    moduleDetail?.ownedByRequester,
    persistBase,
  ]);

  useEffect(() => {
    if (
      !playerInfoDirty ||
      !moduleDetail?.ownedByRequester ||
      activeTab !== "player-info" ||
      Boolean(entityId)
    ) {
      return;
    }

    setAutosaveStatus("queued");
    setAutosaveMessage("pending");
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      void persistPlayerInfo();
    }, 1000);

    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [
    activeTab,
    entityId,
    moduleDetail?.ownedByRequester,
    persistPlayerInfo,
    playerInfoDirty,
  ]);

  useEffect(() => {
    if (
      !storytellerInfoDirty ||
      !moduleDetail?.ownedByRequester ||
      activeTab !== "storyteller-info" ||
      Boolean(entityId)
    ) {
      return;
    }

    setAutosaveStatus("queued");
    setAutosaveMessage("pending");
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      void persistStorytellerInfo();
    }, 1000);

    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [
    activeTab,
    entityId,
    moduleDetail?.ownedByRequester,
    persistStorytellerInfo,
    storytellerInfoDirty,
  ]);

  useEffect(() => {
    if (
      !actorDirty ||
      !moduleDetail?.ownedByRequester ||
      activeTab !== "actors" ||
      !entityId
    ) {
      return;
    }

    setAutosaveStatus("queued");
    setAutosaveMessage("pending");
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      void persistActor();
    }, 1000);

    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [
    activeTab,
    actorDirty,
    entityId,
    moduleDetail?.ownedByRequester,
    persistActor,
  ]);

  useEffect(() => {
    if (
      !locationDirty ||
      !moduleDetail?.ownedByRequester ||
      activeTab !== "locations" ||
      !entityId
    ) {
      return;
    }

    setAutosaveStatus("queued");
    setAutosaveMessage("pending");
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      void persistLocation();
    }, 1000);

    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [
    activeTab,
    entityId,
    locationDirty,
    moduleDetail?.ownedByRequester,
    persistLocation,
  ]);

  useEffect(() => {
    if (
      !encounterDirty ||
      !moduleDetail?.ownedByRequester ||
      activeTab !== "encounters" ||
      !entityId
    ) {
      return;
    }

    setAutosaveStatus("queued");
    setAutosaveMessage("pending");
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      void persistEncounter();
    }, 1000);

    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [
    activeTab,
    encounterDirty,
    entityId,
    moduleDetail?.ownedByRequester,
    persistEncounter,
  ]);

  useEffect(() => {
    if (
      !questDirty ||
      !moduleDetail?.ownedByRequester ||
      activeTab !== "quests" ||
      !entityId
    ) {
      return;
    }

    setAutosaveStatus("queued");
    setAutosaveMessage("pending");
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      void persistQuest();
    }, 1000);

    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [
    activeTab,
    entityId,
    moduleDetail?.ownedByRequester,
    persistQuest,
    questDirty,
  ]);

  useEffect(() => {
    if (
      !counterDirty ||
      !moduleDetail?.ownedByRequester ||
      activeTab !== "counters" ||
      !entityId
    ) {
      return;
    }

    setAutosaveStatus("queued");
    setAutosaveMessage("pending");
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      void persistCounter();
    }, 1000);

    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [
    activeTab,
    counterDirty,
    entityId,
    moduleDetail?.ownedByRequester,
    persistCounter,
  ]);

  useEffect(() => {
    if (
      !assetDirty ||
      !moduleDetail?.ownedByRequester ||
      activeTab !== "assets" ||
      !entityId
    ) {
      return;
    }

    setAutosaveStatus("queued");
    setAutosaveMessage("pending");
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => {
      void persistAsset();
    }, 1000);

    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [
    activeTab,
    assetDirty,
    entityId,
    moduleDetail?.ownedByRequester,
    persistAsset,
  ]);

  useEffect(
    () => () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    },
    [],
  );

  const handleBaseFieldBlur = (): void => {
    if (!baseDirty || !moduleDetail?.ownedByRequester) {
      return;
    }
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    void persistBase();
  };

  const handlePlayerInfoFieldBlur = (): void => {
    if (!playerInfoDirty || !moduleDetail?.ownedByRequester) {
      return;
    }
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    void persistPlayerInfo();
  };

  const handleStorytellerInfoFieldBlur = (): void => {
    if (!storytellerInfoDirty || !moduleDetail?.ownedByRequester) {
      return;
    }
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    void persistStorytellerInfo();
  };

  const handleActorFieldBlur = (): void => {
    if (!actorDirty || !moduleDetail?.ownedByRequester) {
      return;
    }
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    void persistActor();
  };

  const handleLocationFieldBlur = (): void => {
    if (!locationDirty || !moduleDetail?.ownedByRequester) {
      return;
    }
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    void persistLocation();
  };

  const handleEncounterFieldBlur = (): void => {
    if (!encounterDirty || !moduleDetail?.ownedByRequester) {
      return;
    }
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    void persistEncounter();
  };

  const handleQuestFieldBlur = (): void => {
    if (!questDirty || !moduleDetail?.ownedByRequester) {
      return;
    }
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    void persistQuest();
  };

  const handleCounterFieldBlur = (): void => {
    if (!counterDirty || !moduleDetail?.ownedByRequester) {
      return;
    }
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    void persistCounter();
  };

  const handleAssetFieldBlur = (): void => {
    if (!assetDirty || !moduleDetail?.ownedByRequester) {
      return;
    }
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    void persistAsset();
  };

  const editable = Boolean(moduleDetail?.ownedByRequester);
  const smartContextDocument = useMemo<SmartInputDocumentContext>(
    () => ({
      moduleTitle: baseForm.title,
      moduleSummary: moduleDetail?.index.summary ?? "",
      moduleIntent: moduleDetail?.index.intent ?? "",
      premise: baseForm.premise,
      haveTags: baseForm.haveTags,
      avoidTags: baseForm.avoidTags,
      playerSummary: playerInfoForm.summary,
      playerInfo: playerInfoForm.infoText,
      storytellerSummary: storytellerInfoForm.summary,
      storytellerInfo: storytellerInfoForm.infoText,
    }),
    [
      baseForm.avoidTags,
      baseForm.haveTags,
      baseForm.premise,
      baseForm.title,
      moduleDetail?.index.intent,
      moduleDetail?.index.summary,
      playerInfoForm.infoText,
      playerInfoForm.summary,
      storytellerInfoForm.infoText,
      storytellerInfoForm.summary,
    ],
  );
  const locationPinTargetOptions = useMemo<
    AdventureModuleLocationPinTarget[]
  >(() => {
    if (!moduleDetail) {
      return [];
    }

    const moduleSlug = moduleDetail.index.slug;
    const currentLocationFragmentId = locationForm?.fragmentId;
    const locationTargets: AdventureModuleLocationPinTarget[] =
      moduleDetail.locations
        .filter((location) => location.fragmentId !== currentLocationFragmentId)
        .map((location) => ({
          fragmentId: location.fragmentId,
          kind: "location",
          slug: location.locationSlug,
          title: location.title,
          summary: location.summary,
          titleImageUrl: location.titleImageUrl,
          routePath: buildCampaignRoute(
            moduleSlug,
            "locations",
            location.locationSlug,
          ),
        }));
    const actorTargets: AdventureModuleLocationPinTarget[] =
      moduleDetail.actors.map((actor) => ({
        fragmentId: actor.fragmentId,
        kind: "actor",
        slug: actor.actorSlug,
        title: actor.title,
        summary: actor.summary,
        actorCard: {
          baseLayerSlug: actor.baseLayerSlug,
          tacticalRoleSlug: actor.tacticalRoleSlug,
          tacticalSpecialSlug: actor.tacticalSpecialSlug,
        },
        routePath: buildCampaignRoute(moduleSlug, "actors", actor.actorSlug),
      }));
    const encounterTargets: AdventureModuleLocationPinTarget[] =
      moduleDetail.encounters.map((encounter) => ({
        fragmentId: encounter.fragmentId,
        kind: "encounter",
        slug: encounter.encounterSlug,
        title: encounter.title,
        summary: encounter.summary,
        titleImageUrl: encounter.titleImageUrl,
        routePath: buildCampaignRoute(
          moduleSlug,
          "encounters",
          encounter.encounterSlug,
        ),
      }));
    const questTargets: AdventureModuleLocationPinTarget[] =
      moduleDetail.quests.map((quest) => ({
        fragmentId: quest.fragmentId,
        kind: "quest",
        slug: quest.questSlug,
        title: quest.title,
        summary: quest.summary,
        titleImageUrl: quest.titleImageUrl,
        routePath: buildCampaignRoute(moduleSlug, "quests", quest.questSlug),
      }));

    return [...locationTargets, ...actorTargets, ...encounterTargets, ...questTargets];
  }, [buildCampaignRoute, locationForm?.fragmentId, moduleDetail]);

  const openLocationPinTarget = useCallback(
    (target: AdventureModuleLocationPinTarget): void => {
      navigate(target.routePath);
    },
    [navigate],
  );

  const handleCreateSession = useCallback(async (): Promise<void> => {
    if (!moduleDetail || creatingSession) {
      return;
    }

    setCreatingSession(true);
    setError(null);
    try {
      const created = await createCampaignSession(
        moduleDetail.campaignId,
        creatorToken,
      );
      navigate(
        `/campaign/${encodeURIComponent(moduleDetail.index.slug)}/session/${encodeURIComponent(created.sessionId)}`,
      );
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Could not create campaign session.",
      );
    } finally {
      setCreatingSession(false);
    }
  }, [creatingSession, creatorToken, moduleDetail, navigate]);

  const handleSendStorytellerMessage = useCallback((): void => {
    if (!storytellerIdentity || chatDraft.trim().length === 0) {
      return;
    }
    sessionRealtime.sendMessage(storytellerIdentity.participantId, chatDraft.trim());
    setChatDraft("");
  }, [chatDraft, sessionRealtime, storytellerIdentity]);
  const handleStorytellerMessageKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>): void => {
      if (
        event.key !== "Enter" ||
        event.shiftKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.nativeEvent.isComposing
      ) {
        return;
      }

      event.preventDefault();
      handleSendStorytellerMessage();
    },
    [handleSendStorytellerMessage],
  );

  const handleCloseStorytellerSession = useCallback((): void => {
    if (!storytellerIdentity) {
      return;
    }
    sessionRealtime.closeSession(storytellerIdentity.participantId);
  }, [sessionRealtime, storytellerIdentity]);

  useEffect(() => {
    setTableSelection([]);
  }, [sessionId, storytellerSessionMode]);

  const addCardToTableSelection = useCallback(
    (card: CampaignSessionTableCardReference): void => {
      setTableSelection((current) => [
        ...current,
        {
          id: createTableSelectionId(),
          label: formatTableSelectionLabel(card),
          card,
        },
      ]);
    },
    [],
  );

  const removeCardFromSelection = useCallback((entryId: string): void => {
    setTableSelection((current) =>
      current.filter((entry) => entry.id !== entryId),
    );
  }, []);

  const handleSendSelectionToTarget = useCallback(
    (target: CampaignSessionTableTarget): void => {
      if (!storytellerIdentity || tableSelection.length === 0) {
        return;
      }
      sessionRealtime.addTableCards({
        participantId: storytellerIdentity.participantId,
        target,
        cards: tableSelection.map((entry) => entry.card),
      });
      setTableSelection([]);
    },
    [sessionRealtime, storytellerIdentity, tableSelection],
  );

  const handleRemoveStorytellerTableCard = useCallback(
    (tableEntryId: string): void => {
      if (!storytellerIdentity) {
        return;
      }
      sessionRealtime.removeTableCard({
        participantId: storytellerIdentity.participantId,
        tableEntryId,
      });
    },
    [sessionRealtime, storytellerIdentity],
  );

  const storytellerGameCardCatalogValue = useMemo(
    () =>
      createGameCardCatalogContextValue({
        actors: moduleDetail?.actors ?? [],
        counters: moduleDetail?.counters ?? [],
        assets: moduleDetail?.assets ?? [],
        encounters: moduleDetail?.encounters ?? [],
        quests: moduleDetail?.quests ?? [],
      }),
    [moduleDetail],
  );

  return (
    <div
      className={
        storytellerSessionMode
          ? "flex min-h-full w-full max-w-none flex-1 flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8"
          : "app-shell stack py-8 gap-4"
      }
    >
      {storytellerSessionMode ? null : (
        <header className="stack gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex items-baseline gap-x-2">
              {!editable ? (
                <Text
                  variant="h2"
                  color="iron"
                  className="text-[1.75rem] leading-none sm:text-[2.2rem] sm:leading-none"
                >
                  {moduleDetail?.index.title ?? "Campaign"}
                </Text>
              ) : (
                <input
                  type="text"
                  aria-label="Campaign title"
                  maxLength={120}
                  size={resolveCompactTitleInputSize(baseForm.title)}
                  value={baseForm.title}
                  onChange={(event) => {
                    setBaseValidationMessage(null);
                    setBaseForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }));
                    setBaseDirty(true);
                  }}
                  onBlur={handleBaseFieldBlur}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") {
                      return;
                    }
                    event.currentTarget.blur();
                  }}
                  className="m-0 max-w-full appearance-none border-0 bg-transparent p-0 font-heading text-[1.75rem] font-bold leading-none tracking-tight text-kac-iron shadow-none outline-none ring-0 transition sm:text-[2.2rem] sm:leading-none focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kac-gold-dark/40"
                />
              )}
            </div>
            {!moduleDetail ? (
              <div className="flex shrink-0 items-center gap-2">
                <AutosaveStatusBadge
                  status={autosaveStatus}
                  message={autosaveMessage}
                />
              </div>
            ) : null}
          </div>
          {moduleDetail ? (
            <AdventureModuleTabNav
              moduleSlug={moduleDetail.index.slug}
              tabs={tabItems}
              buildTabPath={(moduleSlug, tabId) =>
                buildCampaignRoute(moduleSlug, tabId as CampaignTab)
              }
              leadingContent={
                <Button
                  variant="ghost"
                  color="gold"
                  disabled={creatingSession}
                  onClick={() => {
                    void handleCreateSession();
                  }}
                >
                  {creatingSession ? "Creating Session..." : "Create Session"}
                </Button>
              }
              trailingContent={
                <AutosaveStatusBadge
                  status={autosaveStatus}
                  message={autosaveMessage}
                />
              }
            />
          ) : null}
        </header>
      )}

      {error ? (
        <Message label="Error" color="blood">
          {error}
        </Message>
      ) : null}

      {loading ? (
        <Panel>
          <Text variant="body" color="iron-light">
            Loading campaign...
          </Text>
        </Panel>
      ) : null}

      {!loading && moduleDetail ? (
        <>
          {!moduleDetail.ownedByRequester ? (
            <Message label="Read-Only" color="bone">
              You can view this campaign, but only its current editor can modify it.
            </Message>
          ) : null}

          {storytellerSessionMode ? (
            <AdventureModuleTabNav
              moduleSlug={moduleDetail.index.slug}
              tabs={tabItems}
              buildTabPath={(moduleSlug, tabId) =>
                buildCampaignRoute(moduleSlug, tabId as CampaignTab)
              }
              showMobileMenu={storytellerSessionMode}
              leadingContent={
                <NavLink
                  to="/"
                  aria-label="Go to home page"
                  className="inline-flex shrink-0"
                >
                  <img
                    src="/mighty-decks-ai-storyteller-logo.png"
                    alt="Mighty Decks AI Storyteller"
                    className="h-12 w-auto drop-shadow-[0_4px_0_rgba(9,15,21,0.38)]"
                    loading="eager"
                    decoding="async"
                  />
                </NavLink>
              }
              trailingContent={
                <AutosaveStatusBadge
                  status={autosaveStatus}
                  message={autosaveMessage}
                />
              }
            />
          ) : null}

          {storytellerSessionMode && tableSelection.length > 0 ? (
            <CampaignSessionSelectionStrip
              entries={tableSelection}
              onRemoveEntry={removeCardFromSelection}
            />
          ) : null}

          {entityId ? (
            activeTab === "actors" ? (
              activeActor && actorForm ? (
                <AdventureModuleActorEditor
                  actor={{
                    ...activeActor,
                    title: actorForm.title,
                    summary: actorForm.summary,
                    baseLayerSlug: actorForm.baseLayerSlug,
                    tacticalRoleSlug: actorForm.tacticalRoleSlug,
                    tacticalSpecialSlug: actorForm.tacticalSpecialSlug,
                    isPlayerCharacter: actorForm.isPlayerCharacter,
                    content: actorForm.content,
                  }}
                  actors={moduleDetail.actors}
                  counters={moduleDetail.counters}
                  assets={moduleDetail.assets}
                  encounters={moduleDetail.encounters}
                  quests={moduleDetail.quests}
                  smartContextDocument={smartContextDocument}
                  editable={editable}
                  validationMessage={actorValidationMessage}
                  onTitleChange={(nextValue) => {
                    setActorValidationMessage(null);
                    setActorForm((current) =>
                      current ? { ...current, title: nextValue } : current,
                    );
                    setActorDirty(true);
                  }}
                  onSummaryChange={(nextValue) => {
                    setActorValidationMessage(null);
                    setActorForm((current) =>
                      current ? { ...current, summary: nextValue } : current,
                    );
                    setActorDirty(true);
                  }}
                  onBaseLayerChange={(nextValue) => {
                    setActorValidationMessage(null);
                    setActorForm((current) =>
                      current
                        ? {
                            ...current,
                            baseLayerSlug: nextValue,
                          }
                        : current,
                    );
                    setActorDirty(true);
                  }}
                  onTacticalRoleChange={(nextValue) => {
                    setActorValidationMessage(null);
                    setActorForm((current) =>
                      current
                        ? {
                            ...current,
                            tacticalRoleSlug: nextValue,
                          }
                        : current,
                    );
                    setActorDirty(true);
                  }}
                  onTacticalSpecialChange={(nextValue) => {
                    setActorValidationMessage(null);
                    setActorForm((current) =>
                      current
                        ? {
                            ...current,
                            tacticalSpecialSlug: nextValue,
                          }
                        : current,
                    );
                    setActorDirty(true);
                  }}
                  onIsPlayerCharacterChange={(nextValue) => {
                    setActorValidationMessage(null);
                    setActorForm((current) =>
                      current
                        ? {
                            ...current,
                            isPlayerCharacter: nextValue,
                          }
                        : current,
                    );
                    setActorDirty(true);
                  }}
                  onContentChange={(nextValue) => {
                    setActorValidationMessage(null);
                    setActorForm((current) =>
                      current ? { ...current, content: nextValue } : current,
                    );
                    setActorDirty(true);
                  }}
                  onFieldBlur={handleActorFieldBlur}
                  onAdjustCounterValue={(counterSlug, delta, target) => {
                    void handleAdjustCounterValue(counterSlug, delta, target);
                  }}
                  onDelete={() => {
                    void handleDeleteActor(activeActor.actorSlug, activeActor.title);
                  }}
                  onAddActorCardToSelection={
                    storytellerSessionMode
                      ? () =>
                          addCardToTableSelection({
                            type: "ActorCard",
                            slug: activeActor.actorSlug,
                          })
                      : undefined
                  }
                />
              ) : (
                <AdventureModuleTabPlaceholder
                  description={`Actor "${normalizedEntityId ?? entityId}" could not be found in this module.`}
                />
              )
            ) : activeTab === "locations" ? (
              activeLocation && locationForm ? (
                <AdventureModuleLocationEditor
                  location={{
                    ...activeLocation,
                    title: locationForm.title,
                    summary: locationForm.summary,
                    titleImageUrl: locationForm.titleImageUrl || undefined,
                    introductionMarkdown: locationForm.introductionMarkdown,
                    descriptionMarkdown: locationForm.descriptionMarkdown,
                    mapImageUrl: locationForm.mapImageUrl || undefined,
                    mapPins: locationForm.mapPins,
                  }}
                  actors={moduleDetail.actors}
                  counters={moduleDetail.counters}
                  assets={moduleDetail.assets}
                  encounters={moduleDetail.encounters}
                  quests={moduleDetail.quests}
                  smartContextDocument={smartContextDocument}
                  editable={editable}
                  validationMessage={locationValidationMessage}
                  pinTargets={locationPinTargetOptions}
                  onTitleChange={(nextValue) => {
                    setLocationValidationMessage(null);
                    setLocationForm((current) =>
                      current ? { ...current, title: nextValue } : current,
                    );
                    setLocationDirty(true);
                  }}
                  onSummaryChange={(nextValue) => {
                    setLocationValidationMessage(null);
                    setLocationForm((current) =>
                      current ? { ...current, summary: nextValue } : current,
                    );
                    setLocationDirty(true);
                  }}
                  onTitleImageUrlChange={(nextValue) => {
                    setLocationValidationMessage(null);
                    setLocationForm((current) =>
                      current
                        ? {
                            ...current,
                            titleImageUrl: nextValue,
                          }
                        : current,
                    );
                    setLocationDirty(true);
                  }}
                  onIntroductionChange={(nextValue) => {
                    setLocationValidationMessage(null);
                    setLocationForm((current) =>
                      current
                        ? {
                            ...current,
                            introductionMarkdown: nextValue,
                          }
                        : current,
                    );
                    setLocationDirty(true);
                  }}
                  onDescriptionChange={(nextValue) => {
                    setLocationValidationMessage(null);
                    setLocationForm((current) =>
                      current
                        ? {
                            ...current,
                            descriptionMarkdown: nextValue,
                          }
                        : current,
                    );
                    setLocationDirty(true);
                  }}
                  onMapImageUrlChange={(nextValue) => {
                    setLocationValidationMessage(null);
                    setLocationForm((current) =>
                      current
                        ? {
                            ...current,
                            mapImageUrl: nextValue,
                          }
                        : current,
                    );
                    setLocationDirty(true);
                  }}
                  onMapPinsChange={(nextValue) => {
                    setLocationValidationMessage(null);
                    setLocationForm((current) =>
                      current
                        ? {
                            ...current,
                            mapPins: nextValue.map((pin) => ({ ...pin })),
                          }
                        : current,
                    );
                    setLocationDirty(true);
                  }}
                  onOpenPinTarget={openLocationPinTarget}
                  onFieldBlur={handleLocationFieldBlur}
                  onAdjustCounterValue={(counterSlug, delta, target) => {
                    void handleAdjustCounterValue(counterSlug, delta, target);
                  }}
                  onDelete={() => {
                    void handleDeleteLocation(
                      activeLocation.locationSlug,
                      activeLocation.title,
                    );
                  }}
                  onAddLocationCardToSelection={
                    storytellerSessionMode
                      ? () =>
                          addCardToTableSelection({
                            type: "LocationCard",
                            slug: activeLocation.locationSlug,
                          })
                      : undefined
                  }
                />
              ) : (
                <AdventureModuleTabPlaceholder
                  description={`Location "${normalizedEntityId ?? entityId}" could not be found in this module.`}
                />
              )
            ) : activeTab === "encounters" ? (
              activeEncounter && encounterForm ? (
                <AdventureModuleEncounterEditor
                  encounter={{
                    ...activeEncounter,
                    title: encounterForm.title,
                    summary: encounterForm.summary,
                    prerequisites: encounterForm.prerequisites,
                    titleImageUrl: encounterForm.titleImageUrl || undefined,
                    content: encounterForm.content,
                  }}
                  actors={moduleDetail.actors}
                  counters={moduleDetail.counters}
                  assets={moduleDetail.assets}
                  encounters={moduleDetail.encounters}
                  quests={moduleDetail.quests}
                  smartContextDocument={smartContextDocument}
                  editable={editable}
                  validationMessage={encounterValidationMessage}
                  onTitleChange={(nextValue) => {
                    setEncounterValidationMessage(null);
                    setEncounterForm((current) =>
                      current ? { ...current, title: nextValue } : current,
                    );
                    setEncounterDirty(true);
                  }}
                  onSummaryChange={(nextValue) => {
                    setEncounterValidationMessage(null);
                    setEncounterForm((current) =>
                      current ? { ...current, summary: nextValue } : current,
                    );
                    setEncounterDirty(true);
                  }}
                  onPrerequisitesChange={(nextValue) => {
                    setEncounterValidationMessage(null);
                    setEncounterForm((current) =>
                      current
                        ? { ...current, prerequisites: nextValue }
                        : current,
                    );
                    setEncounterDirty(true);
                  }}
                  onTitleImageUrlChange={(nextValue) => {
                    setEncounterValidationMessage(null);
                    setEncounterForm((current) =>
                      current
                        ? {
                            ...current,
                            titleImageUrl: nextValue,
                          }
                        : current,
                    );
                    setEncounterDirty(true);
                  }}
                  onContentChange={(nextValue) => {
                    setEncounterValidationMessage(null);
                    setEncounterForm((current) =>
                      current ? { ...current, content: nextValue } : current,
                    );
                    setEncounterDirty(true);
                  }}
                  onFieldBlur={handleEncounterFieldBlur}
                  onAdjustCounterValue={(counterSlug, delta, target) => {
                    void handleAdjustCounterValue(counterSlug, delta, target);
                  }}
                  onDelete={() => {
                    void handleDeleteEncounter(
                      activeEncounter.encounterSlug,
                      activeEncounter.title,
                    );
                  }}
                  onAddEncounterCardToSelection={
                    storytellerSessionMode
                      ? () =>
                          addCardToTableSelection({
                            type: "EncounterCard",
                            slug: activeEncounter.encounterSlug,
                          })
                      : undefined
                  }
                />
              ) : (
                <AdventureModuleTabPlaceholder
                  description={`Encounter "${normalizedEntityId ?? entityId}" could not be found in this module.`}
                />
              )
            ) : activeTab === "quests" ? (
              activeQuest && questForm ? (
                <AdventureModuleQuestEditor
                  quest={{
                    ...activeQuest,
                    title: questForm.title,
                    summary: questForm.summary,
                    titleImageUrl: questForm.titleImageUrl || undefined,
                    content: questForm.content,
                  }}
                  actors={moduleDetail.actors}
                  counters={moduleDetail.counters}
                  assets={moduleDetail.assets}
                  encounters={moduleDetail.encounters}
                  quests={moduleDetail.quests}
                  smartContextDocument={smartContextDocument}
                  editable={editable}
                  validationMessage={questValidationMessage}
                  onTitleChange={(nextValue) => {
                    setQuestValidationMessage(null);
                    setQuestForm((current) =>
                      current ? { ...current, title: nextValue } : current,
                    );
                    setQuestDirty(true);
                  }}
                  onSummaryChange={(nextValue) => {
                    setQuestValidationMessage(null);
                    setQuestForm((current) =>
                      current ? { ...current, summary: nextValue } : current,
                    );
                    setQuestDirty(true);
                  }}
                  onTitleImageUrlChange={(nextValue) => {
                    setQuestValidationMessage(null);
                    setQuestForm((current) =>
                      current
                        ? {
                            ...current,
                            titleImageUrl: nextValue,
                          }
                        : current,
                    );
                    setQuestDirty(true);
                  }}
                  onContentChange={(nextValue) => {
                    setQuestValidationMessage(null);
                    setQuestForm((current) =>
                      current ? { ...current, content: nextValue } : current,
                    );
                    setQuestDirty(true);
                  }}
                  onFieldBlur={handleQuestFieldBlur}
                  onAdjustCounterValue={(counterSlug, delta, target) => {
                    void handleAdjustCounterValue(counterSlug, delta, target);
                  }}
                  onDelete={() => {
                    void handleDeleteQuest(activeQuest.questSlug, activeQuest.title);
                  }}
                  onAddQuestCardToSelection={
                    storytellerSessionMode
                      ? () =>
                          addCardToTableSelection({
                            type: "QuestCard",
                            slug: activeQuest.questSlug,
                          })
                      : undefined
                  }
                />
              ) : (
                <AdventureModuleTabPlaceholder
                  description={`Quest "${normalizedEntityId ?? entityId}" could not be found in this module.`}
                />
              )
            ) : activeTab === "counters" ? (
              activeCounter && counterForm ? (
                <AdventureModuleCounterEditor
                  counter={{
                    ...activeCounter,
                    title: counterForm.title,
                    iconSlug: counterForm.iconSlug,
                    currentValue: counterForm.currentValue,
                    maxValue: counterForm.maxValue,
                    description: counterForm.description,
                  }}
                  editable={editable}
                  validationMessage={counterValidationMessage}
                  onTitleChange={(nextValue) => {
                    setCounterValidationMessage(null);
                    setCounterForm((current) =>
                      current ? { ...current, title: nextValue } : current,
                    );
                    setCounterDirty(true);
                  }}
                  onIconSlugChange={(nextValue) => {
                    setCounterValidationMessage(null);
                    setCounterForm((current) =>
                      current ? { ...current, iconSlug: nextValue } : current,
                    );
                    setCounterDirty(true);
                  }}
                  onCurrentValueChange={(nextValue) => {
                    setCounterValidationMessage(null);
                    const parsed = Number.parseInt(nextValue, 10);
                    setCounterForm((current) =>
                      current
                        ? {
                            ...current,
                            currentValue:
                              Number.isFinite(parsed) && parsed >= 0 ? parsed : 0,
                          }
                        : current,
                    );
                    setCounterDirty(true);
                  }}
                  onMaxValueChange={(nextValue) => {
                    setCounterValidationMessage(null);
                    const trimmed = nextValue.trim();
                    const parsed = Number.parseInt(trimmed, 10);
                    setCounterForm((current) =>
                      current
                        ? {
                            ...current,
                            maxValue:
                              trimmed.length === 0
                                ? undefined
                                : Number.isFinite(parsed) && parsed >= 0
                                  ? parsed
                                  : current.maxValue,
                          }
                        : current,
                    );
                    setCounterDirty(true);
                  }}
                  onDescriptionChange={(nextValue) => {
                    setCounterValidationMessage(null);
                    setCounterForm((current) =>
                      current ? { ...current, description: nextValue } : current,
                    );
                    setCounterDirty(true);
                  }}
                  onFieldBlur={handleCounterFieldBlur}
                  onAdjustCounterValue={(counterSlug, delta, target) => {
                    void handleAdjustCounterValue(counterSlug, delta, target);
                  }}
                  onDelete={() => {
                    void handleDeleteCounter(activeCounter.slug, activeCounter.title);
                  }}
                  onAddCounterCardToSelection={
                    storytellerSessionMode
                      ? () =>
                          addCardToTableSelection({
                            type: "CounterCard",
                            slug: activeCounter.slug,
                          })
                      : undefined
                  }
                />
              ) : (
                <AdventureModuleTabPlaceholder
                  description={`Counter "${normalizedEntityId ?? entityId}" could not be found in this module.`}
                />
              )
            ) : activeTab === "assets" ? (
              activeAsset && assetForm ? (
                <AdventureModuleAssetEditor
                  asset={{
                    assetSlug: activeAsset.assetSlug,
                    title: assetForm.title,
                    summary: assetForm.summary,
                    modifier: assetForm.modifier,
                    noun: assetForm.noun,
                    nounDescription: assetForm.nounDescription,
                    adjectiveDescription: assetForm.adjectiveDescription,
                    iconUrl: assetForm.iconUrl,
                    overlayUrl: assetForm.overlayUrl,
                    content: assetForm.content,
                  }}
                  actors={moduleDetail.actors}
                  counters={moduleDetail.counters}
                  assets={moduleDetail.assets}
                  encounters={moduleDetail.encounters}
                  quests={moduleDetail.quests}
                  smartContextDocument={smartContextDocument}
                  editable={editable}
                  reauthorRequired={assetForm.reauthorRequired}
                  validationMessage={assetValidationMessage}
                  onTitleChange={(nextValue) => {
                    setAssetValidationMessage(null);
                    setAssetForm((current) =>
                      current ? { ...current, title: nextValue } : current,
                    );
                    setAssetDirty(true);
                  }}
                  onSummaryChange={(nextValue) => {
                    setAssetValidationMessage(null);
                    setAssetForm((current) =>
                      current ? { ...current, summary: nextValue } : current,
                    );
                    setAssetDirty(true);
                  }}
                  onModifierChange={(nextValue) => {
                    setAssetValidationMessage(null);
                    setAssetForm((current) =>
                      current ? { ...current, modifier: nextValue } : current,
                    );
                    setAssetDirty(true);
                  }}
                  onNounChange={(nextValue) => {
                    setAssetValidationMessage(null);
                    setAssetForm((current) =>
                      current ? { ...current, noun: nextValue } : current,
                    );
                    setAssetDirty(true);
                  }}
                  onNounDescriptionChange={(nextValue) => {
                    setAssetValidationMessage(null);
                    setAssetForm((current) =>
                      current
                        ? { ...current, nounDescription: nextValue }
                        : current,
                    );
                    setAssetDirty(true);
                  }}
                  onAdjectiveDescriptionChange={(nextValue) => {
                    setAssetValidationMessage(null);
                    setAssetForm((current) =>
                      current
                        ? { ...current, adjectiveDescription: nextValue }
                        : current,
                    );
                    setAssetDirty(true);
                  }}
                  onIconUrlChange={(nextValue) => {
                    setAssetValidationMessage(null);
                    setAssetForm((current) =>
                      current ? { ...current, iconUrl: nextValue } : current,
                    );
                    setAssetDirty(true);
                  }}
                  onOverlayUrlChange={(nextValue) => {
                    setAssetValidationMessage(null);
                    setAssetForm((current) =>
                      current ? { ...current, overlayUrl: nextValue } : current,
                    );
                    setAssetDirty(true);
                  }}
                  onContentChange={(nextValue) => {
                    setAssetValidationMessage(null);
                    setAssetForm((current) =>
                      current ? { ...current, content: nextValue } : current,
                    );
                    setAssetDirty(true);
                  }}
                  onFieldBlur={handleAssetFieldBlur}
                  onDelete={() => {
                    void handleDeleteAsset(activeAsset.assetSlug, activeAsset.title);
                  }}
                  onAddAssetCardToSelection={
                    storytellerSessionMode
                      ? () =>
                          addCardToTableSelection({
                            type: "AssetCard",
                            slug: activeAsset.assetSlug,
                          })
                      : undefined
                  }
                />
              ) : (
                <AdventureModuleTabPlaceholder
                  description={`Asset "${normalizedEntityId ?? entityId}" could not be found in this module.`}
                />
              )
            ) : activeEntityTabConfig ? (
              <AdventureModuleTabPlaceholder
                description={
                  normalizedEntityId === "new"
                    ? `Create ${activeEntityTabConfig.singularLabel} is intentionally a placeholder for this milestone.`
                    : `${activeEntityTabConfig.singularLabel} editor placeholder for "${normalizedEntityId ?? entityId}". Detailed entity editors are planned for a later step.`
                }
              />
            ) : (
              <AdventureModuleTabPlaceholder description="Entity editor routes are planned for a later step." />
            )
          ) : activeTab === "base" ? (
            <AdventureModuleBaseTabPanel
              moduleId={moduleDetail.index.moduleId}
              creatorToken={creatorToken}
              coverImageUrl={moduleDetail.coverImageUrl}
              premise={baseForm.premise}
              haveTags={baseForm.haveTags}
              avoidTags={baseForm.avoidTags}
              moduleTitle={baseForm.title}
              moduleSummary={moduleDetail.index.summary}
              moduleIntent={moduleDetail.index.intent}
              playerSummary={playerInfoForm.summary}
              playerInfo={playerInfoForm.infoText}
              storytellerSummary={storytellerInfoForm.summary}
              storytellerInfo={storytellerInfoForm.infoText}
              editable={editable}
              validationMessage={baseValidationMessage}
              persistCoverImage={async (coverImageUrl) => {
                const nextDetail = await updateCampaignCoverImage(
                  moduleDetail.campaignId,
                  { coverImageUrl },
                  creatorToken,
                );
                setModuleDetail(nextDetail);
              }}
              onPremiseChange={(nextValue) => {
                setBaseForm((current) => ({ ...current, premise: nextValue }));
                setBaseDirty(true);
              }}
              onHaveChange={(nextValue) => {
                setBaseForm((current) => ({ ...current, haveTags: nextValue }));
                setBaseDirty(true);
              }}
              onAvoidChange={(nextValue) => {
                setBaseForm((current) => ({
                  ...current,
                  avoidTags: nextValue,
                }));
                setBaseDirty(true);
              }}
              onFieldBlur={handleBaseFieldBlur}
            />
          ) : activeTab === "player-info" ? (
            <AdventureModulePlayerInfoTabPanel
              summary={playerInfoForm.summary}
              infoText={playerInfoForm.infoText}
              smartContextDocument={smartContextDocument}
              actors={moduleDetail.actors}
              counters={moduleDetail.counters}
              assets={moduleDetail.assets}
              encounters={moduleDetail.encounters}
              quests={moduleDetail.quests}
              editable={editable}
              validationMessage={playerInfoValidationMessage}
              onSummaryChange={(nextValue) => {
                setPlayerInfoValidationMessage(null);
                setPlayerInfoForm((current) => ({
                  ...current,
                  summary: nextValue,
                }));
                setPlayerInfoDirty(true);
              }}
              onInfoTextChange={(nextValue) => {
                setPlayerInfoValidationMessage(null);
                setPlayerInfoForm((current) => ({
                  ...current,
                  infoText: nextValue,
                }));
                setPlayerInfoDirty(true);
              }}
              onFieldBlur={handlePlayerInfoFieldBlur}
              onAdjustCounterValue={(counterSlug, delta, target) => {
                void handleAdjustCounterValue(counterSlug, delta, target);
              }}
            />
          ) : activeTab === "storyteller-info" ? (
            <AdventureModuleStorytellerInfoTabPanel
              summary={storytellerInfoForm.summary}
              infoText={storytellerInfoForm.infoText}
              smartContextDocument={smartContextDocument}
              actors={moduleDetail.actors}
              counters={moduleDetail.counters}
              assets={moduleDetail.assets}
              encounters={moduleDetail.encounters}
              quests={moduleDetail.quests}
              editable={editable}
              validationMessage={storytellerInfoValidationMessage}
              onSummaryChange={(nextValue) => {
                setStorytellerInfoValidationMessage(null);
                setStorytellerInfoForm((current) => ({
                  ...current,
                  summary: nextValue,
                }));
                setStorytellerInfoDirty(true);
              }}
              onInfoTextChange={(nextValue) => {
                setStorytellerInfoValidationMessage(null);
                setStorytellerInfoForm((current) => ({
                  ...current,
                  infoText: nextValue,
                }));
                setStorytellerInfoDirty(true);
              }}
              onFieldBlur={handleStorytellerInfoFieldBlur}
              onAdjustCounterValue={(counterSlug, delta, target) => {
                void handleAdjustCounterValue(counterSlug, delta, target);
              }}
            />
          ) : activeTab === "actors" ? (
            <AdventureModuleActorsTabPanel
              actors={moduleDetail.actors}
              editable={editable}
              creating={creatingActor}
              createError={actorCreateError}
              onCreate={() => {
                void handleCreateActor();
              }}
              onOpenActor={(actorSlug) => {
                navigate(
                  buildCampaignRoute(moduleDetail.index.slug, "actors", actorSlug),
                );
              }}
              onDeleteActor={(actorSlug, title) => {
                void handleDeleteActor(actorSlug, title);
              }}
              onAddActorCardToSelection={
                storytellerSessionMode
                  ? (actorSlug) =>
                      addCardToTableSelection({
                        type: "ActorCard",
                        slug: actorSlug,
                      })
                  : undefined
              }
            />
          ) : activeTab === "locations" ? (
            <AdventureModuleLocationsTabPanel
              locations={moduleDetail.locations}
              editable={editable}
              creating={creatingLocation}
              createError={locationCreateError}
              onCreate={() => {
                void handleCreateLocation();
              }}
              onOpenLocation={(locationSlug) => {
                navigate(
                  buildCampaignRoute(moduleDetail.index.slug, "locations", locationSlug),
                );
              }}
              onDeleteLocation={(locationSlug, title) => {
                void handleDeleteLocation(locationSlug, title);
              }}
              onAddLocationCardToSelection={
                storytellerSessionMode
                  ? (locationSlug) =>
                      addCardToTableSelection({
                        type: "LocationCard",
                        slug: locationSlug,
                      })
                  : undefined
              }
            />
          ) : activeTab === "encounters" ? (
            <AdventureModuleEncountersTabPanel
              encounters={moduleDetail.encounters}
              editable={editable}
              creating={creatingEncounter}
              createError={encounterCreateError}
              onCreate={() => {
                void handleCreateEncounter();
              }}
              onOpenEncounter={(encounterSlug) => {
                navigate(
                  buildCampaignRoute(moduleDetail.index.slug, "encounters", encounterSlug),
                );
              }}
              onDeleteEncounter={(encounterSlug, title) => {
                void handleDeleteEncounter(encounterSlug, title);
              }}
              onAddEncounterCardToSelection={
                storytellerSessionMode
                  ? (encounterSlug) =>
                      addCardToTableSelection({
                        type: "EncounterCard",
                        slug: encounterSlug,
                      })
                  : undefined
              }
            />
          ) : activeTab === "quests" ? (
            <AdventureModuleQuestsTabPanel
              quests={moduleDetail.quests}
              editable={editable}
              creating={creatingQuest}
              createError={questCreateError}
              onCreate={() => {
                void handleCreateQuest();
              }}
              onOpenQuest={(questSlug) => {
                navigate(
                  buildCampaignRoute(moduleDetail.index.slug, "quests", questSlug),
                );
              }}
              onDeleteQuest={(questSlug, title) => {
                void handleDeleteQuest(questSlug, title);
              }}
              onAddQuestCardToSelection={
                storytellerSessionMode
                  ? (questSlug) =>
                      addCardToTableSelection({
                        type: "QuestCard",
                        slug: questSlug,
                      })
                  : undefined
              }
            />
          ) : activeTab === "counters" ? (
            <AdventureModuleCountersTabPanel
              counters={moduleDetail.counters}
              editable={editable}
              creating={creatingCounter}
              createError={counterCreateError}
              onCreate={() => {
                void handleCreateCounter();
              }}
              onOpenCounter={(counterSlug) => {
                navigate(
                  buildCampaignRoute(moduleDetail.index.slug, "counters", counterSlug),
                );
              }}
              onDeleteCounter={(counterSlug, title) => {
                void handleDeleteCounter(counterSlug, title);
              }}
              onAdjustCounterValue={(counterSlug, delta, target) => {
                void handleAdjustCounterValue(counterSlug, delta, target);
              }}
              onAddCounterCardToSelection={
                storytellerSessionMode
                  ? (counterSlug) =>
                      addCardToTableSelection({
                        type: "CounterCard",
                        slug: counterSlug,
                      })
                  : undefined
              }
            />
          ) : activeTab === "assets" ? (
            <AdventureModuleAssetsTabPanel
              assets={moduleDetail.assets}
              editable={editable}
              creating={creatingAsset}
              createError={assetCreateError}
              onCreate={() => {
                void handleCreateAsset();
              }}
              onOpenAsset={(assetSlug) => {
                navigate(
                  buildCampaignRoute(moduleDetail.index.slug, "assets", assetSlug),
                );
              }}
              onDeleteAsset={(assetSlug, title) => {
                void handleDeleteAsset(assetSlug, title);
              }}
              onAddAssetCardToSelection={
                storytellerSessionMode
                  ? (assetSlug) =>
                      addCardToTableSelection({
                        type: "AssetCard",
                        slug: assetSlug,
                      })
                  : undefined
              }
            />
          ) : activeTab === "outcomes" ? (
            <RulesOutcomesContent
              onAddOutcomeCard={
                storytellerSessionMode ? addCardToTableSelection : undefined
              }
            />
          ) : activeTab === "effects" ? (
            <RulesEffectsContent
              onAddEffectCard={
                storytellerSessionMode ? addCardToTableSelection : undefined
              }
            />
          ) : activeTab === "stunts" ? (
            <RulesStuntsContent
              onAddStuntCard={
                storytellerSessionMode ? addCardToTableSelection : undefined
              }
            />
          ) : activeTab === "static-assets" ? (
            <RulesAssetsContent
              onAddAssetCard={
                storytellerSessionMode ? addCardToTableSelection : undefined
              }
            />
          ) : activeTab === "sessions" ? (
            <Section className="stack gap-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="stack gap-1">
                  <Text variant="body" color="iron-light" className="text-sm">
                    Each session is a live or archived play instance of this campaign.
                  </Text>
                </div>
                <Button
                  color="gold"
                  disabled={creatingSession}
                  onClick={() => {
                    void handleCreateSession();
                  }}
                >
                  {creatingSession ? "Creating Session..." : "Create Session"}
                </Button>
              </div>
              {(moduleDetail.sessions ?? []).length > 0 ? (
                <div className="grid gap-3">
                  {moduleDetail.sessions.map((session) => (
                    <Message
                      key={session.sessionId}
                      label={`Session ${session.sessionId}`}
                      color="bone"
                      contentClassName="stack gap-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <Text variant="note" color="steel-dark" className="text-xs">
                          Created: {formatSessionCreatedAt(session.createdAtIso)}
                        </Text>
                        <ConnectionStatusPill
                          label="Status"
                          status={resolveSessionStatusTone(session.status)}
                          detail={session.status}
                        />
                      </div>
                      <Text variant="body" color="iron-light" className="text-sm">
                        Storytellers: {session.storytellerCount} | Players: {session.playerCount}
                      </Text>
                      <Text variant="body" color="iron-light" className="text-sm">
                        {session.transcriptPreview ?? "No transcript yet."}
                      </Text>
                      <div className="flex flex-wrap gap-2">
                        <div className="flex-1" />
                        <Button
                          color="gold"
                          href={`/campaign/${encodeURIComponent(moduleDetail.index.slug)}/session/${encodeURIComponent(session.sessionId)}`}
                        >
                          Join
                        </Button>
                      </div>
                    </Message>
                  ))}
                </div>
              ) : (
                <Text variant="body" color="iron-light" className="text-sm">
                  No sessions have been created yet.
                </Text>
              )}
            </Section>
          ) : activeTab === "chat" ? (
            <Section className="stack min-h-0 flex-1 gap-4 overflow-hidden">
              {storytellerRealtimeError ? (
                <Message label="Session Error" color="blood">
                  {storytellerRealtimeError}
                </Message>
              ) : null}

              <CampaignSessionChatLayout
                tablePane={
                  <CampaignSessionTable
                    campaign={moduleDetail}
                    session={storytellerSession}
                    viewerRole="storyteller"
                    currentParticipantId={storytellerIdentity?.participantId}
                    hasStagedCards={tableSelection.length > 0}
                    onSendCardsToTarget={handleSendSelectionToTarget}
                    onRemoveEntry={handleRemoveStorytellerTableCard}
                    className="mx-2 sm:mx-3"
                  />
                }
                chatPane={
                  <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden px-2 sm:px-3">
                    <CampaignSessionTranscriptFeed
                      entries={storytellerSession?.transcript ?? []}
                      participants={storytellerSession?.participants ?? []}
                      currentParticipantId={storytellerIdentity?.participantId}
                      gameCardCatalogValue={storytellerGameCardCatalogValue}
                      className="min-h-[16rem] flex-1"
                    />

                    <div className="stack gap-2">
                      <DepressedInput
                        multiline
                        label="Message"
                        labelColor="gold"
                        rows={4}
                        value={chatDraft}
                        onChange={(event) => setChatDraft(event.target.value)}
                        onKeyDown={handleStorytellerMessageKeyDown}
                        placeholder="Share narration, rulings, or prompts with the table..."
                        controlClassName="min-h-[7.5rem] pr-12"
                        topRightControl={
                          <MarkdownImageInsertButton
                            identityKey={`${moduleDetail.index.slug}-${sessionId ?? "chat"}-storyteller-chat-image`}
                            smartContextDocument={smartContextDocument}
                            currentInputValue={chatDraft}
                            disabled={storytellerSession?.status === "closed"}
                            dialogTitle="Share Image"
                            dialogDescription="Generate a new image or reuse an existing one, then insert it into your storyteller draft as standard markdown."
                            promptDescription="Generate or reuse an image to share in the live storyteller transcript."
                            workflowContextIntro="Markdown image prompt for a campaign storyteller transcript message. Refine wording while preserving a clear, table-readable illustration."
                            buttonAriaLabel="Insert image into storyteller transcript"
                            buttonTitle="Share image"
                            onInsertMarkdownSnippet={(snippet) => {
                              setChatDraft((current) =>
                                appendMarkdownSnippet(current, snippet),
                              );
                            }}
                          />
                        }
                      />
                      <div className="flex flex-wrap items-end gap-2 paper-shadow">
                        <Button
                          variant="solid"
                          color="curse"
                          size="sm"
                          type="button"
                          disabled={storytellerSession?.status === "closed"}
                          onClick={() => {
                            if (window.confirm("End this session now?")) {
                              handleCloseStorytellerSession();
                            }
                          }}
                        >
                          End Session
                        </Button>
                        <div className="flex-1" />
                        <Button
                          color="gold"
                          disabled={
                            storytellerSession?.status === "closed" ||
                            chatDraft.trim().length === 0
                          }
                          onClick={handleSendStorytellerMessage}
                        >
                          Send
                        </Button>
                      </div>
                      <div className="flex min-h-[2.2em] flex-col items-end mt-2 paper-shadow">
                        <Text
                          variant="note"
                          color="steel-dark"
                          className="normal-case tracking-normal"
                        >
                          Press Enter to send. Shift+Enter for newline.
                        </Text>
                      </div>
                    </div>
                  </div>
                }
              />
            </Section>
          ) : activeEntityTab && activeEntityTabConfig ? (
            <EntityList
              tab={activeEntityTab}
              tabLabel={activeEntityTabConfig.tabLabel}
              createLabel={activeEntityTabConfig.createLabel}
              items={activeEntityTabConfig.items}
              editable={editable}
              onCreate={() => {
                navigate(
                  buildCampaignRoute(moduleDetail.index.slug, activeEntityTab, "new"),
                );
              }}
            />
          ) : (
            <AdventureModuleTabPlaceholder description="This tab is intentionally a placeholder for the next implementation step." />
          )}
        </>
      ) : null}
    </div>
  );
};



