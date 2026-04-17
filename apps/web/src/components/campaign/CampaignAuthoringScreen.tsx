import { useCallback, useEffect, useMemo, useState } from "react";
import type { CampaignDetail } from "@mighty-decks/spec/campaign";
import { createCampaignSession } from "../../lib/campaignApi";
import { useCampaignWatch } from "../../hooks/useCampaignWatch";
import { useAuthoringContext } from "../../lib/authoring/store/AuthoringProvider";
import { type AdventureModuleTabItem } from "../adventure-module/AdventureModuleTabNav";
import {
  AutosaveStatusBadge,
} from "../adventure-module/AutosaveStatusBadge";
import { CommonAuthoringTabContent } from "../adventure-module/CommonAuthoringTabContent";
import { SharedAuthoringHeader } from "../adventure-module/SharedAuthoringHeader";
import { CTAButton } from "../common/CTAButton";
import { Message } from "../common/Message";
import { Panel } from "../common/Panel";
import { SectionBoundary } from "../common/SectionBoundary";
import { Text } from "../common/Text";
import {
  CAMPAIGN_DETAIL_TABS,
  CAMPAIGN_TAB_LABELS,
  isCampaignDetailTab,
  type CampaignTab,
} from "./campaignAuthoringTabs";
import { CampaignSessionsTabContent } from "./CampaignSessionsTabContent";

export const CampaignAuthoringScreen = (): JSX.Element => {
  const {
    state,
    editable,
    creatorToken,
    buildRoute,
    navigateTo,
    changeField,
    flushForm,
    refresh,
  } = useAuthoringContext<CampaignDetail>();
  const [creatingSession, setCreatingSession] = useState(false);
  const campaignWatch = useCampaignWatch({
    enabled: Boolean(state.detail?.index.slug),
  });
  const tabItems = useMemo<AdventureModuleTabItem[]>(
    () =>
      CAMPAIGN_DETAIL_TABS.map((tabId) => ({
        id: tabId,
        label: CAMPAIGN_TAB_LABELS[tabId],
      })),
    [],
  );

  useEffect(() => {
    if (!state.detail || isCampaignDetailTab(state.route.activeTab)) {
      return;
    }
    navigateTo(buildRoute(state.detail.index.slug, "player-info"), {
      replace: true,
    });
  }, [buildRoute, navigateTo, state.detail, state.route.activeTab]);

  useEffect(() => {
    if (!state.detail || !campaignWatch.connected) {
      return;
    }
    campaignWatch.watchCampaign(state.detail.index.slug);
    return () => {
      campaignWatch.unwatchCampaign(state.detail?.index.slug ?? "");
    };
  }, [campaignWatch, state.detail]);

  useEffect(() => {
    if (!campaignWatch.campaignUpdatedAtIso) {
      return;
    }
    void refresh();
  }, [campaignWatch.campaignUpdatedAtIso, refresh]);

  const handleCreateSession = useCallback(async (): Promise<void> => {
    if (!state.detail || creatingSession) {
      return;
    }
    setCreatingSession(true);
    try {
      const created = await createCampaignSession(
        state.detail.campaignId,
        creatorToken,
      );
      navigateTo(
        `/campaign/${encodeURIComponent(state.detail.index.slug)}/session/${encodeURIComponent(created.sessionId)}`,
      );
    } finally {
      setCreatingSession(false);
    }
  }, [creatingSession, creatorToken, navigateTo, state.detail]);

  return (
    <div className="app-shell stack py-8 gap-4">
      <SharedAuthoringHeader
        title={state.forms.base.title}
        titleAriaLabel="Campaign title"
        emptyTitle="Campaign"
        editable={editable}
        detailLoaded={Boolean(state.detail)}
        titleInputSize={Math.min(Math.max(state.forms.base.title.trim().length + 1, 5), 32)}
        onTitleChange={(nextValue) => {
          changeField("base", "title", nextValue);
        }}
        onTitleBlur={() => {
          void flushForm("base");
        }}
        titleRowTrailingContent={
          <CTAButton
            color="gold"
            containerClassName="hidden lg:inline-flex"
            disabled={creatingSession || !state.detail}
            onClick={() => {
              void handleCreateSession();
            }}
          >
            {creatingSession ? "Creating Session..." : "Create Session"}
          </CTAButton>
        }
        titleSupportingContent={
          <AutosaveStatusBadge
            status={state.autosave.status}
            message={state.autosave.message}
          />
        }
        navTabs={tabItems}
        moduleSlug={state.detail?.index.slug}
        buildTabPath={(moduleSlug, tabId) =>
          buildRoute(moduleSlug, tabId as CampaignTab)
        }
        navLeadingContent={
          <CTAButton
            color="gold"
            containerClassName="lg:hidden"
            disabled={creatingSession || !state.detail}
            onClick={() => {
              void handleCreateSession();
            }}
          >
            {creatingSession ? "Creating Session..." : "Create Session"}
          </CTAButton>
        }
      />

      {state.error ? (
        <Message label="Error" color="blood">
          {state.error}
        </Message>
      ) : null}

      {state.loading ? (
        <Panel>
          <Text variant="body" color="iron-light">
            Loading campaign...
          </Text>
        </Panel>
      ) : null}

      {!state.loading && state.detail ? (
        <SectionBoundary
          resetKey={`${state.detail.index.slug}-${state.route.activeTab}`}
          title="Campaign content failed to render"
          message="This campaign section crashed while rendering. Choose another tab or refresh the page."
        >
          <>
            {!state.detail.ownedByRequester ? (
              <Message label="Read-Only" color="bone">
                You can view this campaign, but only its current editor can
                modify it.
              </Message>
            ) : null}

            {state.route.activeTab === "sessions" ? (
              <CampaignSessionsTabContent
                campaignSlug={state.detail.index.slug}
                sessions={state.detail.sessions ?? []}
                creatingSession={creatingSession}
                onCreateSession={() => {
                  void handleCreateSession();
                }}
              />
            ) : (
              <CommonAuthoringTabContent />
            )}
          </>
        </SectionBoundary>
      ) : null}
    </div>
  );
};
