import {
  deviceHeight,
  deviceWidth,
  locationHeight,
  locationWidth,
  spaceshipBoardItemId,
  spaceshipTokenSize,
} from "./board/geometry";
import { spaceshipLayoutId } from "./drag/layoutState";
import type {
  SpaceshipDragState,
  SpaceshipDraggableCard,
  SpaceshipDraggableToken,
} from "./drag/types";
import { createPlayerLocation } from "./scene/content";
import type {
  EnergyTokenModel,
  ShipLocationInstance,
  ShipLocationRow,
  ShipLocationType,
  ShipPaneModel,
  SpaceshipScene,
} from "./scene/types";

export interface AddSpaceshipLocationOperation {
  type: "add-location";
  pane: string;
  title: string;
  locationType: ShipLocationType;
  level?: number;
  summary?: string;
  status?: string;
  row?: ShipLocationRow;
  imageUrl?: string;
  energyTokenCount?: number;
}

export interface AddSpaceshipEnergyTokensOperation {
  type: "add-energy-tokens";
  pane?: string;
  targetLocation: string;
  count: number;
}

export interface FocusSpaceshipAgentOperation {
  type: "focus";
  pane?: string;
  itemId?: string;
}

export type SpaceshipAgentOperation =
  | AddSpaceshipLocationOperation
  | AddSpaceshipEnergyTokensOperation
  | FocusSpaceshipAgentOperation;

export interface SpaceshipAgentOperationError {
  operationIndex: number;
  message: string;
}

export interface SpaceshipAgentOperationResult {
  operationIndex: number;
  type: SpaceshipAgentOperation["type"];
  itemIds: string[];
  paneId?: string;
}

export interface ApplySpaceshipAgentOperationsInput {
  scene: SpaceshipScene;
  dragState: SpaceshipDragState;
  operations: readonly SpaceshipAgentOperation[];
}

export interface ApplySpaceshipAgentOperationsResult {
  scene: SpaceshipScene;
  dragState: SpaceshipDragState;
  results: SpaceshipAgentOperationResult[];
  errors: SpaceshipAgentOperationError[];
}

const ignoredPaneWords = new Set(["ship", "the", "a", "an"]);

const normalizeSearchText = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const toSlug = (value: string): string => {
  const slug = normalizeSearchText(value).replaceAll(" ", "-");
  return slug || "item";
};

const getPaneBaseSlug = (pane: ShipPaneModel): string => {
  const fromPaneId = pane.paneId.replace(/^pane-/, "");
  return toSlug(fromPaneId || pane.title);
};

const getPaneSearchFields = (pane: ShipPaneModel): string[] => [
  pane.paneId,
  pane.title,
  pane.faction,
  pane.emphasis,
];

const getPaneTokenMatches = (pane: ShipPaneModel, query: string): boolean => {
  const queryTokens = normalizeSearchText(query)
    .split(" ")
    .filter((token) => token && !ignoredPaneWords.has(token));
  if (queryTokens.length === 0) {
    return false;
  }
  const haystack = normalizeSearchText(getPaneSearchFields(pane).join(" "));
  return queryTokens.every((token) => haystack.includes(token));
};

export const resolveSpaceshipAgentPane = (
  scene: SpaceshipScene,
  paneQuery: string,
): ShipPaneModel | null => {
  const normalizedQuery = normalizeSearchText(paneQuery);
  if (!normalizedQuery) {
    return null;
  }

  const exactMatches = scene.panes.filter((pane) =>
    getPaneSearchFields(pane).some(
      (field) => normalizeSearchText(field) === normalizedQuery,
    ),
  );
  if (exactMatches.length === 1) {
    return exactMatches[0];
  }
  if (exactMatches.length > 1) {
    return null;
  }

  const fuzzyMatches = scene.panes.filter((pane) =>
    getPaneTokenMatches(pane, paneQuery),
  );
  return fuzzyMatches.length === 1 ? fuzzyMatches[0] : null;
};

const countPaneMatches = (scene: SpaceshipScene, paneQuery: string): number => {
  const normalizedQuery = normalizeSearchText(paneQuery);
  if (!normalizedQuery) {
    return 0;
  }

  const exactMatches = scene.panes.filter((pane) =>
    getPaneSearchFields(pane).some(
      (field) => normalizeSearchText(field) === normalizedQuery,
    ),
  );
  if (exactMatches.length > 0) {
    return exactMatches.length;
  }

  return scene.panes.filter((pane) => getPaneTokenMatches(pane, paneQuery)).length;
};

const createUniqueLocationId = (
  scene: SpaceshipScene,
  pane: ShipPaneModel,
  title: string,
): string => {
  const existingIds = new Set(
    scene.panes.flatMap((candidatePane) =>
      candidatePane.locations.map((location) => location.locationId),
    ),
  );
  const baseId = `${getPaneBaseSlug(pane)}-${toSlug(title)}`;
  let candidateId = baseId;
  let suffix = 2;
  while (existingIds.has(candidateId)) {
    candidateId = `${baseId}-${suffix}`;
    suffix += 1;
  }
  return candidateId;
};

const createEnergyTokenModels = (
  locationId: string,
  count: number,
): EnergyTokenModel[] =>
  Array.from({ length: Math.max(0, Math.floor(count)) }, (_, index) => ({
    tokenId: `${locationId}-energy-${index + 1}`,
    label: "1",
    detail: "Active power",
    locationId,
  }));

const resolveDefaultRow = (pane: ShipPaneModel): ShipLocationRow => {
  const topCount = pane.locations.filter((location) => location.row === "top").length;
  const bottomCount = pane.locations.filter(
    (location) => location.row === "bottom",
  ).length;
  return bottomCount <= topCount ? "bottom" : "top";
};

const replacePane = (
  scene: SpaceshipScene,
  paneId: string,
  updater: (pane: ShipPaneModel) => ShipPaneModel,
): SpaceshipScene => ({
  ...scene,
  panes: scene.panes.map((pane) =>
    pane.paneId === paneId ? updater(pane) : pane,
  ) as SpaceshipScene["panes"],
});

const createLocationCard = (
  pane: ShipPaneModel,
  location: ShipLocationInstance,
  dragState: SpaceshipDragState,
): SpaceshipDraggableCard => ({
  itemId: spaceshipBoardItemId.location(location.locationId),
  role: "location",
  paneId: pane.paneId,
  ownerId: location.locationId,
  x: 0,
  y: 0,
  width: locationWidth,
  height: locationHeight,
  zIndex: dragState.nextCardZIndex,
  placement: {
    type: "layout",
    layoutId: spaceshipLayoutId.locationRow(pane.paneId, location.row),
  },
});

const createDeviceCard = (
  pane: ShipPaneModel,
  location: ShipLocationInstance,
  dragState: SpaceshipDragState,
): SpaceshipDraggableCard | null => {
  if (!location.device) {
    return null;
  }

  return {
    itemId: spaceshipBoardItemId.device(location.device.deviceId),
    role: "device",
    paneId: pane.paneId,
    ownerId: location.locationId,
    x: 0,
    y: 0,
    width: deviceWidth,
    height: deviceHeight,
    zIndex: dragState.nextCardZIndex + 1,
    placement: {
      type: "layout",
      layoutId: spaceshipLayoutId.deviceColumn(
        spaceshipBoardItemId.location(location.locationId),
      ),
    },
  };
};

const getLocationTokenOffsets = (
  tokenCount: number,
): { offsetX: number; offsetY: number }[] => {
  const width = spaceshipTokenSize.energy.width;
  const gap = 10;
  const totalWidth = tokenCount * width + Math.max(0, tokenCount - 1) * gap;
  let cursorX = (locationWidth - totalWidth) / 2;
  return Array.from({ length: tokenCount }, () => {
    const offset = {
      offsetX: cursorX,
      offsetY: (locationHeight - spaceshipTokenSize.energy.height) / 2,
    };
    cursorX += width + gap;
    return offset;
  });
};

const createDraggableEnergyTokens = ({
  pane,
  location,
  dragState,
  tokens,
}: {
  pane: ShipPaneModel;
  location: ShipLocationInstance;
  dragState: SpaceshipDragState;
  tokens: readonly EnergyTokenModel[];
}): SpaceshipDraggableToken[] => {
  const offsets = getLocationTokenOffsets(tokens.length);
  return tokens.map((token, index) => ({
    tokenId: token.tokenId,
    kind: "energy",
    label: token.label,
    detail: token.detail,
    state: token.state,
    x: 0,
    y: 0,
    width: spaceshipTokenSize.energy.width,
    height: spaceshipTokenSize.energy.height,
    zIndex: dragState.nextZIndex + index,
    paneId: pane.paneId,
    sourceLocationId: location.locationId,
    placement: {
      type: "card",
      cardItemId: spaceshipBoardItemId.location(location.locationId),
      offsetX: offsets[index]?.offsetX ?? 0,
      offsetY: offsets[index]?.offsetY ?? 0,
    },
  }));
};

const findLocation = (
  scene: SpaceshipScene,
  targetLocation: string,
  pane?: ShipPaneModel,
): { pane: ShipPaneModel; location: ShipLocationInstance } | null => {
  const normalizedTarget = normalizeSearchText(targetLocation);
  const panes = pane ? [pane] : scene.panes;
  const matches = panes.flatMap((candidatePane) =>
    candidatePane.locations
      .filter((location) =>
        [location.locationId, location.title, location.moduleLocationSlug ?? ""].some(
          (field) => normalizeSearchText(field) === normalizedTarget,
        ),
      )
      .map((location) => ({ pane: candidatePane, location })),
  );

  if (matches.length === 1) {
    return matches[0];
  }

  const fuzzyMatches = panes.flatMap((candidatePane) =>
    candidatePane.locations
      .filter((location) =>
        normalizeSearchText(`${location.locationId} ${location.title}`).includes(
          normalizedTarget,
        ),
      )
      .map((location) => ({ pane: candidatePane, location })),
  );
  return fuzzyMatches.length === 1 ? fuzzyMatches[0] : null;
};

const applyAddLocationOperation = (
  scene: SpaceshipScene,
  dragState: SpaceshipDragState,
  operation: AddSpaceshipLocationOperation,
  operationIndex: number,
):
  | { scene: SpaceshipScene; dragState: SpaceshipDragState; result: SpaceshipAgentOperationResult }
  | { error: SpaceshipAgentOperationError } => {
  const matchCount = countPaneMatches(scene, operation.pane);
  const pane = resolveSpaceshipAgentPane(scene, operation.pane);
  if (!pane) {
    return {
      error: {
        operationIndex,
        message:
          matchCount > 1
            ? `Ambiguous pane "${operation.pane}".`
            : `Unknown pane "${operation.pane}".`,
      },
    };
  }

  const locationId = createUniqueLocationId(scene, pane, operation.title);
  const energyTokens = createEnergyTokenModels(
    locationId,
    operation.energyTokenCount ?? 0,
  );
  const lastTouchedOrder =
    Math.max(0, ...pane.locations.map((location) => location.lastTouchedOrder)) + 1;
  const location = createPlayerLocation(
    {
      locationId,
      title: operation.title,
      locationType: operation.locationType,
      level: operation.level ?? 1,
      row: operation.row ?? resolveDefaultRow(pane),
      summary: operation.summary ?? "Added live from the spaceship connector.",
      status: operation.status ?? "Ready for playtest edits.",
      effects: [],
      energyTokens,
      actorTokens: [],
      imageUrl: operation.imageUrl,
    },
    lastTouchedOrder - 1,
  );
  const locationItemId = spaceshipBoardItemId.location(location.locationId);
  const deviceItemId = location.device
    ? spaceshipBoardItemId.device(location.device.deviceId)
    : null;
  const deviceCard = createDeviceCard(pane, location, dragState);
  const addedCards = [
    createLocationCard(pane, location, dragState),
    ...(deviceCard ? [deviceCard] : []),
  ];
  const addedTokens = createDraggableEnergyTokens({
    pane,
    location,
    dragState,
    tokens: energyTokens,
  });

  return {
    scene: replacePane(scene, pane.paneId, (currentPane) => ({
      ...currentPane,
      locations: [...currentPane.locations, location],
    })),
    dragState: {
      ...dragState,
      layouts: {
        ...dragState.layouts,
        locationRows: dragState.layouts.locationRows.map((layout) =>
          layout.layoutId === spaceshipLayoutId.locationRow(pane.paneId, location.row)
            ? { ...layout, itemIds: [...layout.itemIds, locationItemId] }
            : layout,
        ),
        deviceColumns: [
          ...dragState.layouts.deviceColumns,
          {
            layoutId: spaceshipLayoutId.deviceColumn(locationItemId),
            type: "device-column",
            locationItemId,
            itemIds: deviceItemId ? [deviceItemId] : [],
          },
        ],
        effectStacks: [
          ...dragState.layouts.effectStacks,
          {
            layoutId: spaceshipLayoutId.effectStack(locationItemId),
            type: "effect-stack",
            ownerItemId: locationItemId,
            itemIds: [],
          },
          ...(deviceItemId
            ? [
                {
                  layoutId: spaceshipLayoutId.effectStack(deviceItemId),
                  type: "effect-stack" as const,
                  ownerItemId: deviceItemId,
                  itemIds: [],
                },
              ]
            : []),
        ],
      },
      cards: [...dragState.cards, ...addedCards],
      tokens: [...dragState.tokens, ...addedTokens],
      nextCardZIndex: dragState.nextCardZIndex + addedCards.length,
      nextZIndex: dragState.nextZIndex + addedTokens.length,
    },
    result: {
      operationIndex,
      type: operation.type,
      paneId: pane.paneId,
      itemIds: [
        locationItemId,
        ...(deviceItemId ? [deviceItemId] : []),
        ...addedTokens.map((token) => spaceshipBoardItemId.token(token.tokenId)),
      ],
    },
  };
};

const applyAddEnergyTokensOperation = (
  scene: SpaceshipScene,
  dragState: SpaceshipDragState,
  operation: AddSpaceshipEnergyTokensOperation,
  operationIndex: number,
):
  | { scene: SpaceshipScene; dragState: SpaceshipDragState; result: SpaceshipAgentOperationResult }
  | { error: SpaceshipAgentOperationError } => {
  const resolvedPane = operation.pane
    ? resolveSpaceshipAgentPane(scene, operation.pane)
    : null;
  if (operation.pane && !resolvedPane) {
    return {
      error: {
        operationIndex,
        message: `Unknown pane "${operation.pane}".`,
      },
    };
  }

  const target = findLocation(
    scene,
    operation.targetLocation,
    resolvedPane ?? undefined,
  );
  if (!target) {
    return {
      error: {
        operationIndex,
        message: `Unknown or ambiguous Location "${operation.targetLocation}".`,
      },
    };
  }

  const existingTokenCount = dragState.tokens.filter(
    (token) => token.sourceLocationId === target.location.locationId,
  ).length;
  const newTokens = createEnergyTokenModels(
    target.location.locationId,
    operation.count,
  ).map((token, index) => ({
    ...token,
    tokenId: `${target.location.locationId}-agent-energy-${
      existingTokenCount + index + 1
    }`,
  }));
  const draggableTokens = createDraggableEnergyTokens({
    pane: target.pane,
    location: target.location,
    dragState,
    tokens: newTokens,
  });

  return {
    scene: replacePane(scene, target.pane.paneId, (currentPane) => ({
      ...currentPane,
      locations: currentPane.locations.map((location) =>
        location.locationId === target.location.locationId
          ? {
              ...location,
              energyTokens: [...location.energyTokens, ...newTokens],
              device: location.device
                ? {
                    ...location.device,
                    powerTokens: [...location.device.powerTokens, ...newTokens],
                  }
                : location.device,
            }
          : location,
      ),
    })),
    dragState: {
      ...dragState,
      tokens: [...dragState.tokens, ...draggableTokens],
      nextZIndex: dragState.nextZIndex + draggableTokens.length,
    },
    result: {
      operationIndex,
      type: operation.type,
      paneId: target.pane.paneId,
      itemIds: draggableTokens.map((token) =>
        spaceshipBoardItemId.token(token.tokenId),
      ),
    },
  };
};

export const applySpaceshipAgentOperations = ({
  scene,
  dragState,
  operations,
}: ApplySpaceshipAgentOperationsInput): ApplySpaceshipAgentOperationsResult => {
  let nextScene = structuredClone(scene);
  let nextDragState = structuredClone(dragState);
  const results: SpaceshipAgentOperationResult[] = [];
  const errors: SpaceshipAgentOperationError[] = [];

  operations.forEach((operation, operationIndex) => {
    if (operation.type === "focus") {
      results.push({
        operationIndex,
        type: operation.type,
        itemIds: operation.itemId ? [operation.itemId] : [],
        paneId: operation.pane
          ? resolveSpaceshipAgentPane(nextScene, operation.pane)?.paneId
          : undefined,
      });
      return;
    }

    const applied =
      operation.type === "add-location"
        ? applyAddLocationOperation(
            nextScene,
            nextDragState,
            operation,
            operationIndex,
          )
        : applyAddEnergyTokensOperation(
            nextScene,
            nextDragState,
            operation,
            operationIndex,
          );

    if ("error" in applied) {
      errors.push(applied.error);
      return;
    }

    nextScene = applied.scene;
    nextDragState = applied.dragState;
    results.push(applied.result);
  });

  return {
    scene: errors.length > 0 ? scene : nextScene,
    dragState: errors.length > 0 ? dragState : nextDragState,
    results: errors.length > 0 ? [] : results,
    errors,
  };
};
