import { z } from "zod";

const titleCaseSlug = (value: string): string =>
  value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

export const counterIconSlugs = [
  "agreement",
  "construction",
  "crafting",
  "danger",
  "defense",
  "destruction",
  "distance",
  "drop",
  "energy",
  "escape",
  "euphoria",
  "incognito",
  "investigation",
  "morale",
  "performance",
  "persuasion",
  "race",
  "reputation",
  "resources",
  "stealth",
  "study",
  "time",
  "tracking",
  "wealth",
] as const;
export type CounterIconSlug = (typeof counterIconSlugs)[number];
export const counterIconSlugSchema = z.enum(counterIconSlugs);

export const defaultCounterIconSlug: CounterIconSlug = "danger";

export const counterIconCatalog = counterIconSlugs.map((slug) => ({
  slug,
  label: titleCaseSlug(slug),
}));
