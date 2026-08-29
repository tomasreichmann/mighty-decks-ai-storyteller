import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("StyleguideBoardPage teaches static board composition", () => {
  const source = readFileSync(
    new URL("./StyleguideBoardPage.tsx", import.meta.url),
    "utf8",
  );

  for (const heading of [
    "Board anatomy",
    "Layout recipes",
    "Canonical game components",
    "Spaceship-derived composition",
    "Rules illustration recipe",
  ]) {
    assert.match(source, new RegExp(heading));
  }

  assert.match(source, /<BoardProvider/);
  assert.match(source, /<BoardFrame[^>]*interactive=\{false\}/);
  assert.match(source, /className="h-\[18rem\] w-full flex-none sm:h-\[22rem\]"/);
  assert.match(source, /<Board/);
  assert.match(source, /GameCardView/);
  assert.match(source, /CardBoundary/);
  assert.match(source, /LocationCard/);
  assert.match(source, /ActorCard/);
  assert.match(source, /CounterCard/);
  assert.match(source, /<Token/);
  assert.match(source, /ShipLocationCardSurface/);
  assert.match(source, /ShipEffectCardSurface/);
  assert.match(source, /EnergyToken/);
  assert.match(source, /ActorToken/);
  assert.doesNotMatch(source, /spaceshipBoardStateApi/);
  assert.doesNotMatch(source, /mightyDecksSpaceship/);
});
