import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdventureModuleResolvedActor } from "@mighty-decks/spec/adventureModuleAuthoring";
import { Button } from "../common/Button";
import { Message } from "../common/Message";
import { Panel } from "../common/Panel";
import { Text } from "../common/Text";
import { TextField } from "../common/TextField";
import { ActorCard } from "../cards/ActorCard";

interface AdventureModuleActorsTabPanelProps {
  actors: AdventureModuleResolvedActor[];
  editable: boolean;
  creating?: boolean;
  createError?: string | null;
  onCreate: () => void;
  onOpenActor: (actorSlug: string) => void;
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

export const AdventureModuleActorsTabPanel = ({
  actors,
  editable,
  creating = false,
  createError,
  onCreate,
  onOpenActor,
}: AdventureModuleActorsTabPanelProps): JSX.Element => {
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedActorSlug, setCopiedActorSlug] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);

  const filteredActors = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
    if (!normalizedSearch) {
      return actors;
    }
    return actors.filter((actor) => {
      const haystack = `${actor.title} ${actor.summary ?? ""} ${actor.actorSlug}`.toLocaleLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [actors, searchTerm]);

  useEffect(() => {
    if (!copiedActorSlug) {
      return;
    }
    const timer = window.setTimeout(() => {
      setCopiedActorSlug(null);
    }, 1600);
    return () => {
      window.clearTimeout(timer);
    };
  }, [copiedActorSlug]);

  const handleCopyShortcode = useCallback(async (actorSlug: string) => {
    try {
      await copyToClipboard(`@actor/${actorSlug}`);
      setCopiedActorSlug(actorSlug);
      setCopyError(null);
    } catch {
      setCopyError(`Could not copy @actor/${actorSlug}.`);
    }
  }, []);

  return (
    <div className="stack gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Text variant="h3" color="iron">
            Actors
          </Text>
          <Text variant="body" color="iron-light" className="text-sm">
            Click an ActorCard to open its layered card setup and markdown body.
          </Text>
        </div>
        <Button
          color="gold"
          onClick={onCreate}
          disabled={!editable || creating}
        >
          {creating ? "Creating..." : "Create Actor"}
        </Button>
      </div>

      <TextField
        label="Search Actors"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        placeholder="Search actors by title, summary, or slug..."
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

      {filteredActors.length === 0 ? (
        <Panel>
          <Text variant="body" color="iron-light">
            {actors.length === 0
              ? "No actors have been created yet."
              : "No actors match your search."}
          </Text>
        </Panel>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredActors.map((actor) => (
            <Panel
              key={actor.fragmentId}
              className="h-full"
              contentClassName="stack h-full gap-3"
            >
              <button
                type="button"
                className="stack h-full gap-3 text-left"
                onClick={() => onOpenActor(actor.actorSlug)}
              >
                <ActorCard
                  className="mx-auto w-full max-w-[13rem] transition-transform duration-100 hover:-translate-y-0.5"
                  baseLayerSlug={actor.baseLayerSlug}
                  tacticalRoleSlug={actor.tacticalRoleSlug}
                  tacticalSpecialSlug={actor.tacticalSpecialSlug}
                />
                <div className="stack gap-1">
                  <Text variant="emphasised" color="iron">
                    {actor.title}
                  </Text>
                  <Text variant="body" color="iron-light" className="text-sm">
                    {actor.summary ?? "No summary yet."}
                  </Text>
                  <Text variant="note" color="steel-dark">
                    {`@actor/${actor.actorSlug}`}
                  </Text>
                </div>
              </button>
              <div className="mt-auto flex items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  color="cloth"
                  size="sm"
                  onClick={() => {
                    void handleCopyShortcode(actor.actorSlug);
                  }}
                >
                  Copy Shortcode
                </Button>
                <Text
                  variant="note"
                  color="monster"
                  className={copiedActorSlug === actor.actorSlug ? "opacity-100" : "opacity-0"}
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
