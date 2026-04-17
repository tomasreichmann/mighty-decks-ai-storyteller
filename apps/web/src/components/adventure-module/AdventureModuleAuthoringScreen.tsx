import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdventureModuleDetail } from "@mighty-decks/spec/adventureModuleAuthoring";
import { createCampaign } from "../../lib/campaignApi";
import {
  AUTHORING_TAB_LABELS,
  AUTHORING_TABS,
  resolveCompactTitleInputSize,
  type AuthoringTab,
} from "../../lib/authoring/sharedAuthoring";
import { useAuthoringContext } from "../../lib/authoring/store/AuthoringProvider";
import {
  AutosaveStatusBadge,
} from "./AutosaveStatusBadge";
import {
  type AdventureModuleTabItem,
} from "./AdventureModuleTabNav";
import { CommonAuthoringTabContent } from "./CommonAuthoringTabContent";
import { SharedAuthoringHeader } from "./SharedAuthoringHeader";
import { CTAButton } from "../common/CTAButton";
import { Message } from "../common/Message";
import { Panel } from "../common/Panel";
import { PendingIndicator } from "../PendingIndicator";
import { SectionBoundary } from "../common/SectionBoundary";

const TAB_ITEMS: AdventureModuleTabItem[] = AUTHORING_TABS.map((tab) => ({
  id: tab,
  label: AUTHORING_TAB_LABELS[tab],
}));

const isAuthoringTab = (value: string): value is AuthoringTab =>
  AUTHORING_TABS.includes(value as AuthoringTab);

export const AdventureModuleAuthoringScreen = (): JSX.Element => {
  const {
    state,
    editable,
    creatorToken,
    buildRoute,
    navigateTo,
    changeField,
    flushForm,
  } = useAuthoringContext<AdventureModuleDetail>();
  const [creatingCampaign, setCreatingCampaign] = useState(false);

  useEffect(() => {
    if (!state.detail || isAuthoringTab(state.route.activeTab)) {
      return;
    }
    navigateTo(buildRoute(state.detail.index.slug, "player-info"), {
      replace: true,
    });
  }, [buildRoute, navigateTo, state.detail, state.route.activeTab]);

  const handleCreateCampaign = useCallback(async (): Promise<void> => {
    if (!state.detail || creatingCampaign) {
      return;
    }
    setCreatingCampaign(true);
    try {
      const campaign = await createCampaign(
        {
          sourceModuleId: state.detail.index.moduleId,
        },
        creatorToken,
      );
      navigateTo(`/campaign/${encodeURIComponent(campaign.index.slug)}/base`);
    } finally {
      setCreatingCampaign(false);
    }
  }, [creatingCampaign, creatorToken, navigateTo, state.detail]);

  const titleSupportingContent = useMemo(
    () => (
      <AutosaveStatusBadge
        status={state.autosave.status}
        message={state.autosave.message}
      />
    ),
    [state.autosave.message, state.autosave.status],
  );

  return (
    <div className="app-shell stack py-8 gap-4">
      <SharedAuthoringHeader
        title={state.forms.base.title}
        titleAriaLabel="Adventure module title"
        emptyTitle="Adventure Module"
        editable={editable}
        detailLoaded={Boolean(state.detail)}
        titleInputSize={resolveCompactTitleInputSize(state.forms.base.title)}
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
            disabled={creatingCampaign || !state.detail}
            onClick={() => {
              void handleCreateCampaign();
            }}
          >
            {creatingCampaign ? (
              <PendingIndicator label="Creating campaign" color="gold" />
            ) : (
              "Create Campaign"
            )}
          </CTAButton>
        }
        titleSupportingContent={titleSupportingContent}
        navTabs={TAB_ITEMS}
        moduleSlug={state.detail?.index.slug}
        buildTabPath={(moduleSlug, tabId) => buildRoute(moduleSlug, tabId)}
        navLeadingContent={
          <CTAButton
            color="gold"
            containerClassName="lg:hidden"
            disabled={creatingCampaign || !state.detail}
            onClick={() => {
              void handleCreateCampaign();
            }}
          >
            {creatingCampaign ? (
              <PendingIndicator label="Creating campaign" color="gold" />
            ) : (
              "Create Campaign"
            )}
          </CTAButton>
        }
        showMobileMenu
      />

      {state.error ? (
        <Message label="Error" color="blood">
          {state.error}
        </Message>
      ) : null}

      {state.loading ? (
        <Panel contentClassName="flex justify-center">
          <PendingIndicator label="Loading adventure module" color="cloth" />
        </Panel>
      ) : null}

      {!state.loading && state.detail ? (
        <SectionBoundary
          resetKey={`${state.detail.index.slug}-${state.route.activeTab}`}
          title="Adventure module content failed to render"
          message="This adventure module section crashed while rendering. Choose another tab or refresh the page."
        >
          <>
            {!state.detail.ownedByRequester ? (
              <Message label="Read-Only" color="bone">
                You can view this adventure module, but only its current editor can
                modify it.
              </Message>
            ) : null}

            <CommonAuthoringTabContent />
          </>
        </SectionBoundary>
      ) : null}
    </div>
  );
};
