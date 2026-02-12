import { Card, CardProps } from "./cards/Card";
import { Section } from "./common/Section";
import { outcomeMap } from "../data/outcomeDeck";
import { Text } from "./common/Text";

interface OutcomeCardShowcaseItem {
  id: string;
  props: CardProps;
}

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

const showcaseCards: OutcomeCardShowcaseItem[] = slugOrder.map((slug) => {
  const outcome = outcomeMap[slug];

  return {
    id: `${outcome.slug}-showcase`,
    props: {
      iconUri: outcome.iconUri,
      deck: outcome.deck ?? "base",
      typeIconUri: "/types/outcome.png",
      title: outcome.title,
      effect: outcome.description,
      titleClassName: titleColorClassBySlug[slug],
      modifierEffect: outcome.instructions,
    },
  };
});

export const OutcomeCardShowcase = (): JSX.Element => {
  return (
    <Section className="stack">
      <div className="stack gap-1">
        <Text as="h2" variant="h2" color="iron" className="text-2xl">
          Outcome Card Examples
        </Text>
        <Text variant="body" color="iron-light" className="text-sm">
          Base and modifier parts are independent, so either one can be omitted.
        </Text>
      </div>
      <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2">
        {showcaseCards.map((item) => (
          <Card key={item.id} className="shrink-0 snap-start" {...item.props} />
        ))}
      </div>
    </Section>
  );
};
