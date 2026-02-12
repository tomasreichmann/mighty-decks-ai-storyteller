import { FormEvent, KeyboardEvent, useState } from "react";
import { Button } from "./common/Button";
import { Section } from "./common/Section";
import { DepressedInput } from "./common/DepressedInput";
import { Text } from "./common/Text";

interface ActionComposerProps {
  canSend: boolean;
  allowDrafting: boolean;
  onSend: (text: string) => void;
  onEndSession?: () => void;
}

export const ActionComposer = ({
  canSend,
  allowDrafting,
  onSend,
  onEndSession,
}: ActionComposerProps): JSX.Element => {
  const [draft, setDraft] = useState("");

  const submitDraft = (): void => {
    const text = draft.trim();
    if (!text || !canSend) {
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
      <form className="stack" onSubmit={handleSubmit}>
        <DepressedInput
          multiline
          label="Your action"
          rows={3}
          placeholder="I climb the broken stair and listen at the brass door."
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!allowDrafting}
        />
        <div className="flex items-center gap-2 paper-shadow">
          {onEndSession ? (
            <Button
              variant="solid"
              color="curse"
              size="sm"
              type="button"
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
            {!canSend ? (
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
            disabled={!canSend || draft.trim().length === 0}
          >
            Send
          </Button>
        </div>
      </form>
    </Section>
  );
};
