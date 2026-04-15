import { useCallback, useMemo, useState } from "react";
import type { AdventureModuleResolvedActor } from "@mighty-decks/spec/adventureModuleAuthoring";
import { Button } from "../common/Button";
import { Message } from "../common/Message";
import { Panel } from "../common/Panel";
import { Text } from "../common/Text";
import { TextField } from "../common/TextField";
import { ActorCard } from "../cards/ActorCard";
import { ShortcodeField } from "./ShortcodeField";

interface AdventureModuleActorsTabPanelProps {
  actors: AdventureModuleResolvedActor[];
  editable: boolean;
  creating?: boolean;
  createError?: string | null;
  onCreate: () => void;
  onOpenActor: (actorSlug: string) => void;
  onDeleteActor?: (actorSlug: string, title: string) => void;
  onAddActorCardToSelection?: (actorSlug: string) => void;
}

export const AdventureModuleActorsTabPanel = ({
  actors,
  editable,
  creating = false,
  createError,
  onCreate,
  onOpenActor,
  onDeleteActor,
  onAddActorCardToSelection,
}: AdventureModuleActorsTabPanelProps): JSX.Element => {
  const [searchTerm, setSearchTerm] = useState("");

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

  const handleDelete = useCallback(
    (actorSlug: string, title: string): void => {
      if (!onDeleteActor || !editable) {
        return;
      }
      onDeleteActor(actorSlug, title);
    },
    [editable, onDeleteActor],
  );

  return (
    <div className="stack gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="stack gap-1">
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
                </div>
              </button>
              <div className="mt-auto flex items-center justify-between gap-3">
                <ShortcodeField
                  shortcode={`@actor/${actor.actorSlug}`}
                  onAddToSelection={
                    onAddActorCardToSelection
                      ? () => onAddActorCardToSelection(actor.actorSlug)
                      : undefined
                  }
                />
                {onDeleteActor ? (
                  <Button
                    variant="circle"
                    color="blood"
                    size="sm"
                    aria-label={`Delete ${actor.title}`}
                    title={`Delete ${actor.title}`}
                    disabled={!editable}
                    onClick={() => {
                      handleDelete(actor.actorSlug, actor.title);
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
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
};
