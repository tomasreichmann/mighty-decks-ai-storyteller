import { Button } from "./common/Button";
import { Heading } from "./common/Heading";
import { Label } from "./common/Label";
import { Message } from "./common/Message";
import { Panel } from "./common/Panel";
import { Text } from "./common/Text";
import { PendingIndicator } from "./PendingIndicator";
import { getBackendWakeCopy, type BackendStatus } from "../lib/backendReadiness";

interface WakeScreenProps {
  status: BackendStatus;
  elapsedMs: number;
  onRetry: () => void;
}

export const WakeScreen = ({
  status,
  elapsedMs,
  onRetry,
}: WakeScreenProps): JSX.Element => {
  const copy = getBackendWakeCopy(status, elapsedMs);
  const waiting = !copy.canRetry;

  return (
    <main className="app-shell grid min-h-screen place-items-center px-6 py-10">
      <Panel
        as="section"
        tone={copy.canRetry ? "fire" : "cloth"}
        className="w-full max-w-xl"
        contentClassName="stack items-center gap-5 p-7 text-center sm:p-10"
      >
        <Label color={copy.canRetry ? "fire" : "cloth"} rotate={false}>
          Storyteller status
        </Label>
        <Heading level="h1" color="iron" className="max-w-md text-4xl leading-none">
          {copy.title}
        </Heading>
        <Text variant="body" color="iron-light" className="max-w-md">
          {copy.detail}
        </Text>
        {waiting ? (
          <PendingIndicator label="Preparing adventures, images, and AI tools" color="cloth" />
        ) : (
          <Button type="button" color="fire" size="lg" onClick={onRetry}>
            Try again
          </Button>
        )}
        <Message color="bone" className="mt-3 text-left" preserveWhitespace={false}>
          The server rests between adventures on free hosting. Your request is
          already helping wake it up.
        </Message>
      </Panel>
    </main>
  );
};
