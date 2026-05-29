import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type PropsWithChildren,
} from "react";
import {
  type BoardBounds,
  type BoardItemInput,
  type BoardItemRecord,
  type BoardPoint,
  type BoardSize,
  type BoardViewport,
  fitBoundsToFrame,
  fitItemsToFrame,
  frameToWorld as frameToWorldPoint,
  getItemBounds as getRecordBounds,
  getViewportBounds,
  isBoundsInViewport,
  normalizeItemInput,
  worldToFrame as worldToFramePoint,
  zoomAtFramePoint,
} from "../../lib/board/boardController";
import {
  boardRecordsToLayoutItems,
  deckLayout,
  fanLayout,
  flexLayout,
  pileLayout,
  stackLayout,
  type BoardDeckLayoutOptions,
  type BoardFanLayoutOptions,
  type BoardFlexLayoutOptions,
  type BoardLayoutItemBox,
  type BoardLayoutResult,
  type BoardPileLayoutOptions,
  type BoardStackLayoutOptions,
} from "../../lib/board/boardLayout";

type FocusState =
  | { mode: "board" }
  | { mode: "items"; ids?: string[] }
  | { mode: "item"; id: string }
  | { mode: "manual" };

export interface BoardTransitionOptions {
  smooth?: boolean;
  durationMs?: number;
}

export interface BoardFlexLayoutInput extends BoardFlexLayoutOptions {
  ids?: string[];
}

export interface BoardStackLayoutInput extends BoardStackLayoutOptions {
  ids?: string[];
}

export interface BoardDeckLayoutInput extends BoardDeckLayoutOptions {
  ids?: string[];
}

export interface BoardPileLayoutInput extends BoardPileLayoutOptions {
  ids?: string[];
}

export interface BoardFanLayoutInput extends BoardFanLayoutOptions {
  ids?: string[];
}

export interface BoardSnapshot {
  boardSize: BoardSize;
  frameSize: BoardSize;
  viewport: BoardViewport;
  items: BoardItemRecord[];
  viewportBounds: BoardBounds;
  focus: FocusState["mode"];
}

export interface BoardController {
  addItem: (input: BoardItemInput) => string;
  upsertItem: (input: BoardItemInput) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  fitBoard: (options?: BoardTransitionOptions) => void;
  fitItems: (ids?: string[], options?: BoardTransitionOptions) => void;
  focusItem: (id: string, options?: BoardTransitionOptions) => void;
  setViewport: (
    viewport: BoardViewport,
    options?: BoardTransitionOptions,
  ) => void;
  panBy: (delta: BoardPoint, options?: BoardTransitionOptions) => void;
  zoomAt: (
    framePoint: BoardPoint,
    zoom: number,
    options?: BoardTransitionOptions,
  ) => void;
  applyLayout: (
    layout: BoardLayoutResult,
    options?: BoardTransitionOptions,
  ) => void;
  applyFlexLayout: (
    input?: BoardFlexLayoutInput,
    options?: BoardTransitionOptions,
  ) => BoardLayoutResult;
  applyStackLayout: (
    input?: BoardStackLayoutInput,
    options?: BoardTransitionOptions,
  ) => BoardLayoutResult;
  applyDeckLayout: (
    input?: BoardDeckLayoutInput,
    options?: BoardTransitionOptions,
  ) => BoardLayoutResult;
  applyPileLayout: (
    input?: BoardPileLayoutInput,
    options?: BoardTransitionOptions,
  ) => BoardLayoutResult;
  applyFanLayout: (
    input?: BoardFanLayoutInput,
    options?: BoardTransitionOptions,
  ) => BoardLayoutResult;
  getLayoutItems: (ids?: string[]) => BoardLayoutItemBox[];
  setFrameSize: (size: BoardSize) => void;
  getSnapshot: () => BoardSnapshot;
  subscribe: (listener: (snapshot: BoardSnapshot) => void) => () => void;
}

interface BoardContextValue extends BoardController {
  boardSize: BoardSize;
  frameSize: BoardSize;
  viewport: BoardViewport;
  viewportBounds: BoardBounds;
  transitionDurationMs: number;
  items: BoardItemRecord[];
  itemCount: number;
  getItemBounds: (id: string) => BoardBounds | null;
  isItemInViewport: (id: string, margin?: number) => boolean;
  registerItemElement: (id: string, element: HTMLElement | null) => void;
  worldToFrame: (point: BoardPoint) => BoardPoint;
  frameToWorld: (point: BoardPoint) => BoardPoint;
}

interface BoardProviderProps extends PropsWithChildren {
  boardSize: BoardSize;
  initialItems?: BoardItemInput[];
  initialViewport?: BoardViewport;
}

interface BoardState {
  boardSize: BoardSize;
  frameSize: BoardSize;
  viewport: BoardViewport;
  focus: FocusState;
  items: Map<string, BoardItemRecord>;
  transitionDurationMs: number;
  transitionToken: number;
}

type BoardAction =
  | { type: "set-frame-size"; size: BoardSize }
  | { type: "measure-item"; id: string; size: BoardSize }
  | { type: "upsert-item"; input: BoardItemInput; fallbackId: string }
  | { type: "remove-item"; id: string }
  | { type: "clear-items" }
  | { type: "fit-board"; options?: BoardTransitionOptions }
  | { type: "fit-items"; ids?: string[]; options?: BoardTransitionOptions }
  | { type: "focus-item"; id: string; options?: BoardTransitionOptions }
  | {
      type: "set-viewport";
      viewport: BoardViewport;
      options?: BoardTransitionOptions;
    }
  | { type: "pan-by"; delta: BoardPoint; options?: BoardTransitionOptions }
  | {
      type: "zoom-at";
      framePoint: BoardPoint;
      zoom: number;
      options?: BoardTransitionOptions;
    }
  | {
      type: "apply-layout";
      layout: BoardLayoutResult;
      options?: BoardTransitionOptions;
    }
  | { type: "clear-transition"; token: number };

const BoardContext = createContext<BoardContextValue | null>(null);

const defaultFrameSize: BoardSize = {
  width: 1,
  height: 1,
};

const createItemId = (): string => {
  if (globalThis.crypto?.randomUUID) {
    return `board-item-${globalThis.crypto.randomUUID()}`;
  }

  return `board-item-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

const createInitialBoardState = ({
  boardSize,
  initialItems,
  initialViewport,
}: {
  boardSize: BoardSize;
  initialItems: BoardItemInput[];
  initialViewport?: BoardViewport;
}): BoardState => {
  const items = new Map<string, BoardItemRecord>();
  initialItems.forEach((item, index) => {
    const record = normalizeItemInput(
      {
        zIndex: index,
        ...item,
      },
      createItemId(),
    );
    items.set(record.id, record);
  });

  return {
    boardSize,
    frameSize: defaultFrameSize,
    viewport:
      initialViewport ??
      fitBoundsToFrame({
        bounds: { x: 0, y: 0, ...boardSize },
        frameSize: defaultFrameSize,
      }),
    focus: initialViewport ? { mode: "manual" } : { mode: "board" },
    items,
    transitionDurationMs: 0,
    transitionToken: 0,
  };
};

const createSnapshot = ({
  boardSize,
  frameSize,
  viewport,
  items,
  focus,
}: BoardState): BoardSnapshot => ({
  boardSize,
  frameSize,
  viewport,
  items: Array.from(items.values()),
  viewportBounds: getViewportBounds({ viewport, frameSize }),
  focus: focus.mode,
});

const resolveTransitionDuration = (
  options?: BoardTransitionOptions,
): number => {
  if (!options?.smooth) {
    return 0;
  }

  return Math.max(0, options.durationMs ?? 220);
};

const withTransition = (
  state: BoardState,
  options?: BoardTransitionOptions,
): Pick<BoardState, "transitionDurationMs" | "transitionToken"> => ({
  transitionDurationMs: resolveTransitionDuration(options),
  transitionToken: state.transitionToken + 1,
});

const viewportForFocus = (
  state: BoardState,
  focus: FocusState,
  frameSize = state.frameSize,
  items = state.items,
): BoardViewport => {
  if (focus.mode === "items") {
    return fitItemsToFrame({
      items,
      ids: focus.ids,
      frameSize,
      fallbackBounds: { x: 0, y: 0, ...state.boardSize },
    });
  }

  if (focus.mode === "item") {
    return fitItemsToFrame({
      items,
      ids: [focus.id],
      frameSize,
      fallbackBounds: { x: 0, y: 0, ...state.boardSize },
    });
  }

  return fitBoundsToFrame({
    bounds: { x: 0, y: 0, ...state.boardSize },
    frameSize,
  });
};

const boardReducer = (state: BoardState, action: BoardAction): BoardState => {
  switch (action.type) {
    case "set-frame-size": {
      const viewport =
        state.focus.mode === "manual"
          ? (() => {
              const center = frameToWorldPoint(
                {
                  x: state.frameSize.width / 2,
                  y: state.frameSize.height / 2,
                },
                state.viewport,
              );
              return {
                ...state.viewport,
                x: center.x - action.size.width / state.viewport.zoom / 2,
                y: center.y - action.size.height / state.viewport.zoom / 2,
              };
            })()
          : viewportForFocus(state, state.focus, action.size);

      return {
        ...state,
        frameSize: action.size,
        viewport,
      };
    }

    case "measure-item": {
      const existing = state.items.get(action.id);
      if (
        !existing ||
        (existing.measuredWidth === action.size.width &&
          existing.measuredHeight === action.size.height)
      ) {
        return state;
      }

      const items = new Map(state.items);
      items.set(action.id, {
        ...existing,
        measuredWidth: action.size.width,
        measuredHeight: action.size.height,
      });

      return {
        ...state,
        items,
        viewport:
          state.focus.mode === "manual"
            ? state.viewport
            : viewportForFocus(state, state.focus, state.frameSize, items),
      };
    }

    case "upsert-item": {
      const id = action.input.id ?? action.fallbackId;
      const existing = state.items.get(id);
      const items = new Map(state.items);
      items.set(id, {
        ...normalizeItemInput(action.input, action.fallbackId),
        id,
        zIndex: action.input.zIndex ?? existing?.zIndex ?? state.items.size,
        rotation: action.input.rotation ?? existing?.rotation,
        measuredWidth: existing?.measuredWidth,
        measuredHeight: existing?.measuredHeight,
      });

      return {
        ...state,
        items,
      };
    }

    case "remove-item": {
      const items = new Map(state.items);
      items.delete(action.id);
      return {
        ...state,
        items,
      };
    }

    case "clear-items":
      return {
        ...state,
        items: new Map(),
      };

    case "fit-board": {
      const focus: FocusState = { mode: "board" };
      return {
        ...state,
        focus,
        viewport: viewportForFocus(state, focus),
        ...withTransition(state, action.options),
      };
    }

    case "fit-items": {
      const focus: FocusState = { mode: "items", ids: action.ids };
      return {
        ...state,
        focus,
        viewport: viewportForFocus(state, focus),
        ...withTransition(state, action.options),
      };
    }

    case "focus-item": {
      const focus: FocusState = { mode: "item", id: action.id };
      return {
        ...state,
        focus,
        viewport: viewportForFocus(state, focus),
        ...withTransition(state, action.options),
      };
    }

    case "set-viewport":
      return {
        ...state,
        focus: { mode: "manual" },
        viewport: action.viewport,
        ...withTransition(state, action.options),
      };

    case "pan-by":
      return {
        ...state,
        focus: { mode: "manual" },
        viewport: {
          ...state.viewport,
          x: state.viewport.x + action.delta.x,
          y: state.viewport.y + action.delta.y,
        },
        ...withTransition(state, action.options),
      };

    case "zoom-at":
      return {
        ...state,
        focus: { mode: "manual" },
        viewport: zoomAtFramePoint({
          viewport: state.viewport,
          framePoint: action.framePoint,
          zoom: action.zoom,
        }),
        ...withTransition(state, action.options),
      };

    case "apply-layout": {
      const items = new Map(state.items);
      let changed = false;

      for (const placement of action.layout.placements) {
        const existing = items.get(placement.id);
        if (!existing) {
          continue;
        }

        const nextItem: BoardItemRecord = {
          ...existing,
          x: placement.x,
          y: placement.y,
          width: placement.width,
          height: placement.height,
          zIndex: placement.zIndex ?? existing.zIndex,
          rotation: placement.rotation,
        };
        changed =
          changed ||
          nextItem.x !== existing.x ||
          nextItem.y !== existing.y ||
          nextItem.width !== existing.width ||
          nextItem.height !== existing.height ||
          nextItem.zIndex !== existing.zIndex ||
          nextItem.rotation !== existing.rotation;
        items.set(placement.id, nextItem);
      }

      if (!changed) {
        return state;
      }

      return {
        ...state,
        focus: { mode: "manual" },
        items,
        ...withTransition(state, action.options),
      };
    }

    case "clear-transition":
      if (action.token !== state.transitionToken) {
        return state;
      }
      return {
        ...state,
        transitionDurationMs: 0,
      };

    default:
      return state;
  }
};

export const BoardProvider = ({
  boardSize,
  initialItems = [],
  initialViewport,
  children,
}: BoardProviderProps): JSX.Element => {
  const itemResizeObservers = useRef(new Map<string, ResizeObserver>());
  const itemElements = useRef(new Map<string, HTMLElement>());
  const listeners = useRef(new Set<(snapshot: BoardSnapshot) => void>());
  const [state, dispatch] = useReducer(
    boardReducer,
    { boardSize, initialItems, initialViewport },
    createInitialBoardState,
  );
  const stateRef = useRef(state);
  stateRef.current = state;

  const publishSnapshot = useCallback((nextState: BoardState): void => {
    const snapshot = createSnapshot(nextState);
    for (const listener of listeners.current) {
      listener(snapshot);
    }
  }, []);

  const dispatchBoardAction = useCallback(
    (action: BoardAction): void => {
      const nextState = boardReducer(stateRef.current, action);
      stateRef.current = nextState;
      publishSnapshot(nextState);
      dispatch(action);
    },
    [publishSnapshot],
  );

  useEffect(() => {
    if (state.transitionDurationMs <= 0) {
      return;
    }

    const token = state.transitionToken;
    const timeoutId = window.setTimeout(() => {
      dispatchBoardAction({ type: "clear-transition", token });
    }, state.transitionDurationMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [dispatchBoardAction, state.transitionDurationMs, state.transitionToken]);

  const registerItemElement = useCallback(
    (id: string, element: HTMLElement | null): void => {
      if (element && itemElements.current.get(id) === element) {
        return;
      }

      itemResizeObservers.current.get(id)?.disconnect();
      itemResizeObservers.current.delete(id);

      if (!element) {
        itemElements.current.delete(id);
        return;
      }

      itemElements.current.set(id, element);
      const measure = (): void => {
        dispatchBoardAction({
          type: "measure-item",
          id,
          size: {
            width: element.offsetWidth,
            height: element.offsetHeight,
          },
        });
      };
      const observer = new ResizeObserver(measure);
      observer.observe(element);
      itemResizeObservers.current.set(id, observer);
      measure();
    },
    [dispatchBoardAction],
  );

  const controller = useMemo<BoardController>(
    () => ({
      addItem: (input) => {
        const id = input.id ?? createItemId();
        dispatchBoardAction({
          type: "upsert-item",
          input: { ...input, id },
          fallbackId: id,
        });
        return id;
      },
      upsertItem: (input) =>
        dispatchBoardAction({
          type: "upsert-item",
          input,
          fallbackId: input.id ?? createItemId(),
        }),
      removeItem: (id) => {
        itemResizeObservers.current.get(id)?.disconnect();
        itemResizeObservers.current.delete(id);
        itemElements.current.delete(id);
        dispatchBoardAction({ type: "remove-item", id });
      },
      clear: () => {
        for (const observer of itemResizeObservers.current.values()) {
          observer.disconnect();
        }
        itemResizeObservers.current.clear();
        itemElements.current.clear();
        dispatchBoardAction({ type: "clear-items" });
      },
      fitBoard: (options) =>
        dispatchBoardAction({ type: "fit-board", options }),
      fitItems: (ids, options) =>
        dispatchBoardAction({ type: "fit-items", ids, options }),
      focusItem: (id, options) =>
        dispatchBoardAction({ type: "focus-item", id, options }),
      setViewport: (viewport, options) =>
        dispatchBoardAction({ type: "set-viewport", viewport, options }),
      panBy: (delta, options) =>
        dispatchBoardAction({ type: "pan-by", delta, options }),
      zoomAt: (framePoint, zoom, options) =>
        dispatchBoardAction({ type: "zoom-at", framePoint, zoom, options }),
      applyLayout: (layout, options) =>
        dispatchBoardAction({ type: "apply-layout", layout, options }),
      applyFlexLayout: (input = {}, options) => {
        const { ids, ...layoutOptions } = input;
        const layout = flexLayout(
          boardRecordsToLayoutItems(stateRef.current.items.values(), ids),
          layoutOptions,
        );
        dispatchBoardAction({ type: "apply-layout", layout, options });
        return layout;
      },
      applyStackLayout: (input = {}, options) => {
        const { ids, ...layoutOptions } = input;
        const layout = stackLayout(
          boardRecordsToLayoutItems(stateRef.current.items.values(), ids),
          layoutOptions,
        );
        dispatchBoardAction({ type: "apply-layout", layout, options });
        return layout;
      },
      applyDeckLayout: (input = {}, options) => {
        const { ids, ...layoutOptions } = input;
        const layout = deckLayout(
          boardRecordsToLayoutItems(stateRef.current.items.values(), ids),
          layoutOptions,
        );
        dispatchBoardAction({ type: "apply-layout", layout, options });
        return layout;
      },
      applyPileLayout: (input = {}, options) => {
        const { ids, ...layoutOptions } = input;
        const layout = pileLayout(
          boardRecordsToLayoutItems(stateRef.current.items.values(), ids),
          layoutOptions,
        );
        dispatchBoardAction({ type: "apply-layout", layout, options });
        return layout;
      },
      applyFanLayout: (input = {}, options) => {
        const { ids, ...layoutOptions } = input;
        const layout = fanLayout(
          boardRecordsToLayoutItems(stateRef.current.items.values(), ids),
          layoutOptions,
        );
        dispatchBoardAction({ type: "apply-layout", layout, options });
        return layout;
      },
      getLayoutItems: (ids) =>
        boardRecordsToLayoutItems(stateRef.current.items.values(), ids),
      setFrameSize: (size) =>
        dispatchBoardAction({ type: "set-frame-size", size }),
      getSnapshot: () => createSnapshot(stateRef.current),
      subscribe: (listener) => {
        listeners.current.add(listener);
        listener(createSnapshot(stateRef.current));
        return () => {
          listeners.current.delete(listener);
        };
      },
    }),
    [dispatchBoardAction],
  );

  const viewportBounds = useMemo(
    () =>
      getViewportBounds({
        viewport: state.viewport,
        frameSize: state.frameSize,
      }),
    [state.frameSize, state.viewport],
  );

  const getItemBounds = useCallback(
    (id: string): BoardBounds | null => {
      const item = state.items.get(id);
      return item ? getRecordBounds(item) : null;
    },
    [state.items],
  );

  const isItemInViewport = useCallback(
    (id: string, margin = 0): boolean => {
      const bounds = getItemBounds(id);
      return bounds
        ? isBoundsInViewport({ bounds, viewportBounds, margin })
        : false;
    },
    [getItemBounds, viewportBounds],
  );

  const contextValue = useMemo<BoardContextValue>(
    () => ({
      ...controller,
      boardSize: state.boardSize,
      frameSize: state.frameSize,
      viewport: state.viewport,
      viewportBounds,
      transitionDurationMs: state.transitionDurationMs,
      items: Array.from(state.items.values()),
      itemCount: state.items.size,
      getItemBounds,
      isItemInViewport,
      registerItemElement,
      worldToFrame: (point) => worldToFramePoint(point, state.viewport),
      frameToWorld: (point) => frameToWorldPoint(point, state.viewport),
    }),
    [
      controller,
      getItemBounds,
      isItemInViewport,
      registerItemElement,
      state.boardSize,
      state.frameSize,
      state.items,
      state.transitionDurationMs,
      state.viewport,
      viewportBounds,
    ],
  );

  return (
    <BoardContext.Provider value={contextValue}>{children}</BoardContext.Provider>
  );
};

export const useBoard = (): BoardContextValue => {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error("useBoard must be used within BoardProvider");
  }
  return context;
};
