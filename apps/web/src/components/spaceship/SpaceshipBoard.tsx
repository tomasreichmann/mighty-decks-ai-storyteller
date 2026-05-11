import {
  useEffect,
  useMemo,
  useRef,
  type Dispatch,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type SetStateAction,
  useState,
} from "react";
import type {
  SpaceshipDragState,
  SpaceshipScene,
} from "../../lib/spaceship/spaceshipTypes";
import {
  applySpaceshipCardLiveSnap,
  beginSpaceshipCardDrag,
  beginEnergyStackTokenDrag,
  beginSpaceshipTokenDrag,
  didSpaceshipCardLayoutDragExceedTearOffDistance,
  dropSpaceshipCardOnBoard,
  dropSpaceshipTokenOnBoard,
  dropSpaceshipTokenOnCard,
  dropSpaceshipTokenOnEnergyStack,
  findTopmostItemAtPoint,
  isSpaceshipCardLayoutTearOffBlocked,
  isSpaceshipCardSnapInsertBlocked,
  isPointOverEnergyStack,
  moveSpaceshipCardFromDragOrigin,
  moveSpaceshipTokenFromDragOrigin,
  spaceshipCardSnapInsertCooldownMs,
  syncSpaceshipCardPositions,
  syncSpaceshipTokenPositions,
} from "../../lib/spaceship/spaceshipDragState";
import {
  createSpaceshipBoardItemMeta,
  createSpaceshipBoardItems,
  createSpaceshipBoardLayout,
  getSpaceshipBoardPaneItemIds,
  isSpaceshipCardDropTargetItemId,
  spaceshipBoardSize,
  spaceshipBoardItemId,
} from "../../lib/spaceship/spaceshipBoardLayout";
import { cn } from "../../utils/cn";
import { Board } from "../board/Board";
import { BoardFrame } from "../board/BoardFrame";
import { BoardProvider, useBoard } from "../board/BoardProvider";
import { Button } from "../common/Button";
import { Text } from "../common/Text";
import { SpaceshipBoardItem } from "./SpaceshipBoardItem";

interface SpaceshipBoardProps {
  scene: SpaceshipScene;
  dragState: SpaceshipDragState;
  onDragStateChange: Dispatch<SetStateAction<SpaceshipDragState>>;
  actionSlot?: ReactNode;
  className?: string;
}

const spaceshipLayoutReflowTransitionDurationMs = 90;

const SpaceshipBoardCanvas = ({
  scene,
  dragState,
  onDragStateChange,
  onItemDragActiveChange,
}: {
  scene: SpaceshipScene;
  dragState: SpaceshipDragState;
  onDragStateChange: Dispatch<SetStateAction<SpaceshipDragState>>;
  onItemDragActiveChange: (active: boolean) => void;
}): JSX.Element => {
  const controller = useBoard();
  const didInitialLayout = useRef(false);
  const didMeasuredLayout = useRef(false);
  const dragStateRef = useRef(dragState);
  const [activeCardItemId, setActiveCardItemId] = useState<string | null>(null);
  const activeDragRef = useRef<
    | {
        kind: "token";
        tokenId: string;
        pointerId: number;
        startClientX: number;
        startClientY: number;
        startX: number;
        startY: number;
        zoom: number;
      }
    | {
        kind: "card";
        itemId: string;
        pointerId: number;
        startClientX: number;
        startClientY: number;
        startX: number;
        startY: number;
        zoom: number;
        mode: "layout" | "free";
        layoutAnchorClientX: number;
        layoutAnchorClientY: number;
        snapBlockedUntilMs: number | null;
        tearOffBlockedUntilMs: number | null;
      }
    | null
  >(null);
  const layout = useMemo(
    () =>
      createSpaceshipBoardLayout(scene, dragState, {
        activeCardItemId,
      }),
    [activeCardItemId, dragState, scene],
  );
  const metaMap = useMemo(
    () => createSpaceshipBoardItemMeta(scene, dragState),
    [dragState, scene],
  );

  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

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

  useEffect(() => {
    const shouldAnimateLayoutReflow =
      activeDragRef.current?.kind === "card" &&
      activeDragRef.current.mode === "layout" &&
      activeCardItemId === null;
    controller.applyLayout(
      layout,
      shouldAnimateLayoutReflow
        ? {
            smooth: true,
            durationMs: spaceshipLayoutReflowTransitionDurationMs,
          }
        : undefined,
    );
    const placementsById = new Map(
      layout.placements.map((placement) => [placement.id, placement]),
    );
    dragState.tokens.forEach((token) => {
      const placement = placementsById.get(spaceshipBoardItemId.token(token.tokenId));
      controller.upsertItem({
        id: spaceshipBoardItemId.token(token.tokenId),
        kind: "card",
        x: placement?.x ?? token.x,
        y: placement?.y ?? token.y,
        width: placement?.width ?? token.width,
        height: placement?.height ?? token.height,
        zIndex: placement?.zIndex ?? token.zIndex,
      });
    });
  }, [activeCardItemId, controller, dragState, layout]);

  const onCardPointerDown = (
    itemId: string,
    event: ReactPointerEvent<HTMLDivElement>,
  ): void => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const snapshot = controller.getSnapshot();
    const syncedCards = syncSpaceshipCardPositions(
      dragStateRef.current,
      snapshot.items,
    );
    const synced = syncSpaceshipTokenPositions(syncedCards, snapshot.items);
    const result = beginSpaceshipCardDrag(synced, itemId);
    const card = result.state.cards.find(
      (candidate) => candidate.itemId === itemId,
    );
    if (!card) {
      return;
    }
    dragStateRef.current = result.state;
    onDragStateChange(result.state);
    setActiveCardItemId(card.placement.type === "layout" ? null : itemId);
    activeDragRef.current = {
      kind: "card",
      itemId,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: card.x,
      startY: card.y,
      zoom: snapshot.viewport.zoom,
      mode: card.placement.type === "layout" ? "layout" : "free",
      layoutAnchorClientX: event.clientX,
      layoutAnchorClientY: event.clientY,
      snapBlockedUntilMs: null,
      tearOffBlockedUntilMs: null,
    };
    onItemDragActiveChange(true);
  };

  const onTokenPointerDown = (
    tokenId: string,
    event: ReactPointerEvent<HTMLDivElement>,
  ): void => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const snapshot = controller.getSnapshot();
    const synced = syncSpaceshipTokenPositions(dragStateRef.current, snapshot.items);
    const result = beginSpaceshipTokenDrag(synced, tokenId);
    const token = result.state.tokens.find(
      (candidate) => candidate.tokenId === tokenId,
    );
    if (!token) {
      return;
    }
    dragStateRef.current = result.state;
    onDragStateChange(result.state);
    activeDragRef.current = {
      kind: "token",
      tokenId,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: token.x,
      startY: token.y,
      zoom: snapshot.viewport.zoom,
    };
    setActiveCardItemId(null);
    onItemDragActiveChange(true);
  };

  const onEnergyStackPointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ): void => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const snapshot = controller.getSnapshot();
    const stack = snapshot.items.find(
      (item) => item.id === spaceshipBoardItemId.energyStack(),
    );
    const result = beginEnergyStackTokenDrag(dragStateRef.current, {
      x: stack ? stack.x + 35 : 0,
      y: stack ? stack.y + 35 : 0,
    });
    dragStateRef.current = result.state;
    onDragStateChange(result.state);

    if (!result.dragTokenId) {
      return;
    }

    activeDragRef.current = {
      kind: "token",
      tokenId: result.dragTokenId,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: stack ? stack.x + 35 : 0,
      startY: stack ? stack.y + 35 : 0,
      zoom: snapshot.viewport.zoom,
    };
    setActiveCardItemId(null);
    onItemDragActiveChange(true);
  };

  useEffect(() => {
    const handleWheelWhileDragging = (event: WheelEvent): void => {
      if (!activeDragRef.current) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
    };

    const handlePointerMove = (event: PointerEvent): void => {
      const activeDrag = activeDragRef.current;
      if (!activeDrag || activeDrag.pointerId !== event.pointerId) {
        return;
      }

      if (activeDrag.kind === "card") {
        if (activeDrag.mode === "layout") {
          if (
            isSpaceshipCardLayoutTearOffBlocked(
              event.timeStamp,
              activeDrag.tearOffBlockedUntilMs,
            ) ||
            !didSpaceshipCardLayoutDragExceedTearOffDistance({
              anchorClientX: activeDrag.layoutAnchorClientX,
              anchorClientY: activeDrag.layoutAnchorClientY,
              clientX: event.clientX,
              clientY: event.clientY,
            })
          ) {
            setActiveCardItemId(null);
            return;
          }

          activeDrag.mode = "free";
          activeDrag.snapBlockedUntilMs =
            event.timeStamp + spaceshipCardSnapInsertCooldownMs;
          activeDrag.tearOffBlockedUntilMs = null;
          setActiveCardItemId(activeDrag.itemId);
        }

        const dragOrigin = {
          startX: activeDrag.startX,
          startY: activeDrag.startY,
          startClientX: activeDrag.startClientX,
          startClientY: activeDrag.startClientY,
          clientX: event.clientX,
          clientY: event.clientY,
          zoom: activeDrag.zoom,
        };
        const moved = moveSpaceshipCardFromDragOrigin(
          dragStateRef.current,
          activeDrag.itemId,
          dragOrigin,
        );
        const card = moved.cards.find(
          (candidate) => candidate.itemId === activeDrag.itemId,
        );
        const isSnapBlocked = isSpaceshipCardSnapInsertBlocked(
          event.timeStamp,
          activeDrag.snapBlockedUntilMs,
        );
        const nextState =
          card && !isSnapBlocked
            ? applySpaceshipCardLiveSnap(
                moved,
                activeDrag.itemId,
                controller.getSnapshot().items,
                {
                  x: card.x + card.width / 2,
                  y: card.y + card.height / 2,
                },
              )
            : moved;
        const nextCard = nextState.cards.find(
          (candidate) => candidate.itemId === activeDrag.itemId,
        );
        if (nextCard?.placement.type === "layout") {
          activeDrag.mode = "layout";
          activeDrag.layoutAnchorClientX = event.clientX;
          activeDrag.layoutAnchorClientY = event.clientY;
          activeDrag.snapBlockedUntilMs = null;
          activeDrag.tearOffBlockedUntilMs =
            event.timeStamp + spaceshipCardSnapInsertCooldownMs;
          setActiveCardItemId(null);
        } else {
          setActiveCardItemId(activeDrag.itemId);
        }
        dragStateRef.current = nextState;
        onDragStateChange(nextState);
        return;
      }

      const moved = moveSpaceshipTokenFromDragOrigin(
        dragStateRef.current,
        activeDrag.tokenId,
        {
          startX: activeDrag.startX,
          startY: activeDrag.startY,
          startClientX: activeDrag.startClientX,
          startClientY: activeDrag.startClientY,
          clientX: event.clientX,
          clientY: event.clientY,
          zoom: activeDrag.zoom,
        },
      );
      dragStateRef.current = moved;
      onDragStateChange(moved);
    };

    const handlePointerUp = (event: PointerEvent): void => {
      const activeDrag = activeDragRef.current;
      if (!activeDrag || activeDrag.pointerId !== event.pointerId) {
        return;
      }

      activeDragRef.current = null;
      onItemDragActiveChange(false);
      setActiveCardItemId(null);
      const snapshot = controller.getSnapshot();
      const syncedCards = syncSpaceshipCardPositions(
        dragStateRef.current,
        snapshot.items,
      );
      const synced = syncSpaceshipTokenPositions(syncedCards, snapshot.items);

      if (activeDrag.kind === "card") {
        const card = synced.cards.find(
          (candidate) => candidate.itemId === activeDrag.itemId,
        );
        const nextState =
          card?.placement.type === "layout"
            ? synced
            : dropSpaceshipCardOnBoard(synced, activeDrag.itemId);
        dragStateRef.current = nextState;
        onDragStateChange(nextState);
        return;
      }

      const token = synced.tokens.find(
        (candidate) => candidate.tokenId === activeDrag.tokenId,
      );

      if (!token) {
        return;
      }

      const tokenCenter = {
        x: token.x + token.width / 2,
        y: token.y + token.height / 2,
      };
      const isEnergyStackDrop =
        token.kind === "energy" &&
        isPointOverEnergyStack(snapshot.items, tokenCenter);

      let nextState: SpaceshipDragState;
      if (isEnergyStackDrop) {
        nextState = dropSpaceshipTokenOnEnergyStack(synced, token.tokenId);
        controller.removeItem(spaceshipBoardItemId.token(token.tokenId));
      } else {
        const cardTarget = findTopmostItemAtPoint(
          snapshot.items,
          tokenCenter,
          (item) => isSpaceshipCardDropTargetItemId(item.id),
        );
        nextState = cardTarget
          ? dropSpaceshipTokenOnCard(synced, token.tokenId, cardTarget.id, {
              x: cardTarget.x,
              y: cardTarget.y,
            })
          : dropSpaceshipTokenOnBoard(synced, token.tokenId);
      }

      dragStateRef.current = nextState;
      onDragStateChange(nextState);
    };

    window.addEventListener("wheel", handleWheelWhileDragging, {
      capture: true,
      passive: false,
    });
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    return () => {
      if (activeDragRef.current) {
        onItemDragActiveChange(false);
        setActiveCardItemId(null);
      }
      window.removeEventListener("wheel", handleWheelWhileDragging, {
        capture: true,
      });
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [controller, onDragStateChange, onItemDragActiveChange]);

  return (
    <Board
      renderItem={(item) => (
        <SpaceshipBoardItem
          item={item}
          metaMap={metaMap}
          dragState={dragState}
          onCardPointerDown={onCardPointerDown}
          onTokenPointerDown={onTokenPointerDown}
          onEnergyStackPointerDown={onEnergyStackPointerDown}
        />
      )}
    />
  );
};

const SpaceshipBoardControls = ({
  scene,
  dragState,
}: {
  scene: SpaceshipScene;
  dragState: SpaceshipDragState;
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
            getSpaceshipBoardPaneItemIds(scene, allyPaneId, dragState),
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
            getSpaceshipBoardPaneItemIds(scene, enemyPaneId, dragState),
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
  dragState,
  actionSlot,
}: {
  scene: SpaceshipScene;
  dragState: SpaceshipDragState;
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
        <SpaceshipBoardControls scene={scene} dragState={dragState} />
        {actionSlot}
      </div>
    </div>
  );
};

export const SpaceshipBoard = ({
  scene,
  dragState,
  onDragStateChange,
  actionSlot,
  className,
}: SpaceshipBoardProps): JSX.Element => {
  const [isItemDragActive, setIsItemDragActive] = useState(false);
  const initialItems = useMemo(
    () => createSpaceshipBoardItems(scene, dragState),
    [dragState, scene],
  );

  return (
    <div
      className={cn(
        "spaceship-board relative h-screen w-full overflow-hidden",
        className,
      )}
    >
      <BoardProvider boardSize={spaceshipBoardSize} initialItems={initialItems}>
        <SpaceshipBoardHeader
          scene={scene}
          dragState={dragState}
          actionSlot={actionSlot}
        />
        <BoardFrame
          className="min-h-0 rounded-none border-0 bg-[#121b23] shadow-none absolute inset-0"
          disableWheelZoom={isItemDragActive}
        >
          <SpaceshipBoardCanvas
            scene={scene}
            dragState={dragState}
            onDragStateChange={onDragStateChange}
            onItemDragActiveChange={setIsItemDragActive}
          />
        </BoardFrame>
      </BoardProvider>
    </div>
  );
};
