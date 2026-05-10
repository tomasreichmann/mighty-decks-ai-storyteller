import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { getBoardFrameGridZoom } from "./BoardFrame";

test("BoardFrame owns measurement, pointer pan, and wheel zoom behavior", () => {
  const source = readFileSync(new URL("./BoardFrame.tsx", import.meta.url), "utf8");

  assert.match(source, /board-frame/);
  assert.match(source, /ResizeObserver/);
  assert.match(source, /onPointerDown/);
  assert.match(source, /onPointerMove/);
  assert.match(source, /onPointerUp/);
  assert.match(source, /addEventListener\("wheel"/);
  assert.match(source, /passive: false/);
  assert.match(source, /zoomAt/);
  assert.match(source, /setFrameSize/);
});

test("BoardFrame keeps pointer and wheel interaction immediate", () => {
  const source = readFileSync(new URL("./BoardFrame.tsx", import.meta.url), "utf8");

  assert.match(source, /panBy\(\{\s*x: -deltaX \/ viewport\.zoom,\s*y: -deltaY \/ viewport\.zoom,\s*\}\)/);
  assert.match(source, /zoomAt\(\s*\{\s*x: event\.clientX - rect\.left,\s*y: event\.clientY - rect\.top,\s*\},\s*viewport\.zoom \* zoomMultiplier,\s*\)/);
});

test("BoardFrame keeps the dot-grid texture aligned with pan and zoom", () => {
  const source = readFileSync(new URL("./BoardFrame.tsx", import.meta.url), "utf8");

  assert.match(source, /backgroundImage/);
  assert.match(source, /backgroundPosition: `\$\{-viewport\.x \* gridZoom\}px \$\{-viewport\.y \* gridZoom\}px`/);
  assert.match(source, /backgroundSize: `\$\{textureSize\}px \$\{textureSize\}px`/);
});

test("BoardFrame wraps dot-grid scale below each half-zoom level", () => {
  assert.equal(getBoardFrameGridZoom(1), 1);
  assert.equal(getBoardFrameGridZoom(0.5), 0.5);
  assert.equal(getBoardFrameGridZoom(0.49), 0.98);
  assert.equal(getBoardFrameGridZoom(0.25), 0.5);
  assert.equal(getBoardFrameGridZoom(0.249), 0.996);
  assert.equal(getBoardFrameGridZoom(0.125), 0.5);
  assert.equal(getBoardFrameGridZoom(0.124), 0.992);
});
