import { GameCardView } from "../components/adventure-module/GameCardView";
import { CodeCopyRow } from "../components/common/CodeCopyRow";
import { Text } from "../components/common/Text";
import { rulesStuntCards } from "../data/rulesComponents";
import { resolveGameCard } from "../lib/markdownGameComponents";

export const RulesStuntsPage = (): JSX.Element => {
  return (
    <div className="stack gap-4">
      <div className="stack gap-1">
        <Text variant="h3" color="iron">
          Stunt Cards
        </Text>
        <Text variant="body" color="iron-light" className="text-sm">
          Copy each <code>@stunt/&lt;slug&gt;</code> shortcode into Adventure
          Module markdown editors.
        </Text>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {rulesStuntCards.map((stunt) => {
          const gameCard = resolveGameCard("StuntCard", stunt.slug);
          if (!gameCard) {
            return null;
          }
          return (
            <div key={stunt.slug} className="stack h-full gap-2">
              <GameCardView gameCard={gameCard} className="mx-auto" />
              <CodeCopyRow code={gameCard.legacyToken} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
