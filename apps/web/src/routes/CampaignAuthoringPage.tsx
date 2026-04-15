import { useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CampaignAuthoringScreen } from "../components/campaign/CampaignAuthoringScreen";
import { CampaignStorytellerSessionShell } from "../components/campaign/CampaignStorytellerSessionShell";
import { getAdventureModuleCreatorToken } from "../lib/adventureModuleIdentity";
import { AuthoringProvider } from "../lib/authoring/store/AuthoringProvider";
import { campaignAuthoringAdapter } from "../lib/authoring/store/authoringDomainAdapters";
import {
  isCampaignDetailTab,
  isStorytellerSessionTab,
} from "../components/campaign/campaignAuthoringTabs";

const decodeParam = (value?: string): string | undefined => {
  if (!value) {
    return undefined;
  }
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
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
  const storytellerSessionMode = Boolean(campaignSlug && sessionId);
  const routeSlug = decodeParam(campaignSlug ?? slug);
  const normalizedSessionId = decodeParam(sessionId) ?? "";
  const normalizedEntityId = decodeParam(entityId);
  const activeTab = storytellerSessionMode
    ? isStorytellerSessionTab(tab)
      ? tab
      : "chat"
    : isCampaignDetailTab(tab)
      ? tab
      : "player-info";
  const buildRoute = useCallback(
    (nextSlug: string, nextTab: string, nextEntityId?: string): string => {
      const suffix = nextEntityId
        ? `/${encodeURIComponent(nextEntityId)}`
        : "";
      if (storytellerSessionMode && normalizedSessionId) {
        return `/campaign/${encodeURIComponent(nextSlug)}/session/${encodeURIComponent(normalizedSessionId)}/storyteller/${nextTab}${suffix}`;
      }
      return `/campaign/${encodeURIComponent(nextSlug)}/${nextTab}${suffix}`;
    },
    [normalizedSessionId, storytellerSessionMode],
  );

  return (
    <AuthoringProvider
      adapter={campaignAuthoringAdapter}
      slug={routeSlug}
      activeTab={activeTab}
      entityId={normalizedEntityId}
      creatorToken={creatorToken}
      buildRoute={buildRoute}
      navigateTo={navigate}
    >
      {storytellerSessionMode ? (
        <CampaignStorytellerSessionShell sessionId={normalizedSessionId} />
      ) : (
        <CampaignAuthoringScreen />
      )}
    </AuthoringProvider>
  );
};
