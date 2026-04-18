import { useState } from "react";
import { CardLibraryOverlay } from "../components/spaceship/CardLibraryOverlay";
import { ShipPane } from "../components/spaceship/ShipPane";
import { Button } from "../components/common/Button";
import { Label } from "../components/common/Label";
import { Text } from "../components/common/Text";
import {
  createCardLibraryOverlayState,
  toggleCardLibraryEntrySelection,
  toggleCardLibraryOpen,
} from "../lib/spaceship/spaceshipSceneState";
import { spaceshipScene } from "../lib/spaceship/spaceshipSceneData";

export const SpaceshipPage = (): JSX.Element => {
  const [cardLibrary, setCardLibrary] = useState(createCardLibraryOverlayState());

  return (
    <div className="spaceship-page relative min-h-full overflow-hidden bg-[linear-gradient(180deg,#121b23_0%,#23303d_38%,#121b23_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,210,59,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(128,160,188,0.18),transparent_22%),radial-gradient(circle_at_80%_25%,rgba(255,107,107,0.12),transparent_18%)]" />
      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_center,rgba(255,255,255,0.55)_0px,transparent_1.2px)] [background-size:28px_28px]" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 py-6 lg:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="stack gap-3">
            <Label size="lg" color="gold">
              Secret Route
            </Label>
            <div className="stack gap-2">
              <Text variant="h2" color="steel-light" className="text-[2.2rem]">
                {spaceshipScene.title}
              </Text>
              <Text variant="body" color="steel-light" className="max-w-4xl text-sm">
                {spaceshipScene.subtitle}
              </Text>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-[1rem] border-[3px] border-kac-iron bg-kac-bone-light px-3 py-2 shadow-[4px_4px_0_0_#121b23]">
              <Text variant="note" color="iron-light" className="text-xs !opacity-100">
                Milestone 1
              </Text>
              <Text variant="emphasised" color="iron" className="text-sm">
                Static mockup, local state only
              </Text>
            </div>
            <Button
              aria-label="Open card library"
              variant="circle"
              color="gold"
              size="lg"
              onClick={() =>
                setCardLibrary((current) => toggleCardLibraryOpen(current, true))
              }
            >
              +
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          {spaceshipScene.panes.map((pane) => (
            <ShipPane key={pane.paneId} pane={pane} />
          ))}
        </div>
      </div>

      <CardLibraryOverlay
        open={cardLibrary.open}
        entries={spaceshipScene.cardLibrary}
        selectedEntryIds={cardLibrary.selectedEntryIds}
        onClose={() => setCardLibrary((current) => toggleCardLibraryOpen(current, false))}
        onToggleEntry={(entryId) =>
          setCardLibrary((current) => toggleCardLibraryEntrySelection(current, entryId))
        }
      />
    </div>
  );
};
