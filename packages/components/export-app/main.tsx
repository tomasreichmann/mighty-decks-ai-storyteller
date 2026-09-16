import { createRoot } from "react-dom/client";
import "../src/react/cards.module.css";
import { ActorCard, AssetCard, GameCard } from "../src/react";
import type { CardFamily } from "../src/catalog";

const params = new URLSearchParams(window.location.search);
const family = params.get("family") as CardFamily | null;
const slug = params.get("slug");
const layout = params.get("layout") === "compact" ? "compact" : "full";
const width = Number.parseInt(params.get("width") ?? "204", 10);
const scale = Number.isFinite(width) && width > 0 ? width / 204 : 1;
const SingleCard = (): JSX.Element => {
  if (family && slug) {
    return <GameCard type={family} slug={slug} layout={layout} assetBaseUrl="/assets" />;
  }
  return <GameCard type="outcome" slug="success" assetBaseUrl="/assets" />;
};

createRoot(document.getElementById("root")!).render(family ? (
  <main style={{ margin: 0, padding: 0, width: 204, height: 332, zoom: scale }}><div data-card-export><SingleCard /></div></main>
) : (
  <main style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 24, padding: 24, background: "#243038", minHeight: "100vh" }}>
    <GameCard type="outcome" slug="success" assetBaseUrl="/assets" />
    <GameCard type="effect" slug="taken-out" assetBaseUrl="/assets" />
    <GameCard type="stunt" slug="weaponMaintenance" assetBaseUrl="/assets" />
    <ActorCard baseLayerSlug="guard_blue" tacticalRoleSlug="thug" tacticalSpecialSlug="tough" assetBaseUrl="/assets" />
    <AssetCard baseAssetSlug="base_light_weapon" modifierSlug="base_empowered" assetBaseUrl="/assets" />
    <GameCard type="counter" slug="agreement" assetBaseUrl="/assets" />
  </main>
));
