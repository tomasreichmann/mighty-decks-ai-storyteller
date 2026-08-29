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
