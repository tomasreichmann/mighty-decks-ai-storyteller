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
        <h3 className="text-lg font-semibold text-ink">{vote.title}</h3>
        <p className="text-sm text-slate-700">{vote.prompt}</p>
      </div>
      <p className="text-xs uppercase tracking-widest text-slate-500">
        Timeout: {Math.min(secondsRemaining, timeoutDisplay)}s
      </p>
      <div className="grid gap-2">
        {vote.options.map((option) => {
          const selected = localSelection === option.optionId;
          return (
            <label
              key={option.optionId}
              className={cn(
                "rounded-md border p-3 text-sm",
                selected ? "border-accent bg-teal-50" : "border-slate-300 bg-white",
              )}
            >
              <input
                type="radio"
                className="mr-2"
                checked={selected}
                onChange={() => setLocalSelection(option.optionId)}
                disabled={disabled}
              />
              <span className="font-medium text-ink">{option.title}</span>
              <p className="mt-1 text-slate-600">{option.description}</p>
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
        <p className="self-center text-xs text-slate-600">Ties are resolved by randomized server tie-breaker.</p>
      </div>
    </Section>
  );
};

