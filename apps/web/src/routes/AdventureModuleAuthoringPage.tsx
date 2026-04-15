import { useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdventureModuleAuthoringScreen } from "../components/adventure-module/AdventureModuleAuthoringScreen";
import { getAdventureModuleCreatorToken } from "../lib/adventureModuleIdentity";
import {
  AUTHORING_TABS,
  type AuthoringTab,
} from "../lib/authoring/sharedAuthoring";
import { AuthoringProvider } from "../lib/authoring/store/AuthoringProvider";
import { adventureModuleAuthoringAdapter } from "../lib/authoring/store/authoringDomainAdapters";

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

const isAuthoringTab = (value: string | undefined): value is AuthoringTab =>
  Boolean(value && AUTHORING_TABS.includes(value as AuthoringTab));

export const AdventureModuleAuthoringPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { slug, tab, entityId } = useParams<{
    slug?: string;
    tab?: string;
    entityId?: string;
  }>();
  const creatorToken = useMemo(() => getAdventureModuleCreatorToken(), []);
  const routeSlug = decodeParam(slug);
  const normalizedEntityId = decodeParam(entityId);
  const activeTab = isAuthoringTab(tab) ? tab : "player-info";
  const buildRoute = useCallback(
    (nextSlug: string, nextTab: string, nextEntityId?: string): string => {
      const suffix = nextEntityId
        ? `/${encodeURIComponent(nextEntityId)}`
        : "";
      return `/adventure-module/${encodeURIComponent(nextSlug)}/${nextTab}${suffix}`;
    },
    [],
  );

  return (
    <AuthoringProvider
      adapter={adventureModuleAuthoringAdapter}
      slug={routeSlug}
      activeTab={activeTab}
      entityId={normalizedEntityId}
      creatorToken={creatorToken}
      buildRoute={buildRoute}
      navigateTo={navigate}
    >
      <AdventureModuleAuthoringScreen />
    </AuthoringProvider>
  );
};
