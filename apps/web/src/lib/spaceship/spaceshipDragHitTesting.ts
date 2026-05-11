import type { BoardItemRecord, BoardPoint } from "../board/boardController";
import { getItemBounds } from "../board/boardController";
import {
  spaceshipBoardItemId,
  spaceshipEnergyStackSize,
} from "./spaceshipBoardLayout";

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
      (item) => item.id === spaceshipBoardItemId.energyStack(),
    ),
  );

export const getEnergyStackInitialItem = (): {
  id: string;
  kind: "card";
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
} => ({
  id: spaceshipBoardItemId.energyStack(),
  kind: "card",
  x: 4425,
  y: 180,
  width: spaceshipEnergyStackSize.width,
  height: spaceshipEnergyStackSize.height,
  zIndex: 900,
});
