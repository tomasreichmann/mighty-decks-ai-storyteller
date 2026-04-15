import { useCallback, useMemo, useState } from "react";
import type { AdventureModuleResolvedLocation } from "@mighty-decks/spec/adventureModuleAuthoring";
import { Button } from "../common/Button";
import { Message } from "../common/Message";
import { Panel } from "../common/Panel";
import { Text } from "../common/Text";
import { TextField } from "../common/TextField";
import { LocationCardView } from "./LocationCardView";
import { ShortcodeField } from "./ShortcodeField";

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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="stack gap-1">
          <Text variant="body" color="iron-light" className="text-sm">
            Open a location to edit its flavor text, GM notes, title image, and
            interactive map pins.
          </Text>
        </div>
        <Button
          color="gold"
          onClick={onCreate}
          disabled={!editable || creating}
        >
          {creating ? "Creating..." : "Create Location"}
        </Button>
      </div>

      <TextField
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
        <div className="flex flex-row flex-wrap items-start gap-4">
          {filteredLocations.map((location) => (
            <Panel
              key={location.fragmentId}
              className="self-start"
              contentClassName="stack gap-3"
            >
              <button
                type="button"
                className="stack gap-3 text-left"
                onClick={() => onOpenLocation(location.locationSlug)}
              >
                <LocationCardView location={location} />
              </button>
              <div className="flex items-center justify-between gap-3">
                <ShortcodeField
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
        </div>
      )}
    </div>
  );
};
