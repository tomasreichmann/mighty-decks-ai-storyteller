import type {
  BoardBounds,
  BoardItemRecord,
  BoardPoint,
} from "./boardController";

export type BoardLayoutDirection = "row" | "column";
export type BoardStackAlign =
  | "top-left"
  | "top"
  | "top-right"
  | "right"
  | "bottom-right"
  | "bottom"
  | "bottom-left"
  | "left"
  | "center";

export interface BoardLayoutPlacement {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex?: number;
  rotation?: number;
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
  rotation?: number;
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

export type BoardStackRotations =
  | readonly number[]
  | Record<string, number>
  | ((item: BoardLayoutBox, index: number) => number | undefined);

export interface BoardStackLayoutOptions {
  x?: number;
  y?: number;
  align?: BoardStackAlign;
  offset?: BoardPoint;
  itemOffsets?: Record<string, BoardPoint>;
  rotations?: BoardStackRotations;
  zIndexStart?: number;
  zIndexStep?: number;
}

export interface BoardDeckLayoutOptions
  extends Omit<BoardStackLayoutOptions, "offset" | "rotations"> {
  offset?: BoardPoint;
}

export interface BoardPileLayoutOptions
  extends Omit<BoardStackLayoutOptions, "offset" | "rotations"> {
  maxRotation?: number;
  rotations?: BoardStackRotations;
}

export interface BoardFanLayoutOptions {
  x?: number;
  y?: number;
  overlap?: number;
  arcAngle?: number;
  zIndexStart?: number;
  zIndexStep?: number;
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

const getBoxId = (box: BoardLayoutBox): string | null =>
  isGroupBox(box) ? null : box.id;

const getAlignedOffset = (
  box: NormalizedLayoutBox,
  maxSize: { width: number; height: number },
  align: BoardStackAlign,
): BoardPoint => {
  const centerX = (maxSize.width - box.width) / 2;
  const centerY = (maxSize.height - box.height) / 2;
  const right = maxSize.width - box.width;
  const bottom = maxSize.height - box.height;

  switch (align) {
    case "top":
      return { x: centerX, y: 0 };
    case "top-right":
      return { x: right, y: 0 };
    case "right":
      return { x: right, y: centerY };
    case "bottom-right":
      return { x: right, y: bottom };
    case "bottom":
      return { x: centerX, y: bottom };
    case "bottom-left":
      return { x: 0, y: bottom };
    case "left":
      return { x: 0, y: centerY };
    case "center":
      return { x: centerX, y: centerY };
    case "top-left":
    default:
      return { x: 0, y: 0 };
  }
};

const getItemOffset = (
  box: BoardLayoutBox,
  itemOffsets: Record<string, BoardPoint> | undefined,
): BoardPoint => {
  const id = getBoxId(box);
  return id && itemOffsets?.[id] ? itemOffsets[id] : { x: 0, y: 0 };
};

const resolveStackRotation = (
  box: BoardLayoutBox,
  index: number,
  rotations: BoardStackRotations | undefined,
): number | undefined => {
  if (!rotations) {
    return undefined;
  }

  if (typeof rotations === "function") {
    return rotations(box, index);
  }

  if (Array.isArray(rotations)) {
    return rotations[index];
  }

  const id = getBoxId(box);
  const rotationMap = rotations as Record<string, number>;
  return id ? rotationMap[id] : undefined;
};

const appendStackBoxPlacements = ({
  placements,
  box,
  x,
  y,
  zIndex,
  rotation,
}: {
  placements: BoardLayoutPlacement[];
  box: NormalizedLayoutBox;
  x: number;
  y: number;
  zIndex: number;
  rotation?: number;
}): void => {
  const start = placements.length;
  appendBoxPlacements(placements, box, x, y);
  for (let index = start; index < placements.length; index += 1) {
    const placement: BoardLayoutPlacement = {
      ...placements[index],
      zIndex,
    };
    if (rotation !== undefined) {
      placement.rotation = rotation;
    }
    placements[index] = placement;
  }
};

const boundsFromPlacements = (
  placements: readonly BoardLayoutPlacement[],
  fallback: BoardPoint,
): BoardBounds => {
  if (placements.length === 0) {
    return { x: fallback.x, y: fallback.y, width: 0, height: 0 };
  }

  const left = Math.min(...placements.map((placement) => placement.x));
  const top = Math.min(...placements.map((placement) => placement.y));
  const right = Math.max(
    ...placements.map((placement) => placement.x + placement.width),
  );
  const bottom = Math.max(
    ...placements.map((placement) => placement.y + placement.height),
  );

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
};

const deterministicPileRotation = (
  item: BoardLayoutBox,
  index: number,
  maxRotation: number,
): number => {
  const id = getBoxId(item) ?? `group-${index}`;
  let hash = 0;
  for (let charIndex = 0; charIndex < id.length; charIndex += 1) {
    hash = (hash * 31 + id.charCodeAt(charIndex)) >>> 0;
  }
  const normalized = ((hash % 1000) / 999) * 2 - 1;
  return Math.round(normalized * maxRotation * 10) / 10;
};

const degreesToRadians = (degrees: number): number => (degrees * Math.PI) / 180;

const roundLayoutValue = (value: number): number =>
  Math.abs(value) < 0.0001 ? 0 : Number(value.toFixed(4));

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

export const stackLayout = (
  boxes: readonly BoardLayoutBox[],
  {
    x = 0,
    y = 0,
    align = "top-left",
    offset = { x: 0, y: 0 },
    itemOffsets,
    rotations,
    zIndexStart = 0,
    zIndexStep = 1,
  }: BoardStackLayoutOptions = {},
): BoardLayoutResult => {
  const normalizedBoxes = boxes.map(normalizeBox);

  if (normalizedBoxes.length === 0) {
    return {
      placements: [],
      bounds: { x, y, width: 0, height: 0 },
    };
  }

  const maxSize = {
    width: Math.max(...normalizedBoxes.map((box) => box.width)),
    height: Math.max(...normalizedBoxes.map((box) => box.height)),
  };
  const placements: BoardLayoutPlacement[] = [];

  normalizedBoxes.forEach((box, index) => {
    const alignedOffset = getAlignedOffset(box, maxSize, align);
    const itemOffset = getItemOffset(box.source, itemOffsets);
    appendStackBoxPlacements({
      placements,
      box,
      x: x + alignedOffset.x + offset.x * index + itemOffset.x,
      y: y + alignedOffset.y + offset.y * index + itemOffset.y,
      zIndex: zIndexStart + zIndexStep * index,
      rotation: resolveStackRotation(box.source, index, rotations),
    });
  });

  return {
    placements,
    bounds: boundsFromPlacements(placements, { x, y }),
  };
};

export const deckLayout = (
  boxes: readonly BoardLayoutBox[],
  { offset = { x: 0, y: -2 }, ...options }: BoardDeckLayoutOptions = {},
): BoardLayoutResult =>
  stackLayout(boxes, {
    ...options,
    align: options.align ?? "top-left",
    offset,
  });

export const pileLayout = (
  boxes: readonly BoardLayoutBox[],
  {
    maxRotation = 15,
    rotations,
    ...options
  }: BoardPileLayoutOptions = {},
): BoardLayoutResult =>
  stackLayout(boxes, {
    ...options,
    align: options.align ?? "center",
    offset: { x: 0, y: 0 },
    rotations:
      rotations ??
      ((item, index) => deterministicPileRotation(item, index, maxRotation)),
  });

export const fanLayout = (
  boxes: readonly BoardLayoutBox[],
  {
    x = 0,
    y = 0,
    overlap = 72,
    arcAngle = 40,
    zIndexStart = 0,
    zIndexStep = 1,
  }: BoardFanLayoutOptions = {},
): BoardLayoutResult => {
  const normalizedBoxes = boxes.map(normalizeBox);

  if (normalizedBoxes.length === 0) {
    return {
      placements: [],
      bounds: { x, y, width: 0, height: 0 },
    };
  }

  const leftOffsets: number[] = [];
  let cursor = 0;
  normalizedBoxes.forEach((box, index) => {
    leftOffsets.push(cursor);
    if (index < normalizedBoxes.length - 1) {
      cursor += Math.max(0, box.width - Math.max(0, overlap));
    }
  });

  const rotations =
    normalizedBoxes.length === 1
      ? [0]
      : normalizedBoxes.map((_, index) =>
          roundLayoutValue(
            -arcAngle / 2 + (arcAngle * index) / (normalizedBoxes.length - 1),
          ),
        );
  const centers = normalizedBoxes.map(
    (box, index) => leftOffsets[index] + box.width / 2,
  );
  const chord = Math.max(0, centers[centers.length - 1] - centers[0]);
  const halfArcRadians = degreesToRadians(Math.abs(arcAngle) / 2);
  const radius =
    chord > 0 && halfArcRadians > 0
      ? chord / (2 * Math.sin(halfArcRadians))
      : 0;
  const rawYOffset = rotations.map((rotation) =>
    radius > 0
      ? radius * (1 - Math.cos(degreesToRadians(Math.abs(rotation))))
      : 0,
  );
  const minYOffset = Math.min(...rawYOffset);
  const placements: BoardLayoutPlacement[] = [];

  normalizedBoxes.forEach((box, index) => {
    appendStackBoxPlacements({
      placements,
      box,
      x: roundLayoutValue(x + leftOffsets[index]),
      y: roundLayoutValue(y + rawYOffset[index] - minYOffset),
      zIndex: zIndexStart + zIndexStep * index,
      rotation: rotations[index],
    });
  });

  return {
    placements,
    bounds: boundsFromPlacements(placements, { x, y }),
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

  return selectedRecords.map((record) => {
    const item: BoardLayoutItemBox = {
      id: record.id,
      width: record.measuredWidth ?? record.width,
      height: record.measuredHeight ?? record.height,
      zIndex: record.zIndex,
    };
    if (record.rotation !== undefined) {
      item.rotation = record.rotation;
    }
    return item;
  });
};
