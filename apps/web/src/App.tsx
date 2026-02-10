import { Navigate, Route, Routes } from "react-router-dom";
import { LandingPage } from "./routes/LandingPage";
import { PlayerPage } from "./routes/PlayerPage";
import { RoleSelectPage } from "./routes/RoleSelectPage";
import { ScreenPage } from "./routes/ScreenPage";

export const App = (): JSX.Element => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/adventure/:adventureId" element={<RoleSelectPage />} />
      <Route path="/adventure/:adventureId/player" element={<PlayerPage />} />
      <Route path="/adventure/:adventureId/screen" element={<ScreenPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
