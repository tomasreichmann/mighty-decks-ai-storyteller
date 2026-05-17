export interface CardLibraryOverlayState {
  open: boolean;
  selectedEntryIds: string[];
}

export const createCardLibraryOverlayState = (): CardLibraryOverlayState => ({
  open: false,
  selectedEntryIds: [],
});

export const toggleCardLibraryOpen = (
  state: CardLibraryOverlayState,
  open: boolean,
): CardLibraryOverlayState => ({
  ...state,
  open,
});

export const toggleCardLibraryEntrySelection = (
  state: CardLibraryOverlayState,
  entryId: string,
): CardLibraryOverlayState => {
  const selectedEntryIds = state.selectedEntryIds.includes(entryId)
    ? state.selectedEntryIds.filter((currentId) => currentId !== entryId)
    : [...state.selectedEntryIds, entryId];

  return {
    ...state,
    selectedEntryIds,
  };
};
