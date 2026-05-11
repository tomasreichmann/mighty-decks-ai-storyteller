import { useState } from "react";
import { CardLibraryOverlay } from "../components/spaceship/CardLibraryOverlay";
import { SpaceshipBoard } from "../components/spaceship/SpaceshipBoard";
import { Button } from "../components/common/Button";
import {
  createCardLibraryOverlayState,
  toggleCardLibraryEntrySelection,
  toggleCardLibraryOpen,
} from "../lib/spaceship/spaceshipSceneState";
import { spaceshipScene } from "../lib/spaceship/spaceshipSceneData";
import { createSpaceshipDragState } from "../lib/spaceship/spaceshipDragState";

export const SpaceshipPage = (): JSX.Element => {
  const [cardLibrary, setCardLibrary] = useState(createCardLibraryOverlayState());
  const [dragState, setDragState] = useState(() =>
    createSpaceshipDragState(spaceshipScene),
  );

  return (
    <div className="spaceship-page relative min-h-full overflow-x-hidden overflow-y-auto bg-[linear-gradient(180deg,#121b23_0%,#23303d_38%,#121b23_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,210,59,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(128,160,188,0.18),transparent_22%),radial-gradient(circle_at_80%_25%,rgba(255,107,107,0.12),transparent_18%)]" />
      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_center,rgba(255,255,255,0.55)_0px,transparent_1.2px)] [background-size:28px_28px]" />

      <div className="relative z-10 flex h-screen w-full flex-col">
        <SpaceshipBoard
          scene={spaceshipScene}
          dragState={dragState}
          onDragStateChange={setDragState}
          actionSlot={
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
          }
        />
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
