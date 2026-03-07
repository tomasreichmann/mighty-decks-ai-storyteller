import { LayeredCard } from "../components/cards/LayeredCard";
import { CodeCopyRow } from "../components/common/CodeCopyRow";
import { Text } from "../components/common/Text";
import { rulesOutcomeCards } from "../data/rulesComponents";
import type { OutcomeSlug } from "../types/types";
import { cn } from "../utils/cn";

const titleClassByOutcomeSlug: Record<OutcomeSlug, string> = {
  "special-action": "text-special",
  success: "text-success",
  "partial-success": "text-partial",
  chaos: "text-chaos",
  fumble: "text-fumble",
};

export const RulesOutcomesPage = (): JSX.Element => {
  return (
    <div className="stack gap-4">
      <div className="stack gap-1">
        <Text variant="h3" color="iron">
          Outcome Cards
        </Text>
        <Text variant="body" color="iron-light" className="text-sm">
          Copy code snippets like <code>@outcome/success</code> directly into markdown editors.
        </Text>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {rulesOutcomeCards.map((outcome) => (
          <div
            key={`${outcome.slug}-${outcome.sourceSlug}`}
            className="stack h-full gap-2"
          >
            <LayeredCard
              className="mx-auto w-full max-w-[13rem]"
              imageUri={outcome.iconUri}
              noun={outcome.title}
              nounDeck={outcome.deck}
              nounCornerIcon="/types/outcome.png"
              nounEffect={outcome.description}
              adjectiveEffect={outcome.instructions}
              nounClassName={cn("text-[19px]", titleClassByOutcomeSlug[outcome.slug])}
              nounEffectClassName="text-[11px] text-kac-iron-light"
              adjectiveEffectClassName="text-[11px] font-semibold text-kac-iron"
            />
            <CodeCopyRow code={outcome.code} />
          </div>
        ))}
      </div>
    </div>
  );
};
