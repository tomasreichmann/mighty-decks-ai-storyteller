import { GameCardView } from "../components/adventure-module/GameCardView";
import { ShortcodeField } from "../components/adventure-module/ShortcodeField";
import { Text } from "../components/common/Text";
import { rulesOutcomeCards } from "../data/rulesComponents";
import { resolveGameCard } from "../lib/markdownGameComponents";

interface RulesOutcomesContentProps {
  onAddOutcomeCard?: (card: { type: "OutcomeCard"; slug: string }) => void;
}

export const RulesOutcomesContent = ({
  onAddOutcomeCard,
}: RulesOutcomesContentProps): JSX.Element => {
  return (
    <div className="stack gap-4">
      <div className="stack gap-1">
        <Text variant="h3" color="iron">
          Outcome Cards
        </Text>
        <Text variant="body" color="iron-light" className="text-sm">
          Copy <code>{"@outcome/success"}</code> into Adventure Module markdown
          editors.
        </Text>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {rulesOutcomeCards.map((outcome) => {
          const gameCard = resolveGameCard("OutcomeCard", outcome.slug);
          if (!gameCard) {
            return null;
          }
          return (
            <div
              key={`${outcome.slug}-${outcome.sourceSlug}`}
              className="stack h-full gap-2"
            >
              <GameCardView gameCard={gameCard} className="mx-auto" />
              <ShortcodeField
                shortcode={gameCard.legacyToken}
                onAddToSelection={
                  onAddOutcomeCard
                    ? () =>
                        onAddOutcomeCard({
                          type: "OutcomeCard",
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

export const RulesOutcomesPage = (): JSX.Element => {
  return <RulesOutcomesContent />;
};
