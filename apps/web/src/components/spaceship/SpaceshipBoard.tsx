import {
  useCallback,
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
  ShipEffectType,
  SpaceshipDragState,
  SpaceshipScene,
} from "../../lib/spaceship/spaceshipTypes";
import type { BoardBounds, BoardPoint } from "../../lib/board/boardController";
import { worldToFrame } from "../../lib/board/boardController";
import {
  applySpaceshipCardLiveSnap,
  beginDispenserPanelDrag,
  beginSpaceshipCardDrag,
  beginSpaceshipEffectDispenserCardDrag,
  beginEnergyStackTokenDrag,
  beginSpaceshipTokenDrag,
  didSpaceshipCardLayoutDragExceedTearOffDistance,
  dropSpaceshipCardOnBoard,
  dropSpaceshipCardOnTrashTarget,
  dropSpaceshipTokenOnBoard,
  dropSpaceshipTokenOnCard,
  dropSpaceshipTokenOnEnergyStack,
  dropSpaceshipTokenOnTrashTarget,
  findTopmostItemAtPoint,
  getFrameTrashTargetBounds,
  isFrameBoundsOverTrashTarget,
  isFramePointOverTrashTarget,
  isSpaceshipCardLayoutTearOffBlocked,
  isSpaceshipCardSnapInsertBlocked,
  isPointOverEnergyStack,
  moveSpaceshipCardFromDragOrigin,
  moveDispenserPanelFromDragOrigin,
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
const spaceshipTrashDebug = false;

const removeBoardItems = (
  controller: ReturnType<typeof useBoard>,
  itemIds: readonly string[],
): void => {
  itemIds.forEach((itemId) => controller.removeItem(itemId));
};

const getFrameBounds = (
  item: { x: number; y: number; width: number; height: number },
  viewport: ReturnType<typeof useBoard>["viewport"],
): BoardBounds => {
  const topLeft = worldToFrame({ x: item.x, y: item.y }, viewport);
  return {
    x: topLeft.x,
    y: topLeft.y,
    width: item.width * viewport.zoom,
    height: item.height * viewport.zoom,
  };
};

const getTrashHitState = ({
  frameSize,
  pointerFramePoint,
  itemFrameBounds,
}: {
  frameSize: { width: number; height: number };
  pointerFramePoint: BoardPoint;
  itemFrameBounds: BoardBounds | null;
}): {
  active: boolean;
  pointHit: boolean;
  boundsHit: boolean;
  targetBounds: BoardBounds;
} => {
  const targetBounds = getFrameTrashTargetBounds(frameSize);
  const pointHit = isFramePointOverTrashTarget(frameSize, pointerFramePoint);
  const boundsHit = itemFrameBounds
    ? isFrameBoundsOverTrashTarget(frameSize, itemFrameBounds)
    : false;
  return {
    active: pointHit || boundsHit,
    pointHit,
    boundsHit,
    targetBounds,
  };
};

const debugSpaceshipTrashHit = (
  phase: "hover" | "drop",
  details: {
    kind: "card" | "token";
    id: string;
    frameSize: { width: number; height: number };
    pointerFramePoint: BoardPoint;
    itemFrameBounds: BoardBounds | null;
    targetBounds: BoardBounds;
    pointHit: boolean;
    boundsHit: boolean;
    active: boolean;
  },
): void => {
  if (!spaceshipTrashDebug) {
    return;
  }

  console.debug("[spaceship-trash]", {
    phase,
    ...details,
  });
};

const TrashIcon = (): JSX.Element => (
  <svg
    viewBox="0 0 24 24"
    className="h-7 w-7 fill-none stroke-current"
    strokeWidth={1.8}
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
);

const SpaceshipTrashFrameTarget = ({
  active,
  dragging,
}: {
  active: boolean;
  dragging: boolean;
}): JSX.Element => (
  <div
    role="img"
    aria-label="Trash drop area"
    className={cn(
      "spaceship-trash-frame-target absolute bottom-0 left-0 z-30 flex h-20 w-20 items-end justify-start bg-[radial-gradient(circle_at_26px_calc(100%-26px),rgba(148,28,43,0.46)_0_17px,rgba(148,28,43,0.22)_26px,rgba(148,28,43,0)_36px)] p-3 text-kac-curse-lightest opacity-0 transition duration-100 hover:bg-[radial-gradient(circle_at_26px_calc(100%-26px),rgba(202,38,58,0.72)_0_17px,rgba(148,28,43,0.42)_26px,rgba(148,28,43,0)_36px)] hover:opacity-90",
      dragging ? "pointer-events-auto opacity-40" : "pointer-events-none",
      active
        ? "bg-[radial-gradient(circle_at_26px_calc(100%-26px),rgba(202,38,58,0.76)_0_17px,rgba(148,28,43,0.46)_26px,rgba(148,28,43,0)_36px)] opacity-100"
        : null,
    )}
  >
    <div
      className={cn(
        "transition duration-100",
        active ? "scale-110 opacity-90" : "opacity-45",
      )}
    >
      <TrashIcon />
    </div>
  </div>
);

const SpaceshipBoardCanvas = ({
  scene,
  dragState,
  onDragStateChange,
  onItemDragActiveChange,
  onTrashTargetActiveChange,
  getFramePoint,
}: {
  scene: SpaceshipScene;
  dragState: SpaceshipDragState;
  onDragStateChange: Dispatch<SetStateAction<SpaceshipDragState>>;
  onItemDragActiveChange: (active: boolean) => void;
  onTrashTargetActiveChange: (active: boolean) => void;
  getFramePoint: (point: { clientX: number; clientY: number }) => BoardPoint;
}): JSX.Element => {
  const controller = useBoard();
  const didInitialLayout = useRef(false);
  const didMeasuredLayout = useRef(false);
  const dragStateRef = useRef(dragState);
  const [activeCardItemId, setActiveCardItemId] = useState<string | null>(null);
  const activeDragRef = useRef<
    | {
        kind: "dispenser-panel";
        pointerId: number;
        startClientX: number;
        startClientY: number;
        startX: number;
        startY: number;
        zoom: number;
      }
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
  const layoutItemIds = useMemo(
    () => layout.placements.map((placement) => placement.id),
    [layout],
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
      controller.fitItems(layoutItemIds, { smooth: true, durationMs: 260 });
    });
  }, [controller, layout, layoutItemIds]);

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
    controller.fitItems(layoutItemIds, { smooth: true, durationMs: 220 });
  }, [controller, controller.items, layout, layoutItemIds]);

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
    onTrashTargetActiveChange(false);
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
    onTrashTargetActiveChange(false);
    onItemDragActiveChange(true);
  };

  const onDispenserPanelHandlePointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ): void => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const snapshot = controller.getSnapshot();
    const result = beginDispenserPanelDrag(dragStateRef.current);
    dragStateRef.current = result.state;
    onDragStateChange(result.state);
    activeDragRef.current = {
      kind: "dispenser-panel",
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: result.state.dispenserPanel.x,
      startY: result.state.dispenserPanel.y,
      zoom: snapshot.viewport.zoom,
    };
    setActiveCardItemId(null);
    onTrashTargetActiveChange(false);
    onItemDragActiveChange(true);
  };

  const onEnergyDispenserPointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ): void => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const snapshot = controller.getSnapshot();
    const framePoint = getFramePoint({
      clientX: event.clientX,
      clientY: event.clientY,
    });
    const spawnPoint = controller.frameToWorld(framePoint);
    const result = beginEnergyStackTokenDrag(dragStateRef.current, spawnPoint);
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
      startX: spawnPoint.x,
      startY: spawnPoint.y,
      zoom: snapshot.viewport.zoom,
    };
    setActiveCardItemId(null);
    onTrashTargetActiveChange(false);
    onItemDragActiveChange(true);
  };

  const onEffectDispenserPointerDown = (
    effectType: ShipEffectType,
    event: ReactPointerEvent<HTMLButtonElement>,
  ): void => {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    const snapshot = controller.getSnapshot();
    const framePoint = getFramePoint({
      clientX: event.clientX,
      clientY: event.clientY,
    });
    const spawnPoint = controller.frameToWorld(framePoint);
    const result = beginSpaceshipEffectDispenserCardDrag(
      dragStateRef.current,
      effectType,
      spawnPoint,
    );
    const card = result.state.cards.find(
      (candidate) => candidate.itemId === result.dragItemId,
    );
    if (!card) {
      return;
    }

    controller.upsertItem({
      id: result.dragItemId,
      kind: "card",
      x: card.x,
      y: card.y,
      width: card.width,
      height: card.height,
      zIndex: card.zIndex,
    });
    dragStateRef.current = result.state;
    onDragStateChange(result.state);
    activeDragRef.current = {
      kind: "card",
      itemId: result.dragItemId,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: card.x,
      startY: card.y,
      zoom: snapshot.viewport.zoom,
      mode: "free",
      layoutAnchorClientX: event.clientX,
      layoutAnchorClientY: event.clientY,
      snapBlockedUntilMs: null,
      tearOffBlockedUntilMs: null,
    };
    setActiveCardItemId(result.dragItemId);
    onTrashTargetActiveChange(false);
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

      if (activeDrag.kind === "dispenser-panel") {
        const moved = moveDispenserPanelFromDragOrigin(
          dragStateRef.current,
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
        return;
      }

      if (activeDrag.kind === "card") {
        const pointerFramePoint = getFramePoint({
          clientX: event.clientX,
          clientY: event.clientY,
        });
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
            const snapshot = controller.getSnapshot();
            const trashHit = getTrashHitState({
              frameSize: snapshot.frameSize,
              pointerFramePoint,
              itemFrameBounds: null,
            });
            debugSpaceshipTrashHit("hover", {
              kind: "card",
              id: activeDrag.itemId,
              frameSize: snapshot.frameSize,
              pointerFramePoint,
              itemFrameBounds: null,
              ...trashHit,
            });
            onTrashTargetActiveChange(trashHit.active);
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
        const snapshot = controller.getSnapshot();
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
                snapshot.items,
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
        const itemFrameBounds = nextCard
          ? getFrameBounds(nextCard, snapshot.viewport)
          : null;
        const trashHit = getTrashHitState({
          frameSize: snapshot.frameSize,
          pointerFramePoint,
          itemFrameBounds,
        });
        debugSpaceshipTrashHit("hover", {
          kind: "card",
          id: activeDrag.itemId,
          frameSize: snapshot.frameSize,
          pointerFramePoint,
          itemFrameBounds,
          ...trashHit,
        });
        onTrashTargetActiveChange(trashHit.active);
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
      const snapshot = controller.getSnapshot();
      const token = moved.tokens.find(
        (candidate) => candidate.tokenId === activeDrag.tokenId,
      );
      const tokenFramePoint = getFramePoint({
        clientX: event.clientX,
        clientY: event.clientY,
      });
      const itemFrameBounds = token
        ? getFrameBounds(token, snapshot.viewport)
        : null;
      const trashHit = getTrashHitState({
        frameSize: snapshot.frameSize,
        pointerFramePoint: tokenFramePoint,
        itemFrameBounds,
      });
      debugSpaceshipTrashHit("hover", {
        kind: "token",
        id: activeDrag.tokenId,
        frameSize: snapshot.frameSize,
        pointerFramePoint: tokenFramePoint,
        itemFrameBounds,
        ...trashHit,
      });
      onTrashTargetActiveChange(trashHit.active);
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
      onTrashTargetActiveChange(false);
      setActiveCardItemId(null);
      const snapshot = controller.getSnapshot();
      const dropFramePoint = getFramePoint({
        clientX: event.clientX,
        clientY: event.clientY,
      });
      const syncedCards = syncSpaceshipCardPositions(
        dragStateRef.current,
        snapshot.items,
      );
      const synced = syncSpaceshipTokenPositions(syncedCards, snapshot.items);

      if (activeDrag.kind === "dispenser-panel") {
        dragStateRef.current = synced;
        onDragStateChange(synced);
        return;
      }

      if (activeDrag.kind === "card") {
        const card = synced.cards.find(
          (candidate) => candidate.itemId === activeDrag.itemId,
        );
        const itemFrameBounds = card
          ? getFrameBounds(card, snapshot.viewport)
          : null;
        const trashHit = getTrashHitState({
          frameSize: snapshot.frameSize,
          pointerFramePoint: dropFramePoint,
          itemFrameBounds,
        });
        debugSpaceshipTrashHit("drop", {
          kind: "card",
          id: activeDrag.itemId,
          frameSize: snapshot.frameSize,
          pointerFramePoint: dropFramePoint,
          itemFrameBounds,
          ...trashHit,
        });
        if (card && trashHit.active) {
          const result = dropSpaceshipCardOnTrashTarget(
            synced,
            activeDrag.itemId,
          );
          removeBoardItems(controller, result.removedItemIds);
          dragStateRef.current = result.state;
          onDragStateChange(result.state);
          return;
        }
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
      const itemFrameBounds = getFrameBounds(token, snapshot.viewport);
      const trashHit = getTrashHitState({
        frameSize: snapshot.frameSize,
        pointerFramePoint: dropFramePoint,
        itemFrameBounds,
      });
      debugSpaceshipTrashHit("drop", {
        kind: "token",
        id: activeDrag.tokenId,
        frameSize: snapshot.frameSize,
        pointerFramePoint: dropFramePoint,
        itemFrameBounds,
        ...trashHit,
      });
      if (trashHit.active) {
        const result = dropSpaceshipTokenOnTrashTarget(
          synced,
          activeDrag.tokenId,
        );
        removeBoardItems(controller, result.removedItemIds);
        dragStateRef.current = result.state;
        onDragStateChange(result.state);
        return;
      }
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
      window.removeEventListener("wheel", handleWheelWhileDragging, {
        capture: true,
      });
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [
    controller,
    getFramePoint,
    onDragStateChange,
    onItemDragActiveChange,
    onTrashTargetActiveChange,
  ]);

  return (
      <Board
      renderItem={(item) => (
        <SpaceshipBoardItem
          item={item}
          metaMap={metaMap}
          onCardPointerDown={onCardPointerDown}
          onTokenPointerDown={onTokenPointerDown}
          onEnergyDispenserPointerDown={onEnergyDispenserPointerDown}
          onEffectDispenserPointerDown={onEffectDispenserPointerDown}
          onDispenserPanelHandlePointerDown={onDispenserPanelHandlePointerDown}
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
  const allBoardItemIds = [
    spaceshipBoardItemId.dispenserPanel(),
    ...scene.panes.flatMap((pane) =>
      getSpaceshipBoardPaneItemIds(scene, pane.paneId, dragState),
    ),
  ];

  return (
    <div className="spaceship-board-controls flex flex-wrap items-center justify-end gap-2">
      <Button
        size="sm"
        color="bone"
        onClick={() => controller.fitItems(allBoardItemIds, focusOptions)}
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
  const [isTrashTargetActive, setIsTrashTargetActive] = useState(false);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const getFramePoint = useCallback(
    ({ clientX, clientY }: { clientX: number; clientY: number }): BoardPoint => {
      const rect = frameRef.current?.getBoundingClientRect();
      return rect
        ? { x: clientX - rect.left, y: clientY - rect.top }
        : { x: clientX, y: clientY };
    },
    [],
  );
  const initialItems = useMemo(
    () => createSpaceshipBoardItems(scene, dragState),
    [dragState, scene],
  );

  return (
    <div
      ref={frameRef}
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
            onTrashTargetActiveChange={setIsTrashTargetActive}
            getFramePoint={getFramePoint}
          />
          <SpaceshipTrashFrameTarget
            active={isTrashTargetActive}
            dragging={isItemDragActive}
          />
        </BoardFrame>
      </BoardProvider>
    </div>
  );
};
