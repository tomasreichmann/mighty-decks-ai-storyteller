import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  SpaceshipBoardState,
  SpaceshipBoardStateSummary,
  SpaceshipBoardViewport,
} from "@mighty-decks/spec/spaceshipBoardState";
import { CardLibraryOverlay } from "../components/spaceship/CardLibraryOverlay";
import {
  SpaceshipBoard,
  type SpaceshipBoardExternalController,
} from "../components/spaceship/SpaceshipBoard";
import { Button } from "../components/common/Button";
import {
  createCardLibraryOverlayState,
  toggleCardLibraryEntrySelection,
  toggleCardLibraryOpen,
} from "../lib/spaceship/scene/state";
import { spaceshipScene } from "../lib/spaceship/scene/data";
import {
  createSpaceshipDragState,
  syncSpaceshipCardPositions,
  syncSpaceshipTokenPositions,
} from "../lib/spaceship/drag/state";
import {
  applySpaceshipAgentOperations,
  resolveSpaceshipAgentPane,
  type ApplySpaceshipAgentOperationsResult,
  type SpaceshipAgentOperation,
} from "../lib/spaceship/agentConnector";
import { getSpaceshipBoardPaneItemIds } from "../lib/spaceship/board/layout";
import type { BoardSnapshot } from "../components/board/BoardProvider";
import type { SpaceshipDragState } from "../lib/spaceship/drag/types";
import type { SpaceshipScene } from "../lib/spaceship/scene/types";
import {
  getDefaultSpaceshipBoardState,
  getSpaceshipBoardState,
  listSpaceshipBoardStates,
  saveSpaceshipBoardState,
  setDefaultSpaceshipBoardState,
} from "../lib/spaceshipBoardStateApi";

interface SpaceshipConnectorSnapshot {
  scene: SpaceshipScene;
  dragState: SpaceshipDragState;
  board?: BoardSnapshot;
}

interface SpaceshipApplyOperationOptions {
  focus?: "none" | "first-result" | "all-results";
}

interface SpaceshipBrowserConnector {
  getSnapshot: () => SpaceshipConnectorSnapshot;
  applyOperations: (
    operations: readonly SpaceshipAgentOperation[],
    options?: SpaceshipApplyOperationOptions,
  ) => ApplySpaceshipAgentOperationsResult;
  focusPane: (pane: string) => boolean;
  focusItem: (itemId: string) => boolean;
}

declare global {
  interface Window {
    mightyDecksSpaceship?: SpaceshipBrowserConnector;
  }
}

const fallbackStateId = "exiles-corvette-vs-raider";

const toBoardStateId = (name: string): string => {
  const slug = name
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  return slug.length > 0 ? slug : `spaceship-state-${Date.now().toString(36)}`;
};

const toJsonObject = (value: unknown): Record<string, unknown> =>
  structuredClone(value) as Record<string, unknown>;

export const SpaceshipPage = (): JSX.Element => {
  const [cardLibrary, setCardLibrary] = useState(createCardLibraryOverlayState());
  const [scene, setScene] = useState<SpaceshipScene>(() =>
    structuredClone(spaceshipScene),
  );
  const [dragState, setDragState] = useState(() =>
    createSpaceshipDragState(spaceshipScene),
  );
  const [boardStates, setBoardStates] = useState<SpaceshipBoardStateSummary[]>([]);
  const [defaultStateId, setDefaultStateId] = useState<string>(fallbackStateId);
  const [selectedStateId, setSelectedStateId] = useState<string>(fallbackStateId);
  const [selectedStateName, setSelectedStateName] = useState<string>(
    "Exiles Corvette vs Raider",
  );
  const [savedViewport, setSavedViewport] =
    useState<SpaceshipBoardViewport | null>(null);
  const [boardInstanceKey, setBoardInstanceKey] = useState<string>("seeded");
  const [isLoadingBoardState, setIsLoadingBoardState] = useState(true);
  const [boardStateError, setBoardStateError] = useState<string | null>(null);
  const [boardStateMessage, setBoardStateMessage] = useState<string | null>(null);
  const sceneRef = useRef(scene);
  const dragStateRef = useRef(dragState);
  const boardControllerRef = useRef<SpaceshipBoardExternalController | null>(null);

  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);

  useEffect(() => {
    dragStateRef.current = dragState;
  }, [dragState]);

  const applyBoardState = useCallback((state: SpaceshipBoardState): void => {
    const nextScene = structuredClone(state.scene) as unknown as SpaceshipScene;
    const nextDragState = structuredClone(
      state.dragState,
    ) as unknown as SpaceshipDragState;
    sceneRef.current = nextScene;
    dragStateRef.current = nextDragState;
    setScene(nextScene);
    setDragState(nextDragState);
    setSavedViewport(state.viewport);
    setSelectedStateId(state.stateId);
    setSelectedStateName(state.name);
    setBoardInstanceKey(`${state.stateId}:${state.updatedAtIso}`);
  }, []);

  const refreshBoardStateList = useCallback(async (): Promise<void> => {
    const list = await listSpaceshipBoardStates();
    setBoardStates(list.states);
    setDefaultStateId(list.defaultStateId);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadDefaultState = async (): Promise<void> => {
      try {
        const [defaultState, list] = await Promise.all([
          getDefaultSpaceshipBoardState(),
          listSpaceshipBoardStates(),
        ]);
        if (cancelled) {
          return;
        }
        setBoardStates(list.states);
        setDefaultStateId(list.defaultStateId);
        applyBoardState(defaultState);
        setBoardStateError(null);
      } catch (error) {
        if (cancelled) {
          return;
        }
        setBoardStateError(
          error instanceof Error
            ? error.message
            : "Could not load spaceship board state.",
        );
      } finally {
        if (!cancelled) {
          setIsLoadingBoardState(false);
        }
      }
    };

    void loadDefaultState();

    return () => {
      cancelled = true;
    };
  }, [applyBoardState]);

  const getSyncedDragState = useCallback(
    (currentDragState: SpaceshipDragState): SpaceshipDragState => {
      const boardItems = boardControllerRef.current?.getSnapshot().items;
      if (!boardItems) {
        return currentDragState;
      }

      return syncSpaceshipTokenPositions(
        syncSpaceshipCardPositions(currentDragState, boardItems),
        boardItems,
      );
    },
    [],
  );

  const focusPane = useCallback(
    (paneQuery: string): boolean => {
      const pane = resolveSpaceshipAgentPane(sceneRef.current, paneQuery);
      const controller = boardControllerRef.current;
      if (!pane || !controller) {
        return false;
      }

      controller.fitItems(
        getSpaceshipBoardPaneItemIds(
          sceneRef.current,
          pane.paneId,
          getSyncedDragState(dragStateRef.current),
        ),
        { smooth: true, durationMs: 240 },
      );
      return true;
    },
    [getSyncedDragState],
  );

  const focusItem = useCallback((itemId: string): boolean => {
    const controller = boardControllerRef.current;
    if (!controller) {
      return false;
    }

    controller.focusItem(itemId, { smooth: true, durationMs: 240 });
    return true;
  }, []);

  const focusOperationResults = useCallback(
    (
      result: ApplySpaceshipAgentOperationsResult,
      options?: SpaceshipApplyOperationOptions,
    ): void => {
      const focusMode = options?.focus ?? "first-result";
      if (focusMode === "none" || result.results.length === 0) {
        return;
      }

      window.requestAnimationFrame(() => {
        const controller = boardControllerRef.current;
        if (!controller) {
          return;
        }

        if (focusMode === "all-results") {
          const itemIds = result.results.flatMap((entry) => entry.itemIds);
          controller.fitItems(itemIds, { smooth: true, durationMs: 240 });
          return;
        }

        const firstItemId = result.results
          .flatMap((entry) => entry.itemIds)
          .find(Boolean);
        if (firstItemId) {
          controller.focusItem(firstItemId, { smooth: true, durationMs: 240 });
        }
      });
    },
    [],
  );

  const applyOperations = useCallback(
    (
      operations: readonly SpaceshipAgentOperation[],
      options?: SpaceshipApplyOperationOptions,
    ): ApplySpaceshipAgentOperationsResult => {
      const syncedDragState = getSyncedDragState(dragStateRef.current);
      const result = applySpaceshipAgentOperations({
        scene: sceneRef.current,
        dragState: syncedDragState,
        operations,
      });

      if (result.errors.length === 0) {
        sceneRef.current = result.scene;
        dragStateRef.current = result.dragState;
        setScene(result.scene);
        setDragState(result.dragState);
        focusOperationResults(result, options);
      }

      return result;
    },
    [focusOperationResults, getSyncedDragState],
  );

  const connector = useMemo<SpaceshipBrowserConnector>(
    () => ({
      getSnapshot: () => {
        const syncedDragState = getSyncedDragState(dragStateRef.current);
        return {
          scene: structuredClone(sceneRef.current),
          dragState: structuredClone(syncedDragState),
          board: boardControllerRef.current?.getSnapshot(),
        };
      },
      applyOperations,
      focusPane,
      focusItem,
    }),
    [applyOperations, focusItem, focusPane, getSyncedDragState],
  );

  useEffect(() => {
    window.mightyDecksSpaceship = connector;
    return () => {
      delete window.mightyDecksSpaceship;
    };
  }, [connector]);

  const saveCurrentState = useCallback(
    async (stateId: string, name: string): Promise<void> => {
      const snapshot = boardControllerRef.current?.getSnapshot();
      const syncedDragState = snapshot
        ? syncSpaceshipTokenPositions(
            syncSpaceshipCardPositions(dragStateRef.current, snapshot.items),
            snapshot.items,
          )
        : dragStateRef.current;
      const viewport = snapshot?.viewport ?? savedViewport ?? { x: 0, y: 0, zoom: 1 };
      const saved = await saveSpaceshipBoardState(stateId, {
        name,
        scene: toJsonObject(sceneRef.current),
        dragState: toJsonObject(syncedDragState),
        viewport,
      });
      dragStateRef.current = syncedDragState;
      setDragState(syncedDragState);
      applyBoardState(saved);
      await refreshBoardStateList();
      setBoardStateMessage(`Saved ${saved.name}.`);
      setBoardStateError(null);
    },
    [applyBoardState, refreshBoardStateList, savedViewport],
  );

  const handleSave = useCallback(async (): Promise<void> => {
    try {
      await saveCurrentState(selectedStateId, selectedStateName);
    } catch (error) {
      setBoardStateError(error instanceof Error ? error.message : "Could not save state.");
    }
  }, [saveCurrentState, selectedStateId, selectedStateName]);

  const handleSaveAs = useCallback(async (): Promise<void> => {
    const name = window.prompt("Save board state as", selectedStateName);
    if (!name || name.trim().length === 0) {
      return;
    }
    try {
      await saveCurrentState(toBoardStateId(name), name.trim());
    } catch (error) {
      setBoardStateError(error instanceof Error ? error.message : "Could not save state.");
    }
  }, [saveCurrentState, selectedStateName]);

  const handleRestore = useCallback(async (): Promise<void> => {
    try {
      const restored = await getSpaceshipBoardState(selectedStateId);
      applyBoardState(restored);
      setBoardStateMessage(`Restored ${restored.name}.`);
      setBoardStateError(null);
    } catch (error) {
      setBoardStateError(
        error instanceof Error ? error.message : "Could not restore state.",
      );
    }
  }, [applyBoardState, selectedStateId]);

  const handleSetDefault = useCallback(async (): Promise<void> => {
    try {
      const list = await setDefaultSpaceshipBoardState(selectedStateId);
      setBoardStates(list.states);
      setDefaultStateId(list.defaultStateId);
      setBoardStateMessage("Default state updated.");
      setBoardStateError(null);
    } catch (error) {
      setBoardStateError(
        error instanceof Error ? error.message : "Could not set default state.",
      );
    }
  }, [selectedStateId]);

  const boardStateControls = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <select
        aria-label="Spaceship board state"
        value={selectedStateId}
        onChange={(event) => {
          const nextStateId = event.currentTarget.value;
          setSelectedStateId(nextStateId);
          setSelectedStateName(
            boardStates.find((state) => state.stateId === nextStateId)?.name ??
              nextStateId,
          );
        }}
        className="h-9 max-w-[15rem] rounded-sm border-2 border-kac-iron bg-kac-steel-dark px-2 text-xs font-semibold text-kac-steel-lightest shadow-[2px_2px_0_0_#121b23]"
      >
        {boardStates.length === 0 ? (
          <option value={selectedStateId}>{selectedStateName}</option>
        ) : (
          boardStates.map((state) => (
            <option key={state.stateId} value={state.stateId}>
              {state.name}
              {state.stateId === defaultStateId ? " (default)" : ""}
            </option>
          ))
        )}
      </select>
      <Button size="sm" color="steel" onClick={() => void handleRestore()}>
        Restore
      </Button>
      <Button size="sm" color="monster" onClick={() => void handleSave()}>
        Save
      </Button>
      <Button size="sm" color="bone" onClick={() => void handleSaveAs()}>
        Save As
      </Button>
      <Button size="sm" color="cloth" onClick={() => void handleSetDefault()}>
        Set Default
      </Button>
      <Button
        aria-label="Open card library"
        variant="circle"
        color="gold"
        size="lg"
        onClick={() =>
          setCardLibrary((current) => toggleCardLibraryOpen(current, true))
        }
      >
        +
      </Button>
    </div>
  );

  if (isLoadingBoardState) {
    return (
      <div className="spaceship-page relative grid h-screen place-items-center overflow-hidden bg-[#121b23] text-kac-steel-lightest">
        Loading board state...
      </div>
    );
  }

  return (
    <div className="spaceship-page relative min-h-full overflow-x-hidden overflow-y-auto bg-[linear-gradient(180deg,#121b23_0%,#23303d_38%,#121b23_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,210,59,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(128,160,188,0.18),transparent_22%),radial-gradient(circle_at_80%_25%,rgba(255,107,107,0.12),transparent_18%)]" />
      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_center,rgba(255,255,255,0.55)_0px,transparent_1.2px)] [background-size:28px_28px]" />

      <div className="relative z-10 flex h-screen w-full flex-col">
        {(boardStateError || boardStateMessage) && (
          <div className="pointer-events-none absolute bottom-4 right-4 z-30 max-w-md rounded-sm border-2 border-kac-iron bg-kac-steel-dark/92 px-3 py-2 text-xs font-semibold text-kac-steel-lightest shadow-[3px_3px_0_0_#121b23]">
            {boardStateError ?? boardStateMessage}
          </div>
        )}
        <SpaceshipBoard
          key={boardInstanceKey}
          scene={scene}
          dragState={dragState}
          initialViewport={savedViewport ?? undefined}
          onDragStateChange={setDragState}
          onControllerChange={(controller) => {
            boardControllerRef.current = controller;
          }}
          actionSlot={boardStateControls}
        />
      </div>

      <CardLibraryOverlay
        open={cardLibrary.open}
        entries={scene.cardLibrary}
        selectedEntryIds={cardLibrary.selectedEntryIds}
        onClose={() => setCardLibrary((current) => toggleCardLibraryOpen(current, false))}
        onToggleEntry={(entryId) =>
          setCardLibrary((current) => toggleCardLibraryEntrySelection(current, entryId))
        }
      />
    </div>
  );
};

