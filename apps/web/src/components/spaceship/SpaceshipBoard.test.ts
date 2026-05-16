import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const readBoardSource = (): string =>
  readFileSync(new URL("./SpaceshipBoard.tsx", import.meta.url), "utf8");

const readBoardItemSource = (): string =>
  readFileSync(new URL("./SpaceshipBoardItem.tsx", import.meta.url), "utf8");

const readBoardInteractionSource = (): string =>
  `${readBoardSource()}\n${readBoardItemSource()}`;

test("SpaceshipBoard renders the scene through the shared board primitives", () => {
  const source = readBoardSource();

  assert.match(source, /BoardProvider/);
  assert.match(source, /BoardFrame/);
  assert.match(source, /<Board/);
  assert.match(source, /renderItem=/);
  assert.match(source, /createSpaceshipBoardItems/);
  assert.match(source, /createSpaceshipBoardLayout/);
});

test("SpaceshipBoard renders independent board surfaces for ship backgrounds, locations, devices, effects, tokens, and actors", () => {
  const source = readBoardItemSource();

  assert.match(source, /SpaceshipShipBackground/);
  assert.match(source, /ShipLocationCardSurface/);
  assert.match(source, /ShipLocationDeviceCard/);
  assert.match(source, /SpaceshipTokenSurface/);
  assert.match(source, /EnergyTokenStack/);
  assert.match(source, /ShipEffectCardSurface/);
  assert.match(source, /SpaceshipActorCardSurface/);
  assert.match(source, /SpaceshipActorEffectSurface/);
});

test("SpaceshipBoard wires pointer drag handlers for tokens and the energy stack", () => {
  const source = readBoardInteractionSource();

  assert.match(source, /onTokenPointerDown/);
  assert.match(source, /onEnergyStackPointerDown/);
  assert.match(source, /beginSpaceshipTokenDrag/);
  assert.match(source, /beginEnergyStackTokenDrag/);
  assert.match(source, /window\.addEventListener\("pointermove"/);
  assert.match(source, /window\.addEventListener\("pointerup"/);
});

test("SpaceshipBoard wires pointer drag handlers for all draggable card surfaces", () => {
  const source = readBoardInteractionSource();

  assert.match(source, /onCardPointerDown/);
  assert.match(source, /beginSpaceshipCardDrag/);
  assert.match(source, /moveSpaceshipCardFromDragOrigin/);
  assert.match(source, /applySpaceshipCardLiveSnap/);
  assert.match(source, /didSpaceshipCardLayoutDragExceedTearOffDistance/);
  assert.match(source, /isSpaceshipCardLayoutTearOffBlocked/);
  assert.match(source, /isSpaceshipCardSnapInsertBlocked/);
  assert.match(source, /tearOffBlockedUntilMs/);
  assert.match(source, /snapBlockedUntilMs/);
  assert.match(source, /mode: "layout"/);
  assert.match(source, /activeCardItemId/);
  assert.match(source, /createSpaceshipBoardLayout\(scene, dragState, \{\s*activeCardItemId,\s*\}\)/);
  assert.match(source, /dropSpaceshipCardOnBoard/);
  assert.match(source, /case "location":[\s\S]*onCardPointerDown/);
  assert.match(source, /case "device":[\s\S]*onCardPointerDown/);
  assert.match(source, /case "effect-card":[\s\S]*onCardPointerDown/);
  assert.match(source, /case "actor-effect-card":[\s\S]*onCardPointerDown/);
  assert.match(source, /case "actor-card":[\s\S]*onCardPointerDown/);
  assert.match(source, /case "ship-background":[\s\S]*<SpaceshipShipBackground/);
  assert.match(source, /case "ship-header":\r?\n\s+return meta\.pane \? <SpaceshipShipHeader/);
  assert.match(source, /case "energy-stack":[\s\S]*<EnergyTokenStack/);
});

test("SpaceshipBoard disables board wheel zoom while any item drag is active", () => {
  const source = readBoardSource();

  assert.match(source, /isItemDragActive/);
  assert.match(source, /onItemDragActiveChange\(true\)/);
  assert.match(source, /onItemDragActiveChange\(false\)/);
  assert.match(source, /onItemDragActiveChange=\{setIsItemDragActive\}/);
  assert.match(source, /disableWheelZoom=\{isItemDragActive\}/);
  assert.match(source, /window\.addEventListener\("wheel", handleWheelWhileDragging, \{\s*capture: true,\s*passive: false,\s*\}\)/);
  assert.match(source, /if \(!activeDragRef\.current\) \{/);
  assert.match(source, /event\.preventDefault\(\);[\s\S]*event\.stopPropagation\(\);/);
});

test("SpaceshipBoard renders custom actor cards when spaceship actors provide them", () => {
  const source = readFileSync(new URL("./SpaceshipActorStrip.tsx", import.meta.url), "utf8");

  assert.match(source, /actor\.customCard/);
  assert.match(source, /kind="custom"/);
  assert.match(source, /custom=\{actor\.customCard\}/);
});

test("SpaceshipBoard exposes fit controls for all, ally, and enemy board content", () => {
  const source = readBoardSource();

  assert.match(source, /Show All/);
  assert.match(source, /Focus Ally Ship/);
  assert.match(source, /Focus Enemy Ship/);
  assert.match(source, /getSpaceshipBoardPaneItemIds/);
  assert.match(source, /controller\.fitItems/);
});

test("SpaceshipBoard keeps fit controls in the same header action row as the action slot", () => {
  const source = readBoardSource();

  assert.match(source, /SpaceshipBoardHeader[\s\S]*<SpaceshipBoardControls scene=\{scene\} dragState=\{dragState\} \/>[\s\S]*\{actionSlot/);
  assert.match(source, /bg-\[linear-gradient\(180deg,rgba\(18,27,35,0\.72\)_0%,rgba\(18,27,35,0\)_100%\)\]/);
  assert.doesNotMatch(source, /<SpaceshipBoardControls scene=\{scene\} \/>\s*<BoardFrame/);
});

test("SpaceshipBoard renders a square flush board frame", () => {
  const source = readBoardSource();

  assert.match(
    source,
    /<BoardFrame[\s\S]*className="min-h-0 rounded-none border-0 bg-\[#121b23\] shadow-none absolute inset-0"[\s\S]*disableWheelZoom=\{isItemDragActive\}/,
  );
  assert.doesNotMatch(source, /rounded-\[1\.25rem\]/);
});

test("SpaceshipBoard shows the live board zoom in the header", () => {
  const source = readBoardSource();

  assert.match(source, /SpaceshipBoardHeader/);
  assert.match(source, /viewport\.zoom \* 100/);
  assert.match(source, /Zoom/);
  assert.match(source, /useBoard\(\)/);
});
