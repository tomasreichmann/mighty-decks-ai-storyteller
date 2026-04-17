import { GameCardView } from "../components/adventure-module/GameCardView";
import { ShortcodeField } from "../components/adventure-module/ShortcodeField";
import { CardBoundary } from "../components/common/CardBoundary";
import { Text } from "../components/common/Text";
import { rulesEffectCards } from "../data/rulesComponents";
import { resolveGameCard } from "../lib/markdownGameComponents";

interface RulesEffectsContentProps {
  onAddEffectCard?: (card: { type: "EffectCard"; slug: string }) => void;
}

export const RulesEffectsContent = ({
  onAddEffectCard,
}: RulesEffectsContentProps): JSX.Element => {
  return (
    <div className="stack gap-4">
      <div className="stack gap-1">
        <Text variant="h3" color="iron">
          Effect Cards
        </Text>
        <Text variant="body" color="iron-light" className="text-sm">
          Copy each <code>@effect/&lt;slug&gt;</code> shortcode into Adventure
          Module markdown editors.
        </Text>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {rulesEffectCards.map((effect) => {
          const gameCard = resolveGameCard("EffectCard", effect.slug);
          if (!gameCard) {
            return null;
          }
          return (
            <div key={effect.slug} className="stack h-full gap-2">
              <CardBoundary
                resetKey={effect.slug}
                label="Card failed to render"
                message="This rules card could not render."
                className="mx-auto w-full max-w-[13rem]"
              >
                <GameCardView gameCard={gameCard} className="mx-auto" />
              </CardBoundary>
              <ShortcodeField
                shortcode={gameCard.legacyToken}
                onAddToSelection={
                  onAddEffectCard
                    ? () =>
                        onAddEffectCard({
                          type: "EffectCard",
                          slug: gameCard.slug,
                        })
                    : undefined
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const RulesEffectsPage = (): JSX.Element => {
  return <RulesEffectsContent />;
};
