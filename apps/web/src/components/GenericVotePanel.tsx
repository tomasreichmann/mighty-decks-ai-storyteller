import { useEffect, useState } from "react";
import type { ActiveVote } from "@mighty-decks/spec/adventureState";
import { Button } from "./common/Button";
import { Section } from "./common/Section";
import { Text } from "./common/Text";
import { Message } from "./common/Message";
import { Highlight } from "./common/Highlight";

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
  const [localSelection, setLocalSelection] = useState<string | undefined>(
    selectedOptionId,
  );
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
        <Text as="h3" variant="h3" color="iron">
          <span className="relative">
            <span className="inline-block relative rotate-[-2deg]">
              {vote.title}
            </span>
            <Highlight
              lineCount={1}
              animate="once"
              brushHeight={8}
              className="absolute left-1/2 bottom-[25%] -translate-x-1/2 w-[130%] h-[25%] -z-10"
            />
          </span>
        </Text>
        <Text variant="emphasised" color="iron-light">
          {vote.prompt}
        </Text>
      </div>
      <div className="grid gap-2 mt-4">
        {vote.options.map((option) => {
          const selected = localSelection === option.optionId;
          return (
            <Message
              label={option.title}
              key={option.optionId}
              color={selected ? "gold" : "bone"}
              as="label"
            >
              <input
                type="radio"
                className="mr-2 h-4 w-4 accent-kac-blood align-middle"
                checked={selected}
                onChange={() => setLocalSelection(option.optionId)}
                disabled={disabled}
              />
              <Text
                as="span"
                variant="body"
                color="iron"
                className="font-medium"
              >
                {option.title}
              </Text>
              <Text variant="body" color="steel-dark" className="mt-1 text-sm">
                {option.description}
              </Text>
            </Message>
          );
        })}
      </div>
      <div className="flex gap-2 mt-4">
        <Button
          onClick={() => {
            if (localSelection) {
              onVote(localSelection);
            }
          }}
          disabled={!localSelection || disabled}
        >
          Cast Vote
          <br />
          {Math.min(secondsRemaining, timeoutDisplay)}s
        </Button>
        <Text
          variant="note"
          color="steel-dark"
          className="self-center normal-case tracking-normal"
        >
          Ties are resolved by randomized server tie-breaker.
        </Text>
      </div>
    </Section>
  );
};
