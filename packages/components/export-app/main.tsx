import { createRoot } from "react-dom/client";
import "../src/react/cards.module.css";
import { ActorCard, AssetCard, GameCard } from "../src/react";

createRoot(document.getElementById("root")!).render(
  <main style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 24, padding: 24, background: "#243038", minHeight: "100vh" }}>
    <GameCard type="outcome" slug="success" />
    <GameCard type="outcome" slug="success" layout="compact" />
    <GameCard type="stunt" slug="weaponMaintenance" layout="compact" />
    <ActorCard baseLayerSlug="guard_blue" tacticalRoleSlug="thug" />
    <AssetCard baseAssetSlug="base_light_weapon" modifierSlug="base_empowered" />
  </main>,
);
