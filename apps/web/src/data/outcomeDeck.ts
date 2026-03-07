import { CardProps } from "../components/cards/Card";
import type { OutcomeSlug, OutcomeType } from "../types/types";
import arrayToMap from "../utils/arrayToMap";
import { rulesOutcomeCards } from "./rulesComponents";

const outcomeRecords = rulesOutcomeCards.map((outcome) => ({
  slug: outcome.slug,
  deck: outcome.deck,
  title: outcome.title,
  iconUri: outcome.iconUri,
  description: outcome.description,
  instructions: outcome.instructions,
  count: outcome.count,
})) as Array<OutcomeType & { count: number } & { slug: OutcomeSlug }>;

export const outcomeMap = arrayToMap(outcomeRecords, "slug") as {
  [key in OutcomeSlug]: OutcomeType & { count: number };
};

export const {
  "special-action": special,
  success,
  "partial-success": partial,
  fumble,
  chaos,
} = outcomeMap;

const outcomes = [
  special,
  success,
  success,
  success,
  partial,
  partial,
  partial,
  fumble,
  fumble,
  fumble,
  fumble,
  chaos,
].map((outcome, outcomeIndex) => ({
  ...outcome,
  slug: `${outcome.slug}-${outcomeIndex}`,
}));

const slugOrder = [
  "special-action",
  "success",
  "partial-success",
  "chaos",
  "fumble",
] as const;

const titleColorClassBySlug = {
  "special-action": "text-special",
  success: "text-success",
  "partial-success": "text-partial",
  chaos: "text-chaos",
  fumble: "text-fumble",
} as const;

const isOutcomeSlug = (value: string): value is OutcomeSlug =>
  slugOrder.includes(value as OutcomeSlug);

export const ourcomeCardPropsMap = Object.fromEntries(
  Object.entries(outcomeMap).map(([slug, outcome]) => {
    return [
      slug as OutcomeSlug,
      {
        iconUri: outcome.iconUri,
        deck: outcome.deck ?? "base",
        typeIconUri: "/types/outcome.png",
        title: outcome.title,
        effect: outcome.description,
        titleClassName: isOutcomeSlug(slug)
          ? titleColorClassBySlug[slug]
          : undefined,
        modifierEffect: outcome.instructions,
      } as CardProps,
    ];
  }),
) as { [key in OutcomeSlug]: CardProps };

export default outcomes;