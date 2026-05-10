import { useEffect, useMemo, useRef, type ReactNode } from "react";
import type { BoardItemRecord } from "../../lib/board/boardController";
import type { SpaceshipScene } from "../../lib/spaceship/spaceshipTypes";
import {
  createSpaceshipBoardItemMeta,
  createSpaceshipBoardItems,
  createSpaceshipBoardLayout,
  getSpaceshipBoardPaneItemIds,
  spaceshipBoardSize,
} from "../../lib/spaceship/spaceshipBoardLayout";
import { cn } from "../../utils/cn";
import { Board } from "../board/Board";
import { BoardFrame } from "../board/BoardFrame";
import { BoardProvider, useBoard } from "../board/BoardProvider";
import { Button } from "../common/Button";
import { Text } from "../common/Text";
import {
  ShipLocationCardSurface,
  ShipLocationDeviceCard,
  ShipLocationTokenRow,
} from "./ShipLocationCard";
import { ShipEffectCardSurface } from "./ShipEffectStack";
import {
  SpaceshipActorCardSurface,
  SpaceshipActorEffectSurface,
} from "./SpaceshipActorStrip";

interface SpaceshipBoardProps {
  scene: SpaceshipScene;
  actionSlot?: ReactNode;
  className?: string;
}

const SpaceshipShipHeader = ({
  pane,
}: {
  pane: SpaceshipScene["panes"][number];
}): JSX.Element => (
  <div className="spaceship-ship-header flex h-full w-full items-start">
    <div className="stack max-w-2xl gap-2">
      <Text variant="h3" color="steel-light" className="text-[1.8rem]">
        {pane.title}
      </Text>
    </div>
  </div>
);

const SpaceshipBoardItem = ({
  item,
  metaMap,
}: {
  item: BoardItemRecord;
  metaMap: ReturnType<typeof createSpaceshipBoardItemMeta>;
}): ReactNode => {
  const meta = metaMap.get(item.id);

  if (!meta) {
    return null;
  }

  switch (meta.role) {
    case "ship-header":
      return meta.pane ? <SpaceshipShipHeader pane={meta.pane} /> : null;
    case "location":
      return meta.location ? (
        <ShipLocationCardSurface location={meta.location} />
      ) : null;
    case "device":
      return meta.location ? (
        <ShipLocationDeviceCard location={meta.location} />
      ) : null;
    case "effect-card":
      return meta.effectType ? (
        <ShipEffectCardSurface effectType={meta.effectType} />
      ) : null;
    case "tokens":
      return meta.location ? (
        <ShipLocationTokenRow location={meta.location} />
      ) : null;
    case "actor-effect-card":
      return meta.actor && meta.effectType ? (
        <SpaceshipActorEffectSurface effectType={meta.effectType} />
      ) : null;
    case "actor-card":
      return meta.actor ? <SpaceshipActorCardSurface actor={meta.actor} /> : null;
    default:
      return null;
  }
};

const SpaceshipBoardCanvas = ({
  scene,
}: {
  scene: SpaceshipScene;
}): JSX.Element => {
  const controller = useBoard();
  const didInitialLayout = useRef(false);
  const didMeasuredLayout = useRef(false);
  const layout = useMemo(() => createSpaceshipBoardLayout(scene), [scene]);
  const metaMap = useMemo(() => createSpaceshipBoardItemMeta(scene), [scene]);

  useEffect(() => {
    if (didInitialLayout.current) {
      return;
    }

    didInitialLayout.current = true;
    controller.applyLayout(layout);
    window.requestAnimationFrame(() => {
      controller.fitItems(undefined, { smooth: true, durationMs: 260 });
    });
  }, [controller, layout]);

  useEffect(() => {
    if (
      !didInitialLayout.current ||
      didMeasuredLayout.current ||
      controller.items.length === 0 ||
      !controller.items.every((item) => item.measuredWidth && item.measuredHeight)
    ) {
      return;
    }

    didMeasuredLayout.current = true;
    controller.applyLayout(layout, { smooth: true, durationMs: 220 });
    controller.fitItems(undefined, { smooth: true, durationMs: 220 });
  }, [controller, controller.items, layout]);

  return (
    <Board
      renderItem={(item) => <SpaceshipBoardItem item={item} metaMap={metaMap} />}
    />
  );
};

const SpaceshipBoardControls = ({
  scene,
}: {
  scene: SpaceshipScene;
}): JSX.Element => {
  const controller = useBoard();
  const allyPaneId = scene.panes[0].paneId;
  const enemyPaneId = scene.panes[1].paneId;
  const focusOptions = { smooth: true, durationMs: 240 };

  return (
    <div className="spaceship-board-controls flex flex-wrap items-center justify-end gap-2">
      <Button
        size="sm"
        color="bone"
        onClick={() => controller.fitItems(undefined, focusOptions)}
      >
        Show All
      </Button>
      <Button
        size="sm"
        color="gold"
        onClick={() =>
          controller.fitItems(
            getSpaceshipBoardPaneItemIds(scene, allyPaneId),
            focusOptions,
          )
        }
      >
        Focus Ally Ship
      </Button>
      <Button
        size="sm"
        color="blood"
        onClick={() =>
          controller.fitItems(
            getSpaceshipBoardPaneItemIds(scene, enemyPaneId),
            focusOptions,
          )
        }
      >
        Focus Enemy Ship
      </Button>
    </div>
  );
};

const SpaceshipBoardHeader = ({
  scene,
  actionSlot,
}: {
  scene: SpaceshipScene;
  actionSlot?: ReactNode;
}): JSX.Element => {
  const { viewport } = useBoard();
  const zoomPercent = Math.round(viewport.zoom * 100);

  return (
    <div className="spaceship-board-header pointer-events-none absolute left-0 right-0 top-0 z-20 flex flex-wrap items-start justify-between gap-4 bg-[linear-gradient(180deg,rgba(18,27,35,0.72)_0%,rgba(18,27,35,0)_100%)] p-4">
      <div className="stack gap-2">
        <Text variant="h2" color="steel-light" className="text-[2.2rem]">
          {scene.title}
        </Text>
        <Text variant="note" color="steel-light" className="text-xs !opacity-100">
          Zoom {zoomPercent}%
        </Text>
      </div>

      <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
        <SpaceshipBoardControls scene={scene} />
        {actionSlot}
      </div>
    </div>
  );
};

export const SpaceshipBoard = ({
  scene,
  actionSlot,
  className,
}: SpaceshipBoardProps): JSX.Element => {
  const initialItems = useMemo(() => createSpaceshipBoardItems(scene), [scene]);

  return (
    <div
      className={cn(
        "spaceship-board relative h-screen w-full overflow-hidden",
        className,
      )}
    >
      <BoardProvider boardSize={spaceshipBoardSize} initialItems={initialItems}>
        <SpaceshipBoardHeader scene={scene} actionSlot={actionSlot} />
        <BoardFrame className="min-h-0 rounded-none border-0 bg-[#121b23] shadow-none absolute inset-0">
          <SpaceshipBoardCanvas scene={scene} />
        </BoardFrame>
      </BoardProvider>
    </div>
  );
};
