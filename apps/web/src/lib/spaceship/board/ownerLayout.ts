import type { BoardLayoutResult } from "../../board/boardLayout";
import {
  effectCardHeight,
  effectCardWidth,
  effectHeaderOffset,
} from "./geometry";

export interface OwnerWithEffectsLayoutInput {
  ownerItemId: string;
  ownerWidth: number;
  ownerHeight: number;
  groupWidth: number;
  ownerZIndex: number;
  effectItemIds: readonly string[];
}

export const createOwnerWithEffectsLayout = ({
  ownerItemId,
  ownerWidth,
  ownerHeight,
  groupWidth,
  ownerZIndex,
  effectItemIds,
}: OwnerWithEffectsLayoutInput): BoardLayoutResult => {
  const effectPeek =
    effectItemIds.length > 0
      ? Math.max(effectHeaderOffset, effectCardHeight - ownerHeight)
      : 0;
  const ownerYOffset =
    effectItemIds.length > 0
      ? effectPeek + (effectItemIds.length - 1) * effectHeaderOffset
      : 0;
  const placements: BoardLayoutResult["placements"] = [];
  const ownerX = (groupWidth - ownerWidth) / 2;

  effectItemIds.forEach((effectItemId, stackIndex) => {
    placements.push({
      id: effectItemId,
      x: (groupWidth - effectCardWidth) / 2,
      y: ownerYOffset - effectPeek - stackIndex * effectHeaderOffset,
      width: effectCardWidth,
      height: effectCardHeight,
      zIndex: ownerZIndex - stackIndex - 1,
    });
  });

  placements.push({
    id: ownerItemId,
    x: ownerX,
    y: ownerYOffset,
    width: ownerWidth,
    height: ownerHeight,
    zIndex: ownerZIndex,
  });

  return {
    placements,
    bounds: {
      x: 0,
      y: 0,
      width: groupWidth,
      height: ownerYOffset + ownerHeight,
    },
  };
};

export const appendLayoutAt = (
  target: BoardLayoutResult["placements"],
  layout: BoardLayoutResult,
  x: number,
  y: number,
): void => {
  layout.placements.forEach((placement) => {
    target.push({
      ...placement,
      x: x + placement.x - layout.bounds.x,
      y: y + placement.y - layout.bounds.y,
    });
  });
};

