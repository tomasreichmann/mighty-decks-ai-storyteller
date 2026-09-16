import { z } from "zod";
import { actorBaseLayerCatalog, actorTacticalRoleCatalog, actorTacticalSpecialCatalog } from "../../../spec/actorCards";
import { assetBaseCatalog, assetModifierCatalog } from "../../../spec/assetCards";
import { counterIconCatalog } from "../../../spec/counterCards";
import { rulesEffectCards, rulesOutcomeCards, rulesStuntCards } from "../../../spec/rulesCards";

export const contentVersion = "2026-09-16";
export const supportedLocale = "en" as const;
export type CardFamily = "outcome" | "effect" | "stunt" | "actor-base" | "actor-role" | "actor-special" | "asset-base" | "asset-modifier" | "counter";
export interface CatalogCard { id: string; family: CardFamily; slug: string; title: string; locale: "en"; description?: string; artworkPath?: string; }

const rulesCards: CatalogCard[] = [
  ...rulesOutcomeCards.map((card) => ({ id: `outcome:${card.slug}`, family: "outcome" as const, slug: card.slug, title: card.title, description: card.description, artworkPath: card.iconUri, locale: supportedLocale })),
  ...rulesEffectCards.map((card) => ({ id: `effect:${card.slug}`, family: "effect" as const, slug: card.slug, title: card.title, description: [card.nounEffect, card.adjectiveEffect].filter(Boolean).join("\n"), artworkPath: card.iconUri === "/effects/dying.png" ? "/art/effects/taken-out.png" : card.iconUri, locale: supportedLocale })),
  ...rulesStuntCards.map((card) => ({ id: `stunt:${card.slug}`, family: "stunt" as const, slug: card.slug, title: card.title, description: [card.requirements, card.effect].filter(Boolean).join("\n"), artworkPath: card.iconUri, locale: supportedLocale })),
];
const layers: CatalogCard[] = [
  ...actorBaseLayerCatalog.map((card) => ({ id: `actor-base:${card.slug}`, family: "actor-base" as const, slug: card.slug, title: card.label, locale: supportedLocale })),
  ...actorTacticalRoleCatalog.map((card) => ({ id: `actor-role:${card.slug}`, family: "actor-role" as const, slug: card.slug, title: card.label, locale: supportedLocale })),
  ...actorTacticalSpecialCatalog.map((card) => ({ id: `actor-special:${card.slug}`, family: "actor-special" as const, slug: card.slug, title: card.label, locale: supportedLocale })),
  ...assetBaseCatalog.map((card) => ({ id: `asset-base:${card.slug}`, family: "asset-base" as const, slug: card.slug, title: card.title, locale: supportedLocale })),
  ...assetModifierCatalog.map((card) => ({ id: `asset-modifier:${card.slug}`, family: "asset-modifier" as const, slug: card.slug, title: card.title, locale: supportedLocale })),
  ...counterIconCatalog.map((card) => ({ id: `counter:${card.slug}`, family: "counter" as const, slug: card.slug, title: card.label, locale: supportedLocale })),
];
export const cardCatalog = [...rulesCards, ...layers];
export const getCard = (family: CardFamily, slug: string): CatalogCard | undefined => cardCatalog.find((card) => card.family === family && card.slug === slug);
const customCardSchema = z.object({ family: z.enum(["outcome", "effect", "stunt", "actor-base", "actor-role", "actor-special", "asset-base", "asset-modifier", "counter"]), id: z.string().min(1), title: z.string().min(1), artworkPath: z.string().min(1).optional() });
const exportInputSchema = z.object({ locale: z.literal("en"), cards: z.array(customCardSchema) });
export type CardExportInput = z.infer<typeof exportInputSchema>;
export const validateCardExportInput = (input: unknown): CardExportInput => exportInputSchema.parse(input);
