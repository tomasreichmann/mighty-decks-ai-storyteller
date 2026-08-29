import type { BoardItemInput, BoardSize } from "../../lib/board/boardController";
import { deckLayout, fanLayout, flexLayout } from "../../lib/board/boardLayout";

export interface RulebookBoardExample {
  boardSize: BoardSize;
  items: BoardItemInput[];
}

const boardSize = { width: 960, height: 640 };
const standardCard = { width: 105, height: 156 };

const toBoardItems = (
  placements: ReturnType<typeof flexLayout>["placements"],
): BoardItemInput[] =>
  placements.map((placement) => ({
    id: placement.id,
    kind: "card",
    x: placement.x,
    y: placement.y,
    width: placement.width,
    height: placement.height,
    zIndex: placement.zIndex,
    rotation: placement.rotation,
  }));

const sharedScene = flexLayout(
  [
    { id: "setup-location-gate", ...standardCard },
    { id: "setup-location-courtyard", ...standardCard },
    { id: "setup-location-tower", ...standardCard },
    { id: "setup-counter", ...standardCard },
    { id: "setup-actor-guard", ...standardCard },
  ],
  { x: 24, y: 62, gap: 20 },
);

const outcomeDeck = deckLayout(
  [
    { id: "setup-outcome-deck-bottom", ...standardCard },
    { id: "setup-outcome-deck-middle", ...standardCard },
    { id: "setup-outcome-deck", ...standardCard },
  ],
  { x: 760, y: 62, offset: { x: -4, y: 4 }, zIndexStart: 2 },
);

const playerSpace = (
  player: "mira" | "aldren" | "tomas",
  x: number,
): BoardItemInput[] => {
  const hand = fanLayout(
    [
      { id: `setup-${player}-hand-first`, ...standardCard },
      { id: `setup-${player}-hand-second`, ...standardCard },
      { id: `setup-${player}-hand-third`, ...standardCard },
    ],
    { x: x + 75, y: 284, overlap: 75, arcAngle: 14, zIndexStart: 3 },
  );

  return [
    {
      id: `setup-${player}-label`,
      kind: "note",
      x,
      y: 242,
      width: 150,
      height: 26,
      zIndex: 8,
    },
    {
      id: `setup-${player}-token`,
      kind: "note",
      x,
      y: 300,
      width: 58,
      height: 66,
      zIndex: 9,
    },
    ...toBoardItems(hand.placements),
    {
      id: `setup-${player}-owned`,
      kind: "card",
      x: x + 90,
      y: 464,
      ...standardCard,
      zIndex: 4,
    },
  ];
};

export const completeTableSetupBoard: RulebookBoardExample = {
  boardSize,
  items: [
    {
      id: "setup-shared-label",
      kind: "note",
      x: 24,
      y: 14,
      width: 180,
      height: 26,
      zIndex: 8,
    },
    {
      id: "setup-deck-label",
      kind: "note",
      x: 744,
      y: 14,
      width: 160,
      height: 26,
      zIndex: 8,
    },
    ...toBoardItems(sharedScene.placements),
    ...toBoardItems(outcomeDeck.placements),
    ...playerSpace("mira", 24),
    ...playerSpace("aldren", 334),
    ...playerSpace("tomas", 644),
  ],
};

export const completeTableSetupMobileBoard: RulebookBoardExample = {
  boardSize: { width: 340, height: 650 },
  items: [
    {
      id: "setup-shared-label",
      kind: "note",
      x: 30,
      y: 18,
      width: 170,
      height: 26,
      zIndex: 8,
    },
    {
      id: "setup-location-gate",
      kind: "card",
      x: 40,
      y: 66,
      width: 120,
      height: 156,
    },
    {
      id: "setup-counter",
      kind: "card",
      x: 180,
      y: 66,
      width: 120,
      height: 156,
    },
    {
      id: "setup-actor-guard",
      kind: "card",
      x: 40,
      y: 246,
      width: 120,
      height: 156,
    },
    {
      id: "setup-mobile-deck-label",
      kind: "note",
      x: 180,
      y: 222,
      width: 120,
      height: 26,
      zIndex: 8,
    },
    {
      id: "setup-outcome-deck",
      kind: "card",
      x: 180,
      y: 246,
      width: 120,
      height: 156,
    },
    {
      id: "setup-mobile-player-label",
      kind: "note",
      x: 30,
      y: 430,
      width: 280,
      height: 26,
      zIndex: 8,
    },
    {
      id: "setup-mira-token",
      kind: "note",
      x: 30,
      y: 500,
      width: 58,
      height: 66,
      zIndex: 9,
    },
    ...toBoardItems(
      fanLayout(
        [
          { id: "setup-mira-hand-first", width: 120, height: 156 },
          { id: "setup-mira-hand-second", width: 120, height: 156 },
          { id: "setup-mira-hand-third", width: 120, height: 156 },
        ],
        { x: 100, y: 476, overlap: 90, arcAngle: 14, zIndexStart: 3 },
      ).placements,
    ),
  ],
};

const coreActionLoopCard = { width: 105, height: 156 };

const coreActionLoopHand = fanLayout(
  [
    { id: "loop-initial-first", ...coreActionLoopCard },
    { id: "loop-initial-second", ...coreActionLoopCard },
    { id: "loop-initial-third", ...coreActionLoopCard },
  ],
  { x: 30, y: 92, overlap: 75, arcAngle: 14, zIndexStart: 3 },
);

const coreActionLoopDeck = deckLayout(
  [
    { id: "loop-deck-bottom", ...coreActionLoopCard },
    { id: "loop-deck-middle", ...coreActionLoopCard },
    { id: "loop-deck", ...coreActionLoopCard },
  ],
  { x: 628, y: 92, offset: { x: -4, y: 4 }, zIndexStart: 2 },
);

const coreActionLoopRefreshedHand = fanLayout(
  [
    { id: "loop-refreshed-first", ...coreActionLoopCard },
    { id: "loop-refreshed-second", ...coreActionLoopCard },
    { id: "loop-refreshed-third", ...coreActionLoopCard },
  ],
  { x: 800, y: 92, overlap: 75, arcAngle: 14, zIndexStart: 3 },
);

export const coreActionLoopBoard: RulebookBoardExample = {
  boardSize: { width: 1_050, height: 450 },
  items: [
    { id: "loop-step-choose", kind: "note", x: 10, y: 16, width: 190, height: 32, zIndex: 8 },
    { id: "loop-step-resolve", kind: "note", x: 240, y: 16, width: 155, height: 32, zIndex: 8 },
    { id: "loop-step-discard", kind: "note", x: 425, y: 16, width: 150, height: 32, zIndex: 8 },
    { id: "loop-step-draw", kind: "note", x: 610, y: 16, width: 155, height: 32, zIndex: 8 },
    { id: "loop-step-check", kind: "note", x: 795, y: 16, width: 205, height: 32, zIndex: 8 },
    ...toBoardItems(coreActionLoopHand.placements),
    { id: "loop-arrow-choose-resolve", kind: "note", x: 205, y: 136, width: 40, height: 60, zIndex: 8 },
    { id: "loop-selected", kind: "card", x: 265, y: 92, ...coreActionLoopCard, zIndex: 4 },
    { id: "loop-arrow-resolve-discard", kind: "note", x: 395, y: 136, width: 40, height: 60, zIndex: 8 },
    { id: "loop-discard", kind: "card", x: 450, y: 92, ...coreActionLoopCard, zIndex: 4 },
    { id: "loop-arrow-discard-draw", kind: "note", x: 580, y: 136, width: 40, height: 60, zIndex: 8 },
    ...toBoardItems(coreActionLoopDeck.placements),
    { id: "loop-arrow-draw-check", kind: "note", x: 760, y: 136, width: 40, height: 60, zIndex: 8 },
    ...toBoardItems(coreActionLoopRefreshedHand.placements),
    { id: "loop-selected-detail", kind: "note", x: 230, y: 286, width: 175, height: 32, zIndex: 8 },
    { id: "loop-discard-detail", kind: "note", x: 418, y: 286, width: 170, height: 32, zIndex: 8 },
    { id: "loop-deck-detail", kind: "note", x: 600, y: 286, width: 190, height: 32, zIndex: 8 },
    { id: "loop-catastrophe-rule", kind: "note", x: 230, y: 350, width: 600, height: 46, zIndex: 8 },
  ],
};

const coreActionLoopMobileCard = { width: 120, height: 156 };

export const coreActionLoopMobileBoard: RulebookBoardExample = {
  boardSize: { width: 380, height: 660 },
  items: [
    { id: "loop-step-choose", kind: "note", x: 20, y: 16, width: 340, height: 30, zIndex: 8 },
    ...toBoardItems(
      fanLayout(
        [
          { id: "loop-initial-first", ...coreActionLoopMobileCard },
          { id: "loop-initial-second", ...coreActionLoopMobileCard },
          { id: "loop-initial-third", ...coreActionLoopMobileCard },
        ],
        { x: 100, y: 60, overlap: 90, arcAngle: 14, zIndexStart: 3 },
      ).placements,
    ),
    { id: "loop-step-resolve", kind: "note", x: 14, y: 238, width: 145, height: 28, zIndex: 8 },
    { id: "loop-step-discard", kind: "note", x: 220, y: 238, width: 145, height: 28, zIndex: 8 },
    { id: "loop-selected", kind: "card", x: 25, y: 276, ...coreActionLoopMobileCard, zIndex: 4 },
    { id: "loop-discard", kind: "card", x: 225, y: 276, ...coreActionLoopMobileCard, zIndex: 4 },
    { id: "loop-step-draw", kind: "note", x: 14, y: 446, width: 145, height: 28, zIndex: 8 },
    { id: "loop-step-check", kind: "note", x: 190, y: 446, width: 175, height: 28, zIndex: 8 },
    ...toBoardItems(
      deckLayout(
        [
          { id: "loop-deck-bottom", ...coreActionLoopMobileCard },
          { id: "loop-deck-middle", ...coreActionLoopMobileCard },
          { id: "loop-deck", ...coreActionLoopMobileCard },
        ],
        { x: 33, y: 486, offset: { x: -4, y: 4 }, zIndexStart: 2 },
      ).placements,
    ),
    ...toBoardItems(
      fanLayout(
        [
          { id: "loop-refreshed-first", ...coreActionLoopMobileCard },
          { id: "loop-refreshed-second", ...coreActionLoopMobileCard },
          { id: "loop-refreshed-third", ...coreActionLoopMobileCard },
        ],
        { x: 190, y: 486, overlap: 90, arcAngle: 14, zIndexStart: 3 },
      ).placements,
    ),
  ],
};
