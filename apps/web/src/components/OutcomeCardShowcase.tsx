import { Card } from "./cards/Card";
import { Section } from "./common/Section";
import { outcomeMap } from "../data/outcomeDeck";
import { Text } from "./common/Text";

interface OutcomeCardShowcaseItem {
  id: string;
  base: {
    iconUri: string;
    deckName: string;
    typeIconUri: string;
    title: string;
    effect: string;
  };
  modifier?: {
    iconUri?: string;
    deckName: string;
    typeIconUri: string;
    title: string;
    effect: string;
  };
}

const modifierTitleBySlug: Record<string, string> = {
  special: "Burst",
  success: "Clean",
  partial: "Tradeoff",
  fumble: "Backfire",
  chaos: "Twist",
};

const slugOrder = ["special", "success", "fumble"] as const;

const showcaseCards: OutcomeCardShowcaseItem[] = slugOrder
  .map((slug) => outcomeMap[slug])
  .filter(Boolean)
  .map((outcome) => {
    const hasModifier = Boolean(outcome.instructions && outcome.instructions.length > 0);

    return {
      id: `${outcome.slug}-showcase`,
      base: {
        iconUri: outcome.iconUri,
        deckName: outcome.deck ?? "base",
        typeIconUri: "/types/outcome.png",
        title: outcome.title,
        effect: outcome.description,
      },
      modifier: hasModifier
        ? {
            iconUri: "/types/effect.png",
            deckName: "mod",
            typeIconUri: "/types/effect.png",
            title: modifierTitleBySlug[outcome.slug] ?? "Modifier",
            effect: outcome.instructions ?? "",
          }
        : undefined,
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
          <Card
            key={item.id}
            className="shrink-0 snap-start"
            base={item.base}
            modifierPart={item.modifier}
            baseHeaderIconUri="/types/outcome.png"
            backgroundUri="/backgrounds/paper-with-image-shadow.png"
          />
        ))}
      </div>
    </Section>
  );
};
