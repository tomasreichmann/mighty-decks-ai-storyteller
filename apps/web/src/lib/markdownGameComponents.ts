import {
  rulesEffectCards,
  rulesOutcomeCards,
  rulesStuntCards,
  type RulesEffectCard,
  type RulesOutcomeCard,
  type RulesStuntCard,
} from "../data/rulesComponents";

export type MarkdownGameComponentType = "outcome" | "effect" | "stunt";

export interface MarkdownGameComponentOption {
  type: MarkdownGameComponentType;
  slug: string;
  token: string;
  label: string;
}

export type ResolvedMarkdownGameComponent =
  | {
      type: "outcome";
      slug: string;
      token: string;
      card: RulesOutcomeCard;
    }
  | {
      type: "effect";
      slug: string;
      token: string;
      card: RulesEffectCard;
    }
  | {
      type: "stunt";
      slug: string;
      token: string;
      card: RulesStuntCard;
    };

const TOKEN_PATTERN = /^@(outcome|effect|stunt)\/([A-Za-z0-9-]+)$/;

const dedupeBySlug = <T extends { slug: string }>(records: T[]): T[] => {
  const deduped: T[] = [];
  const seen = new Set<string>();

  for (const record of records) {
    const key = record.slug.toLocaleLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(record);
  }

  return deduped;
};

const outcomeCards = dedupeBySlug(rulesOutcomeCards);
const effectCards = dedupeBySlug(rulesEffectCards);
const stuntCards = dedupeBySlug(rulesStuntCards);

const outcomeBySlug = new Map(
  outcomeCards.map((card) => [card.slug.toLocaleLowerCase(), card] as const),
);
const effectBySlug = new Map(
  effectCards.map((card) => [card.slug.toLocaleLowerCase(), card] as const),
);
const stuntBySlug = new Map(
  stuntCards.map((card) => [card.slug.toLocaleLowerCase(), card] as const),
);

const toOption = (
  type: MarkdownGameComponentType,
  slug: string,
  title: string,
): MarkdownGameComponentOption => ({
  type,
  slug,
  token: `@${type}/${slug}`,
  label: `${title} (${slug})`,
});

export const markdownGameComponentOptionsByType: Record<
  MarkdownGameComponentType,
  MarkdownGameComponentOption[]
> = {
  outcome: outcomeCards.map((card) => toOption("outcome", card.slug, card.title)),
  effect: effectCards.map((card) => toOption("effect", card.slug, card.title)),
  stunt: stuntCards.map((card) => toOption("stunt", card.slug, card.title)),
};

export const markdownGameComponentTypeLabel: Record<
  MarkdownGameComponentType,
  string
> = {
  outcome: "Outcome",
  effect: "Effect",
  stunt: "Stunt",
};

export const parseMarkdownGameComponentToken = (
  value: string,
): { type: MarkdownGameComponentType; slug: string; token: string } | null => {
  const trimmed = value.trim();
  const match = TOKEN_PATTERN.exec(trimmed);
  if (!match) {
    return null;
  }
  const type = match[1] as MarkdownGameComponentType;
  const slug = match[2];
  return {
    type,
    slug,
    token: trimmed,
  };
};

export const resolveMarkdownGameComponentToken = (
  value: string,
): ResolvedMarkdownGameComponent | null => {
  const parsed = parseMarkdownGameComponentToken(value);
  if (!parsed) {
    return null;
  }

  const key = parsed.slug.toLocaleLowerCase();
  switch (parsed.type) {
    case "outcome": {
      const card = outcomeBySlug.get(key);
      if (!card) {
        return null;
      }
      return {
        type: "outcome",
        slug: card.slug,
        token: parsed.token,
        card,
      };
    }
    case "effect": {
      const card = effectBySlug.get(key);
      if (!card) {
        return null;
      }
      return {
        type: "effect",
        slug: card.slug,
        token: parsed.token,
        card,
      };
    }
    case "stunt": {
      const card = stuntBySlug.get(key);
      if (!card) {
        return null;
      }
      return {
        type: "stunt",
        slug: card.slug,
        token: parsed.token,
        card,
      };
    }
    default:
      return null;
  }
};
