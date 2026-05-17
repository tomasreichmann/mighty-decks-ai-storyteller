import type {
  BoardBounds,
  BoardItemRecord,
  BoardPoint,
  BoardSize,
} from "../board/boardController";
import { getItemBounds } from "../board/boardController";
import {
  spaceshipBoardItemId,
  spaceshipDispenserPanelSize,
} from "./spaceshipBoardLayout";

export const spaceshipTrashFrameTargetSize = 80;

export const findTopmostItemAtPoint = (
  items: readonly BoardItemRecord[],
  point: BoardPoint,
  predicate: (item: BoardItemRecord) => boolean,
): BoardItemRecord | null => {
  const matches = items.filter((item) => {
    if (!predicate(item)) {
      return false;
    }

    const bounds = getItemBounds(item);
    return (
      point.x >= bounds.x &&
      point.x <= bounds.x + bounds.width &&
      point.y >= bounds.y &&
      point.y <= bounds.y + bounds.height
    );
  });

  return matches.sort((left, right) => right.zIndex - left.zIndex)[0] ?? null;
};

export const isPointOverEnergyStack = (
  items: readonly BoardItemRecord[],
  point: BoardPoint,
): boolean =>
  Boolean(
    findTopmostItemAtPoint(
      items,
      point,
      (item) => item.id === spaceshipBoardItemId.dispenserPanel(),
    ),
  );

export const isFramePointOverTrashTarget = (
  frameSize: BoardSize,
  point: BoardPoint,
): boolean => {
  const targetBounds = getFrameTrashTargetBounds(frameSize);
  return (
    point.x >= targetBounds.x &&
    point.x <= targetBounds.x + targetBounds.width &&
    point.y >= targetBounds.y &&
    point.y <= targetBounds.y + targetBounds.height
  );
};

export const getFrameTrashTargetBounds = (
  frameSize: BoardSize,
): BoardBounds => ({
  x: 0,
  y: Math.max(0, frameSize.height - spaceshipTrashFrameTargetSize),
  width: Math.min(frameSize.width, spaceshipTrashFrameTargetSize),
  height: Math.min(frameSize.height, spaceshipTrashFrameTargetSize),
});

export const isFrameBoundsOverTrashTarget = (
  frameSize: BoardSize,
  bounds: BoardBounds,
): boolean => {
  const targetBounds = getFrameTrashTargetBounds(frameSize);
  return (
    bounds.x <= targetBounds.x + targetBounds.width &&
    bounds.x + bounds.width >= targetBounds.x &&
    bounds.y <= targetBounds.y + targetBounds.height &&
    bounds.y + bounds.height >= targetBounds.y
  );
};

export const getEnergyStackInitialItem = (): {
  id: string;
  kind: "card";
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
} => ({
  id: spaceshipBoardItemId.dispenserPanel(),
  kind: "card",
  x: 124,
  y: 124,
  width: spaceshipDispenserPanelSize.width,
  height: spaceshipDispenserPanelSize.height,
  zIndex: 900,
});
