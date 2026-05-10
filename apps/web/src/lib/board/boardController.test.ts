import test from "node:test";
import assert from "node:assert/strict";
import {
  BOARD_MAX_ZOOM,
  BOARD_MIN_ZOOM,
  fitBoundsToFrame,
  fitItemsToFrame,
  frameToWorld,
  getViewportBounds,
  isBoundsInViewport,
  worldToFrame,
  zoomAtFramePoint,
  type BoardItemRecord,
} from "./boardController";

const assertNearlyEqual = (actual: number, expected: number): void => {
  assert.ok(
    Math.abs(actual - expected) < 0.0000001,
    `Expected ${actual} to be nearly ${expected}`,
  );
};

test("fitBoundsToFrame centers a board-sized rectangle in the frame", () => {
  const viewport = fitBoundsToFrame({
    bounds: { x: 0, y: 0, width: 2400, height: 1600 },
    frameSize: { width: 1200, height: 800 },
    padding: 0,
  });

  assert.equal(viewport.zoom, 0.5);
  assert.equal(viewport.x, 0);
  assert.equal(viewport.y, 0);
});

test("fitBoundsToFrame clamps zoom and centers smaller rectangles", () => {
  const viewport = fitBoundsToFrame({
    bounds: { x: 100, y: 120, width: 80, height: 60 },
    frameSize: { width: 1200, height: 800 },
    padding: 24,
  });

  assert.equal(viewport.zoom, BOARD_MAX_ZOOM);
  assert.equal(viewport.x, -60);
  assertNearlyEqual(viewport.y, 16.666666666666686);
});

test("zoomAtFramePoint preserves the world coordinate under the cursor", () => {
  const current = { x: 200, y: 100, zoom: 0.5 };
  const framePoint = { x: 300, y: 200 };
  const worldBefore = frameToWorld(framePoint, current);
  const next = zoomAtFramePoint({
    viewport: current,
    framePoint,
    zoom: 1.25,
  });
  const worldAfter = frameToWorld(framePoint, next);

  assert.deepEqual(worldAfter, worldBefore);
});

test("coordinate helpers convert between world and frame coordinates", () => {
  const viewport = { x: 120, y: 80, zoom: 0.75 };

  assert.deepEqual(worldToFrame({ x: 520, y: 280 }, viewport), {
    x: 300,
    y: 150,
  });
  assert.deepEqual(frameToWorld({ x: 300, y: 150 }, viewport), {
    x: 520,
    y: 280,
  });
});

test("fitItemsToFrame uses measured item bounds and ignores missing ids", () => {
  const items = new Map<string, BoardItemRecord>([
    [
      "known",
      {
        id: "known",
        kind: "note",
        x: 400,
        y: 300,
        width: 160,
        height: 120,
        measuredWidth: 200,
        measuredHeight: 100,
        zIndex: 0,
      },
    ],
  ]);

  const viewport = fitItemsToFrame({
    items,
    ids: ["known", "missing"],
    frameSize: { width: 600, height: 400 },
    padding: 20,
    fallbackBounds: { x: 0, y: 0, width: 2400, height: 1600 },
  });

  assert.equal(viewport.zoom, 2.5);
  assert.equal(viewport.x, 380);
  assert.equal(viewport.y, 270);
});

test("viewport bounds and visibility helpers use frame size and margin", () => {
  const viewportBounds = getViewportBounds({
    viewport: { x: 100, y: 200, zoom: 2 },
    frameSize: { width: 800, height: 600 },
  });

  assert.deepEqual(viewportBounds, {
    x: 100,
    y: 200,
    width: 400,
    height: 300,
  });
  assert.equal(
    isBoundsInViewport({
      bounds: { x: 490, y: 490, width: 40, height: 40 },
      viewportBounds,
      margin: 0,
    }),
    true,
  );
  assert.equal(
    isBoundsInViewport({
      bounds: { x: 531, y: 490, width: 40, height: 40 },
      viewportBounds,
      margin: 0,
    }),
    false,
  );
  assert.equal(
    isBoundsInViewport({
      bounds: { x: 531, y: 490, width: 40, height: 40 },
      viewportBounds,
      margin: 48,
    }),
    true,
  );
});

test("zoomAtFramePoint clamps zoom to supported limits", () => {
  assert.equal(
    zoomAtFramePoint({
      viewport: { x: 0, y: 0, zoom: 1 },
      framePoint: { x: 0, y: 0 },
      zoom: 100,
    }).zoom,
    BOARD_MAX_ZOOM,
  );
  assert.equal(
    zoomAtFramePoint({
      viewport: { x: 0, y: 0, zoom: 1 },
      framePoint: { x: 0, y: 0 },
      zoom: 0.01,
    }).zoom,
    BOARD_MIN_ZOOM,
  );
});
