import type { OutcomeSlug } from "../types/types";
import effectsCsvRaw from "./effects-en.csv?raw";
import outcomesCsvRaw from "./outcomes-en.csv?raw";
import stuntsCsvRaw from "./stunts-en.csv?raw";
import {
  normalizePublicUri,
  parseCount,
  parseCsvRecords,
  sanitizeRichText,
} from "./csvUtils";

interface OutcomeCsvRow {
  slug: string;
  title: string;
  icon: string;
  description: string;
  instructions: string;
  count: string;
  deck: string;
}

interface EffectCsvRow {
  slug: string;
  title: string;
  icon: string;
  effect: string;
  count: string;
  deck: string;
}

interface StuntCsvRow {
  slug: string;
  title: string;
  icon: string;
  requirements: string;
  effect: string;
  deck: string;
  count: string;
}

export interface RulesOutcomeCard {
  sourceSlug: string;
  slug: OutcomeSlug;
  title: string;
  iconUri: string;
  description: string;
  instructions: string;
  count: number;
  deck: string;
  code: string;
}

export interface RulesEffectCard {
  slug: string;
  title: string;
  iconUri: string;
  nounEffect: string;
  adjectiveEffect?: string;
  count: number;
  deck: string;
}

export interface RulesStuntCard {
  slug: string;
  title: string;
  iconUri: string;
  requirements?: string;
  effect: string;
  count: number;
  deck: string;
}

const outcomeSlugAliasMap: Record<string, OutcomeSlug> = {
  "special-action": "special-action",
  special: "special-action",
  success: "success",
  "partial-success": "partial-success",
  partial: "partial-success",
  fumble: "fumble",
  chaos: "chaos",
};

const parseOutcomeCsvRows = (): OutcomeCsvRow[] =>
  parseCsvRecords(outcomesCsvRaw).map((record) => ({
    slug: record.slug ?? "",
    title: record.title ?? "",
    icon: record.icon ?? "",
    description: record.description ?? "",
    instructions: record.instructions ?? "",
    count: record.count ?? "0",
    deck: record.deck ?? "base",
  }));

const parseEffectCsvRows = (): EffectCsvRow[] =>
  parseCsvRecords(effectsCsvRaw).map((record) => ({
    slug: record.slug ?? "",
    title: record.title ?? "",
    icon: record.icon ?? "",
    effect: record.effect ?? "",
    count: record.count ?? "0",
    deck: record.deck ?? "base",
  }));

const parseStuntCsvRows = (): StuntCsvRow[] =>
  parseCsvRecords(stuntsCsvRaw).map((record) => ({
    slug: record.slug ?? "",
    title: record.title ?? "",
    icon: record.icon ?? "",
    requirements: record.requirements ?? "",
    effect: record.effect ?? "",
    deck: record.deck ?? "base",
    count: record.count ?? "0",
  }));

const splitEffectSections = (
  value: string,
): { noun: string; adjective?: string } => {
  const normalized = value
    .replace(/\u2014/g, "-")
    .replace(/\u2500/g, "-")
    .replace(/\u2013/g, "-");
  const separator = /-{2,}/;
  const match = separator.exec(normalized);

  if (!match || match.index < 0) {
    return { noun: normalized.trim() };
  }

  const noun = normalized.slice(0, match.index).trim();
  const adjective = normalized.slice(match.index + match[0].length).trim();
  return {
    noun,
    adjective: adjective.length > 0 ? adjective : undefined,
  };
};
const NBSP = " ";
const normalizeNoBreakSpaces = (value: string): string =>
  value
    .replace(/\+(\d+)\s+(?=[A-Za-z])/g, "+$1\u00a0")
    .replaceAll(NBSP, "\u00a0");

export const rulesOutcomeCards: RulesOutcomeCard[] = parseOutcomeCsvRows()
  .map((row) => {
    const normalizedSourceSlug = row.slug.trim().toLowerCase();
    const canonicalSlug = outcomeSlugAliasMap[normalizedSourceSlug];
    if (!canonicalSlug) {
      return null;
    }

    const count = parseCount(row.count, 0);

    return {
      sourceSlug: normalizedSourceSlug,
      slug: canonicalSlug,
      title: sanitizeRichText(row.title),
      iconUri: normalizePublicUri(row.icon),
      description: sanitizeRichText(row.description),
      instructions: sanitizeRichText(row.instructions),
      count,
      deck: sanitizeRichText(row.deck) || "base",
      code: `@outcome/${canonicalSlug}`,
    } satisfies RulesOutcomeCard;
  })
  .filter((value): value is RulesOutcomeCard => value !== null);

export const rulesEffectCards: RulesEffectCard[] = parseEffectCsvRows().flatMap(
  (row) => {
    const count = parseCount(row.count, 0);
    if (count <= 0) {
      return [];
    }

    const sanitizedEffect = sanitizeRichText(row.effect);
    const sections = splitEffectSections(sanitizedEffect);

    return [
      {
        slug: row.slug.trim(),
        title: sanitizeRichText(row.title),
        iconUri: normalizePublicUri(row.icon),
        nounEffect: sections.noun,
        adjectiveEffect: sections.adjective,
        count,
        deck: sanitizeRichText(row.deck) || "base",
      } satisfies RulesEffectCard,
    ];
  },
);

export const rulesStuntCards: RulesStuntCard[] = parseStuntCsvRows().flatMap(
  (row) => {
    const count = parseCount(row.count, 0);
    if (count <= 0) {
      return [];
    }

    const requirements = normalizeNoBreakSpaces(
      sanitizeRichText(row.requirements),
    );
    const effect = normalizeNoBreakSpaces(sanitizeRichText(row.effect));

    return [
      {
        slug: row.slug.trim(),
        title: sanitizeRichText(row.title),
        iconUri: normalizePublicUri(row.icon),
        requirements: requirements.length > 0 ? requirements : undefined,
        effect,
        count,
        deck: sanitizeRichText(row.deck) || "base",
      } satisfies RulesStuntCard,
    ];
  },
);
