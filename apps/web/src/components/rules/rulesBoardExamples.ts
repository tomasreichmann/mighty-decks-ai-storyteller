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

const initiativeActorCard = { width: 112, height: 156 };

export const actorInitiativeBoard: RulebookBoardExample = {
  boardSize: { width: 940, height: 400 },
  items: [
    { id: "initiative-mira-slot", kind: "note", x: 28, y: 18, width: 390, height: 32, zIndex: 8 },
    { id: "initiative-aldren-slot", kind: "note", x: 450, y: 18, width: 340, height: 32, zIndex: 8 },
    { id: "initiative-mira", kind: "note", x: 44, y: 138, width: 66, height: 70, zIndex: 8 },
    { id: "initiative-arrow-mira-guard", kind: "note", x: 120, y: 146, width: 28, height: 48, zIndex: 8 },
    { id: "initiative-guard", kind: "card", x: 160, y: 86, ...initiativeActorCard, zIndex: 4 },
    { id: "initiative-arrow-guard-wolf", kind: "note", x: 279, y: 146, width: 28, height: 48, zIndex: 8 },
    { id: "initiative-wolf", kind: "card", x: 319, y: 86, ...initiativeActorCard, zIndex: 4 },
    { id: "initiative-arrow-wolf-aldren", kind: "note", x: 438, y: 146, width: 28, height: 48, zIndex: 8 },
    { id: "initiative-aldren", kind: "note", x: 478, y: 138, width: 66, height: 70, zIndex: 8 },
    { id: "initiative-arrow-aldren-bandit", kind: "note", x: 554, y: 146, width: 28, height: 48, zIndex: 8 },
    { id: "initiative-bandit", kind: "card", x: 594, y: 86, ...initiativeActorCard, zIndex: 4 },
    { id: "initiative-arrow-bandit-tomas", kind: "note", x: 713, y: 146, width: 28, height: 48, zIndex: 8 },
    { id: "initiative-tomas", kind: "note", x: 753, y: 138, width: 66, height: 70, zIndex: 8 },
    { id: "initiative-guard-label", kind: "note", x: 160, y: 260, width: 112, height: 28, zIndex: 8 },
    { id: "initiative-wolf-label", kind: "note", x: 319, y: 260, width: 112, height: 28, zIndex: 8 },
    { id: "initiative-bandit-label", kind: "note", x: 594, y: 260, width: 112, height: 28, zIndex: 8 },
    { id: "initiative-round-order", kind: "note", x: 150, y: 330, width: 640, height: 34, zIndex: 8 },
  ],
};

export const actorInitiativeMobileBoard: RulebookBoardExample = {
  boardSize: { width: 380, height: 600 },
  items: [
    { id: "initiative-mira-slot", kind: "note", x: 20, y: 16, width: 340, height: 30, zIndex: 8 },
    { id: "initiative-mira", kind: "note", x: 20, y: 104, width: 66, height: 70, zIndex: 8 },
    { id: "initiative-arrow-mira-guard", kind: "note", x: 90, y: 116, width: 24, height: 44, zIndex: 8 },
    { id: "initiative-guard", kind: "card", x: 122, y: 60, ...initiativeActorCard, zIndex: 4 },
    { id: "initiative-arrow-guard-wolf", kind: "note", x: 236, y: 116, width: 18, height: 44, zIndex: 8 },
    { id: "initiative-wolf", kind: "card", x: 254, y: 60, ...initiativeActorCard, zIndex: 4 },
    { id: "initiative-arrow-wolf-aldren-mobile", kind: "note", x: 176, y: 218, width: 28, height: 24, zIndex: 8 },
    { id: "initiative-aldren-slot", kind: "note", x: 20, y: 244, width: 340, height: 30, zIndex: 8 },
    { id: "initiative-aldren", kind: "note", x: 50, y: 332, width: 66, height: 70, zIndex: 8 },
    { id: "initiative-arrow-aldren-bandit", kind: "note", x: 134, y: 344, width: 28, height: 44, zIndex: 8 },
    { id: "initiative-bandit", kind: "card", x: 194, y: 286, ...initiativeActorCard, zIndex: 4 },
    { id: "initiative-arrow-bandit-tomas-mobile", kind: "note", x: 176, y: 450, width: 28, height: 24, zIndex: 8 },
    { id: "initiative-round-order", kind: "note", x: 20, y: 474, width: 340, height: 30, zIndex: 8 },
    { id: "initiative-tomas", kind: "note", x: 157, y: 516, width: 66, height: 70, zIndex: 8 },
  ],
};

const zoneCard = { width: 220, height: 156 };

export const zonesAndRangeBoard: RulebookBoardExample = {
  boardSize: { width: 960, height: 430 },
  items: [
    { id: "range-title", kind: "note", x: 220, y: 16, width: 520, height: 32, zIndex: 8 },
    { id: "zone-gate", kind: "card", x: 38, y: 96, ...zoneCard, zIndex: 2 },
    { id: "zone-courtyard", kind: "card", x: 370, y: 96, ...zoneCard, zIndex: 2 },
    { id: "zone-tower", kind: "card", x: 702, y: 96, ...zoneCard, zIndex: 2 },
    { id: "zone-arrow-gate-courtyard", kind: "note", x: 272, y: 145, width: 80, height: 42, zIndex: 8 },
    { id: "zone-arrow-courtyard-tower", kind: "note", x: 604, y: 145, width: 80, height: 42, zIndex: 8 },
    { id: "zone-mira", kind: "note", x: 114, y: 132, width: 66, height: 70, zIndex: 10 },
    { id: "zone-bandit", kind: "note", x: 778, y: 132, width: 66, height: 70, zIndex: 10 },
    { id: "range-sword", kind: "note", x: 38, y: 296, width: 220, height: 30, zIndex: 8 },
    { id: "range-throw", kind: "note", x: 370, y: 296, width: 220, height: 30, zIndex: 8 },
    { id: "range-bow", kind: "note", x: 702, y: 296, width: 220, height: 30, zIndex: 8 },
    { id: "range-rule", kind: "note", x: 210, y: 364, width: 540, height: 30, zIndex: 8 },
  ],
};

export const zonesAndRangeMobileBoard: RulebookBoardExample = {
  boardSize: { width: 380, height: 750 },
  items: [
    { id: "range-title", kind: "note", x: 20, y: 16, width: 340, height: 30, zIndex: 8 },
    { id: "zone-gate", kind: "card", x: 80, y: 64, ...zoneCard, zIndex: 2 },
    { id: "zone-mira", kind: "note", x: 157, y: 106, width: 66, height: 70, zIndex: 10 },
    { id: "range-sword", kind: "note", x: 80, y: 230, width: 220, height: 28, zIndex: 8 },
    { id: "zone-arrow-gate-courtyard-mobile", kind: "note", x: 166, y: 262, width: 48, height: 28, zIndex: 8 },
    { id: "zone-courtyard", kind: "card", x: 80, y: 298, ...zoneCard, zIndex: 2 },
    { id: "range-throw", kind: "note", x: 80, y: 464, width: 220, height: 28, zIndex: 8 },
    { id: "zone-arrow-courtyard-tower-mobile", kind: "note", x: 166, y: 496, width: 48, height: 28, zIndex: 8 },
    { id: "zone-tower", kind: "card", x: 80, y: 532, ...zoneCard, zIndex: 2 },
    { id: "zone-bandit", kind: "note", x: 157, y: 574, width: 66, height: 70, zIndex: 10 },
    { id: "range-bow", kind: "note", x: 20, y: 704, width: 340, height: 26, zIndex: 8 },
  ],
};

const catastropheCard = { width: 105, height: 156 };

export const catastropheFlowBoard: RulebookBoardExample = {
  boardSize: { width: 960, height: 560 },
  items: [
    { id: "catastrophe-resolved-label", kind: "note", x: 28, y: 18, width: 170, height: 32, zIndex: 8 },
    { id: "catastrophe-draw-label", kind: "note", x: 234, y: 18, width: 170, height: 32, zIndex: 8 },
    { id: "catastrophe-fumbles-label", kind: "note", x: 414, y: 18, width: 215, height: 32, zIndex: 8 },
    { id: "catastrophe-resolved", kind: "card", x: 62, y: 80, ...catastropheCard, zIndex: 4 },
    { id: "catastrophe-arrow-resolved-draw", kind: "note", x: 176, y: 132, width: 48, height: 50, zIndex: 8 },
    { id: "catastrophe-draw", kind: "card", x: 266, y: 80, ...catastropheCard, zIndex: 4 },
    { id: "catastrophe-arrow-draw-fumbles", kind: "note", x: 380, y: 132, width: 42, height: 50, zIndex: 8 },
    { id: "catastrophe-fumble-first", kind: "card", x: 430, y: 82, ...catastropheCard, zIndex: 2 },
    { id: "catastrophe-fumble-second", kind: "card", x: 478, y: 74, ...catastropheCard, zIndex: 3 },
    { id: "catastrophe-fumble-third", kind: "card", x: 526, y: 82, ...catastropheCard, zIndex: 4 },
    { id: "catastrophe-arrow-fumbles-trigger", kind: "note", x: 640, y: 132, width: 42, height: 50, zIndex: 8 },
    { id: "catastrophe-trigger", kind: "note", x: 704, y: 126, width: 210, height: 48, zIndex: 8 },
    { id: "catastrophe-arrow-trigger-consequences", kind: "note", x: 756, y: 210, width: 48, height: 48, zIndex: 8 },
    { id: "catastrophe-consequence-title", kind: "note", x: 230, y: 276, width: 500, height: 32, zIndex: 8 },
    { id: "catastrophe-consequence-injury-label", kind: "note", x: 92, y: 326, width: 180, height: 28, zIndex: 8 },
    { id: "catastrophe-consequence-complication-label", kind: "note", x: 390, y: 326, width: 180, height: 28, zIndex: 8 },
    { id: "catastrophe-consequence-boost-label", kind: "note", x: 688, y: 326, width: 180, height: 28, zIndex: 8 },
    { id: "catastrophe-consequence-injury", kind: "card", x: 130, y: 370, ...catastropheCard, zIndex: 4 },
    { id: "catastrophe-consequence-complication", kind: "card", x: 428, y: 370, ...catastropheCard, zIndex: 4 },
    { id: "catastrophe-consequence-boost", kind: "card", x: 726, y: 370, ...catastropheCard, zIndex: 4 },
  ],
};

export const catastropheFlowMobileBoard: RulebookBoardExample = {
  boardSize: { width: 380, height: 780 },
  items: [
    { id: "catastrophe-resolved-label", kind: "note", x: 20, y: 16, width: 140, height: 30, zIndex: 8 },
    { id: "catastrophe-draw-label", kind: "note", x: 220, y: 16, width: 140, height: 30, zIndex: 8 },
    { id: "catastrophe-resolved", kind: "card", x: 48, y: 58, ...catastropheCard, zIndex: 4 },
    { id: "catastrophe-arrow-resolved-draw", kind: "note", x: 166, y: 110, width: 48, height: 48, zIndex: 8 },
    { id: "catastrophe-draw", kind: "card", x: 227, y: 58, ...catastropheCard, zIndex: 4 },
    { id: "catastrophe-fumbles-label", kind: "note", x: 20, y: 242, width: 340, height: 30, zIndex: 8 },
    { id: "catastrophe-fumble-first", kind: "card", x: 94, y: 282, ...catastropheCard, zIndex: 2 },
    { id: "catastrophe-fumble-second", kind: "card", x: 137, y: 274, ...catastropheCard, zIndex: 3 },
    { id: "catastrophe-fumble-third", kind: "card", x: 180, y: 282, ...catastropheCard, zIndex: 4 },
    { id: "catastrophe-arrow-draw-fumbles", kind: "note", x: 166, y: 222, width: 48, height: 18, zIndex: 8 },
    { id: "catastrophe-arrow-fumbles-trigger", kind: "note", x: 166, y: 448, width: 48, height: 28, zIndex: 8 },
    { id: "catastrophe-trigger", kind: "note", x: 40, y: 486, width: 300, height: 38, zIndex: 8 },
    { id: "catastrophe-arrow-trigger-consequences", kind: "note", x: 166, y: 526, width: 48, height: 18, zIndex: 8 },
    { id: "catastrophe-consequence-title", kind: "note", x: 20, y: 550, width: 340, height: 28, zIndex: 8 },
    { id: "catastrophe-consequence-injury", kind: "card", x: 25, y: 594, ...catastropheCard, zIndex: 4 },
    { id: "catastrophe-consequence-complication", kind: "card", x: 138, y: 594, ...catastropheCard, zIndex: 4 },
    { id: "catastrophe-consequence-boost", kind: "card", x: 251, y: 594, ...catastropheCard, zIndex: 4 },
  ],
};

const statusCard = { width: 90, height: 156 };

export const statusThresholdsBoard: RulebookBoardExample = {
  boardSize: { width: 960, height: 620 },
  items: [
    { id: "distress-title", kind: "note", x: 30, y: 16, width: 180, height: 32, zIndex: 8 },
    { id: "distress-ok", kind: "note", x: 30, y: 128, width: 140, height: 38, zIndex: 8 },
    { id: "distress-arrow-ok-three", kind: "note", x: 185, y: 122, width: 42, height: 48, zIndex: 8 },
    { id: "distress-three", kind: "card", x: 242, y: 66, ...statusCard, zIndex: 4 },
    { id: "status-panicked", kind: "card", x: 350, y: 66, ...statusCard, zIndex: 4 },
    { id: "distress-count-three", kind: "note", x: 298, y: 76, width: 34, height: 24, zIndex: 10 },
    { id: "distress-arrow-three-four", kind: "note", x: 456, y: 122, width: 42, height: 48, zIndex: 8 },
    { id: "distress-recover", kind: "note", x: 430, y: 230, width: 110, height: 26, zIndex: 8 },
    { id: "distress-four", kind: "card", x: 548, y: 66, ...statusCard, zIndex: 4 },
    { id: "status-hopeless", kind: "card", x: 656, y: 66, ...statusCard, zIndex: 4 },
    { id: "distress-count-four", kind: "note", x: 604, y: 76, width: 34, height: 24, zIndex: 10 },
    { id: "distress-three-label", kind: "note", x: 222, y: 262, width: 200, height: 30, zIndex: 8 },
    { id: "distress-four-label", kind: "note", x: 528, y: 262, width: 200, height: 30, zIndex: 8 },
    { id: "injury-title", kind: "note", x: 30, y: 330, width: 180, height: 32, zIndex: 8 },
    { id: "injury-ok", kind: "note", x: 30, y: 442, width: 140, height: 38, zIndex: 8 },
    { id: "injury-arrow-ok-four", kind: "note", x: 210, y: 436, width: 42, height: 48, zIndex: 8 },
    { id: "injury-four", kind: "card", x: 300, y: 380, ...statusCard, zIndex: 4 },
    { id: "status-taken-out", kind: "card", x: 408, y: 380, ...statusCard, zIndex: 4 },
    { id: "injury-count-four", kind: "note", x: 356, y: 390, width: 34, height: 24, zIndex: 10 },
    { id: "injury-four-label", kind: "note", x: 280, y: 576, width: 220, height: 30, zIndex: 8 },
  ],
};

export const statusThresholdsMobileBoard: RulebookBoardExample = {
  boardSize: { width: 380, height: 990 },
  items: [
    { id: "distress-title", kind: "note", x: 20, y: 16, width: 340, height: 30, zIndex: 8 },
    { id: "distress-ok", kind: "note", x: 90, y: 58, width: 200, height: 32, zIndex: 8 },
    { id: "distress-arrow-ok-three", kind: "note", x: 166, y: 94, width: 48, height: 26, zIndex: 8 },
    { id: "distress-three", kind: "card", x: 54, y: 128, ...statusCard, zIndex: 4 },
    { id: "status-panicked", kind: "card", x: 236, y: 128, ...statusCard, zIndex: 4 },
    { id: "distress-count-three", kind: "note", x: 110, y: 138, width: 34, height: 24, zIndex: 10 },
    { id: "distress-three-label", kind: "note", x: 20, y: 298, width: 340, height: 28, zIndex: 8 },
    { id: "distress-recover", kind: "note", x: 60, y: 344, width: 260, height: 28, zIndex: 8 },
    { id: "distress-arrow-three-four", kind: "note", x: 166, y: 376, width: 48, height: 26, zIndex: 8 },
    { id: "distress-four", kind: "card", x: 54, y: 410, ...statusCard, zIndex: 4 },
    { id: "status-hopeless", kind: "card", x: 236, y: 410, ...statusCard, zIndex: 4 },
    { id: "distress-count-four", kind: "note", x: 110, y: 420, width: 34, height: 24, zIndex: 10 },
    { id: "distress-four-label", kind: "note", x: 20, y: 580, width: 340, height: 28, zIndex: 8 },
    { id: "injury-title", kind: "note", x: 20, y: 644, width: 340, height: 30, zIndex: 8 },
    { id: "injury-ok", kind: "note", x: 90, y: 686, width: 200, height: 32, zIndex: 8 },
    { id: "injury-arrow-ok-four", kind: "note", x: 166, y: 722, width: 48, height: 26, zIndex: 8 },
    { id: "injury-four", kind: "card", x: 54, y: 756, ...statusCard, zIndex: 4 },
    { id: "status-taken-out", kind: "card", x: 236, y: 756, ...statusCard, zIndex: 4 },
    { id: "injury-count-four", kind: "note", x: 110, y: 766, width: 34, height: 24, zIndex: 10 },
    { id: "injury-four-label", kind: "note", x: 20, y: 926, width: 340, height: 28, zIndex: 8 },
  ],
};
