import { FormEvent, useEffect, useState } from "react";
import type { RuntimeConfig } from "@mighty-decks/spec/adventureState";
import { Button } from "./common/Button";
import { Section } from "./common/Section";
import { TextField } from "./common/TextField";

interface RuntimeConfigPanelProps {
  config: RuntimeConfig;
  onApply: (nextConfig: RuntimeConfig) => void;
}

export const RuntimeConfigPanel = ({ config, onApply }: RuntimeConfigPanelProps): JSX.Element => {
  const [draft, setDraft] = useState<RuntimeConfig>(config);

  useEffect(() => {
    setDraft(config);
  }, [config]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onApply(draft);
  };

  return (
    <Section className="stack bg-cyan-50">
      <h3 className="text-lg font-semibold text-ink">Runtime Config (Screen only)</h3>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={handleSubmit}>
        <TextField
          label="Text call timeout (ms)"
          type="number"
          value={draft.textCallTimeoutMs}
          onChange={(event) =>
            setDraft((current) => ({ ...current, textCallTimeoutMs: Number(event.target.value) }))
          }
        />
        <TextField
          label="Turn deadline (ms)"
          type="number"
          value={draft.turnDeadlineMs}
          onChange={(event) =>
            setDraft((current) => ({ ...current, turnDeadlineMs: Number(event.target.value) }))
          }
        />
        <TextField
          label="Image timeout (ms)"
          type="number"
          value={draft.imageTimeoutMs}
          onChange={(event) =>
            setDraft((current) => ({ ...current, imageTimeoutMs: Number(event.target.value) }))
          }
        />
        <TextField
          label="AI retries"
          type="number"
          value={draft.aiRetryCount}
          onChange={(event) =>
            setDraft((current) => ({ ...current, aiRetryCount: Number(event.target.value) }))
          }
        />
        <TextField
          label="Vote timeout (ms)"
          type="number"
          value={draft.voteTimeoutMs}
          onChange={(event) =>
            setDraft((current) => ({ ...current, voteTimeoutMs: Number(event.target.value) }))
          }
        />
        <div className="flex items-end">
          <Button type="submit" variant="secondary">
            Apply Runtime Config
          </Button>
        </div>
      </form>
    </Section>
  );
};

