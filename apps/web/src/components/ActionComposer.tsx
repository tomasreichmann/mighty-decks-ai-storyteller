import { FormEvent, KeyboardEvent, useState } from "react";
import { Button } from "./common/Button";
import { Section } from "./common/Section";
import { TextArea } from "./common/TextArea";

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
        <TextArea
          label="Your action"
          rows={3}
          placeholder="I climb the broken stair and listen at the brass door."
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!allowDrafting}
        />
        <div className="flex items-center gap-2">
          <Button
            type="submit"
            disabled={!canSend || draft.trim().length === 0}
          >
            Send
          </Button>
          <div className="flex-1">
            <p className="text-xs text-kac-steel-dark">
              Press Enter to send. Shift+Enter for newline.
            </p>
            {!canSend ? (
              <p className="text-xs text-kac-steel-dark">
                You can draft while waiting for the queue.
              </p>
            ) : null}
          </div>
          {onEndSession ? (
            <Button
              variant="danger"
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
        </div>
      </form>
    </Section>
  );
};

