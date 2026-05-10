import { useEffect, useMemo } from "react";
import { Board } from "../components/board/Board";
import { BoardFrame } from "../components/board/BoardFrame";
import {
  BoardProvider,
  useBoard,
  type BoardController,
} from "../components/board/BoardProvider";
import { Button } from "../components/common/Button";
import { Text } from "../components/common/Text";
import type { BoardItemInput } from "../lib/board/boardController";

type BoardExternalController = Omit<BoardController, "setFrameSize">;

declare global {
  interface Window {
    mightyDecksBoard?: BoardExternalController;
  }
}

const boardSize = {
  width: 2400,
  height: 1600,
};

const seededItems: BoardItemInput[] = [
  {
    id: "scene-map",
    kind: "image",
    x: 260,
    y: 220,
    width: 420,
    height: 280,
    title: "Drowned Gate",
    body: "Factory quarter map fragment.",
    imageUrl: "/maps/exiles-ship.png",
    zIndex: 1,
  },
  {
    id: "clue-note",
    kind: "note",
    x: 980,
    y: 360,
    width: 260,
    height: 150,
    title: "Lantern shards",
    body: "Pale fragments hum when patrol sensors sweep the room.",
    zIndex: 2,
  },
  {
    id: "pressure-card",
    kind: "card",
    x: 1560,
    y: 920,
    width: 300,
    height: 180,
    title: "Clock",
    body: "Counterweights grind below the bridge. Three turns before collapse.",
    zIndex: 3,
  },
];

const BoardPageContent = (): JSX.Element => {
  const controller = useBoard();
  const snapshot = controller.getSnapshot();
  const externalController = useMemo<BoardExternalController>(() => {
    return {
      addItem: controller.addItem,
      upsertItem: controller.upsertItem,
      removeItem: controller.removeItem,
      clear: controller.clear,
      fitBoard: controller.fitBoard,
      fitItems: controller.fitItems,
      focusItem: controller.focusItem,
      setViewport: controller.setViewport,
      panBy: controller.panBy,
      zoomAt: controller.zoomAt,
      applyLayout: controller.applyLayout,
      applyFlexLayout: controller.applyFlexLayout,
      applyStackLayout: controller.applyStackLayout,
      applyDeckLayout: controller.applyDeckLayout,
      applyPileLayout: controller.applyPileLayout,
      applyFanLayout: controller.applyFanLayout,
      getLayoutItems: controller.getLayoutItems,
      getSnapshot: controller.getSnapshot,
      subscribe: controller.subscribe,
    };
  }, [controller]);
  const viewportReadout = useMemo(
    () =>
      `x ${Math.round(snapshot.viewport.x)} / y ${Math.round(
        snapshot.viewport.y,
      )} / ${Math.round(snapshot.viewport.zoom * 100)}%`,
    [snapshot.viewport.x, snapshot.viewport.y, snapshot.viewport.zoom],
  );

  useEffect(() => {
    window.mightyDecksBoard = externalController;
    return () => {
      delete window.mightyDecksBoard;
    };
  }, [externalController]);

  const addSampleItem = (): void => {
    const itemNumber = controller.getSnapshot().items.length + 1;
    const id = controller.addItem({
      kind: "note",
      x: 360 + itemNumber * 120,
      y: 620 + itemNumber * 64,
      width: 240,
      height: 140,
      title: `Dropped note ${itemNumber}`,
      body: "Added through the board controller.",
      zIndex: itemNumber + 4,
    });
    controller.focusItem(id, { smooth: true });
  };

  const zoomFromCenter = (multiplier: number): void => {
    const current = controller.getSnapshot();
    controller.zoomAt(
      {
        x: current.frameSize.width / 2,
        y: current.frameSize.height / 2,
      },
      current.viewport.zoom * multiplier,
      { smooth: true, durationMs: 160 },
    );
  };

  const applyDemoFlexLayout = (direction: "row" | "column"): void => {
    const current = controller.getSnapshot();
    controller.applyFlexLayout(
      {
        ids: current.items.map((item) => item.id),
        direction,
        x: 180,
        y: 160,
        columnGap: 32,
        rowGap: 28,
        wrapLimit: direction === "row" ? 1100 : 700,
      },
      { smooth: true, durationMs: 260 },
    );
    controller.fitItems(undefined, { smooth: true, durationMs: 260 });
  };

  const getCurrentItemIds = (): string[] =>
    controller.getSnapshot().items.map((item) => item.id);

  const applyDemoPeekStack = (): void => {
    controller.applyStackLayout(
      {
        ids: getCurrentItemIds(),
        x: 180,
        y: 160,
        offset: { x: 0, y: 42 },
        zIndexStart: 10,
      },
      { smooth: true, durationMs: 260 },
    );
    controller.fitItems(undefined, { smooth: true, durationMs: 260 });
  };

  const applyDemoDeck = (): void => {
    controller.applyDeckLayout(
      {
        ids: getCurrentItemIds(),
        x: 180,
        y: 160,
        zIndexStart: 20,
      },
      { smooth: true, durationMs: 260 },
    );
    controller.fitItems(undefined, { smooth: true, durationMs: 260 });
  };

  const applyDemoPile = (): void => {
    controller.applyPileLayout(
      {
        ids: getCurrentItemIds(),
        x: 380,
        y: 260,
        maxRotation: 15,
        zIndexStart: 30,
      },
      { smooth: true, durationMs: 260 },
    );
    controller.fitItems(undefined, { smooth: true, durationMs: 260 });
  };

  const applyDemoFan = (): void => {
    controller.applyFanLayout(
      {
        ids: getCurrentItemIds(),
        x: 180,
        y: 220,
        overlap: 96,
        arcAngle: 42,
        zIndexStart: 40,
      },
      { smooth: true, durationMs: 260 },
    );
    controller.fitItems(undefined, { smooth: true, durationMs: 260 });
  };

  const applyDemoTokenOnCard = (): void => {
    controller.upsertItem({
      id: "token-marker",
      kind: "card",
      x: 0,
      y: 0,
      width: 92,
      height: 52,
      title: "Token",
      body: "On card",
      zIndex: 99,
    });
    controller.applyStackLayout(
      {
        ids: ["pressure-card", "token-marker"],
        x: 1560,
        y: 920,
        itemOffsets: {
          "token-marker": { x: 178, y: 62 },
        },
        zIndexStart: 40,
      },
      { smooth: true, durationMs: 260 },
    );
    controller.fitItems(["pressure-card", "token-marker"], {
      smooth: true,
      durationMs: 260,
    });
  };

  return (
    <div className="board-page flex h-full min-h-0 flex-col bg-[linear-gradient(180deg,#332316_0%,#6f4a28_46%,#2a1b12_100%)] p-3 text-kac-bone-light sm:p-4">
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_center,rgba(255,249,227,0.55)_0px,transparent_1.4px)] [background-size:18px_18px]" />
      <div className="relative z-10 flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="stack gap-1">
            <Text variant="h2" color="inherit" className="text-3xl text-kac-bone-light">
              Board
            </Text>
            <Text
              variant="note"
              color="inherit"
              className="text-xs text-kac-bone-light !opacity-80"
            >
              {viewportReadout} - {controller.itemCount} items
            </Text>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              size="sm"
              color="bone"
              onClick={() => controller.fitBoard({ smooth: true })}
            >
              Fit board
            </Button>
            <Button
              size="sm"
              color="gold"
              onClick={() => controller.fitItems(undefined, { smooth: true })}
            >
              Fit items
            </Button>
            <Button
              size="sm"
              color="steel"
              onClick={() => zoomFromCenter(1.2)}
            >
              Zoom +
            </Button>
            <Button
              size="sm"
              color="steel"
              onClick={() => zoomFromCenter(1 / 1.2)}
            >
              Zoom -
            </Button>
            <Button
              size="sm"
              color="cloth"
              onClick={() => controller.fitBoard({ smooth: true })}
            >
              Reset
            </Button>
            <Button
              size="sm"
              color="cloth"
              onClick={() => applyDemoFlexLayout("row")}
            >
              Flex row
            </Button>
            <Button
              size="sm"
              color="cloth"
              onClick={() => applyDemoFlexLayout("column")}
            >
              Flex column
            </Button>
            <Button
              size="sm"
              color="cloth"
              onClick={applyDemoPeekStack}
            >
              Header stack
            </Button>
            <Button
              size="sm"
              color="cloth"
              onClick={applyDemoDeck}
            >
              Deck
            </Button>
            <Button
              size="sm"
              color="cloth"
              onClick={applyDemoPile}
            >
              Pile
            </Button>
            <Button
              size="sm"
              color="cloth"
              onClick={applyDemoFan}
            >
              Fan
            </Button>
            <Button
              size="sm"
              color="cloth"
              onClick={applyDemoTokenOnCard}
            >
              Token stack
            </Button>
            <Button size="sm" color="fire" onClick={addSampleItem}>
              Add item
            </Button>
          </div>
        </div>

        <BoardFrame>
          <Board />
        </BoardFrame>
      </div>
    </div>
  );
};

export const BoardPage = (): JSX.Element => (
  <BoardProvider boardSize={boardSize} initialItems={seededItems}>
    <BoardPageContent />
  </BoardProvider>
);
