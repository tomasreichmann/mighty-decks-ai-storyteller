import { FormEvent, KeyboardEvent, useState } from "react";
import { Button } from "./common/Button";
import { Section } from "./common/Section";
import { DepressedInput } from "./common/DepressedInput";
import { Text } from "./common/Text";
import { Message } from "./common/Message";
import { Toggle } from "./common/Toggle";

interface ActionComposerProps {
  connected: boolean;
  canSend: boolean;
  allowDrafting: boolean;
  onSend: (text: string) => void;
  onSendMetagame: (text: string) => void;
  onEndSession?: () => void;
}

export const ActionComposer = ({
  connected,
  canSend,
  allowDrafting,
  onSend,
  onSendMetagame,
  onEndSession,
}: ActionComposerProps): JSX.Element => {
  const [draft, setDraft] = useState("");
  const [metagameEnabled, setMetagameEnabled] = useState(false);
  const disconnected = !connected;
  const canDraftNow = !disconnected && (metagameEnabled || allowDrafting);
  const canSendNow = !disconnected && (metagameEnabled || canSend);

  const submitDraft = (): void => {
    const text = draft.trim();
    if (!text || !canSendNow) {
      return;
    }

    if (metagameEnabled) {
      onSendMetagame(text);
    } else {
      onSend(text);
    }
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
            className="absolute inset-0 z-20 rounded-sm bg-[repeating-linear-gradient(45deg,rgba(0,0,0,0.25)_0px,rgba(0,0,0,0.25)_10px,transparent_10px,transparent_20px)] [mask-image:linear-gradient(to_bottom,_transparent_0%,_black_10%,_black_90%,_transparent_100%)]"
          />
        ) : null}
        <form className="stack" onSubmit={handleSubmit}>
          <DepressedInput
            multiline
            label={metagameEnabled ? "Ask a Storyteller" : "Your action"}
            labelColor={metagameEnabled ? "curse" : "gold"}
            rows={3}
            placeholder={
              metagameEnabled
                ? "What was behind the door that I could not open?"
                : "I climb the broken stair and listen at the brass door."
            }
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!canDraftNow}
          />
          <div className="flex items-end gap-2 paper-shadow">
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
            <div className="flex-1 flex flex-col items-end"></div>
            <Toggle
              checked={metagameEnabled}
              onCheckedChange={setMetagameEnabled}
              label="Metagame"
              labelVariant="emphasised"
              className="min-w-[128px] shrink-0"
            />
            <Button
              type="submit"
              disabled={!canSendNow || draft.trim().length === 0}
            >
              Send
            </Button>
          </div>
          <div className="flex flex-col items-end mt-2 paper-shadow min-h-[2.2em]">
            <Text
              variant="note"
              color="steel-dark"
              className="normal-case tracking-normal"
            >
              Press Enter to send. Shift+Enter for newline.
            </Text>
            {metagameEnabled ? (
              <Text
                variant="note"
                color="steel-dark"
                className="normal-case tracking-normal"
              >
                Metagame mode bypasses turn-order and queue locks.
              </Text>
            ) : null}
            {!metagameEnabled && !canSend && !disconnected ? (
              <Text
                variant="note"
                color="steel-dark"
                className="normal-case tracking-normal"
              >
                You can draft while waiting for the queue.
              </Text>
            ) : null}
          </div>
        </form>
      </div>
      {disconnected ? (
        <Message
          label="Connection"
          color="curse"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
        >
          Disconnected from the server. Reconnect to send actions.
        </Message>
      ) : null}
    </Section>
  );
};
