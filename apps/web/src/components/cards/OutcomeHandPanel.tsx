import type { ActiveOutcomeCheck, OutcomeCardType } from "@mighty-decks/spec/adventureState";
import { Card } from "../common/Card";
import { OutcomeCard, outcomeCardOrder } from "./OutcomeCard";
import { Text } from "../common/Text";

interface OutcomeHandPanelProps {
  check: ActiveOutcomeCheck;
  playerId: string;
  onPlayCard: (card: OutcomeCardType) => void;
  disabled?: boolean;
}

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
    <Card className="grid gap-3 border border-kac-gold-dark/20 bg-kac-gold-light/30 p-4">
      <div>
        <Text variant="note" color="gold-dark">
          Outcome Check
        </Text>
        <Text variant="body" color="iron" className="text-sm">
          {check.prompt}
        </Text>
      </div>

      {playedCard ? (
        <div className="grid gap-2 sm:max-w-sm">
          <OutcomeCard card={playedCard} selected={true} disabled={true} />
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
          <Text variant="body" color="iron" className="text-sm font-medium">
            Pick one reusable Outcome card:
          </Text>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
            {outcomeCardOrder.map((card) => (
              <OutcomeCard
                key={card}
                card={card}
                disabled={disabled}
                onSelect={onPlayCard}
              />
            ))}
          </div>
        </>
      )}
    </Card>
  );
};
