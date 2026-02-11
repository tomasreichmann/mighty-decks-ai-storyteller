import type { ActiveOutcomeCheck, OutcomeCardType } from "@mighty-decks/spec/adventureState";
import { Card } from "../common/Card";
import { OutcomeCard, outcomeCardOrder } from "./OutcomeCard";

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
        <p className="text-xs font-semibold uppercase tracking-wide text-kac-gold-darker">
          Outcome Check
        </p>
        <p className="text-sm text-kac-iron">{check.prompt}</p>
      </div>

      {playedCard ? (
        <div className="grid gap-2 sm:max-w-sm">
          <OutcomeCard card={playedCard} selected={true} disabled={true} />
          <p className="text-xs text-kac-iron-light">
            Card locked in. Waiting for resolution.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm font-medium text-kac-iron">
            Pick one reusable Outcome card:
          </p>
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
