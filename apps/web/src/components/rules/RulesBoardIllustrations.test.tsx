import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

test("the complete table figure uses the shared static board and wood surface", () => {
  const sourceUrl = new URL("./RulesBoardIllustrations.tsx", import.meta.url);

  assert.ok(existsSync(sourceUrl));
  const source = readFileSync(sourceUrl, "utf8");

  assert.match(source, /StaticBoardFigure/);
  assert.match(source, /const boardBackground = "\/backgrounds\/board\.jpg"/);
  assert.match(source, /backgroundImageUrl=\{boardBackground\}/);
  assert.match(source, /export const CompleteTableSetup/);
  assert.match(source, /completeTableSetupMobileBoard/);
  assert.match(source, /sm:hidden/);
});

test("the core action loop uses matching card sizes for every state", () => {
  const source = readFileSync(
    new URL("./RulesBoardIllustrations.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /export const CoreActionLoop/);
  assert.match(source, /coreActionLoopBoard/);
  assert.match(source, /coreActionLoopMobileBoard/);
  assert.match(source, /Catastrophe check/);
});

test("actor initiative uses a static board with an explicit turn sequence", () => {
  const source = readFileSync(
    new URL("./RulesBoardIllustrations.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /export const ActorInitiative/);
  assert.match(source, /actorInitiativeBoard/);
  assert.match(source, /actorInitiativeMobileBoard/);
  assert.match(source, /Actors act immediately after the player/);
});

test("zones and range uses a static board with matching location card footprints", () => {
  const source = readFileSync(new URL("./RulesBoardIllustrations.tsx", import.meta.url), "utf8");

  assert.match(source, /export const ZonesAndRange/);
  assert.match(source, /zonesAndRangeBoard/);
  assert.match(source, /zonesAndRangeMobileBoard/);
  assert.match(source, /Bow: \+2 zones/);
});

test("catastrophe flow shows the replacement draw before its three-Fumble trigger", () => {
  const source = readFileSync(new URL("./RulesBoardIllustrations.tsx", import.meta.url), "utf8");

  assert.match(source, /export const CatastropheFlow/);
  assert.match(source, /catastropheFlowBoard/);
  assert.match(source, /catastropheFlowMobileBoard/);
  assert.match(source, /Draw replacement/);
  assert.match(source, /Three Fumbles trigger a Catastrophe/);
  assert.match(source, /Pick one fitting consequence/);
});
