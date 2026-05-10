export const BOARD_MIN_ZOOM = 0.15;
export const BOARD_MAX_ZOOM = 3;

export type BoardItemKind = "note" | "card" | "image";

export interface BoardPoint {
  x: number;
  y: number;
}

export interface BoardSize {
  width: number;
  height: number;
}

export interface BoardBounds extends BoardPoint, BoardSize {}

export interface BoardViewport extends BoardPoint {
  zoom: number;
}

export interface BoardItemInput {
  id?: string;
  kind: BoardItemKind;
  x: number;
  y: number;
  width?: number;
  height?: number;
  title?: string;
  body?: string;
  imageUrl?: string;
  zIndex?: number;
  rotation?: number;
}

export interface BoardItemRecord extends Required<Pick<BoardItemInput, "id" | "kind" | "x" | "y">> {
  width: number;
  height: number;
  title?: string;
  body?: string;
  imageUrl?: string;
  zIndex: number;
  rotation?: number;
  measuredWidth?: number;
  measuredHeight?: number;
}

export interface FitBoundsOptions {
  bounds: BoardBounds;
  frameSize: BoardSize;
  padding?: number;
  minZoom?: number;
  maxZoom?: number;
}

export interface FitItemsOptions {
  items: Map<string, BoardItemRecord>;
  ids?: readonly string[];
  frameSize: BoardSize;
  fallbackBounds: BoardBounds;
  padding?: number;
}

export interface ViewportBoundsOptions {
  viewport: BoardViewport;
  frameSize: BoardSize;
}

export interface ZoomAtFramePointOptions {
  viewport: BoardViewport;
  framePoint: BoardPoint;
  zoom: number;
}

const fallbackItemSize: BoardSize = {
  width: 180,
  height: 120,
};

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const normalizeItemInput = (
  input: BoardItemInput,
  fallbackId: string,
): BoardItemRecord => ({
  id: input.id ?? fallbackId,
  kind: input.kind,
  x: input.x,
  y: input.y,
  width: input.width ?? fallbackItemSize.width,
  height: input.height ?? fallbackItemSize.height,
  title: input.title,
  body: input.body,
  imageUrl: input.imageUrl,
  zIndex: input.zIndex ?? 0,
  rotation: input.rotation,
});

export const getItemBounds = (item: BoardItemRecord): BoardBounds => ({
  x: item.x,
  y: item.y,
  width: item.measuredWidth ?? item.width,
  height: item.measuredHeight ?? item.height,
});

export const expandBounds = (
  bounds: BoardBounds,
  padding: number,
): BoardBounds => ({
  x: bounds.x - padding,
  y: bounds.y - padding,
  width: bounds.width + padding * 2,
  height: bounds.height + padding * 2,
});

export const combineBounds = (
  boundsList: readonly BoardBounds[],
): BoardBounds | null => {
  if (boundsList.length === 0) {
    return null;
  }

  const left = Math.min(...boundsList.map((bounds) => bounds.x));
  const top = Math.min(...boundsList.map((bounds) => bounds.y));
  const right = Math.max(
    ...boundsList.map((bounds) => bounds.x + bounds.width),
  );
  const bottom = Math.max(
    ...boundsList.map((bounds) => bounds.y + bounds.height),
  );

  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top,
  };
};

export const fitBoundsToFrame = ({
  bounds,
  frameSize,
  padding = 40,
  minZoom = BOARD_MIN_ZOOM,
  maxZoom = BOARD_MAX_ZOOM,
}: FitBoundsOptions): BoardViewport => {
  if (frameSize.width <= 0 || frameSize.height <= 0) {
    return { x: bounds.x, y: bounds.y, zoom: minZoom };
  }

  const paddedBounds = expandBounds(bounds, padding);
  const widthZoom = frameSize.width / Math.max(paddedBounds.width, 1);
  const heightZoom = frameSize.height / Math.max(paddedBounds.height, 1);
  const zoom = clamp(Math.min(widthZoom, heightZoom), minZoom, maxZoom);
  const centerX = paddedBounds.x + paddedBounds.width / 2;
  const centerY = paddedBounds.y + paddedBounds.height / 2;

  return {
    x: centerX - frameSize.width / zoom / 2,
    y: centerY - frameSize.height / zoom / 2,
    zoom,
  };
};

export const fitItemsToFrame = ({
  items,
  ids,
  frameSize,
  fallbackBounds,
  padding = 56,
}: FitItemsOptions): BoardViewport => {
  const selectedItems = ids
    ? ids.map((id) => items.get(id)).filter((item): item is BoardItemRecord => Boolean(item))
    : Array.from(items.values());
  const bounds = combineBounds(selectedItems.map(getItemBounds)) ?? fallbackBounds;

  return fitBoundsToFrame({ bounds, frameSize, padding });
};

export const frameToWorld = (
  point: BoardPoint,
  viewport: BoardViewport,
): BoardPoint => ({
  x: viewport.x + point.x / viewport.zoom,
  y: viewport.y + point.y / viewport.zoom,
});

export const worldToFrame = (
  point: BoardPoint,
  viewport: BoardViewport,
): BoardPoint => ({
  x: (point.x - viewport.x) * viewport.zoom,
  y: (point.y - viewport.y) * viewport.zoom,
});

export const zoomAtFramePoint = ({
  viewport,
  framePoint,
  zoom,
}: ZoomAtFramePointOptions): BoardViewport => {
  const nextZoom = clamp(zoom, BOARD_MIN_ZOOM, BOARD_MAX_ZOOM);
  const worldPoint = frameToWorld(framePoint, viewport);

  return {
    x: worldPoint.x - framePoint.x / nextZoom,
    y: worldPoint.y - framePoint.y / nextZoom,
    zoom: nextZoom,
  };
};

export const getViewportBounds = ({
  viewport,
  frameSize,
}: ViewportBoundsOptions): BoardBounds => ({
  x: viewport.x,
  y: viewport.y,
  width: frameSize.width / viewport.zoom,
  height: frameSize.height / viewport.zoom,
});

export const isBoundsInViewport = ({
  bounds,
  viewportBounds,
  margin = 0,
}: {
  bounds: BoardBounds;
  viewportBounds: BoardBounds;
  margin?: number;
}): boolean => {
  const expandedViewport = expandBounds(viewportBounds, margin);
  const boundsRight = bounds.x + bounds.width;
  const boundsBottom = bounds.y + bounds.height;
  const viewportRight = expandedViewport.x + expandedViewport.width;
  const viewportBottom = expandedViewport.y + expandedViewport.height;

  return (
    bounds.x <= viewportRight &&
    boundsRight >= expandedViewport.x &&
    bounds.y <= viewportBottom &&
    boundsBottom >= expandedViewport.y
  );
};
