import { Suspense, lazy } from "react";
import { Navigate, Outlet, Route, Routes, useParams } from "react-router-dom";
import { Page } from "./components/layout/Page";

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
const StyleguideIndexPage = lazy(async () => ({
  default: (await import("./routes/StyleguideIndexPage")).StyleguideIndexPage,
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
  <div className="p-4 text-sm text-slate-600">Loading...</div>
);

export const App = (): JSX.Element => {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route element={<FitContentLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/image" element={<ImageGenerator />} />
          <Route path="/campaign/list" element={<CampaignListPage />} />
          <Route path="/campaign/:slug/:tab" element={<CampaignAuthoringPage />} />
          <Route
            path="/campaign/:slug/:tab/:entityId"
            element={<CampaignAuthoringPage />}
          />
          <Route
            path="/campaign/:campaignSlug/session/:sessionId"
            element={<CampaignSessionLobbyPage />}
          />
          <Route
            path="/campaign/:campaignSlug/session/:sessionId/player"
            element={<CampaignSessionPlayerPage />}
          />
          <Route
            path="/campaign/:campaignSlug/session/:sessionId/storyteller/:tab"
            element={<CampaignAuthoringPage />}
          />
          <Route
            path="/campaign/:campaignSlug/session/:sessionId/storyteller/:tab/:entityId"
            element={<CampaignAuthoringPage />}
          />
          <Route path="/adventure-module/list" element={<AdventureModuleListPage />} />
          <Route path="/adventure-module/new" element={<AdventureModuleNewPage />} />
          <Route path="/adventure-module/:slug/:tab" element={<AdventureModuleAuthoringPage />} />
          <Route
            path="/adventure-module/:slug/:tab/:entityId"
            element={<AdventureModuleAuthoringPage />}
          />
          <Route path="/workflow-lab" element={<WorkflowLabPage />} />
          <Route path="/workflow-lab/:workflowId" element={<WorkflowLabPage />} />
          <Route path="/styleguide" element={<StyleguideIndexPage />} />
          <Route
            path="/styleguide/location-card"
            element={<StyleguideLocationCardPage />}
          />
          <Route
            path="/styleguide/encounter-card"
            element={<StyleguideEncounterCardPage />}
          />
          <Route
            path="/styleguide/quest-card"
            element={<StyleguideQuestCardPage />}
          />
          <Route path="/adventure/:adventureId" element={<RoleSelectPage />} />
          <Route path="/rules" element={<RulesLayoutPage />}>
            <Route index element={<RulesIndexPage />} />
            <Route path="outcomes" element={<RulesOutcomesPage />} />
            <Route path="effects" element={<RulesEffectsPage />} />
            <Route path="stunts" element={<RulesStuntsPage />} />
            <Route path="assets" element={<RulesAssetsPage />} />
          </Route>
        </Route>

        <Route element={<FitScreenLayout />}>
          <Route path="/adventure/:adventureId/player" element={<PlayerPage />} />
          <Route path="/adventure/:adventureId/screen" element={<ScreenPage />} />
        </Route>

        <Route
          path="/campaign"
          element={<Navigate to="/campaign/list" replace />}
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
