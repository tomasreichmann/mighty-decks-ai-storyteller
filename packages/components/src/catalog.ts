import {
  validateCardExportInput,
  type CardExportInput,
  type CardFamily as ContractCardFamily,
} from "../../../spec/cardComponents";
import { actorBaseLayerCatalog, actorTacticalRoleCatalog, actorTacticalSpecialCatalog } from "../../../spec/actorCards";
import { assetBaseCatalog, assetModifierCatalog } from "../../../spec/assetCards";
import { counterIconCatalog } from "../../../spec/counterCards";
import { rulesEffectCards, rulesOutcomeCards, rulesStuntCards } from "../../../spec/rulesCards";
import { assetBaseCards, assetModifierCards } from "../../../spec/cardPresentation";

export const contentVersion = "2026-09-16";
export const supportedLocale = "en" as const;
export type CardFamily = Exclude<
  ContractCardFamily,
  "location" | "encounter" | "quest"
>;
export interface CatalogCard { id: string; family: CardFamily; slug: string; title: string; locale: "en"; description?: string; body?: string; footer?: string; deck?: string; artworkPath?: string; }

const rulesCards: CatalogCard[] = [
  ...rulesOutcomeCards.map((card) => ({ id: `outcome:${card.slug}`, family: "outcome" as const, slug: card.slug, title: card.title, body: card.description, footer: card.instructions, description: [card.description, card.instructions].filter(Boolean).join("\n"), deck: card.deck, artworkPath: card.iconUri, locale: supportedLocale })),
  ...rulesEffectCards.map((card) => ({ id: `effect:${card.slug}`, family: "effect" as const, slug: card.slug, title: card.title, body: card.nounEffect, footer: card.adjectiveEffect, description: [card.nounEffect, card.adjectiveEffect].filter(Boolean).join("\n"), deck: card.deck, artworkPath: card.iconUri === "/effects/dying.png" ? "/art/effects/taken-out.png" : card.iconUri, locale: supportedLocale })),
  ...rulesStuntCards.map((card) => ({ id: `stunt:${card.slug}`, family: "stunt" as const, slug: card.slug, title: card.title, body: card.effect, footer: card.requirements, description: [card.effect, card.requirements].filter(Boolean).join("\n"), deck: card.deck, artworkPath: card.iconUri, locale: supportedLocale })),
];
const actorArtworkPath = (slug: string): string => `/actors/base/${slug.replaceAll("_", "-")}.png`;
const assetArtworkPath = (slug: string): string => `/assets/${slug.startsWith("medieval_") ? "medieval" : "base"}/${slug.replace(/^medieval_|^base_/, "")}.png`;
const layers: CatalogCard[] = [
  ...actorBaseLayerCatalog.map((card) => ({ id: `actor-base:${card.slug}`, family: "actor-base" as const, slug: card.slug, title: card.label, artworkPath: actorArtworkPath(card.slug), locale: supportedLocale })),
  ...actorTacticalRoleCatalog.map((card) => ({ id: `actor-role:${card.slug}`, family: "actor-role" as const, slug: card.slug, title: card.label, artworkPath: "/types/actor.png", locale: supportedLocale })),
  ...actorTacticalSpecialCatalog.map((card) => ({ id: `actor-special:${card.slug}`, family: "actor-special" as const, slug: card.slug, title: card.label, artworkPath: actorArtworkPath(card.slug), locale: supportedLocale })),
  ...assetBaseCatalog.map((card) => { const presentation = assetBaseCards.find((entry) => entry.slug === card.slug); return { id: `asset-base:${card.slug}`, family: "asset-base" as const, slug: card.slug, title: card.title, body: presentation?.effect, description: presentation?.effect, deck: presentation?.deck ?? (card.group === "Asset Medieval" ? "medieval" : "base"), artworkPath: presentation?.imageUri ?? assetArtworkPath(card.slug), locale: supportedLocale }; }),
  ...assetModifierCatalog.map((card) => { const presentation = assetModifierCards.find((entry) => entry.slug === card.slug); return { id: `asset-modifier:${card.slug}`, family: "asset-modifier" as const, slug: card.slug, title: card.title, body: presentation?.effect, description: presentation?.effect, deck: presentation?.deck ?? "base mod", artworkPath: presentation?.imageUri ?? assetArtworkPath(card.slug), locale: supportedLocale }; }),
  ...counterIconCatalog.map((card) => ({ id: `counter:${card.slug}`, family: "counter" as const, slug: card.slug, title: card.label, artworkPath: `/counters/${card.slug}.png`, locale: supportedLocale })),
];
export const cardCatalog = [...rulesCards, ...layers];
export const getCard = (family: CardFamily, slug: string): CatalogCard | undefined => cardCatalog.find((card) => card.family === family && card.slug === slug);
export interface StaticCardEntry extends CatalogCard {
  layout: "full" | "compact";
  width: number;
  height: number;
}
const portraitPresets = [
  { layout: "full" as const, width: 629, height: 1024 },
  { layout: "full" as const, width: 315, height: 512 },
  { layout: "compact" as const, width: 157, height: 256 },
];
export const enumerateStaticCards = (): StaticCardEntry[] => cardCatalog.flatMap((card) =>
  portraitPresets.map((preset) => ({ ...card, ...preset })),
);
export { validateCardExportInput, type CardExportInput };
