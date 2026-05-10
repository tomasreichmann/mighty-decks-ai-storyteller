import type { BoardBounds, BoardItemRecord } from "./boardController";

export type BoardLayoutDirection = "row" | "column";

export interface BoardLayoutPlacement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex?: number;
}

export interface BoardLayoutResult {
  placements: BoardLayoutPlacement[];
  bounds: BoardBounds;
}

export interface BoardLayoutItemBox {
  id: string;
  width: number;
  height: number;
  zIndex?: number;
}

export interface BoardLayoutGroupBox {
  layout: BoardLayoutResult;
  width?: number;
  height?: number;
}

export type BoardLayoutBox = BoardLayoutItemBox | BoardLayoutGroupBox;

export interface BoardFlexLayoutOptions {
  direction?: BoardLayoutDirection;
  x?: number;
  y?: number;
  gap?: number;
  rowGap?: number;
  columnGap?: number;
  wrapLimit?: number;
}

interface NormalizedLayoutBox {
  source: BoardLayoutBox;
  width: number;
  height: number;
}

interface LayoutLineEntry {
  box: NormalizedLayoutBox;
  mainOffset: number;
}

interface LayoutLine {
  entries: LayoutLineEntry[];
  mainSize: number;
  crossSize: number;
}

const isGroupBox = (box: BoardLayoutBox): box is BoardLayoutGroupBox =>
  "layout" in box;

const normalizeBox = (box: BoardLayoutBox): NormalizedLayoutBox => {
  if (isGroupBox(box)) {
    return {
      source: box,
      width: box.width ?? box.layout.bounds.width,
      height: box.height ?? box.layout.bounds.height,
    };
  }

  return {
    source: box,
    width: box.width,
    height: box.height,
  };
};

const getMainSize = (
  box: NormalizedLayoutBox,
  direction: BoardLayoutDirection,
): number => (direction === "row" ? box.width : box.height);

const getCrossSize = (
  box: NormalizedLayoutBox,
  direction: BoardLayoutDirection,
): number => (direction === "row" ? box.height : box.width);

const createItemPlacement = (
  item: BoardLayoutItemBox,
  x: number,
  y: number,
): BoardLayoutPlacement => {
  const placement: BoardLayoutPlacement = {
    id: item.id,
    x,
    y,
    width: item.width,
    height: item.height,
  };

  if (item.zIndex !== undefined) {
    placement.zIndex = item.zIndex;
  }

  return placement;
};

const appendBoxPlacements = (
  placements: BoardLayoutPlacement[],
  box: NormalizedLayoutBox,
  x: number,
  y: number,
): void => {
  if (!isGroupBox(box.source)) {
    placements.push(createItemPlacement(box.source, x, y));
    return;
  }

  const { layout } = box.source;
  for (const placement of layout.placements) {
    placements.push({
      ...placement,
      x: x + placement.x - layout.bounds.x,
      y: y + placement.y - layout.bounds.y,
    });
  }
};

export const flexLayout = (
  boxes: readonly BoardLayoutBox[],
  {
    direction = "row",
    x = 0,
    y = 0,
    gap = 0,
    rowGap = gap,
    columnGap = gap,
    wrapLimit,
  }: BoardFlexLayoutOptions = {},
): BoardLayoutResult => {
  const mainGap = direction === "row" ? columnGap : rowGap;
  const crossGap = direction === "row" ? rowGap : columnGap;
  const normalizedBoxes = boxes.map(normalizeBox);

  if (normalizedBoxes.length === 0) {
    return {
      placements: [],
      bounds: { x, y, width: 0, height: 0 },
    };
  }

  const lines: LayoutLine[] = [];
  let currentLine: LayoutLine = {
    entries: [],
    mainSize: 0,
    crossSize: 0,
  };

  const pushCurrentLine = (): void => {
    if (currentLine.entries.length > 0) {
      lines.push(currentLine);
      currentLine = {
        entries: [],
        mainSize: 0,
        crossSize: 0,
      };
    }
  };

  for (const box of normalizedBoxes) {
    const itemMainSize = getMainSize(box, direction);
    const itemCrossSize = getCrossSize(box, direction);
    const entryGap =
      currentLine.entries.length > 0 ? Math.max(0, mainGap) : 0;
    const nextMainSize = currentLine.mainSize + entryGap + itemMainSize;

    if (
      wrapLimit !== undefined &&
      currentLine.entries.length > 0 &&
      nextMainSize > wrapLimit
    ) {
      pushCurrentLine();
    }

    const mainOffset =
      currentLine.entries.length > 0
        ? currentLine.mainSize + Math.max(0, mainGap)
        : 0;
    currentLine.entries.push({ box, mainOffset });
    currentLine.mainSize = mainOffset + itemMainSize;
    currentLine.crossSize = Math.max(currentLine.crossSize, itemCrossSize);
  }
  pushCurrentLine();

  const placements: BoardLayoutPlacement[] = [];
  let crossOffset = 0;
  let maxMainSize = 0;

  lines.forEach((line, lineIndex) => {
    for (const entry of line.entries) {
      const placementX =
        direction === "row" ? x + entry.mainOffset : x + crossOffset;
      const placementY =
        direction === "row" ? y + crossOffset : y + entry.mainOffset;
      appendBoxPlacements(placements, entry.box, placementX, placementY);
    }

    maxMainSize = Math.max(maxMainSize, line.mainSize);
    crossOffset += line.crossSize;
    if (lineIndex < lines.length - 1) {
      crossOffset += Math.max(0, crossGap);
    }
  });

  return {
    placements,
    bounds: {
      x,
      y,
      width: direction === "row" ? maxMainSize : crossOffset,
      height: direction === "row" ? crossOffset : maxMainSize,
    },
  };
};

export const boardRecordsToLayoutItems = (
  records: Iterable<BoardItemRecord>,
  ids?: readonly string[],
): BoardLayoutItemBox[] => {
  const allRecords = Array.from(records);
  const selectedRecords = ids
    ? ids
        .map((id) => allRecords.find((record) => record.id === id))
        .filter((record): record is BoardItemRecord => Boolean(record))
    : allRecords;

  return selectedRecords.map((record) => ({
    id: record.id,
    width: record.measuredWidth ?? record.width,
    height: record.measuredHeight ?? record.height,
    zIndex: record.zIndex,
  }));
};
