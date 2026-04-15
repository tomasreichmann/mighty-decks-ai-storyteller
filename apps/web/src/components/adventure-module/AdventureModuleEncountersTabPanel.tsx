import { useCallback, useMemo, useState } from "react";
import type { AdventureModuleResolvedEncounter } from "@mighty-decks/spec/adventureModuleAuthoring";
import { Button } from "../common/Button";
import { Message } from "../common/Message";
import { Panel } from "../common/Panel";
import { Text } from "../common/Text";
import { TextField } from "../common/TextField";
import { EncounterCardView } from "./EncounterCardView";
import { ShortcodeField } from "./ShortcodeField";
import {
  AUTHORED_SCENE_ACTION_ROW_CLASS,
  AUTHORED_SCENE_PANEL_BUTTON_CLASS,
  AUTHORED_SCENE_PANEL_CLASS,
  AUTHORED_SCENE_PANEL_CONTENT_CLASS,
} from "./sceneCardSizing";

interface AdventureModuleEncountersTabPanelProps {
  encounters: AdventureModuleResolvedEncounter[];
  editable: boolean;
  creating?: boolean;
  createError?: string | null;
  onCreate: () => void;
  onOpenEncounter: (encounterSlug: string) => void;
  onDeleteEncounter?: (encounterSlug: string, title: string) => void;
  onAddEncounterCardToSelection?: (encounterSlug: string) => void;
}

export const AdventureModuleEncountersTabPanel = ({
  encounters,
  editable,
  creating = false,
  createError,
  onCreate,
  onOpenEncounter,
  onDeleteEncounter,
  onAddEncounterCardToSelection,
}: AdventureModuleEncountersTabPanelProps): JSX.Element => {
  const [searchTerm, setSearchTerm] = useState("");

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
      <div className="flex flex-wrap justify-end gap-3">
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
              className={AUTHORED_SCENE_PANEL_CLASS}
              contentClassName={AUTHORED_SCENE_PANEL_CONTENT_CLASS}
            >
              <button
                type="button"
                className={AUTHORED_SCENE_PANEL_BUTTON_CLASS}
                onClick={() => onOpenEncounter(encounter.encounterSlug)}
              >
                <EncounterCardView encounter={encounter} />
                <Text
                  variant="body"
                  color="iron-light"
                  className="text-sm break-words"
                >
                  {encounter.prerequisites.trim().length > 0
                    ? `Prerequisites: ${encounter.prerequisites}`
                    : "No prerequisites yet."}
                </Text>
              </button>
              <div className={AUTHORED_SCENE_ACTION_ROW_CLASS}>
                <ShortcodeField
                  className="flex-1"
                  shortcode={`@encounter/${encounter.encounterSlug}`}
                  onAddToSelection={
                    onAddEncounterCardToSelection
                      ? () => onAddEncounterCardToSelection(encounter.encounterSlug)
                      : undefined
                  }
                />
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
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
};
