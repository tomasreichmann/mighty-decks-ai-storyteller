import type { CSSProperties, ReactNode } from "react";
import {
  ActorCard as PackageActorCard,
  AssetCard as PackageAssetCard,
  AssetModifierCard as PackageAssetModifierCard,
  GameCard as PackageGameCard,
} from "@mighty-decks/components/react";
import { ActorCard } from "../components/cards/ActorCard";
import { AssetCard } from "../components/cards/AssetCard";
import { AssetModifierCard } from "../components/cards/AssetModifierCard";
import { GameCardView } from "../components/adventure-module/GameCardView";
import { CardBoundary } from "../components/common/CardBoundary";
import { Heading } from "../components/common/Heading";
import { Text } from "../components/common/Text";
import { ActorCompositionFigure, AssetCompositionFigure } from "../components/rules/RulesCardComposition";
import { resolveGameCard } from "../lib/markdownGameComponents";
import styles from "./CardParityPage.module.css";

// Remove this page/CSS and App's lazy import/route after package acceptance
// and saved visual comparison evidence. This is a temporary development aid.
interface Fixture {
  id: string;
  title: string;
  packagePath: string;
  appPath: string;
  overlay?: boolean;
  packageCard: (className: string) => ReactNode;
  appCard: (className: string) => ReactNode;
}

const Marksman = ({ className }: { className: string }): JSX.Element => {
  const gameCard = resolveGameCard("StuntCard", "marksman");
  if (!gameCard) throw new Error("Marksman fixture is missing from the catalog");
  return <GameCardView gameCard={gameCard} className={className} />;
};

const fixtures: Fixture[] = [
  ...([
    ["civilian", "Civilian base", "actor-base"],
    ["minion", "Minion role", "actor-role"],
    ["fast", "Fast special", "actor-special"],
  ] as const).map(([slug, title, type]) => ({
    id: slug,
    title,
    packagePath: `GameCard / ${type}`,
    appPath: "RulesCardComposition → package GameCard (shared delegate)",
    overlay: type !== "actor-base",
    packageCard: (className: string) => <PackageGameCard type={type} slug={slug} className={className} />,
    appCard: (className: string) => <PackageGameCard type={type} slug={slug} className={className} />,
  })),
  ...([false, true] as const).map((fast) => ({
    id: fast ? "fast-minion" : "civilian-minion",
    title: fast ? "Civilian + Minion + Fast" : "Civilian + Minion",
    packagePath: "ActorCard",
    appPath: "Local ActorCard (independent legacy renderer; rules teaching figure uses package ActorCard)",
    packageCard: (className: string) => <PackageActorCard baseLayerSlug="civilian" tacticalRoleSlug="minion" tacticalSpecialSlug={fast ? "fast" : undefined} className={className} />,
    appCard: (className: string) => <ActorCard baseLayerSlug="civilian" tacticalRoleSlug="minion" tacticalSpecialSlug={fast ? "fast" : undefined} className={className} />,
  })),
  {
    id: "marksman", title: "Marksman",
    packagePath: "GameCard / stunt",
    appPath: "resolveGameCard → GameCardView → package GameCard (shared delegate)",
    packageCard: (className) => <PackageGameCard type="stunt" slug="marksman" className={className} />,
    appCard: (className) => <Marksman className={className} />,
  },
  {
    id: "tools", title: "Tools",
    packagePath: "AssetCard / base_tools", appPath: "AssetCard generic adapter → package AssetCard (shared delegate)",
    packageCard: (className) => <PackageAssetCard baseAssetSlug="base_tools" className={className} />,
    appCard: (className) => <AssetCard baseAssetSlug="base_tools" className={className} />,
  },
  {
    id: "empowered", title: "Empowered overlay", overlay: true,
    packagePath: "AssetModifierCard / slug=base_empowered",
    appPath: "AssetModifierCard adapter → package AssetModifierCard / modifierSlug → slug (shared delegate)",
    packageCard: (className) => <PackageAssetModifierCard slug="base_empowered" className={className} />,
    appCard: (className) => <AssetModifierCard modifierSlug="base_empowered" className={className} />,
  },
  {
    id: "empowered-tools", title: "Empowered Tools",
    packagePath: "AssetCard / base_tools + base_empowered",
    appPath: "AssetCard generic adapter → package AssetCard / base_tools + base_empowered (shared delegate)",
    packageCard: (className) => <PackageAssetCard baseAssetSlug="base_tools" modifierSlug="base_empowered" className={className} />,
    appCard: (className) => <AssetCard baseAssetSlug="base_tools" modifierSlug="base_empowered" className={className} />,
  },
];

const Pair = ({ fixture, width, surface }: {
  fixture: Fixture;
  width: string;
  surface: "plain" | "checkerboard" | "light" | "dark";
}): JSX.Element => (
  <div className={styles.pair} data-fixture={fixture.id} data-width={width} data-surface={surface}>
    {([
      ["Components package", fixture.packagePath, fixture.packageCard],
      ["Storyteller adapter/local renderer", fixture.appPath, fixture.appCard],
    ] as const).map(([label, path, render]) => (
      <figure className={styles.sample} key={label}>
        <figcaption className={styles.label}>
          <strong>{label}</strong>
          <span>{path}</span>
          <span>{width} · {surface} surface</span>
        </figcaption>
        <div className={`${styles.surface} ${styles[surface]}`}>
          <div className={styles.frame} style={{ width } as CSSProperties}>
            <CardBoundary label={`${fixture.title}: ${label} failed`}>
              {render(styles.card)}
            </CardBoundary>
          </div>
        </div>
      </figure>
    ))}
  </div>
);

export const CardParityPage = (): JSX.Element => (
  <main className={`app-shell stack gap-8 ${styles.page}`}>
    <header className="stack gap-4">
      <Heading level="h1">Card renderer comparison</Heading>
      <Text>Temporary development fixtures at native and rules display widths. Each pair uses identical slugs and card dimensions.</Text>
      <Text variant="note">Actor parts and the rules Actor assembly use package renderers. The local Actor samples here retain the independent legacy renderer for custom/layout compatibility. Marksman, generic Assets, and Asset modifiers delegate to the package. Identical output from a shared delegate is an adapter smoke check, not independent renderer evidence.</Text>
    </header>
    {fixtures.map((fixture) => (
      <section className="stack gap-5" key={fixture.id} aria-label={fixture.title}>
        <Heading level="h2">{fixture.title}</Heading>
        {["204px", fixture.id === "marksman" ? "10rem" : "11rem"].map((width) => (
          <div className="stack gap-5" key={width}>
            {(fixture.overlay ? ["checkerboard", "light", "dark"] as const : ["plain"] as const).map((surface) => (
              <Pair key={surface} fixture={fixture} width={width} surface={surface} />
            ))}
          </div>
        ))}
      </section>
    ))}
    <section className="stack gap-5" aria-label="Rules composition context">
      <Heading level="h2">Existing rules composition figures</Heading>
      <Text variant="note">These production figures use package Actor parts and assembly, plus the shared package delegates for generic Assets and modifiers. Their labels, widths, and responsive layout reveal parent layout effects.</Text>
      <ActorCompositionFigure />
      <AssetCompositionFigure />
    </section>
  </main>
);
