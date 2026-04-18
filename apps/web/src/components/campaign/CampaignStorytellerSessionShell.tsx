import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { NavLink } from "react-router-dom";
import type {
  CampaignDetail,
  CampaignSessionTableCardReference,
  CampaignSessionTableTarget,
} from "@mighty-decks/spec/campaign";
import { MarkdownImageInsertButton } from "../MarkdownImageInsertButton";
import {
  AdventureModuleTabNav,
  type AdventureModuleTabItem,
} from "../adventure-module/AdventureModuleTabNav";
import { AutosaveStatusBadge } from "../adventure-module/AutosaveStatusBadge";
import { CommonAuthoringTabContent } from "../adventure-module/CommonAuthoringTabContent";
import { Message } from "../common/Message";
import { Panel } from "../common/Panel";
import { PendingIndicator } from "../PendingIndicator";
import { SectionBoundary } from "../common/SectionBoundary";
import {
  CampaignSessionSelectionStrip,
  type CampaignSessionSelectionEntry,
} from "../session/CampaignSessionSelectionStrip";
import { useCampaignSession } from "../../hooks/useCampaignSession";
import { useAuthoringContext } from "../../lib/authoring/store/AuthoringProvider";
import {
  appendStorytellerTableSelection,
  createStorytellerTableSelectionEntry,
  removeStorytellerTableSelection,
  type StorytellerTableSelectionItem,
} from "../../lib/authoring/campaignStorytellerSession";
import { getCampaignSessionIdentity } from "../../lib/campaignSessionIdentity";
import { createGameCardCatalogContextValue } from "../../lib/gameCardCatalogContext";
import { appendMarkdownSnippet } from "../../lib/markdownImage";
import type { SmartInputDocumentContext } from "../../lib/smartInputContext";
import { RulesAssetsContent } from "../../routes/RulesAssetsPage";
import { RulesEffectsContent } from "../../routes/RulesEffectsPage";
import { RulesOutcomesContent } from "../../routes/RulesOutcomesPage";
import { RulesStuntsContent } from "../../routes/RulesStuntsPage";
import { CampaignStorytellerSessionTabContent } from "./CampaignStorytellerSessionTabContent";
import {
  CAMPAIGN_TAB_LABELS,
  STORYTELLER_SESSION_TABS,
  isCommonAuthoringCampaignTab,
  isStorytellerSessionTab,
} from "./campaignAuthoringTabs";

interface CampaignStorytellerSessionShellProps {
  sessionId: string;
}

interface StorytellerTableSelectionEntry
  extends CampaignSessionSelectionEntry,
    StorytellerTableSelectionItem {}

export const CampaignStorytellerSessionShell = ({
  sessionId,
}: CampaignStorytellerSessionShellProps): JSX.Element => {
  const { state, buildRoute, navigateTo, refresh } =
    useAuthoringContext<CampaignDetail>();
  const [chatDraft, setChatDraft] = useState("");
  const [tableSelection, setTableSelection] = useState<
    StorytellerTableSelectionEntry[]
  >([]);
  const detail = state.detail;
  const activeTab = state.route.activeTab;
  const tabItems = useMemo<AdventureModuleTabItem[]>(
    () =>
      STORYTELLER_SESSION_TABS.map((tabId) => ({
        id: tabId,
        label: tabId === "assets" ? "Custom Assets" : CAMPAIGN_TAB_LABELS[tabId],
      })),
    [],
  );
  const storytellerIdentity = useMemo(
    () =>
      detail
        ? getCampaignSessionIdentity(detail.index.slug, sessionId, "storyteller")
        : null,
    [detail, sessionId],
  );
  const sessionRealtime = useCampaignSession({
    campaignSlug: detail?.index.slug ?? "campaign",
    sessionId,
    enabled: Boolean(detail?.index.slug),
  });
  const storytellerGameCardCatalogValue = useMemo(
    () =>
      createGameCardCatalogContextValue({
        actors: detail?.actors ?? [],
        counters: detail?.counters ?? [],
        assets: detail?.assets ?? [],
        locations: detail?.locations ?? [],
        encounters: detail?.encounters ?? [],
        quests: detail?.quests ?? [],
      }),
    [detail],
  );
  const smartContextDocument = useMemo<SmartInputDocumentContext>(
    () => ({
      moduleTitle: state.forms.base.title,
      moduleSummary: detail?.index.summary ?? "",
      moduleIntent: detail?.index.intent ?? "",
      premise: state.forms.base.premise,
      haveTags: state.forms.base.haveTags,
      avoidTags: state.forms.base.avoidTags,
      playerSummary: state.forms.playerInfo.summary,
      playerInfo: state.forms.playerInfo.infoText,
      storytellerSummary: state.forms.storytellerInfo.summary,
      storytellerInfo: state.forms.storytellerInfo.infoText,
    }),
    [detail?.index.intent, detail?.index.summary, state.forms],
  );

  useEffect(() => {
    if (!detail || isStorytellerSessionTab(activeTab)) {
      return;
    }
    navigateTo(buildRoute(detail.index.slug, "chat"), { replace: true });
  }, [activeTab, buildRoute, detail, navigateTo]);

  useEffect(() => {
    if (!storytellerIdentity || !sessionRealtime.connected) {
      return;
    }
    sessionRealtime.ensureSessionRole({
      participantId: storytellerIdentity.participantId,
      displayName: storytellerIdentity.displayName,
      role: "storyteller",
    });
  }, [sessionRealtime, storytellerIdentity]);

  useEffect(() => {
    if (!sessionRealtime.campaignUpdatedAtIso) {
      return;
    }
    void refresh();
  }, [refresh, sessionRealtime.campaignUpdatedAtIso]);

  useEffect(() => {
    setTableSelection([]);
  }, [sessionId]);

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

  const handleSendStorytellerMessage = useCallback((): void => {
    if (!storytellerIdentity || chatDraft.trim().length === 0) {
      return;
    }
    sessionRealtime.sendMessage(
      storytellerIdentity.participantId,
      chatDraft.trim(),
    );
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

  return (
    <div className="flex min-h-full w-full max-w-none flex-1 flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
      {state.error ? (
        <Message label="Error" color="blood">
          {state.error}
        </Message>
      ) : null}

      {state.loading ? (
        <Panel contentClassName="flex justify-center">
          <PendingIndicator label="Loading campaign" color="cloth" />
        </Panel>
      ) : null}

      {!state.loading && detail ? (
        <SectionBoundary
          resetKey={`${detail.index.slug}-${activeTab}`}
          title="Campaign session content failed to render"
          message="This campaign section crashed while rendering. Choose another tab or refresh the page."
        >
          <>
            {!detail.ownedByRequester ? (
              <Message label="Read-Only" color="bone">
                You can view this campaign, but only its current editor can modify
                it.
              </Message>
            ) : null}

            <AdventureModuleTabNav
              moduleSlug={detail.index.slug}
              tabs={tabItems}
              buildTabPath={(moduleSlug, tabId) => buildRoute(moduleSlug, tabId)}
              showMobileMenu
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
                  status={state.autosave.status}
                  message={state.autosave.message}
                />
              }
            />

            {tableSelection.length > 0 ? (
              <CampaignSessionSelectionStrip
                entries={tableSelection}
                onRemoveEntry={removeCardFromSelection}
              />
            ) : null}

            {isCommonAuthoringCampaignTab(activeTab) ? (
              <CommonAuthoringTabContent
                onAddActorCardToSelection={(actorSlug) => {
                  addCardToTableSelection({ type: "ActorCard", slug: actorSlug });
                }}
                onAddLocationCardToSelection={(locationSlug) => {
                  addCardToTableSelection({
                    type: "LocationCard",
                    slug: locationSlug,
                  });
                }}
                onAddEncounterCardToSelection={(encounterSlug) => {
                  addCardToTableSelection({
                    type: "EncounterCard",
                    slug: encounterSlug,
                  });
                }}
                onAddQuestCardToSelection={(questSlug) => {
                  addCardToTableSelection({
                    type: "QuestCard",
                    slug: questSlug,
                  });
                }}
                onAddCounterCardToSelection={(counterSlug) => {
                  addCardToTableSelection({
                    type: "CounterCard",
                    slug: counterSlug,
                  });
                }}
                onAddAssetCardToSelection={(assetSlug) => {
                  addCardToTableSelection({
                    type: "AssetCard",
                    slug: assetSlug,
                  });
                }}
              />
            ) : activeTab === "outcomes" ? (
              <RulesOutcomesContent onAddOutcomeCard={addCardToTableSelection} />
            ) : activeTab === "effects" ? (
              <RulesEffectsContent onAddEffectCard={addCardToTableSelection} />
            ) : activeTab === "stunts" ? (
              <RulesStuntsContent onAddStuntCard={addCardToTableSelection} />
            ) : activeTab === "static-assets" ? (
              <RulesAssetsContent
                showHeader={false}
                onAddAssetCard={addCardToTableSelection}
              />
            ) : activeTab === "chat" ? (
              <CampaignStorytellerSessionTabContent
                campaign={detail}
                session={sessionRealtime.session}
                currentParticipantId={storytellerIdentity?.participantId}
                storytellerRealtimeError={sessionRealtime.error}
                tableSelectionCount={tableSelection.length}
                chatDraft={chatDraft}
                messageInputTopRightControl={
                  <MarkdownImageInsertButton
                    identityKey={`${detail.index.slug}-${sessionId}-storyteller-chat-image`}
                    smartContextDocument={smartContextDocument}
                    currentInputValue={chatDraft}
                    disabled={sessionRealtime.session?.status === "closed"}
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
                gameCardCatalogValue={storytellerGameCardCatalogValue}
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
            ) : (
              <Message label="Unsupported Tab" color="bone">
                This campaign tab is not available in the current mode.
              </Message>
            )}
          </>
        </SectionBoundary>
      ) : null}
    </div>
  );
};
