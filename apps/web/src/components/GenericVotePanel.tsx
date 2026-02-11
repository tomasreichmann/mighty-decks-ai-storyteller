import { useEffect, useState } from "react";
import type { ActiveVote } from "@mighty-decks/spec/adventureState";
import { Button } from "./common/Button";
import { Section } from "./common/Section";
import { cn } from "../utils/cn";

interface GenericVotePanelProps {
  vote: ActiveVote;
  selectedOptionId?: string;
  onVote: (optionId: string) => void;
  disabled?: boolean;
}

export const GenericVotePanel = ({
  vote,
  selectedOptionId,
  onVote,
  disabled = false,
}: GenericVotePanelProps): JSX.Element => {
  const [localSelection, setLocalSelection] = useState<string | undefined>(selectedOptionId);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  useEffect(() => {
    setLocalSelection(selectedOptionId);
  }, [selectedOptionId, vote.voteId]);

  useEffect(() => {
    const calculate = (): number => {
      const closesAt = new Date(vote.closesAtIso).getTime();
      const now = Date.now();
      return Math.max(0, Math.ceil((closesAt - now) / 1000));
    };

    setSecondsRemaining(calculate());
    const interval = window.setInterval(() => {
      setSecondsRemaining(calculate());
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [vote.closesAtIso]);

  const timeoutDisplay = (() => {
    const closesAt = new Date(vote.closesAtIso).getTime();
    const now = Date.now();
    return Math.max(0, Math.ceil((closesAt - now) / 1000));
  })();

  return (
    <Section className="stack">
      <div>
        <h3 className="text-lg font-semibold text-kac-iron">{vote.title}</h3>
        <p className="text-sm text-kac-iron-light">{vote.prompt}</p>
      </div>
      <p className="text-xs uppercase tracking-widest text-kac-steel-dark/90">
        Timeout: {Math.min(secondsRemaining, timeoutDisplay)}s
      </p>
      <div className="grid gap-2">
        {vote.options.map((option) => {
          const selected = localSelection === option.optionId;
          return (
            <label
              key={option.optionId}
              className={cn(
                "border-[3px] border-b-[6px] p-3 text-sm shadow-[3px_3px_0_0_#121b23]",
                selected
                  ? "border-kac-iron bg-gradient-to-b from-kac-cloth-lightest to-kac-cloth-light"
                  : "border-kac-iron bg-gradient-to-b from-[#fffdf5] to-kac-bone-light",
              )}
            >
              <input
                type="radio"
                className="mr-2 h-4 w-4 accent-kac-blood align-middle"
                checked={selected}
                onChange={() => setLocalSelection(option.optionId)}
                disabled={disabled}
              />
              <span className="font-medium text-kac-iron">{option.title}</span>
              <p className="mt-1 text-kac-steel-dark">{option.description}</p>
            </label>
          );
        })}
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => {
            if (localSelection) {
              onVote(localSelection);
            }
          }}
          disabled={!localSelection || disabled}
        >
          Cast Vote
        </Button>
        <p className="self-center text-xs text-kac-steel-dark">Ties are resolved by randomized server tie-breaker.</p>
      </div>
    </Section>
  );
};

