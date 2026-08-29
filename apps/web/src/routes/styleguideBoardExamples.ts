import type { BoardItemInput, BoardSize } from "../lib/board/boardController";
import {
  deckLayout,
  fanLayout,
  flexLayout,
  pileLayout,
  stackLayout,
  type BoardLayoutItemBox,
  type BoardLayoutResult,
} from "../lib/board/boardLayout";

export interface StyleguideBoardExample {
  id: string;
  boardSize: BoardSize;
  items: BoardItemInput[];
}

export interface StyleguideLayoutRecipe extends StyleguideBoardExample {
  layout: "flex" | "stack" | "deck" | "pile" | "fan";
  useWhen: string;
  keyOptions: string;
  commonMistake: string;
}

interface ItemCopy {
  title: string;
  body: string;
  kind?: BoardItemInput["kind"];
}

const toBoardItems = (
  layout: BoardLayoutResult,
  copy: Record<string, ItemCopy>,
): BoardItemInput[] =>
  layout.placements.map((placement) => {
    const itemCopy = copy[placement.id];

    return {
      id: placement.id,
      kind: itemCopy.kind ?? "card",
      x: placement.x,
      y: placement.y,
      width: placement.width,
      height: placement.height,
      zIndex: placement.zIndex,
      rotation: placement.rotation,
      title: itemCopy.title,
      body: itemCopy.body,
    };
  });

const recipeBoxes = (prefix: string): BoardLayoutItemBox[] => [
  { id: `${prefix}-first`, width: 150, height: 110 },
  { id: `${prefix}-second`, width: 150, height: 110 },
  { id: `${prefix}-third`, width: 150, height: 110 },
];

const recipeCopy = (prefix: string): Record<string, ItemCopy> => ({
  [`${prefix}-first`]: { title: "First", body: "A flat board item.", kind: "note" },
  [`${prefix}-second`]: { title: "Second", body: "Placement comes from the helper.", kind: "note" },
  [`${prefix}-third`]: { title: "Third", body: "Render after flattening.", kind: "note" },
});

const flexRecipe = flexLayout(recipeBoxes("flex"), {
  x: 28,
  y: 64,
  gap: 22,
});

const stackRecipe = stackLayout(recipeBoxes("stack"), {
  x: 160,
  y: 38,
  offset: { x: 0, y: 36 },
  zIndexStart: 1,
});

const deckRecipe = deckLayout(recipeBoxes("deck"), {
  x: 160,
  y: 68,
  offset: { x: 0, y: -16 },
  zIndexStart: 1,
});

const pileRecipe = pileLayout(recipeBoxes("pile"), {
  x: 160,
  y: 56,
  maxRotation: 8,
  zIndexStart: 1,
});

const fanRecipe = fanLayout(recipeBoxes("fan"), {
  x: 46,
  y: 54,
  overlap: 54,
  arcAngle: 28,
  zIndexStart: 1,
});

export const layoutRecipeExamples: StyleguideLayoutRecipe[] = [
  {
    id: "flex-layout",
    layout: "flex",
    boardSize: { width: 540, height: 250 },
    items: toBoardItems(flexRecipe, recipeCopy("flex")),
    useWhen: "You need an evenly spaced row or wrapped hand of independent pieces.",
    keyOptions: "direction, gap, rowGap, columnGap, wrapLimit",
    commonMistake: "Do not use a flex wrapper inside the transformed board; flatten its placements first.",
  },
  {
    id: "stack-layout",
    layout: "stack",
    boardSize: { width: 480, height: 250 },
    items: toBoardItems(stackRecipe, recipeCopy("stack")),
    useWhen: "Cards share ownership and need deliberate header peeks.",
    keyOptions: "align, offset, itemOffsets, rotations, zIndexStart",
    commonMistake: "Do not rely on DOM order alone when the overlap tells a rules story.",
  },
  {
    id: "deck-layout",
    layout: "deck",
    boardSize: { width: 480, height: 250 },
    items: toBoardItems(deckRecipe, recipeCopy("deck")),
    useWhen: "A compact same-sized deck needs a subtle, repeatable edge.",
    keyOptions: "offset, align, zIndexStart",
    commonMistake: "Do not space a deck like a hand; keep its edges tight.",
  },
  {
    id: "pile-layout",
    layout: "pile",
    boardSize: { width: 480, height: 250 },
    items: toBoardItems(pileRecipe, recipeCopy("pile")),
    useWhen: "A discard or messy shared pile benefits from bounded variation.",
    keyOptions: "maxRotation, rotations, align, zIndexStart",
    commonMistake: "Do not use unbounded random rotation in a reusable illustration.",
  },
  {
    id: "fan-layout",
    layout: "fan",
    boardSize: { width: 480, height: 250 },
    items: toBoardItems(fanRecipe, recipeCopy("fan")),
    useWhen: "A small hand should read left-to-right without becoming a list.",
    keyOptions: "overlap, arcAngle, zIndexStart, zIndexStep",
    commonMistake: "Do not fan so widely that titles or controls fall outside the figure.",
  },
];

const canonicalLayout = flexLayout(
  [
    { id: "canonical-location", width: 230, height: 180 },
    { id: "canonical-effect", width: 140, height: 200 },
    { id: "canonical-actor", width: 150, height: 210 },
    { id: "canonical-counter", width: 150, height: 170 },
    { id: "canonical-token", width: 66, height: 66 },
  ],
  { x: 30, y: 104, gap: 24 },
);

export const canonicalBoardExample: StyleguideBoardExample = {
  id: "canonical-components",
  boardSize: { width: 880, height: 360 },
  items: toBoardItems(canonicalLayout, {
    "canonical-location": { title: "Location", body: "Use the real LocationCard." },
    "canonical-effect": { title: "Effect", body: "Resolve a catalog card." },
    "canonical-actor": { title: "Actor", body: "Use ActorCard." },
    "canonical-counter": { title: "Counter", body: "Use CounterCard." },
    "canonical-token": { title: "Token", body: "Use a circular marker." },
  }),
};

const spaceshipLayers = stackLayout(
  [
    { id: "spaceship-effect", width: 220, height: 150 },
    { id: "spaceship-location", width: 340, height: 230 },
    { id: "spaceship-device", width: 130, height: 180 },
  ],
  {
    x: 86,
    y: 126,
    itemOffsets: {
      "spaceship-location": { x: 64, y: 0 },
      "spaceship-device": { x: 226, y: 28 },
    },
    zIndexStart: 1,
  },
);

const spaceshipCrew = flexLayout(
  [
    { id: "spaceship-actor-card", width: 150, height: 210, zIndex: 3 },
    { id: "spaceship-energy-token", width: 56, height: 56, zIndex: 5 },
    { id: "spaceship-actor-token", width: 62, height: 62, zIndex: 6 },
  ],
  { x: 550, y: 142, gap: 36 },
);

export const spaceshipCompositionExample: StyleguideBoardExample = {
  id: "spaceship-composition",
  boardSize: { width: 900, height: 430 },
  items: [
    ...toBoardItems(spaceshipLayers, {
      "spaceship-effect": { title: "Effect", body: "Tucked behind its owner." },
      "spaceship-location": { title: "Ship location", body: "The owner surface." },
      "spaceship-device": { title: "Device", body: "Placed above the Location." },
    }),
    ...toBoardItems(spaceshipCrew, {
      "spaceship-actor-card": { title: "Crew", body: "A flat group member." },
      "spaceship-energy-token": { title: "Energy", body: "Token above cards." },
      "spaceship-actor-token": { title: "Pilot", body: "Token above cards." },
    }),
  ],
};

const rulesFigure = flexLayout(
  [
    { id: "rules-location", width: 260, height: 170 },
    { id: "rules-counter", width: 130, height: 160 },
    { id: "rules-actor", width: 150, height: 190 },
  ],
  { x: 34, y: 54, gap: 30 },
);

const rulesOutcomes = fanLayout(
  [
    { id: "rules-outcome-a", width: 110, height: 150 },
    { id: "rules-outcome-b", width: 110, height: 150 },
    { id: "rules-outcome-c", width: 110, height: 150 },
  ],
  { x: 548, y: 222, overlap: 42, arcAngle: 22, zIndexStart: 4 },
);

export const rulesIllustrationExample: StyleguideBoardExample = {
  id: "rules-illustration",
  boardSize: { width: 900, height: 410 },
  items: [
    ...toBoardItems(rulesFigure, {
      "rules-location": { title: "Location", body: "The scene anchor." },
      "rules-counter": { title: "Pressure", body: "Visible escalation." },
      "rules-actor": { title: "Actor", body: "A named participant." },
    }),
    ...toBoardItems(rulesOutcomes, {
      "rules-outcome-a": { title: "Outcome", body: "A possible result." },
      "rules-outcome-b": { title: "Outcome", body: "A possible result." },
      "rules-outcome-c": { title: "Outcome", body: "A possible result." },
    }),
  ],
};
