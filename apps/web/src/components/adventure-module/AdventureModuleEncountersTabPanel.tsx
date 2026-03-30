import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdventureModuleResolvedEncounter } from "@mighty-decks/spec/adventureModuleAuthoring";
import { Button } from "../common/Button";
import { Message } from "../common/Message";
import { Panel } from "../common/Panel";
import { Text } from "../common/Text";
import { TextField } from "../common/TextField";
import { EncounterCardView } from "./EncounterCardView";

interface AdventureModuleEncountersTabPanelProps {
  encounters: AdventureModuleResolvedEncounter[];
  editable: boolean;
  creating?: boolean;
  createError?: string | null;
  onCreate: () => void;
  onOpenEncounter: (encounterSlug: string) => void;
  onDeleteEncounter?: (encounterSlug: string, title: string) => void;
}

const copyToClipboard = async (value: string): Promise<void> => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.setAttribute("readonly", "true");
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.append(textArea);
  textArea.select();
  const copied = document.execCommand("copy");
  textArea.remove();
  if (!copied) {
    throw new Error("Clipboard copy failed.");
  }
};

export const AdventureModuleEncountersTabPanel = ({
  encounters,
  editable,
  creating = false,
  createError,
  onCreate,
  onOpenEncounter,
  onDeleteEncounter,
}: AdventureModuleEncountersTabPanelProps): JSX.Element => {
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedEncounterSlug, setCopiedEncounterSlug] = useState<string | null>(
    null,
  );
  const [copyError, setCopyError] = useState<string | null>(null);

  const filteredEncounters = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
    if (!normalizedSearch) {
      return encounters;
    }
    return encounters.filter((encounter) => {
      const haystack =
        `${encounter.title} ${encounter.summary ?? ""} ${encounter.prerequisites} ${encounter.encounterSlug}`.toLocaleLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [encounters, searchTerm]);

  useEffect(() => {
    if (!copiedEncounterSlug) {
      return;
    }
    const timer = window.setTimeout(() => {
      setCopiedEncounterSlug(null);
    }, 1600);
    return () => {
      window.clearTimeout(timer);
    };
  }, [copiedEncounterSlug]);

  const handleCopyEmbed = useCallback(async (encounterSlug: string) => {
    try {
      await copyToClipboard(`@encounter/${encounterSlug}`);
      setCopiedEncounterSlug(encounterSlug);
      setCopyError(null);
    } catch {
      setCopyError(`Could not copy @encounter/${encounterSlug}.`);
    }
  }, []);

  const handleDelete = useCallback(
    (encounterSlug: string, title: string): void => {
      if (!onDeleteEncounter || !editable) {
        return;
      }
      onDeleteEncounter(encounterSlug, title);
    },
    [editable, onDeleteEncounter],
  );

  return (
    <div className="stack gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="stack gap-1">
          <Text variant="body" color="iron-light" className="text-sm">
            Open an encounter to edit its playable setup, prerequisites, title
            art, and markdown script.
          </Text>
        </div>
        <Button
          color="gold"
          onClick={onCreate}
          disabled={!editable || creating}
        >
          {creating ? "Creating..." : "Create Encounter"}
        </Button>
      </div>

      <TextField
        label="Search Encounters"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        placeholder="Search encounters by title, description, prerequisite, or slug..."
      />

      {createError ? (
        <Message label="Create failed" color="blood">
          {createError}
        </Message>
      ) : null}
      {copyError ? (
        <Message label="Copy failed" color="blood">
          {copyError}
        </Message>
      ) : null}

      {filteredEncounters.length === 0 ? (
        <Panel>
          <Text variant="body" color="iron-light">
            {encounters.length === 0
              ? "No encounters have been created yet."
              : "No encounters match your search."}
          </Text>
        </Panel>
      ) : (
        <div className="flex flex-row flex-wrap items-start gap-4">
          {filteredEncounters.map((encounter) => (
            <Panel
              key={encounter.fragmentId}
              className="self-start"
              contentClassName="stack gap-3"
            >
              <button
                type="button"
                className="stack gap-3 text-left"
                onClick={() => onOpenEncounter(encounter.encounterSlug)}
              >
                <EncounterCardView encounter={encounter} />
                <div className="stack gap-1">
                  <Text variant="note" color="steel-dark">
                    {`@encounter/${encounter.encounterSlug}`}
                  </Text>
                  <Text variant="body" color="iron-light" className="text-sm">
                    {encounter.prerequisites.trim().length > 0
                      ? `Prerequisites: ${encounter.prerequisites}`
                      : "No prerequisites yet."}
                  </Text>
                </div>
              </button>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    color="cloth"
                    size="sm"
                    onClick={() => {
                      void handleCopyEmbed(encounter.encounterSlug);
                    }}
                  >
                    Copy Shortcode
                  </Button>
                  {onDeleteEncounter ? (
                    <Button
                      variant="circle"
                      color="blood"
                      size="sm"
                      aria-label={`Delete ${encounter.title}`}
                      title={`Delete ${encounter.title}`}
                      disabled={!editable}
                      onClick={() => {
                        handleDelete(encounter.encounterSlug, encounter.title);
                      }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5 fill-none stroke-current"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M3 6h18" />
                        <path d="M8 6V4h8v2" />
                        <path d="M6 6l1 14h10l1-14" />
                        <path d="M10 10v7" />
                        <path d="M14 10v7" />
                      </svg>
                    </Button>
                  ) : null}
                </div>
                <Text
                  variant="note"
                  color="monster"
                  className={
                    copiedEncounterSlug === encounter.encounterSlug
                      ? "opacity-100"
                      : "opacity-0"
                  }
                >
                  Copied
                </Text>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
};
