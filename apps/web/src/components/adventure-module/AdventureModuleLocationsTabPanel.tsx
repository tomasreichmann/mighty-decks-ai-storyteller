import { useCallback, useMemo, useState } from "react";
import type { AdventureModuleResolvedLocation } from "@mighty-decks/spec/adventureModuleAuthoring";
import { Button } from "../common/Button";
import { Message } from "../common/Message";
import { Panel } from "../common/Panel";
import { ResponsiveCardGrid } from "../common/ResponsiveCardGrid";
import { SearchField } from "../common/SearchField";
import { Text } from "../common/Text";
import { LocationCardView } from "./LocationCardView";
import { ShortcodeField } from "./ShortcodeField";
import {
  AUTHORED_SCENE_ACTION_ROW_CLASS,
  AUTHORED_SCENE_PANEL_BUTTON_CLASS,
  AUTHORED_SCENE_PANEL_CLASS,
  AUTHORED_SCENE_PANEL_CONTENT_CLASS,
} from "./sceneCardSizing";

interface AdventureModuleLocationsTabPanelProps {
  locations: AdventureModuleResolvedLocation[];
  editable: boolean;
  creating?: boolean;
  createError?: string | null;
  onCreate: () => void;
  onOpenLocation: (locationSlug: string) => void;
  onDeleteLocation?: (locationSlug: string, title: string) => void;
  onAddLocationCardToSelection?: (locationSlug: string) => void;
}

export const AdventureModuleLocationsTabPanel = ({
  locations,
  editable,
  creating = false,
  createError,
  onCreate,
  onOpenLocation,
  onDeleteLocation,
  onAddLocationCardToSelection,
}: AdventureModuleLocationsTabPanelProps): JSX.Element => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLocations = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase();
    if (!normalizedSearch) {
      return locations;
    }
    return locations.filter((location) => {
      const haystack =
        `${location.title} ${location.summary ?? ""} ${location.locationSlug}`.toLocaleLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [locations, searchTerm]);

  const handleDelete = useCallback(
    (locationSlug: string, title: string): void => {
      if (!onDeleteLocation || !editable) {
        return;
      }
      onDeleteLocation(locationSlug, title);
    },
    [editable, onDeleteLocation],
  );

  return (
    <div className="stack gap-4">
      <div className="flex flex-wrap justify-end gap-3">
        <Button
          color="gold"
          onClick={onCreate}
          disabled={!editable || creating}
        >
          {creating ? "Creating..." : "Create Location"}
        </Button>
      </div>

      <SearchField
        label="Search Locations"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
        placeholder="Search locations by title, summary, or slug..."
      />

      {createError ? (
        <Message label="Create failed" color="blood">
          {createError}
        </Message>
      ) : null}

      {filteredLocations.length === 0 ? (
        <Panel>
          <Text variant="body" color="iron-light">
            {locations.length === 0
              ? "No locations have been created yet."
              : "No locations match your search."}
          </Text>
        </Panel>
      ) : (
        <ResponsiveCardGrid>
          {filteredLocations.map((location) => (
            <Panel
              key={location.fragmentId}
              className={AUTHORED_SCENE_PANEL_CLASS}
              contentClassName={AUTHORED_SCENE_PANEL_CONTENT_CLASS}
            >
              <button
                type="button"
                className={AUTHORED_SCENE_PANEL_BUTTON_CLASS}
                onClick={() => onOpenLocation(location.locationSlug)}
              >
                <LocationCardView location={location} />
              </button>
              <div className={AUTHORED_SCENE_ACTION_ROW_CLASS}>
                <ShortcodeField
                  className="flex-1"
                  shortcode={`@location/${location.locationSlug}`}
                  onAddToSelection={
                    onAddLocationCardToSelection
                      ? () => onAddLocationCardToSelection(location.locationSlug)
                      : undefined
                  }
                />
                {onDeleteLocation ? (
                  <Button
                    variant="circle"
                    color="blood"
                    size="sm"
                    aria-label={`Delete ${location.title}`}
                    title={`Delete ${location.title}`}
                    disabled={!editable}
                    onClick={() => {
                      handleDelete(location.locationSlug, location.title);
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
        </ResponsiveCardGrid>
      )}
    </div>
  );
};
