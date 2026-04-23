import { Suspense, lazy } from "react";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router-dom";
import { Page } from "./components/layout/Page";
import { PendingIndicator } from "./components/PendingIndicator";
import { RouteBoundary } from "./components/common/RouteBoundary";

const AdventureModuleAuthoringPage = lazy(async () => ({
  default: (await import("./routes/AdventureModuleAuthoringPage"))
    .AdventureModuleAuthoringPage,
}));
const CampaignAuthoringPage = lazy(async () => ({
  default: (await import("./routes/CampaignAuthoringPage")).CampaignAuthoringPage,
}));
const CampaignListPage = lazy(async () => ({
  default: (await import("./routes/CampaignListPage")).CampaignListPage,
}));
const CampaignSessionLobbyPage = lazy(async () => ({
  default: (await import("./routes/CampaignSessionLobbyPage"))
    .CampaignSessionLobbyPage,
}));
const CampaignSessionPlayerPage = lazy(async () => ({
  default: (await import("./routes/CampaignSessionPlayerPage"))
    .CampaignSessionPlayerPage,
}));
const AdventureModuleListPage = lazy(async () => ({
  default: (await import("./routes/AdventureModuleListPage"))
    .AdventureModuleListPage,
}));
const AdventureModuleNewPage = lazy(async () => ({
  default: (await import("./routes/AdventureModuleNewPage")).AdventureModuleNewPage,
}));
const ImageGenerator = lazy(async () => ({
  default: (await import("./routes/ImageGenerator")).ImageGenerator,
}));
const LandingPage = lazy(async () => ({
  default: (await import("./routes/LandingPage")).LandingPage,
}));
const PrivacyPolicyPage = lazy(async () => ({
  default: (await import("./routes/PrivacyPolicyPage")).PrivacyPolicyPage,
}));
const PlayerPage = lazy(async () => ({
  default: (await import("./routes/PlayerPage")).PlayerPage,
}));
const RoleSelectPage = lazy(async () => ({
  default: (await import("./routes/RoleSelectPage")).RoleSelectPage,
}));
const RulesEffectsPage = lazy(async () => ({
  default: (await import("./routes/RulesEffectsPage")).RulesEffectsPage,
}));
const RulesAssetsPage = lazy(async () => ({
  default: (await import("./routes/RulesAssetsPage")).RulesAssetsPage,
}));
const RulesIndexPage = lazy(async () => ({
  default: (await import("./routes/RulesIndexPage")).RulesIndexPage,
}));
const RulesLayoutPage = lazy(async () => ({
  default: (await import("./routes/RulesLayoutPage")).RulesLayoutPage,
}));
const RulesOutcomesPage = lazy(async () => ({
  default: (await import("./routes/RulesOutcomesPage")).RulesOutcomesPage,
}));
const RulesStuntsPage = lazy(async () => ({
  default: (await import("./routes/RulesStuntsPage")).RulesStuntsPage,
}));
const ScreenPage = lazy(async () => ({
  default: (await import("./routes/ScreenPage")).ScreenPage,
}));
const SpaceshipPage = lazy(async () => ({
  default: (await import("./routes/SpaceshipPage")).SpaceshipPage,
}));
const StyleguideActorTokenPage = lazy(async () => ({
  default: (await import("./routes/StyleguideActorTokenPage"))
    .StyleguideActorTokenPage,
}));
const StyleguideIndexPage = lazy(async () => ({
  default: (await import("./routes/StyleguideIndexPage")).StyleguideIndexPage,
}));
const StyleguideTypographyPage = lazy(async () => ({
  default: (await import("./routes/StyleguideTypographyPage"))
    .StyleguideTypographyPage,
}));
const StyleguideInputsPage = lazy(async () => ({
  default: (await import("./routes/StyleguideInputsPage")).StyleguideInputsPage,
}));
const StyleguideLoadingPage = lazy(async () => ({
  default: (await import("./routes/StyleguideLoadingPage"))
    .StyleguideLoadingPage,
}));
const StyleguideButtonsPage = lazy(async () => ({
  default: (await import("./routes/StyleguideButtonsPage"))
    .StyleguideButtonsPage,
}));
const StyleguidePanelPage = lazy(async () => ({
  default: (await import("./routes/StyleguidePanelPage")).StyleguidePanelPage,
}));
const StyleguideCardsPage = lazy(async () => ({
  default: (await import("./routes/StyleguideCardsPage")).StyleguideCardsPage,
}));
const StyleguideTagsPage = lazy(async () => ({
  default: (await import("./routes/StyleguideTagsPage")).StyleguideTagsPage,
}));
const StyleguideLabelsPage = lazy(async () => ({
  default: (await import("./routes/StyleguideLabelsPage")).StyleguideLabelsPage,
}));
const StyleguideMessagesPage = lazy(async () => ({
  default: (await import("./routes/StyleguideMessagesPage"))
    .StyleguideMessagesPage,
}));
const StyleguideControlsPage = lazy(async () => ({
  default: (await import("./routes/StyleguideControlsPage"))
    .StyleguideControlsPage,
}));
const StyleguideSessionChatPage = lazy(async () => ({
  default: (await import("./routes/StyleguideSessionChatPage"))
    .StyleguideSessionChatPage,
}));
const StyleguideLocationCardPage = lazy(async () => ({
  default: (await import("./routes/StyleguideLocationCardPage"))
    .StyleguideLocationCardPage,
}));
const StyleguideEncounterCardPage = lazy(async () => ({
  default: (await import("./routes/StyleguideEncounterCardPage"))
    .StyleguideEncounterCardPage,
}));
const StyleguideQuestCardPage = lazy(async () => ({
  default: (await import("./routes/StyleguideQuestCardPage"))
    .StyleguideQuestCardPage,
}));
const StyleguideSessionChatPlayerPage = lazy(async () => ({
  default: (await import("./routes/StyleguideSessionChatPlayerPage"))
    .StyleguideSessionChatPlayerPage,
}));
const StyleguideSessionChatStorytellerPage = lazy(async () => ({
  default: (await import("./routes/StyleguideSessionChatStorytellerPage"))
    .StyleguideSessionChatStorytellerPage,
}));
const TermsOfServicePage = lazy(async () => ({
  default: (await import("./routes/TermsOfServicePage")).TermsOfServicePage,
}));
const WorkflowLabPage = lazy(async () => ({
  default: (await import("./routes/WorkflowLabPage")).WorkflowLabPage,
}));

const FitContentLayout = (): JSX.Element => {
  return (
    <Page mode="fit-content">
      <Outlet />
    </Page>
  );
};

const NoHeaderFitScreenLayout = (): JSX.Element => {
  return (
    <Page mode="fit-screen" footerContent={null} hideHeader>
      <Outlet />
    </Page>
  );
};

const CampaignPlayerSessionLayout = (): JSX.Element => {
  const { pathname } = useLocation();
  const inChatRoute = pathname.endsWith("/chat");

  return (
    <Page
      mode={inChatRoute ? "fit-screen" : "fit-content"}
      footerContent={inChatRoute ? null : undefined}
      hideHeader={inChatRoute}
    >
      <Outlet />
    </Page>
  );
};

const CampaignStorytellerSessionLayout = (): JSX.Element => {
  const { pathname } = useLocation();
  const inChatRoute = /\/storyteller\/chat(?:\/|$)/.test(pathname);

  return (
    <Page
      mode={inChatRoute ? "fit-screen" : "fit-content"}
      footerContent={inChatRoute ? null : undefined}
      hideHeader
    >
      <Outlet />
    </Page>
  );
};

const FitScreenLayout = (): JSX.Element => {
  return (
    <Page mode="fit-screen" footerContent={null}>
      <Outlet />
    </Page>
  );
};

const AdventureModuleRootRedirect = (): JSX.Element => {
  const { slug = "" } = useParams<{ slug?: string }>();
  return (
    <Navigate
      to={`/adventure-module/${encodeURIComponent(slug)}/player-info`}
      replace
    />
  );
};

const RouteLoadingFallback = (): JSX.Element => (
  <div className="grid min-h-screen w-full place-items-center px-6 py-10">
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center gap-4 text-center"
    >
      <PendingIndicator label="Loading" color="gold" />
    </div>
  </div>
);

const RouteShellBoundary = ({
  children,
}: {
  children: JSX.Element;
}): JSX.Element => {
  return (
    <RouteBoundary
      title="Route failed to render"
      message="This route hit a render error. Use Home or Back to continue."
    >
      {children}
    </RouteBoundary>
  );
};

export const App = (): JSX.Element => {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route element={<FitContentLayout />}>
          <Route
            path="/"
            element={
              <RouteShellBoundary>
                <LandingPage />
              </RouteShellBoundary>
            }
          />
          <Route
            path="/image-lab"
            element={
              <RouteShellBoundary>
                <ImageGenerator />
              </RouteShellBoundary>
            }
          />
          <Route
            path="/privacy-policy"
            element={
              <RouteShellBoundary>
                <PrivacyPolicyPage />
              </RouteShellBoundary>
            }
          />
          <Route
            path="/terms-of-service"
            element={
              <RouteShellBoundary>
                <TermsOfServicePage />
              </RouteShellBoundary>
            }
          />
          <Route
            path="/campaign/list"
            element={
              <RouteShellBoundary>
                <CampaignListPage />
              </RouteShellBoundary>
            }
          />
          <Route
            path="/campaign/:slug/:tab"
            element={
              <RouteShellBoundary>
                <CampaignAuthoringPage />
              </RouteShellBoundary>
            }
          />
          <Route
            path="/campaign/:slug/:tab/:entityId"
            element={
              <RouteShellBoundary>
                <CampaignAuthoringPage />
              </RouteShellBoundary>
            }
          />
          <Route
            path="/campaign/:campaignSlug/session/:sessionId"
            element={
              <RouteShellBoundary>
                <CampaignSessionLobbyPage />
              </RouteShellBoundary>
            }
          />
          <Route
            path="/adventure-module/list"
            element={
              <RouteShellBoundary>
                <AdventureModuleListPage />
              </RouteShellBoundary>
            }
          />
          <Route
            path="/adventure-module/new"
            element={
              <RouteShellBoundary>
                <AdventureModuleNewPage />
              </RouteShellBoundary>
            }
          />
          <Route
            path="/adventure-module/:slug/:tab"
            element={
              <RouteShellBoundary>
                <AdventureModuleAuthoringPage />
              </RouteShellBoundary>
            }
          />
          <Route
            path="/adventure-module/:slug/:tab/:entityId"
            element={
              <RouteShellBoundary>
                <AdventureModuleAuthoringPage />
              </RouteShellBoundary>
            }
          />
          <Route
            path="/workflow-lab"
            element={
              <RouteShellBoundary>
                <WorkflowLabPage />
              </RouteShellBoundary>
            }
          />
          <Route
            path="/workflow-lab/:workflowId"
            element={
              <RouteShellBoundary>
                <WorkflowLabPage />
              </RouteShellBoundary>
            }
          />
          <Route
            path="/styleguide"
            element={
              <RouteShellBoundary>
                <StyleguideIndexPage />
              </RouteShellBoundary>
            }
          />
          <Route
            path="/styleguide/actor-token"
            element={
              <RouteShellBoundary>
                <StyleguideActorTokenPage />
              </RouteShellBoundary>
            }
          />
          <Route
            path="/styleguide/typography"
            element={
              <RouteShellBoundary>
                <StyleguideTypographyPage />
              </RouteShellBoundary>
            }
          />
          <Route
            path="/styleguide/inputs"
            element={
              <RouteShellBoundary>
                <StyleguideInputsPage />
              </RouteShellBoundary>
            }
          />
          <Route
            path="/styleguide/loading"
            element={
              <RouteShellBoundary>
                <StyleguideLoadingPage />
              </RouteShellBoundary>
            }
          />
          <Route
            path="/styleguide/buttons"
            element={
              <RouteShellBoundary>
                <StyleguideButtonsPage />
              </RouteShellBoundary>
            }
          />
          <Route
            path="/styleguide/panel"
            element={
              <RouteShellBoundary>
                <StyleguidePanelPage />
              </RouteShellBoundary>
            }
          />
          <Route
            path="/styleguide/cards"
            element={
              <RouteShellBoundary>
                <StyleguideCardsPage />
              </RouteShellBoundary>
            }
          />
          <Route
            path="/styleguide/tags"
            element={
              <RouteShellBoundary>
                <StyleguideTagsPage />
              </RouteShellBoundary>
            }
          />
          <Route
            path="/styleguide/labels"
            element={
              <RouteShellBoundary>
                <StyleguideLabelsPage />
              </RouteShellBoundary>
            }
          />
          <Route
            path="/styleguide/messages"
            element={
              <RouteShellBoundary>
                <StyleguideMessagesPage />
              </RouteShellBoundary>
            }
          />
          <Route
            path="/styleguide/controls"
            element={
              <RouteShellBoundary>
                <StyleguideControlsPage />
              </RouteShellBoundary>
            }
          />
          <Route
            path="/styleguide/session-chat"
            element={
              <RouteShellBoundary>
                <StyleguideSessionChatPage />
              </RouteShellBoundary>
            }
          />
          <Route
            path="/styleguide/location-card"
            element={
              <RouteShellBoundary>
                <StyleguideLocationCardPage />
              </RouteShellBoundary>
            }
          />
          <Route
            path="/styleguide/encounter-card"
            element={
              <RouteShellBoundary>
                <StyleguideEncounterCardPage />
              </RouteShellBoundary>
            }
          />
          <Route
            path="/styleguide/quest-card"
            element={
              <RouteShellBoundary>
                <StyleguideQuestCardPage />
              </RouteShellBoundary>
            }
          />
          <Route
            path="/adventure/:adventureId"
            element={
              <RouteShellBoundary>
                <RoleSelectPage />
              </RouteShellBoundary>
            }
          />
          <Route path="/rules" element={<RulesLayoutPage />}>
            <Route index element={<RulesIndexPage />} />
            <Route path="outcomes" element={<RulesOutcomesPage />} />
            <Route path="effects" element={<RulesEffectsPage />} />
            <Route path="stunts" element={<RulesStuntsPage />} />
            <Route path="assets" element={<RulesAssetsPage />} />
          </Route>
        </Route>

        <Route element={<NoHeaderFitScreenLayout />}>
          <Route
            path="/spaceship"
            element={
              <RouteShellBoundary>
                <SpaceshipPage />
              </RouteShellBoundary>
            }
          />
          <Route
            path="/styleguide/session-chat-player"
            element={
              <RouteShellBoundary>
                <StyleguideSessionChatPlayerPage />
              </RouteShellBoundary>
            }
          />
          <Route
            path="/styleguide/session-chat-storyteller"
            element={
              <RouteShellBoundary>
                <StyleguideSessionChatStorytellerPage />
              </RouteShellBoundary>
            }
          />
        </Route>

        <Route element={<CampaignPlayerSessionLayout />}>
          <Route
            path="/campaign/:campaignSlug/session/:sessionId/player/*"
            element={
              <RouteShellBoundary>
                <CampaignSessionPlayerPage />
              </RouteShellBoundary>
            }
          />
        </Route>

        <Route element={<CampaignStorytellerSessionLayout />}>
          <Route
            path="/campaign/:campaignSlug/session/:sessionId/storyteller/:tab"
            element={
              <RouteShellBoundary>
                <CampaignAuthoringPage />
              </RouteShellBoundary>
            }
          />
          <Route
            path="/campaign/:campaignSlug/session/:sessionId/storyteller/:tab/:entityId"
            element={
              <RouteShellBoundary>
                <CampaignAuthoringPage />
              </RouteShellBoundary>
            }
          />
        </Route>

        <Route element={<FitScreenLayout />}>
          <Route
            path="/adventure/:adventureId/player"
            element={
              <RouteShellBoundary>
                <PlayerPage />
              </RouteShellBoundary>
            }
          />
          <Route
            path="/adventure/:adventureId/screen"
            element={
              <RouteShellBoundary>
                <ScreenPage />
              </RouteShellBoundary>
            }
          />
        </Route>

        <Route
          path="/campaign"
          element={<Navigate to="/campaign/list" replace />}
        />
        <Route
          path="/image"
          element={<Navigate to="/image-lab" replace />}
        />
        <Route
          path="/adventure-module"
          element={<Navigate to="/adventure-module/list" replace />}
        />
        <Route
          path="/adventure-modules/*"
          element={<Navigate to="/adventure-module/list" replace />}
        />
        <Route
          path="/adventure-module/:slug"
          element={<AdventureModuleRootRedirect />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};
