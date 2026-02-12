import type {
  ActiveOutcomeCheck,
  OutcomeCardType,
} from "@mighty-decks/spec/adventureState";
import { Text } from "../common/Text";
import { Message } from "../common/Message";
import { Card } from "./Card";
import { ourcomeCardPropsMap } from "../../data/outcomeDeck";
import { cn } from "../../utils/cn";

interface OutcomeHandPanelProps {
  check: ActiveOutcomeCheck;
  playerId: string;
  onPlayCard: (card: OutcomeCardType) => void;
  disabled?: boolean;
}

const outcomeCardSlugOrder = [
  "special-action",
  "success",
  "partial-success",
  "chaos",
  "fumble",
] as const;

export const OutcomeHandPanel = ({
  check,
  playerId,
  onPlayCard,
  disabled = false,
}: OutcomeHandPanelProps): JSX.Element | null => {
  const target = check.targets.find((entry) => entry.playerId === playerId);
  if (!target) {
    return null;
  }

  const playedCard = target.playedCard;

  return (
    <div className="grid gap-3 border border-kac-gold-dark/20 bg-kac-gold-light/30 p-4">
      <Message label="Outcome Check" variant="gold">
        <Text variant="body" color="iron" className="text-sm">
          {check.prompt}
        </Text>
      </Message>

      {playedCard ? (
        <div className="grid gap-2">
          <div className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1">
            <Card {...ourcomeCardPropsMap[playedCard]} />
          </div>
          <Text
            variant="note"
            color="iron-light"
            className="normal-case tracking-normal"
          >
            Card locked in. Waiting for resolution.
          </Text>
        </div>
      ) : (
        <>
          <div className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1">
            {outcomeCardSlugOrder.map((slug) => {
              const props = ourcomeCardPropsMap[slug];
              return (
                <div
                  onClick={disabled ? undefined : () => onPlayCard(slug)}
                  key={slug}
                  className={cn(
                    "snap-start",
                    disabled &&
                      "cursor-not-allowed opacity-60 pointer-events-none",
                  )}
                >
                  <Card {...props} />
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
