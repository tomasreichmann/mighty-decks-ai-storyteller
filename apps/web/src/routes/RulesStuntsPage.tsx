import { LayeredCard } from "../components/cards/LayeredCard";
import { CodeCopyRow } from "../components/common/CodeCopyRow";
import { Text } from "../components/common/Text";
import { rulesStuntCards } from "../data/rulesComponents";

export const RulesStuntsPage = (): JSX.Element => {
  return (
    <div className="stack gap-4">
      <div className="stack gap-1">
        <Text variant="h3" color="iron">
          Stunt Cards
        </Text>
        <Text variant="body" color="iron-light" className="text-sm">
          Showing {rulesStuntCards.length} stunt components with deck count above zero.
        </Text>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {rulesStuntCards.map((stunt) => (
          <div key={stunt.slug} className="stack h-full gap-2">
            <LayeredCard
              className="mx-auto w-full max-w-[13rem]"
              imageUri={stunt.iconUri}
              noun={stunt.title}
              nounDeck={stunt.deck}
              nounCornerIcon="/types/stunt.png"
              nounEffect={stunt.effect}
              adjectiveEffect={stunt.requirements}
              nounClassName="text-[17px] text-kac-iron"
              nounEffectClassName="text-[10px] text-kac-iron-light"
              adjectiveEffectClassName="text-[10px] font-semibold text-kac-blood-dark"
            />
            <CodeCopyRow code={`@stunt/${stunt.slug}`} />
          </div>
        ))}
      </div>
    </div>
  );
};
