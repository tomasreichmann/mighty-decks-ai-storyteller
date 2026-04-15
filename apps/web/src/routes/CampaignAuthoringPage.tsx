import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import type { AdventureModuleIndex } from "@mighty-decks/spec/adventureModule";
import type {
  CampaignDetail,
  CampaignSessionTableCardReference,
  CampaignSessionTableTarget,
} from "@mighty-decks/spec/campaign";
import { Message } from "../components/common/Message";
import { Panel } from "../components/common/Panel";
import { Text } from "../components/common/Text";
import { CTAButton } from "../components/common/CTAButton";
import { MarkdownImageInsertButton } from "../components/MarkdownImageInsertButton";
import {
  AutosaveStatusBadge,
  type AutosaveStatus,
} from "../components/adventure-module/AutosaveStatusBadge";
import {
  AdventureModuleTabNav,
  type AdventureModuleTabItem,
} from "../components/adventure-module/AdventureModuleTabNav";
import { CommonAuthoringTabContent } from "../components/adventure-module/CommonAuthoringTabContent";
import { SharedAuthoringHeader } from "../components/adventure-module/SharedAuthoringHeader";
import type { AdventureModuleLocationPinTarget } from "../components/adventure-module/AdventureModuleLocationMapEditor";
import { CampaignSessionsTabContent } from "../components/campaign/CampaignSessionsTabContent";
import { CampaignStorytellerSessionTabContent } from "../components/campaign/CampaignStorytellerSessionTabContent";
import {
  CampaignSessionSelectionStrip,
  type CampaignSessionSelectionEntry,
} from "../components/session/CampaignSessionSelectionStrip";
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
import { createGameCardCatalogContextValue } from "../lib/gameCardCatalogContext";
import {
  appendStorytellerTableSelection,
  createStorytellerTableSelectionEntry,
  removeStorytellerTableSelection,
  type StorytellerTableSelectionItem,
} from "../lib/authoring/campaignStorytellerSession";
import { appendMarkdownSnippet } from "../lib/markdownImage";
import {
  AUTHORING_TAB_LABELS,
  AUTHORING_TABS,
  clampCounterValue,
  makeUniqueAssetSlug,
  makeUniqueCounterSlug,
  replaceCounterInDetail,
  resolvePlayerSummaryState,
  resolveCompactTitleInputSize,
  resolveStorytellerSummaryState,
  toActorFormState,
  toAssetFormState,
  toBaseFormState,
  toCounterFormState,
  toEncounterFormState,
  toLocationFormState,
  toPlayerInfoFormState,
  toQuestFormState,
  toStorytellerInfoFormState,
  type ActorFormState,
  type AssetFormState,
  type AuthoringTab,
  type BaseFormState,
  type CounterFormState,
  type EncounterFormState,
  type LocationFormState,
  type PlayerInfoFormState,
  type QuestFormState,
  type StorytellerInfoFormState,
  validateActorForm,
  validateAssetForm,
  validateBaseForm,
  validateCounterForm,
  validateEncounterForm,
  validateLocationForm,
  validatePlayerInfoForm,
  validateQuestForm,
  validateStorytellerInfoForm,
} from "../lib/authoring/sharedAuthoring";
import { toMarkdownPlainTextSnippet } from "../lib/markdownSnippet";
import type { SmartInputDocumentContext } from "../lib/smartInputContext";
import { useCampaignSession } from "../hooks/useCampaignSession";
import { useCampaignWatch } from "../hooks/useCampaignWatch";
import { RulesAssetsContent } from "./RulesAssetsPage";
import { RulesEffectsContent } from "./RulesEffectsPage";
import { RulesOutcomesContent } from "./RulesOutcomesPage";
import { RulesStuntsContent } from "./RulesStuntsPage";

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

type CampaignDetailTab = (typeof CAMPAIGN_DETAIL_TABS)[number];
type StorytellerSessionTab = (typeof STORYTELLER_SESSION_TABS)[number];
type CampaignTab = CampaignDetailTab | StorytellerSessionTab;

const TAB_LABELS: Record<CampaignTab, string> = {
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

interface StorytellerTableSelectionEntry
  extends CampaignSessionSelectionEntry,
    StorytellerTableSelectionItem {}

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
      setTableSelection((current) =>
        appendStorytellerTableSelection(
          current,
          createStorytellerTableSelectionEntry(card),
        ),
      );
    },
    [],
  );

  const removeCardFromSelection = useCallback((entryId: string): void => {
    setTableSelection((current) =>
      removeStorytellerTableSelection(current, entryId),
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

  const commonAuthoringTabContent = moduleDetail ? (
    <CommonAuthoringTabContent
      activeTab={activeTab}
      entityId={entityId}
      normalizedEntityId={normalizedEntityId}
      detailLabel="campaign"
      baseTabPanelProps={{
        moduleId: moduleDetail.index.moduleId,
        creatorToken,
        coverImageUrl: moduleDetail.coverImageUrl,
        premise: baseForm.premise,
        haveTags: baseForm.haveTags,
        avoidTags: baseForm.avoidTags,
        moduleTitle: baseForm.title,
        moduleSummary: moduleDetail.index.summary,
        moduleIntent: moduleDetail.index.intent,
        playerSummary: playerInfoForm.summary,
        playerInfo: playerInfoForm.infoText,
        storytellerSummary: storytellerInfoForm.summary,
        storytellerInfo: storytellerInfoForm.infoText,
        editable,
        validationMessage: baseValidationMessage,
        persistCoverImage: async (coverImageUrl) => {
          const nextDetail = await updateCampaignCoverImage(
            moduleDetail.campaignId,
            { coverImageUrl },
            creatorToken,
          );
          setModuleDetail(nextDetail);
        },
        onPremiseChange: (nextValue) => {
          setBaseForm((current) => ({ ...current, premise: nextValue }));
          setBaseDirty(true);
        },
        onHaveChange: (nextValue) => {
          setBaseForm((current) => ({ ...current, haveTags: nextValue }));
          setBaseDirty(true);
        },
        onAvoidChange: (nextValue) => {
          setBaseForm((current) => ({
            ...current,
            avoidTags: nextValue,
          }));
          setBaseDirty(true);
        },
        onFieldBlur: handleBaseFieldBlur,
      }}
      playerInfoTabPanelProps={{
        summary: playerInfoForm.summary,
        infoText: playerInfoForm.infoText,
        smartContextDocument,
        actors: moduleDetail.actors,
        counters: moduleDetail.counters,
        assets: moduleDetail.assets,
        encounters: moduleDetail.encounters,
        quests: moduleDetail.quests,
        editable,
        validationMessage: playerInfoValidationMessage,
        onSummaryChange: (nextValue) => {
          setPlayerInfoValidationMessage(null);
          setPlayerInfoForm((current) => ({
            ...current,
            summary: nextValue,
          }));
          setPlayerInfoDirty(true);
        },
        onInfoTextChange: (nextValue) => {
          setPlayerInfoValidationMessage(null);
          setPlayerInfoForm((current) => ({
            ...current,
            infoText: nextValue,
          }));
          setPlayerInfoDirty(true);
        },
        onFieldBlur: handlePlayerInfoFieldBlur,
        onAdjustCounterValue: (counterSlug, delta, target) => {
          void handleAdjustCounterValue(counterSlug, delta, target);
        },
      }}
      storytellerInfoTabPanelProps={{
        summary: storytellerInfoForm.summary,
        infoText: storytellerInfoForm.infoText,
        smartContextDocument,
        actors: moduleDetail.actors,
        counters: moduleDetail.counters,
        assets: moduleDetail.assets,
        encounters: moduleDetail.encounters,
        quests: moduleDetail.quests,
        editable,
        validationMessage: storytellerInfoValidationMessage,
        onSummaryChange: (nextValue) => {
          setStorytellerInfoValidationMessage(null);
          setStorytellerInfoForm((current) => ({
            ...current,
            summary: nextValue,
          }));
          setStorytellerInfoDirty(true);
        },
        onInfoTextChange: (nextValue) => {
          setStorytellerInfoValidationMessage(null);
          setStorytellerInfoForm((current) => ({
            ...current,
            infoText: nextValue,
          }));
          setStorytellerInfoDirty(true);
        },
        onFieldBlur: handleStorytellerInfoFieldBlur,
        onAdjustCounterValue: (counterSlug, delta, target) => {
          void handleAdjustCounterValue(counterSlug, delta, target);
        },
      }}
      actorsTabPanelProps={{
        actors: moduleDetail.actors,
        editable,
        creating: creatingActor,
        createError: actorCreateError,
        onCreate: () => {
          void handleCreateActor();
        },
        onOpenActor: (actorSlug) => {
          navigate(buildCampaignRoute(moduleDetail.index.slug, "actors", actorSlug));
        },
        onDeleteActor: (actorSlug, title) => {
          void handleDeleteActor(actorSlug, title);
        },
        onAddActorCardToSelection:
          storytellerSessionMode
            ? (actorSlug) =>
                addCardToTableSelection({
                  type: "ActorCard",
                  slug: actorSlug,
                })
            : undefined,
      }}
      locationsTabPanelProps={{
        locations: moduleDetail.locations,
        editable,
        creating: creatingLocation,
        createError: locationCreateError,
        onCreate: () => {
          void handleCreateLocation();
        },
        onOpenLocation: (locationSlug) => {
          navigate(
            buildCampaignRoute(moduleDetail.index.slug, "locations", locationSlug),
          );
        },
        onDeleteLocation: (locationSlug, title) => {
          void handleDeleteLocation(locationSlug, title);
        },
        onAddLocationCardToSelection:
          storytellerSessionMode
            ? (locationSlug) =>
                addCardToTableSelection({
                  type: "LocationCard",
                  slug: locationSlug,
                })
            : undefined,
      }}
      encountersTabPanelProps={{
        encounters: moduleDetail.encounters,
        editable,
        creating: creatingEncounter,
        createError: encounterCreateError,
        onCreate: () => {
          void handleCreateEncounter();
        },
        onOpenEncounter: (encounterSlug) => {
          navigate(
            buildCampaignRoute(
              moduleDetail.index.slug,
              "encounters",
              encounterSlug,
            ),
          );
        },
        onDeleteEncounter: (encounterSlug, title) => {
          void handleDeleteEncounter(encounterSlug, title);
        },
        onAddEncounterCardToSelection:
          storytellerSessionMode
            ? (encounterSlug) =>
                addCardToTableSelection({
                  type: "EncounterCard",
                  slug: encounterSlug,
                })
            : undefined,
      }}
      questsTabPanelProps={{
        quests: moduleDetail.quests,
        editable,
        creating: creatingQuest,
        createError: questCreateError,
        onCreate: () => {
          void handleCreateQuest();
        },
        onOpenQuest: (questSlug) => {
          navigate(buildCampaignRoute(moduleDetail.index.slug, "quests", questSlug));
        },
        onDeleteQuest: (questSlug, title) => {
          void handleDeleteQuest(questSlug, title);
        },
        onAddQuestCardToSelection:
          storytellerSessionMode
            ? (questSlug) =>
                addCardToTableSelection({
                  type: "QuestCard",
                  slug: questSlug,
                })
            : undefined,
      }}
      countersTabPanelProps={{
        counters: moduleDetail.counters,
        editable,
        creating: creatingCounter,
        createError: counterCreateError,
        onCreate: () => {
          void handleCreateCounter();
        },
        onOpenCounter: (counterSlug) => {
          navigate(buildCampaignRoute(moduleDetail.index.slug, "counters", counterSlug));
        },
        onDeleteCounter: (counterSlug, title) => {
          void handleDeleteCounter(counterSlug, title);
        },
        onAdjustCounterValue: (counterSlug, delta, target) => {
          void handleAdjustCounterValue(counterSlug, delta, target);
        },
        onAddCounterCardToSelection:
          storytellerSessionMode
            ? (counterSlug) =>
                addCardToTableSelection({
                  type: "CounterCard",
                  slug: counterSlug,
                })
            : undefined,
      }}
      assetsTabPanelProps={{
        assets: moduleDetail.assets,
        editable,
        creating: creatingAsset,
        createError: assetCreateError,
        onCreate: () => {
          void handleCreateAsset();
        },
        onOpenAsset: (assetSlug) => {
          navigate(buildCampaignRoute(moduleDetail.index.slug, "assets", assetSlug));
        },
        onDeleteAsset: (assetSlug, title) => {
          void handleDeleteAsset(assetSlug, title);
        },
        onAddAssetCardToSelection:
          storytellerSessionMode
            ? (assetSlug) =>
                addCardToTableSelection({
                  type: "AssetCard",
                  slug: assetSlug,
                })
            : undefined,
      }}
      actorEditorProps={
        activeActor && actorForm
          ? {
              actor: {
                ...activeActor,
                title: actorForm.title,
                summary: actorForm.summary,
                baseLayerSlug: actorForm.baseLayerSlug,
                tacticalRoleSlug: actorForm.tacticalRoleSlug,
                tacticalSpecialSlug: actorForm.tacticalSpecialSlug,
                isPlayerCharacter: actorForm.isPlayerCharacter,
                content: actorForm.content,
              },
              actors: moduleDetail.actors,
              counters: moduleDetail.counters,
              assets: moduleDetail.assets,
              encounters: moduleDetail.encounters,
              quests: moduleDetail.quests,
              smartContextDocument,
              editable,
              validationMessage: actorValidationMessage,
              onTitleChange: (nextValue) => {
                setActorValidationMessage(null);
                setActorForm((current) =>
                  current ? { ...current, title: nextValue } : current,
                );
                setActorDirty(true);
              },
              onSummaryChange: (nextValue) => {
                setActorValidationMessage(null);
                setActorForm((current) =>
                  current ? { ...current, summary: nextValue } : current,
                );
                setActorDirty(true);
              },
              onBaseLayerChange: (nextValue) => {
                setActorValidationMessage(null);
                setActorForm((current) =>
                  current ? { ...current, baseLayerSlug: nextValue } : current,
                );
                setActorDirty(true);
              },
              onTacticalRoleChange: (nextValue) => {
                setActorValidationMessage(null);
                setActorForm((current) =>
                  current ? { ...current, tacticalRoleSlug: nextValue } : current,
                );
                setActorDirty(true);
              },
              onTacticalSpecialChange: (nextValue) => {
                setActorValidationMessage(null);
                setActorForm((current) =>
                  current
                    ? { ...current, tacticalSpecialSlug: nextValue }
                    : current,
                );
                setActorDirty(true);
              },
              onIsPlayerCharacterChange: (nextValue) => {
                setActorValidationMessage(null);
                setActorForm((current) =>
                  current ? { ...current, isPlayerCharacter: nextValue } : current,
                );
                setActorDirty(true);
              },
              onContentChange: (nextValue) => {
                setActorValidationMessage(null);
                setActorForm((current) =>
                  current ? { ...current, content: nextValue } : current,
                );
                setActorDirty(true);
              },
              onFieldBlur: handleActorFieldBlur,
              onDelete: () => {
                void handleDeleteActor(activeActor.actorSlug, activeActor.title);
              },
              onAddActorCardToSelection: storytellerSessionMode
                ? () =>
                    addCardToTableSelection({
                      type: "ActorCard",
                      slug: activeActor.actorSlug,
                    })
                : undefined,
            }
          : null
      }
      locationEditorProps={
        activeLocation && locationForm
          ? {
              location: {
                ...activeLocation,
                title: locationForm.title,
                summary: locationForm.summary,
                titleImageUrl: locationForm.titleImageUrl,
                introductionMarkdown: locationForm.introductionMarkdown,
                descriptionMarkdown: locationForm.descriptionMarkdown,
                mapImageUrl: locationForm.mapImageUrl,
                mapPins: locationForm.mapPins,
              },
              actors: moduleDetail.actors,
              counters: moduleDetail.counters,
              assets: moduleDetail.assets,
              encounters: moduleDetail.encounters,
              quests: moduleDetail.quests,
              smartContextDocument,
              editable,
              validationMessage: locationValidationMessage,
              pinTargets: locationPinTargetOptions,
              onTitleChange: (nextValue) => {
                setLocationValidationMessage(null);
                setLocationForm((current) =>
                  current ? { ...current, title: nextValue } : current,
                );
                setLocationDirty(true);
              },
              onSummaryChange: (nextValue) => {
                setLocationValidationMessage(null);
                setLocationForm((current) =>
                  current ? { ...current, summary: nextValue } : current,
                );
                setLocationDirty(true);
              },
              onTitleImageUrlChange: (nextValue) => {
                setLocationValidationMessage(null);
                setLocationForm((current) =>
                  current ? { ...current, titleImageUrl: nextValue } : current,
                );
                setLocationDirty(true);
              },
              onIntroductionChange: (nextValue) => {
                setLocationValidationMessage(null);
                setLocationForm((current) =>
                  current
                    ? { ...current, introductionMarkdown: nextValue }
                    : current,
                );
                setLocationDirty(true);
              },
              onDescriptionChange: (nextValue) => {
                setLocationValidationMessage(null);
                setLocationForm((current) =>
                  current
                    ? { ...current, descriptionMarkdown: nextValue }
                    : current,
                );
                setLocationDirty(true);
              },
              onMapImageUrlChange: (nextValue) => {
                setLocationValidationMessage(null);
                setLocationForm((current) =>
                  current ? { ...current, mapImageUrl: nextValue } : current,
                );
                setLocationDirty(true);
              },
              onMapPinsChange: (nextPins) => {
                setLocationValidationMessage(null);
                setLocationForm((current) =>
                  current ? { ...current, mapPins: nextPins } : current,
                );
                setLocationDirty(true);
              },
              onFieldBlur: handleLocationFieldBlur,
              onOpenPinTarget: openLocationPinTarget,
              onAdjustCounterValue: (counterSlug, delta, target) => {
                void handleAdjustCounterValue(counterSlug, delta, target);
              },
              onDelete: () => {
                void handleDeleteLocation(
                  activeLocation.locationSlug,
                  activeLocation.title,
                );
              },
              onAddLocationCardToSelection: storytellerSessionMode
                ? () =>
                    addCardToTableSelection({
                      type: "LocationCard",
                      slug: activeLocation.locationSlug,
                    })
                : undefined,
            }
          : null
      }
      encounterEditorProps={
        activeEncounter && encounterForm
          ? {
              encounter: {
                ...activeEncounter,
                title: encounterForm.title,
                summary: encounterForm.summary,
                prerequisites: encounterForm.prerequisites,
                titleImageUrl: encounterForm.titleImageUrl,
                content: encounterForm.content,
              },
              actors: moduleDetail.actors,
              counters: moduleDetail.counters,
              assets: moduleDetail.assets,
              encounters: moduleDetail.encounters,
              quests: moduleDetail.quests,
              smartContextDocument,
              editable,
              validationMessage: encounterValidationMessage,
              onTitleChange: (nextValue) => {
                setEncounterValidationMessage(null);
                setEncounterForm((current) =>
                  current ? { ...current, title: nextValue } : current,
                );
                setEncounterDirty(true);
              },
              onSummaryChange: (nextValue) => {
                setEncounterValidationMessage(null);
                setEncounterForm((current) =>
                  current ? { ...current, summary: nextValue } : current,
                );
                setEncounterDirty(true);
              },
              onPrerequisitesChange: (nextValue) => {
                setEncounterValidationMessage(null);
                setEncounterForm((current) =>
                  current ? { ...current, prerequisites: nextValue } : current,
                );
                setEncounterDirty(true);
              },
              onTitleImageUrlChange: (nextValue) => {
                setEncounterValidationMessage(null);
                setEncounterForm((current) =>
                  current ? { ...current, titleImageUrl: nextValue } : current,
                );
                setEncounterDirty(true);
              },
              onContentChange: (nextValue) => {
                setEncounterValidationMessage(null);
                setEncounterForm((current) =>
                  current ? { ...current, content: nextValue } : current,
                );
                setEncounterDirty(true);
              },
              onFieldBlur: handleEncounterFieldBlur,
              onAdjustCounterValue: (counterSlug, delta, target) => {
                void handleAdjustCounterValue(counterSlug, delta, target);
              },
              onDelete: () => {
                void handleDeleteEncounter(
                  activeEncounter.encounterSlug,
                  activeEncounter.title,
                );
              },
              onAddEncounterCardToSelection: storytellerSessionMode
                ? () =>
                    addCardToTableSelection({
                      type: "EncounterCard",
                      slug: activeEncounter.encounterSlug,
                    })
                : undefined,
            }
          : null
      }
      questEditorProps={
        activeQuest && questForm
          ? {
              quest: {
                ...activeQuest,
                title: questForm.title,
                summary: questForm.summary,
                titleImageUrl: questForm.titleImageUrl,
                content: questForm.content,
              },
              actors: moduleDetail.actors,
              counters: moduleDetail.counters,
              assets: moduleDetail.assets,
              encounters: moduleDetail.encounters,
              quests: moduleDetail.quests,
              smartContextDocument,
              editable,
              validationMessage: questValidationMessage,
              onTitleChange: (nextValue) => {
                setQuestValidationMessage(null);
                setQuestForm((current) =>
                  current ? { ...current, title: nextValue } : current,
                );
                setQuestDirty(true);
              },
              onSummaryChange: (nextValue) => {
                setQuestValidationMessage(null);
                setQuestForm((current) =>
                  current ? { ...current, summary: nextValue } : current,
                );
                setQuestDirty(true);
              },
              onTitleImageUrlChange: (nextValue) => {
                setQuestValidationMessage(null);
                setQuestForm((current) =>
                  current ? { ...current, titleImageUrl: nextValue } : current,
                );
                setQuestDirty(true);
              },
              onContentChange: (nextValue) => {
                setQuestValidationMessage(null);
                setQuestForm((current) =>
                  current ? { ...current, content: nextValue } : current,
                );
                setQuestDirty(true);
              },
              onFieldBlur: handleQuestFieldBlur,
              onAdjustCounterValue: (counterSlug, delta, target) => {
                void handleAdjustCounterValue(counterSlug, delta, target);
              },
              onDelete: () => {
                void handleDeleteQuest(activeQuest.questSlug, activeQuest.title);
              },
              onAddQuestCardToSelection: storytellerSessionMode
                ? () =>
                    addCardToTableSelection({
                      type: "QuestCard",
                      slug: activeQuest.questSlug,
                    })
                : undefined,
            }
          : null
      }
      counterEditorProps={
        activeCounter && counterForm
          ? {
              counter: {
                ...activeCounter,
                title: counterForm.title,
                iconSlug: counterForm.iconSlug,
                currentValue: counterForm.currentValue,
                maxValue: counterForm.maxValue,
                description: counterForm.description,
              },
              editable,
              validationMessage: counterValidationMessage,
              onTitleChange: (nextValue) => {
                setCounterValidationMessage(null);
                setCounterForm((current) =>
                  current ? { ...current, title: nextValue } : current,
                );
                setCounterDirty(true);
              },
              onIconSlugChange: (nextValue) => {
                setCounterValidationMessage(null);
                setCounterForm((current) =>
                  current ? { ...current, iconSlug: nextValue } : current,
                );
                setCounterDirty(true);
              },
              onCurrentValueChange: (nextValue) => {
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
              },
              onMaxValueChange: (nextValue) => {
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
              },
              onDescriptionChange: (nextValue) => {
                setCounterValidationMessage(null);
                setCounterForm((current) =>
                  current ? { ...current, description: nextValue } : current,
                );
                setCounterDirty(true);
              },
              onFieldBlur: handleCounterFieldBlur,
              onAdjustCounterValue: (counterSlug, delta, target) => {
                void handleAdjustCounterValue(counterSlug, delta, target);
              },
              onDelete: () => {
                void handleDeleteCounter(activeCounter.slug, activeCounter.title);
              },
              onAddCounterCardToSelection: storytellerSessionMode
                ? () =>
                    addCardToTableSelection({
                      type: "CounterCard",
                      slug: activeCounter.slug,
                    })
                : undefined,
            }
          : null
      }
      assetEditorProps={
        activeAsset && assetForm
          ? {
              asset: {
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
              },
              actors: moduleDetail.actors,
              counters: moduleDetail.counters,
              assets: moduleDetail.assets,
              encounters: moduleDetail.encounters,
              quests: moduleDetail.quests,
              smartContextDocument,
              editable,
              reauthorRequired: assetForm.reauthorRequired,
              validationMessage: assetValidationMessage,
              onTitleChange: (nextValue) => {
                setAssetValidationMessage(null);
                setAssetForm((current) =>
                  current ? { ...current, title: nextValue } : current,
                );
                setAssetDirty(true);
              },
              onSummaryChange: (nextValue) => {
                setAssetValidationMessage(null);
                setAssetForm((current) =>
                  current ? { ...current, summary: nextValue } : current,
                );
                setAssetDirty(true);
              },
              onModifierChange: (nextValue) => {
                setAssetValidationMessage(null);
                setAssetForm((current) =>
                  current ? { ...current, modifier: nextValue } : current,
                );
                setAssetDirty(true);
              },
              onNounChange: (nextValue) => {
                setAssetValidationMessage(null);
                setAssetForm((current) =>
                  current ? { ...current, noun: nextValue } : current,
                );
                setAssetDirty(true);
              },
              onNounDescriptionChange: (nextValue) => {
                setAssetValidationMessage(null);
                setAssetForm((current) =>
                  current ? { ...current, nounDescription: nextValue } : current,
                );
                setAssetDirty(true);
              },
              onAdjectiveDescriptionChange: (nextValue) => {
                setAssetValidationMessage(null);
                setAssetForm((current) =>
                  current
                    ? { ...current, adjectiveDescription: nextValue }
                    : current,
                );
                setAssetDirty(true);
              },
              onIconUrlChange: (nextValue) => {
                setAssetValidationMessage(null);
                setAssetForm((current) =>
                  current ? { ...current, iconUrl: nextValue } : current,
                );
                setAssetDirty(true);
              },
              onOverlayUrlChange: (nextValue) => {
                setAssetValidationMessage(null);
                setAssetForm((current) =>
                  current ? { ...current, overlayUrl: nextValue } : current,
                );
                setAssetDirty(true);
              },
              onContentChange: (nextValue) => {
                setAssetValidationMessage(null);
                setAssetForm((current) =>
                  current ? { ...current, content: nextValue } : current,
                );
                setAssetDirty(true);
              },
              onFieldBlur: handleAssetFieldBlur,
              onDelete: () => {
                void handleDeleteAsset(activeAsset.assetSlug, activeAsset.title);
              },
              onAddAssetCardToSelection: storytellerSessionMode
                ? () =>
                    addCardToTableSelection({
                      type: "AssetCard",
                      slug: activeAsset.assetSlug,
                    })
                : undefined,
            }
          : null
      }
    />
  ) : null;

  const storytellerSessionTabContent = moduleDetail ? (
    <CampaignStorytellerSessionTabContent
      campaign={moduleDetail}
      session={storytellerSession}
      currentParticipantId={storytellerIdentity?.participantId}
      storytellerRealtimeError={storytellerRealtimeError}
      tableSelectionCount={tableSelection.length}
      chatDraft={chatDraft}
      gameCardCatalogValue={storytellerGameCardCatalogValue}
      messageInputTopRightControl={
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
            setChatDraft((current) => appendMarkdownSnippet(current, snippet));
          }}
        />
      }
      onChatDraftChange={setChatDraft}
      onStorytellerMessageKeyDown={handleStorytellerMessageKeyDown}
      onSendSelectionToTarget={handleSendSelectionToTarget}
      onRemoveStorytellerTableCard={handleRemoveStorytellerTableCard}
      onCloseSession={() => {
        if (window.confirm("End this session now?")) {
          handleCloseStorytellerSession();
        }
      }}
      onSendMessage={handleSendStorytellerMessage}
    />
  ) : null;

  return (
    <div
      className={
        storytellerSessionMode
          ? "flex min-h-full w-full max-w-none flex-1 flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8"
          : "app-shell stack py-8 gap-4"
      }
    >
      {storytellerSessionMode ? null : (
        <SharedAuthoringHeader
          title={baseForm.title}
          titleAriaLabel="Campaign title"
          emptyTitle="Campaign"
          editable={editable}
          detailLoaded={Boolean(moduleDetail)}
          titleInputSize={resolveCompactTitleInputSize(baseForm.title)}
          onTitleChange={(nextValue) => {
            setBaseValidationMessage(null);
            setBaseForm((current) => ({
              ...current,
              title: nextValue,
            }));
            setBaseDirty(true);
          }}
          onTitleBlur={handleBaseFieldBlur}
          titleRowTrailingContent={
            <CTAButton
              color="gold"
              containerClassName="hidden lg:inline-flex"
              disabled={creatingSession}
              onClick={() => {
                void handleCreateSession();
              }}
            >
              {creatingSession ? "Creating Session..." : "Create Session"}
            </CTAButton>
          }
          loadingTrailingContent={
            <div className="flex shrink-0 items-center gap-2">
              <AutosaveStatusBadge
                status={autosaveStatus}
                message={autosaveMessage}
              />
            </div>
          }
          navTabs={tabItems}
          moduleSlug={moduleDetail?.index.slug}
          buildTabPath={(moduleSlug, tabId) =>
            buildCampaignRoute(moduleSlug, tabId as CampaignTab)
          }
          navLeadingContent={
            <CTAButton
              color="gold"
              containerClassName="lg:hidden"
              disabled={creatingSession}
              onClick={() => {
                void handleCreateSession();
              }}
            >
              {creatingSession ? "Creating Session..." : "Create Session"}
            </CTAButton>
          }
          navTrailingContent={
            <AutosaveStatusBadge
              status={autosaveStatus}
              message={autosaveMessage}
            />
          }
        />
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

          {commonAuthoringTabContent ? (
            commonAuthoringTabContent
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
            <CampaignSessionsTabContent
              campaignSlug={moduleDetail.index.slug}
              sessions={moduleDetail.sessions ?? []}
              creatingSession={creatingSession}
              onCreateSession={() => {
                void handleCreateSession();
              }}
            />
          ) : activeTab === "chat" ? (
            storytellerSessionTabContent
          ) : (
            <Message label="Unsupported Tab" color="bone">
              This campaign tab is not available in the current mode.
            </Message>
          )}
        </>
      ) : null}
    </div>
  );
};



