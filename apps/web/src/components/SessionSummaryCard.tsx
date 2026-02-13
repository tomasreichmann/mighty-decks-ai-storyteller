import { Button } from "./common/Button";
import { Message } from "./common/Message";
import { Text } from "./common/Text";

interface SessionSummaryCardProps {
  summary: string;
  forwardHook?: string;
  onContinueAdventure?: () => void;
  onStartNewAdventure?: () => void;
  onCloseAdventure?: () => void;
}

export const SessionSummaryCard = ({
  summary: _summary,
  forwardHook,
  onContinueAdventure,
  onStartNewAdventure,
  onCloseAdventure,
}: SessionSummaryCardProps): JSX.Element => {
  const resolvedForwardHook =
    forwardHook?.trim().length
      ? forwardHook.trim()
      : "The story continues beyond this chapter.";

  return (
    <Message
      label="End-of-Session"
      className="stack gap-4 border-2 border-kac-iron-dark bg-gradient-to-b from-kac-bone-light to-kac-bone px-4 py-4 shadow-[4px_4px_0_0_#121b23]"
    >
      <Text variant="body" color="iron-dark" className="italic">
        {resolvedForwardHook}
      </Text>
      <div className="flex flex-wrap gap-2">
        {onContinueAdventure ? (
          <Button
            size="sm"
            variant="solid"
            color="cloth"
            onClick={onContinueAdventure}
          >
            Continue this adventure
          </Button>
        ) : null}
        {onStartNewAdventure ? (
          <Button
            size="sm"
            variant="solid"
            color="gold"
            onClick={onStartNewAdventure}
          >
            Start a new Adventure
          </Button>
        ) : null}
        {onCloseAdventure ? (
          <Button
            size="sm"
            variant="solid"
            color="blood"
            onClick={onCloseAdventure}
          >
            Close Adventure
          </Button>
        ) : null}
      </div>
    </Message>
  );
};
