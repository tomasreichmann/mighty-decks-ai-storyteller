import type {
  SpaceshipDragState,
  SpaceshipDraggableCard,
  SpaceshipDraggableToken,
} from "./types";

export const clampInsertionIndex = (index: number, length: number): number =>
  Math.max(0, Math.min(length, index));

export const removeId = (ids: readonly string[], itemId: string): string[] =>
  ids.filter((id) => id !== itemId);

export const insertId = (
  ids: readonly string[],
  itemId: string,
  index: number,
): string[] => {
  const withoutItem = removeId(ids, itemId);
  const insertionIndex = clampInsertionIndex(index, withoutItem.length);
  return [
    ...withoutItem.slice(0, insertionIndex),
    itemId,
    ...withoutItem.slice(insertionIndex),
  ];
};

export const mapSpaceshipCards = (
  state: SpaceshipDragState,
  itemId: string,
  updater: (card: SpaceshipDraggableCard) => SpaceshipDraggableCard,
): SpaceshipDragState => ({
  ...state,
  cards: state.cards.map((card) =>
    card.itemId === itemId ? updater(card) : card,
  ),
});

export const mapSpaceshipTokens = (
  state: SpaceshipDragState,
  tokenId: string,
  updater: (token: SpaceshipDraggableToken) => SpaceshipDraggableToken,
): SpaceshipDragState => ({
  ...state,
  tokens: state.tokens.map((token) =>
    token.tokenId === tokenId ? updater(token) : token,
  ),
});

export const removeIds = (
  ids: readonly string[],
  removedIds: Set<string>,
): string[] => ids.filter((id) => !removedIds.has(id));
