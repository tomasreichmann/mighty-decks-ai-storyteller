import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdventureModuleResolvedQuest } from "@mighty-decks/spec/adventureModuleAuthoring";
import { Button } from "../common/Button";
import { Message } from "../common/Message";
import { Panel } from "../common/Panel";
import { Text } from "../common/Text";
import { TextField } from "../common/TextField";
import { QuestCardView } from "./QuestCardView";

interface AdventureModuleQuestsTabPanelProps {
  quests: AdventureModuleResolvedQuest[];
  editable: boolean;
  creating?: boolean;
  createError?: string | null;
  onCreate: () => void;
  onOpenQuest: (questSlug: string) => void;
  onDeleteQuest?: (questSlug: string, title: string) => void;
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

export const AdventureModuleQuestsTabPanel = ({
  quests,
  editable,
  creating = false,
  createError,
  onCreate,
  onOpenQuest,
  onDeleteQuest,
}: AdventureModuleQuestsTabPanelProps): JSX.Element => {
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedQuestSlug, setCopiedQuestSlug] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);

  const filteredQuests = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
    if (!normalizedSearch) {
      return quests;
    }
    return quests.filter((quest) => {
      const haystack =
        `${quest.title} ${quest.summary ?? ""} ${quest.questSlug}`.toLocaleLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [quests, searchTerm]);

  useEffect(() => {
    if (!copiedQuestSlug) {
      return;
    }
    const timer = window.setTimeout(() => {
      setCopiedQuestSlug(null);
    }, 1600);
    return () => {
      window.clearTimeout(timer);
    };
  }, [copiedQuestSlug]);

  const handleCopyEmbed = useCallback(async (questSlug: string) => {
    try {
      await copyToClipboard(`@quest/${questSlug}`);
      setCopiedQuestSlug(questSlug);
      setCopyError(null);
    } catch {
      setCopyError(`Could not copy @quest/${questSlug}.`);
    }
  }, []);

  const handleDelete = useCallback(
    (questSlug: string, title: string): void => {
      if (!onDeleteQuest || !editable) {
        return;
      }
      onDeleteQuest(questSlug, title);
    },
    [editable, onDeleteQuest],
  );

  return (
    <div className="stack gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Text variant="h3" color="iron">
            Quests
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            Open a quest to edit its title, summary, title art, and markdown
            brief.
          </Text>
        </div>
        <Button
          color="gold"
          onClick={onCreate}
          disabled={!editable || creating}
        >
          {creating ? "Creating..." : "Create Quest"}
        </Button>
      </div>

      <TextField
        label="Search Quests"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        placeholder="Search quests by title, description, or slug..."
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

      {filteredQuests.length === 0 ? (
        <Panel>
          <Text variant="body" color="iron-light">
            {quests.length === 0
              ? "No quests have been created yet."
              : "No quests match your search."}
          </Text>
        </Panel>
      ) : (
        <div className="flex flex-row flex-wrap items-start gap-4">
          {filteredQuests.map((quest) => (
            <Panel
              key={quest.fragmentId}
              className="self-start"
              contentClassName="stack gap-3"
            >
              <button
                type="button"
                className="stack gap-3 text-left"
                onClick={() => onOpenQuest(quest.questSlug)}
              >
                <QuestCardView quest={quest} />
                <div className="stack gap-1">
                  <Text variant="note" color="steel-dark">
                    {`@quest/${quest.questSlug}`}
                  </Text>
                  <Text variant="body" color="iron-light" className="text-sm">
                    {quest.summary?.trim().length
                      ? quest.summary
                      : "No summary yet."}
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
                      void handleCopyEmbed(quest.questSlug);
                    }}
                  >
                    Copy Shortcode
                  </Button>
                  {onDeleteQuest ? (
                    <Button
                      variant="circle"
                      color="blood"
                      size="sm"
                      aria-label={`Delete ${quest.title}`}
                      title={`Delete ${quest.title}`}
                      disabled={!editable}
                      onClick={() => {
                        handleDelete(quest.questSlug, quest.title);
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
                    copiedQuestSlug === quest.questSlug
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
