import { FormEvent, KeyboardEvent, useState } from "react";
import { Button } from "./common/Button";
import { Section } from "./common/Section";
import { DepressedInput } from "./common/DepressedInput";
import { Text } from "./common/Text";
import { Message } from "./common/Message";

interface ActionComposerProps {
  connected: boolean;
  canSend: boolean;
  allowDrafting: boolean;
  onSend: (text: string) => void;
  onEndSession?: () => void;
}

export const ActionComposer = ({
  connected,
  canSend,
  allowDrafting,
  onSend,
  onEndSession,
}: ActionComposerProps): JSX.Element => {
  const [draft, setDraft] = useState("");
  const disconnected = !connected;
  const canDraftNow = allowDrafting && !disconnected;
  const canSendNow = canSend && !disconnected;

  const submitDraft = (): void => {
    const text = draft.trim();
    if (!text || !canSendNow) {
      return;
    }

    onSend(text);
    setDraft("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    submitDraft();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing
    ) {
      return;
    }

    event.preventDefault();
    submitDraft();
  };

  return (
    <Section>
      <div className="relative">
        {disconnected ? (
          <div
            aria-hidden="true"
            className="absolute inset-0 z-20 rounded-sm border-2 border-kac-iron/40 bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0.25)_0px,rgba(0,0,0,0.25)_10px,transparent_10px,transparent_20px)]"
          />
        ) : null}
        <form className="stack" onSubmit={handleSubmit}>
          <DepressedInput
            multiline
            label="Your action"
            rows={3}
            placeholder="I climb the broken stair and listen at the brass door."
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!canDraftNow}
          />
          <div className="flex items-center gap-2 paper-shadow">
            {onEndSession ? (
              <Button
                variant="solid"
                color="curse"
                size="sm"
                type="button"
                disabled={disconnected}
                onClick={() => {
                  if (window.confirm("End this session now?")) {
                    onEndSession();
                  }
                }}
              >
                End Session
              </Button>
            ) : null}
            <div className="flex-1 flex flex-col items-end">
              <Text
                variant="note"
                color="steel-dark"
                className="normal-case tracking-normal"
              >
                Press Enter to send. Shift+Enter for newline.
              </Text>
              {!canSend && !disconnected ? (
                <Text
                  variant="note"
                  color="steel-dark"
                  className="normal-case tracking-normal"
                >
                  You can draft while waiting for the queue.
                </Text>
              ) : null}
            </div>
            <Button
              type="submit"
              disabled={!canSendNow || draft.trim().length === 0}
            >
              Send
            </Button>
          </div>
        </form>
      </div>
      {disconnected ? (
        <Message label="Connection" color="cloth">
          Disconnected from the server. Reconnect to send actions.
        </Message>
      ) : null}
    </Section>
  );
};
