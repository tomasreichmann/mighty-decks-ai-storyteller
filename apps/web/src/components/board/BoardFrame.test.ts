import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("BoardFrame owns measurement, pointer pan, and wheel zoom behavior", () => {
  const source = readFileSync(new URL("./BoardFrame.tsx", import.meta.url), "utf8");

  assert.match(source, /board-frame/);
  assert.match(source, /ResizeObserver/);
  assert.match(source, /onPointerDown/);
  assert.match(source, /onPointerMove/);
  assert.match(source, /onPointerUp/);
  assert.match(source, /addEventListener\("wheel"/);
  assert.match(source, /passive: false/);
  assert.doesNotMatch(source, /onWheel=/);
  assert.match(source, /zoomAt/);
  assert.match(source, /setFrameSize/);
});

test("BoardFrame keeps pointer and wheel interaction immediate", () => {
  const source = readFileSync(new URL("./BoardFrame.tsx", import.meta.url), "utf8");

  assert.match(source, /panBy\(\{\s*x: -deltaX \/ viewport\.zoom,\s*y: -deltaY \/ viewport\.zoom,\s*\}\)/);
  assert.match(source, /zoomAt\(\s*\{\s*x: event\.clientX - rect\.left,\s*y: event\.clientY - rect\.top,\s*\},\s*viewport\.zoom \* zoomMultiplier,\s*\)/);
  assert.doesNotMatch(source, /smooth: true/);
});
