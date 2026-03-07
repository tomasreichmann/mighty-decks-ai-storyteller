import { Navigate, Outlet, Route, Routes, useParams } from "react-router-dom";
import { Page } from "./components/layout/Page";
import { AdventureModuleAuthoringPage } from "./routes/AdventureModuleAuthoringPage";
import { AdventureModuleListPage } from "./routes/AdventureModuleListPage";
import { AdventureModuleNewPage } from "./routes/AdventureModuleNewPage";
import { ImageGenerator } from "./routes/ImageGenerator";
import { LandingPage } from "./routes/LandingPage";
import { PlayerPage } from "./routes/PlayerPage";
import { RoleSelectPage } from "./routes/RoleSelectPage";
import { RulesEffectsPage } from "./routes/RulesEffectsPage";
import { RulesIndexPage } from "./routes/RulesIndexPage";
import { RulesLayoutPage } from "./routes/RulesLayoutPage";
import { RulesOutcomesPage } from "./routes/RulesOutcomesPage";
import { RulesStuntsPage } from "./routes/RulesStuntsPage";
import { ScreenPage } from "./routes/ScreenPage";
import { WorkflowLabPage } from "./routes/WorkflowLabPage";

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

export const App = (): JSX.Element => {
  return (
    <Routes>
      <Route element={<FitContentLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/image" element={<ImageGenerator />} />
        <Route path="/adventure-module/list" element={<AdventureModuleListPage />} />
        <Route path="/adventure-module/new" element={<AdventureModuleNewPage />} />
        <Route path="/adventure-module/:slug/:tab" element={<AdventureModuleAuthoringPage />} />
        <Route
          path="/adventure-module/:slug/:tab/:entityId"
          element={<AdventureModuleAuthoringPage />}
        />
        <Route path="/workflow-lab" element={<WorkflowLabPage />} />
        <Route path="/workflow-lab/:workflowId" element={<WorkflowLabPage />} />
        <Route path="/adventure/:adventureId" element={<RoleSelectPage />} />
        <Route path="/rules" element={<RulesLayoutPage />}>
          <Route index element={<RulesIndexPage />} />
          <Route path="outcomes" element={<RulesOutcomesPage />} />
          <Route path="effects" element={<RulesEffectsPage />} />
          <Route path="stunts" element={<RulesStuntsPage />} />
        </Route>
      </Route>

      <Route element={<FitScreenLayout />}>
        <Route path="/adventure/:adventureId/player" element={<PlayerPage />} />
        <Route path="/adventure/:adventureId/screen" element={<ScreenPage />} />
      </Route>

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
  );
};
