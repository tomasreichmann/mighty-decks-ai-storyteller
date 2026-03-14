import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { AdventureModuleDetail } from "@mighty-decks/spec/adventureModuleAuthoring";
import type { AdventureModuleIndex } from "@mighty-decks/spec/adventureModule";
import { Message } from "../components/common/Message";
import { Panel } from "../components/common/Panel";
import { Text } from "../components/common/Text";
import { AdventureModuleActorEditor } from "../components/adventure-module/AdventureModuleActorEditor";
import { AdventureModuleActorsTabPanel } from "../components/adventure-module/AdventureModuleActorsTabPanel";
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
  EntityList,
  type EntityListItem,
  type EntityListTab,
} from "../components/adventure-module/EntityList";
import {
  createAdventureModuleActor,
  getAdventureModuleBySlug,
  updateAdventureModuleActor,
  updateAdventureModuleFragment,
  updateAdventureModuleIndex,
} from "../lib/adventureModuleApi";
import { getAdventureModuleCreatorToken } from "../lib/adventureModuleIdentity";
import { normalizeLegacyGameCardMarkdown } from "../lib/gameCardMarkdown";
import { toMarkdownPlainTextSnippet } from "../lib/markdownSnippet";
import type { SmartInputDocumentContext } from "../lib/smartInputContext";

const AUTHORING_TABS = [
  "base",
  "player-info",
  "storyteller-info",
  "actors",
  "locations",
  "encounters",
  "quests",
  "assets",
] as const;

type AuthoringTab = (typeof AUTHORING_TABS)[number];

const TAB_LABELS: Record<AuthoringTab, string> = {
  base: "Base",
  "player-info": "Player Info",
  "storyteller-info": "Storyteller Info",
  actors: "Actors",
  locations: "Locations",
  encounters: "Encounters",
  quests: "Quests",
  assets: "Assets",
};

const TAB_ITEMS: AdventureModuleTabItem[] = AUTHORING_TABS.map((tab) => ({
  id: tab,
  label: TAB_LABELS[tab],
}));

const isAuthoringTab = (value: string | undefined): value is AuthoringTab =>
  Boolean(value && AUTHORING_TABS.includes(value as AuthoringTab));

const ENTITY_LIST_TABS: EntityListTab[] = [
  "actors",
  "locations",
  "encounters",
  "quests",
  "assets",
];

const isEntityListTab = (value: AuthoringTab): value is EntityListTab =>
  ENTITY_LIST_TABS.includes(value as EntityListTab);

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
  assets: {
    tabLabel: "Assets",
    singularLabel: "Asset",
    createLabel: "Create Asset",
    items: withPlaceholderImages([
      {
        slug: "lantern-shards",
        title: "Lantern Shards",
        description: "Cracked crystal fragments that store unstable light.",
      },
      {
        slug: "smuggler-passkey",
        title: "Smuggler Passkey",
        description:
          "Stamped token granting temporary passage through checkpoints.",
      },
      {
        slug: "wardens-seal",
        title: "Warden's Seal",
        description: "Authority sigil capable of overriding civic locks.",
      },
      {
        slug: "memory-fog-vial",
        title: "Memory Fog Vial",
        description: "Single-use gas that blurs faces and spoken details.",
      },
      {
        slug: "clockwork-map",
        title: "Clockwork Map",
        description: "Self-updating chart tracking moving walls and shutters.",
      },
      {
        slug: "broken-vow-ledger",
        title: "Broken Vow Ledger",
        description:
          "Compromising account book tied to multiple power brokers.",
      },
      {
        slug: "echo-repeater",
        title: "Echo Repeater",
        description: "Portable relay for signals across deep stone corridors.",
      },
      {
        slug: "stormglass-compass",
        title: "Stormglass Compass",
        description:
          "Direction finder that points toward active magical pressure.",
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
  actorSlug: string;
  title: string;
  summary: string;
  baseLayerSlug: AdventureModuleDetail["actors"][number]["baseLayerSlug"];
  tacticalRoleSlug: AdventureModuleDetail["actors"][number]["tacticalRoleSlug"];
  tacticalSpecialSlug?: AdventureModuleDetail["actors"][number]["tacticalSpecialSlug"];
  content: string;
}

const toBaseFormState = (index: AdventureModuleIndex): BaseFormState => ({
  title: index.title,
  premise: index.premise,
  haveTags: [...index.dos],
  avoidTags: [...index.donts],
});

const resolvePlayerSummaryState = (
  detail: AdventureModuleDetail,
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
  detail: AdventureModuleDetail,
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
  detail: AdventureModuleDetail,
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
  detail: AdventureModuleDetail,
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
  actor: AdventureModuleDetail["actors"][number],
): ActorFormState => ({
  actorSlug: actor.actorSlug,
  title: actor.title,
  summary: actor.summary ?? "",
  baseLayerSlug: actor.baseLayerSlug,
  tacticalRoleSlug: actor.tacticalRoleSlug,
  tacticalSpecialSlug: actor.tacticalSpecialSlug,
  content: normalizeLegacyGameCardMarkdown(actor.content),
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
    content,
  };
};

export const AdventureModuleAuthoringPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { slug, tab, entityId } = useParams<{
    slug?: string;
    tab?: string;
    entityId?: string;
  }>();
  const creatorToken = useMemo(() => getAdventureModuleCreatorToken(), []);
  const [moduleDetail, setModuleDetail] =
    useState<AdventureModuleDetail | null>(null);
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [baseDirty, setBaseDirty] = useState(false);
  const [playerInfoDirty, setPlayerInfoDirty] = useState(false);
  const [storytellerInfoDirty, setStorytellerInfoDirty] = useState(false);
  const [actorDirty, setActorDirty] = useState(false);
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
  const [actorCreateError, setActorCreateError] = useState<string | null>(null);
  const [creatingActor, setCreatingActor] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>("idle");
  const [autosaveMessage, setAutosaveMessage] = useState<string | undefined>(
    undefined,
  );
  const saveTimerRef = useRef<number | null>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    if (!slug || isAuthoringTab(tab)) {
      return;
    }
    navigate(`/adventure-module/${encodeURIComponent(slug)}/player-info`, {
      replace: true,
    });
  }, [navigate, slug, tab]);

  const activeTab: AuthoringTab = isAuthoringTab(tab) ? tab : "player-info";
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

  useEffect(() => {
    if (!slug) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void getAdventureModuleBySlug(slug, creatorToken)
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
        setBaseValidationMessage(null);
        setPlayerInfoValidationMessage(null);
        setStorytellerInfoValidationMessage(null);
        setActorValidationMessage(null);
        setActorCreateError(null);
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
            : "Could not load adventure module.",
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
  }, [creatorToken, slug]);

  const activeActor = useMemo(() => {
    if (activeTab !== "actors" || !normalizedEntityId || !moduleDetail) {
      return null;
    }
    return (
      moduleDetail.actors.find((actor) => actor.actorSlug === normalizedEntityId) ??
      null
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
      const saved = await updateAdventureModuleIndex(
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

        nextDetail = await updateAdventureModuleIndex(
          nextDetail.index.moduleId,
          nextIndex,
          creatorToken,
        );
      }

      if (infoTextChanged) {
        nextDetail = await updateAdventureModuleFragment(
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

        nextDetail = await updateAdventureModuleIndex(
          nextDetail.index.moduleId,
          nextIndex,
          creatorToken,
        );
      }

      if (infoTextChanged) {
        nextDetail = await updateAdventureModuleFragment(
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
      const nextDetail = await updateAdventureModuleActor(
        moduleDetail.index.moduleId,
        actorForm.actorSlug,
        {
          title: validated.title,
          summary: validated.summary,
          baseLayerSlug: validated.baseLayerSlug,
          tacticalRoleSlug: validated.tacticalRoleSlug,
          tacticalSpecialSlug: validated.tacticalSpecialSlug ?? null,
          content: validated.content,
        },
        creatorToken,
      );

      setModuleDetail(nextDetail);
      const nextActor =
        nextDetail.actors.find(
          (resolvedActor) => resolvedActor.actorSlug === actorForm.actorSlug,
        ) ?? null;
      setActorForm(nextActor ? toActorFormState(nextActor) : null);
      setActorDirty(false);
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
  }, [activeTab, actorForm, creatorToken, moduleDetail]);

  const handleCreateActor = useCallback(async (): Promise<void> => {
    if (!moduleDetail?.ownedByRequester || creatingActor) {
      return;
    }

    setCreatingActor(true);
    setActorCreateError(null);
    setError(null);

    try {
      const nextDetail = await createAdventureModuleActor(
        moduleDetail.index.moduleId,
        { title: "New Actor" },
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
        `/adventure-module/${encodeURIComponent(nextDetail.index.slug)}/actors/${encodeURIComponent(createdActor.actorSlug)}`,
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

  return (
    <div className="app-shell stack py-8 gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {editable ? (
            <input
              type="text"
              aria-label="Module title"
              maxLength={120}
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
              className="m-0 w-full appearance-none border-0 bg-transparent p-0 font-heading text-3xl/none font-bold tracking-tight text-kac-iron shadow-none outline-none ring-0 transition sm:text-4xl/none focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kac-gold-dark/40"
            />
          ) : (
            <Text variant="h2" color="iron">
              {moduleDetail?.index.title ?? "Adventure Module"}
            </Text>
          )}
          <Text variant="body" color="iron-light" className="text-sm">
            {moduleDetail?.index.slug
              ? `/${moduleDetail.index.slug}`
              : "Authoring"}
          </Text>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AutosaveStatusBadge
            status={autosaveStatus}
            message={autosaveMessage}
          />
        </div>
      </header>

      {error ? (
        <Message label="Error" color="blood">
          {error}
        </Message>
      ) : null}

      {loading ? (
        <Panel>
          <Text variant="body" color="iron-light">
            Loading module...
          </Text>
        </Panel>
      ) : null}

      {!loading && moduleDetail ? (
        <>
          {!moduleDetail.ownedByRequester ? (
            <Message label="Read-Only" color="bone">
              You can view this module, but only its author can edit.
            </Message>
          ) : null}

          <AdventureModuleTabNav
            moduleSlug={moduleDetail.index.slug}
            tabs={TAB_ITEMS}
          />

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
                    content: actorForm.content,
                  }}
                  actors={moduleDetail.actors}
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
                  onContentChange={(nextValue) => {
                    setActorValidationMessage(null);
                    setActorForm((current) =>
                      current ? { ...current, content: nextValue } : current,
                    );
                    setActorDirty(true);
                  }}
                  onFieldBlur={handleActorFieldBlur}
                />
              ) : (
                <AdventureModuleTabPlaceholder
                  description={`Actor "${normalizedEntityId ?? entityId}" could not be found in this module.`}
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
            />
          ) : activeTab === "storyteller-info" ? (
            <AdventureModuleStorytellerInfoTabPanel
              summary={storytellerInfoForm.summary}
              infoText={storytellerInfoForm.infoText}
              smartContextDocument={smartContextDocument}
              actors={moduleDetail.actors}
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
                  `/adventure-module/${encodeURIComponent(moduleDetail.index.slug)}/actors/${encodeURIComponent(actorSlug)}`,
                );
              }}
            />
          ) : activeEntityTab && activeEntityTabConfig ? (
            <EntityList
              tab={activeEntityTab}
              tabLabel={activeEntityTabConfig.tabLabel}
              createLabel={activeEntityTabConfig.createLabel}
              items={activeEntityTabConfig.items}
              editable={editable}
              onCreate={() => {
                navigate(
                  `/adventure-module/${encodeURIComponent(moduleDetail.index.slug)}/${activeEntityTab}/new`,
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
