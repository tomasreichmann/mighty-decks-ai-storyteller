import { FormEvent, useEffect, useState } from "react";
import type { RuntimeConfig } from "@mighty-decks/spec/adventureState";
import { Button } from "./common/Button";
import { Section } from "./common/Section";
import { Text } from "./common/Text";
import { DepressedInput } from "./common/DepressedInput";

interface RuntimeConfigPanelProps {
  config: RuntimeConfig;
  onApply: (nextConfig: RuntimeConfig) => void;
}

export const RuntimeConfigPanel = ({
  config,
  onApply,
}: RuntimeConfigPanelProps): JSX.Element => {
  const [draft, setDraft] = useState<RuntimeConfig>(config);

  useEffect(() => {
    setDraft(config);
  }, [config]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onApply(draft);
  };

  return (
    <Section className="stack">
      <Text as="h3" variant="h3" color="iron" className="mb-2">
        Runtime Config (Screen only)
      </Text>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={handleSubmit}>
        <DepressedInput
          label="Text call timeout (ms)"
          type="number"
          value={draft.textCallTimeoutMs}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              textCallTimeoutMs: Number(event.target.value),
            }))
          }
        />
        <DepressedInput
          label="Turn deadline (ms)"
          type="number"
          value={draft.turnDeadlineMs}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              turnDeadlineMs: Number(event.target.value),
            }))
          }
        />
        <DepressedInput
          label="Image timeout (ms)"
          type="number"
          value={draft.imageTimeoutMs}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              imageTimeoutMs: Number(event.target.value),
            }))
          }
        />
        <DepressedInput
          label="AI retries"
          type="number"
          value={draft.aiRetryCount}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              aiRetryCount: Number(event.target.value),
            }))
          }
        />
        <DepressedInput
          label="Vote timeout (ms)"
          type="number"
          value={draft.voteTimeoutMs}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              voteTimeoutMs: Number(event.target.value),
            }))
          }
        />
        <div className="flex items-end">
          <Button type="submit" variant="solid" color="cloth">
            Apply Runtime Config
          </Button>
        </div>
      </form>
    </Section>
  );
};
