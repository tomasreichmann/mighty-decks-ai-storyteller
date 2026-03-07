import { LayeredCard } from "../components/cards/LayeredCard";
import { CodeCopyRow } from "../components/common/CodeCopyRow";
import { Text } from "../components/common/Text";
import { rulesEffectCards } from "../data/rulesComponents";

export const RulesEffectsPage = (): JSX.Element => {
  return (
    <div className="stack gap-4">
      <div className="stack gap-1">
        <Text variant="h3" color="iron">
          Effect Cards
        </Text>
        <Text variant="body" color="iron-light" className="text-sm">
          Showing {rulesEffectCards.length} effect components with deck count above zero.
        </Text>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {rulesEffectCards.map((effect) => (
          <div key={effect.slug} className="stack h-full gap-2">
            <LayeredCard
              className="mx-auto w-full max-w-[13rem]"
              imageUri={effect.iconUri}
              noun={effect.title}
              nounDeck={effect.deck}
              nounCornerIcon="/types/effect.png"
              nounEffect={effect.nounEffect}
              adjectiveEffect={effect.adjectiveEffect}
              nounClassName="text-[18px] text-kac-iron"
              nounEffectClassName="text-[10px] text-kac-iron-light"
              adjectiveEffectClassName="text-[10px] font-semibold text-kac-iron"
            />
            <CodeCopyRow code={`@effect/${effect.slug}`} />
          </div>
        ))}
      </div>
    </div>
  );
};
