import type { BoardItemRecord, BoardPoint } from "../../board/boardController";
import { spaceshipBoardItemId } from "../board/geometry";
import { findTopmostItemAtPoint } from "./hitTesting";
import type {
  SpaceshipCardSnapTarget,
  SpaceshipDragState,
  SpaceshipDraggableCard,
  SpaceshipDraggableCardRole,
  SpaceshipLayoutMembershipState,
} from "./types";
import type {
  ShipLocationRow,
  SpaceshipScene,
} from "../scene/types";
import { insertId, removeId } from "./stateHelpers";
import { mapSpaceshipCards } from "./stateHelpers";

export const spaceshipLayoutId = {
  locationRow: (paneId: string, row: ShipLocationRow) =>
    `spaceship:location-row:${paneId}:${row}`,
  deviceColumn: (locationItemId: string) =>
    `spaceship:device-column:${locationItemId}`,
  effectStack: (ownerItemId: string) => `spaceship:effect-stack:${ownerItemId}`,
  actorRow: (paneId: string) => `spaceship:actor-row:${paneId}`,
};

export const createInitialSpaceshipLayouts = (
  scene: SpaceshipScene,
): SpaceshipLayoutMembershipState => {
  const locationRows: SpaceshipLayoutMembershipState["locationRows"] = [];
  const deviceColumns: SpaceshipLayoutMembershipState["deviceColumns"] = [];
  const effectStacks: SpaceshipLayoutMembershipState["effectStacks"] = [];
  const actorRows: SpaceshipLayoutMembershipState["actorRows"] = [];

  scene.panes.forEach((pane) => {
    (["top", "bottom"] as const).forEach((row) => {
      const itemIds = pane.locations
        .filter((location) => location.row === row)
        .sort((left, right) => left.lastTouchedOrder - right.lastTouchedOrder)
        .map((location) => spaceshipBoardItemId.location(location.locationId));
      locationRows.push({
        layoutId: spaceshipLayoutId.locationRow(pane.paneId, row),
        type: "location-row",
        paneId: pane.paneId,
        row,
        itemIds,
      });
    });

    pane.locations.forEach((location) => {
      const locationItemId = spaceshipBoardItemId.location(location.locationId);
      deviceColumns.push({
        layoutId: spaceshipLayoutId.deviceColumn(locationItemId),
        type: "device-column",
        locationItemId,
        itemIds: location.device
          ? [spaceshipBoardItemId.device(location.device.deviceId)]
          : [],
      });

      const effectIds = location.effects.flatMap((effect) =>
        Array.from({ length: effect.count }, (_, index) =>
          spaceshipBoardItemId.effectCard(effect.effectId, index),
        ),
      );
      effectStacks.push({
        layoutId: spaceshipLayoutId.effectStack(locationItemId),
        type: "effect-stack",
        ownerItemId: locationItemId,
        itemIds: effectIds,
      });

      if (location.device) {
        const deviceItemId = spaceshipBoardItemId.device(location.device.deviceId);
        effectStacks.push({
          layoutId: spaceshipLayoutId.effectStack(deviceItemId),
          type: "effect-stack",
          ownerItemId: deviceItemId,
          itemIds: [],
        });
      }
    });

    const actorIds = [...pane.actors]
      .sort((left, right) => left.lastTouchedOrder - right.lastTouchedOrder)
      .map((actor) => spaceshipBoardItemId.actorCard(actor.actorId));
    actorRows.push({
      layoutId: spaceshipLayoutId.actorRow(pane.paneId),
      type: "actor-row",
      paneId: pane.paneId,
      itemIds: actorIds,
    });

    pane.actors.forEach((actor) => {
      const actorItemId = spaceshipBoardItemId.actorCard(actor.actorId);
      const effectIds = (["injury", "distress"] as const).flatMap((effectType) =>
        Array.from(
          {
            length:
              effectType === "injury" ? actor.injuryCount : actor.distressCount,
          },
          (_, index) =>
            spaceshipBoardItemId.actorEffectCard(actor.actorId, effectType, index),
        ),
      );
      effectStacks.push({
        layoutId: spaceshipLayoutId.effectStack(actorItemId),
        type: "effect-stack",
        ownerItemId: actorItemId,
        itemIds: effectIds,
      });
    });
  });

  return {
    locationRows,
    deviceColumns,
    effectStacks,
    actorRows,
  };
};

export const findCardLayoutId = (
  layouts: SpaceshipLayoutMembershipState,
  itemId: string,
): string => {
  const locationRow = layouts.locationRows.find((layout) =>
    layout.itemIds.includes(itemId),
  );
  if (locationRow) {
    return locationRow.layoutId;
  }

  const deviceColumn = layouts.deviceColumns.find((layout) =>
    layout.itemIds.includes(itemId),
  );
  if (deviceColumn) {
    return deviceColumn.layoutId;
  }

  const effectStack = layouts.effectStacks.find((layout) =>
    layout.itemIds.includes(itemId),
  );
  if (effectStack) {
    return effectStack.layoutId;
  }

  const actorRow = layouts.actorRows.find((layout) =>
    layout.itemIds.includes(itemId),
  );
  if (actorRow) {
    return actorRow.layoutId;
  }

  return "";
};

const getCardRole = (
  state: SpaceshipDragState,
  itemId: string,
): SpaceshipDraggableCardRole | undefined =>
  state.cards.find((card) => card.itemId === itemId)?.role;

const getCard = (
  state: SpaceshipDragState,
  itemId: string,
): SpaceshipDraggableCard | undefined =>
  state.cards.find((card) => card.itemId === itemId);

export const removeSpaceshipCardFromLayouts = (
  state: SpaceshipDragState,
  itemId: string,
): SpaceshipDragState => ({
  ...mapSpaceshipCards(state, itemId, (card) => ({
    ...card,
    placement: { type: "board" },
  })),
  layouts: {
    locationRows: state.layouts.locationRows.map((layout) => ({
      ...layout,
      itemIds: removeId(layout.itemIds, itemId),
    })),
    deviceColumns: state.layouts.deviceColumns.map((layout) => ({
      ...layout,
      itemIds: removeId(layout.itemIds, itemId),
    })),
    effectStacks: state.layouts.effectStacks.map((layout) => ({
      ...layout,
      itemIds: removeId(layout.itemIds, itemId),
    })),
    actorRows: state.layouts.actorRows.map((layout) => ({
      ...layout,
      itemIds: removeId(layout.itemIds, itemId),
    })),
  },
});

export const insertSpaceshipCardIntoLayout = (
  state: SpaceshipDragState,
  itemId: string,
  target: SpaceshipCardSnapTarget,
): SpaceshipDragState => {
  const withoutItem = removeSpaceshipCardFromLayouts(state, itemId);
  const setLayoutPlacement = (nextState: SpaceshipDragState): SpaceshipDragState =>
    mapSpaceshipCards(nextState, itemId, (card) => ({
      ...card,
      placement: { type: "layout", layoutId: target.layoutId },
    }));

  if (target.type === "location-row") {
    return setLayoutPlacement({
      ...withoutItem,
      layouts: {
        ...withoutItem.layouts,
        locationRows: withoutItem.layouts.locationRows.map((layout) =>
          layout.layoutId === target.layoutId
            ? {
                ...layout,
                itemIds: insertId(layout.itemIds, itemId, target.index),
              }
            : layout,
        ),
      },
    });
  }

  if (target.type === "device-column") {
    return setLayoutPlacement({
      ...withoutItem,
      layouts: {
        ...withoutItem.layouts,
        deviceColumns: withoutItem.layouts.deviceColumns.map((layout) =>
          layout.layoutId === target.layoutId
            ? {
                ...layout,
                itemIds: insertId(layout.itemIds, itemId, target.index),
              }
            : layout,
        ),
      },
    });
  }

  if (target.type === "effect-stack") {
    const existingStack = withoutItem.layouts.effectStacks.find(
      (layout) => layout.layoutId === target.layoutId,
    );
    const nextStack = existingStack
      ? withoutItem.layouts.effectStacks.map((layout) =>
          layout.layoutId === target.layoutId
            ? {
                ...layout,
                itemIds: insertId(layout.itemIds, itemId, target.index),
              }
            : layout,
        )
      : [
          ...withoutItem.layouts.effectStacks,
          {
            layoutId: target.layoutId,
            type: "effect-stack" as const,
            ownerItemId: target.ownerItemId,
            itemIds: [itemId],
          },
        ];
    return setLayoutPlacement({
      ...withoutItem,
      layouts: {
        ...withoutItem.layouts,
        effectStacks: nextStack,
      },
    });
  }

  return setLayoutPlacement({
    ...withoutItem,
    layouts: {
      ...withoutItem.layouts,
      actorRows: withoutItem.layouts.actorRows.map((layout) =>
        layout.layoutId === target.layoutId
          ? {
              ...layout,
              itemIds: insertId(layout.itemIds, itemId, target.index),
            }
          : layout,
      ),
    },
  });
};

const findContainingLocationRow = (
  state: SpaceshipDragState,
  itemId: string,
) =>
  state.layouts.locationRows.find((layout) => layout.itemIds.includes(itemId));

const findContainingDeviceColumn = (
  state: SpaceshipDragState,
  itemId: string,
) =>
  state.layouts.deviceColumns.find((layout) => layout.itemIds.includes(itemId));

const findContainingActorRow = (
  state: SpaceshipDragState,
  itemId: string,
) => state.layouts.actorRows.find((layout) => layout.itemIds.includes(itemId));

const findEffectStackForOwner = (
  state: SpaceshipDragState,
  ownerItemId: string,
) =>
  state.layouts.effectStacks.find(
    (layout) => layout.ownerItemId === ownerItemId,
  );

const getItemCenter = (item: BoardItemRecord): BoardPoint => ({
  x: item.x + item.width / 2,
  y: item.y + item.height / 2,
});

const getRowInsertionIndex = (
  itemIds: readonly string[],
  targetItemId: string,
  targetItem: BoardItemRecord,
  point: BoardPoint,
): number => {
  const targetIndex = Math.max(0, itemIds.indexOf(targetItemId));
  return point.x < getItemCenter(targetItem).x ? targetIndex : targetIndex + 1;
};

const getColumnInsertionIndex = (
  itemIds: readonly string[],
  targetItemId: string,
  targetItem: BoardItemRecord,
  point: BoardPoint,
): number => {
  const targetIndex = Math.max(0, itemIds.indexOf(targetItemId));
  return point.y < getItemCenter(targetItem).y ? targetIndex : targetIndex + 1;
};

export const resolveSpaceshipCardSnapTarget = (
  state: SpaceshipDragState,
  items: readonly BoardItemRecord[],
  itemId: string,
  point: BoardPoint,
): SpaceshipCardSnapTarget | null => {
  const draggedRole = getCardRole(state, itemId);
  if (!draggedRole) {
    return null;
  }

  const compatibleItem = findTopmostItemAtPoint(items, point, (item) => {
    if (item.id === itemId) {
      return false;
    }

    const targetRole = getCardRole(state, item.id);
    if (!targetRole) {
      return false;
    }

    if (draggedRole === "location") {
      return targetRole === "location";
    }

    if (draggedRole === "device") {
      return targetRole === "location" || targetRole === "device";
    }

    if (draggedRole === "actor-card") {
      return targetRole === "actor-card";
    }

    return (
      targetRole === "location" ||
      targetRole === "device" ||
      targetRole === "actor-card"
    );
  });

  if (!compatibleItem) {
    return null;
  }

  const targetRole = getCardRole(state, compatibleItem.id);
  if (draggedRole === "location" && targetRole === "location") {
    const row = findContainingLocationRow(state, compatibleItem.id);
    if (!row) {
      return null;
    }
    return {
      type: "location-row",
      layoutId: row.layoutId,
      index: getRowInsertionIndex(
        removeId(row.itemIds, itemId),
        compatibleItem.id,
        compatibleItem,
        point,
      ),
    };
  }

  if (draggedRole === "device") {
    const column =
      targetRole === "device"
        ? findContainingDeviceColumn(state, compatibleItem.id)
        : state.layouts.deviceColumns.find(
            (layout) => layout.locationItemId === compatibleItem.id,
          );
    if (!column) {
      return null;
    }
    return {
      type: "device-column",
      layoutId: column.layoutId,
      index:
        targetRole === "device"
          ? getColumnInsertionIndex(
              removeId(column.itemIds, itemId),
              compatibleItem.id,
              compatibleItem,
              point,
            )
          : column.itemIds.length,
    };
  }

  if (draggedRole === "actor-card" && targetRole === "actor-card") {
    const row = findContainingActorRow(state, compatibleItem.id);
    if (!row) {
      return null;
    }
    return {
      type: "actor-row",
      layoutId: row.layoutId,
      index: getRowInsertionIndex(
        removeId(row.itemIds, itemId),
        compatibleItem.id,
        compatibleItem,
        point,
      ),
    };
  }

  if (draggedRole === "effect-card" || draggedRole === "actor-effect-card") {
    const ownerRole = getCardRole(state, compatibleItem.id);
    if (
      ownerRole !== "location" &&
      ownerRole !== "device" &&
      ownerRole !== "actor-card"
    ) {
      return null;
    }
    const stack = findEffectStackForOwner(state, compatibleItem.id);
    return {
      type: "effect-stack",
      layoutId:
        stack?.layoutId ?? spaceshipLayoutId.effectStack(compatibleItem.id),
      ownerItemId: compatibleItem.id,
      index: stack?.itemIds.length ?? 0,
    };
  }

  return null;
};

export const applySpaceshipCardLiveSnap = (
  state: SpaceshipDragState,
  itemId: string,
  items: readonly BoardItemRecord[],
  point: BoardPoint,
): SpaceshipDragState => {
  if (!getCard(state, itemId)) {
    return state;
  }

  const target = resolveSpaceshipCardSnapTarget(state, items, itemId, point);
  return target
    ? insertSpaceshipCardIntoLayout(state, itemId, target)
    : removeSpaceshipCardFromLayouts(state, itemId);
};


