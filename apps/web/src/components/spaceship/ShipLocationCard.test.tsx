import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import TestRenderer, { act } from "react-test-renderer";
import { ShipLocationCard } from "./ShipLocationCard";
import type { ShipLocationInstance } from "../../lib/spaceship/spaceshipTypes";

type RenderNode = TestRenderer.ReactTestRendererJSON | string | null;

const collectText = (node: RenderNode | RenderNode[]): string => {
  if (node == null) {
    return "";
  }

  if (Array.isArray(node)) {
    return node.map((child) => collectText(child)).join("");
  }

  if (typeof node === "string") {
    return node;
  }

  return (node.children ?? [])
    .map((child) => collectText(child as RenderNode | RenderNode[]))
    .join("");
};

const sampleLocation: ShipLocationInstance = {
  locationId: "ship-docking-bay",
  title: "Docking Bay",
  locationType: "docking-bay",
  level: 1,
  row: "top",
  summary: "A narrow bay lined with magnetic clamps and scorched bulkheads.",
  status: "Open to the vacuum",
  imageUrl: "/sample-scene-image.png",
  effects: [],
  energyTokens: [],
  actorTokens: [],
  lastTouchedOrder: 0,
};

test("ShipLocationCard keeps the shared location card and local level controls", () => {
  const source = readFileSync(
    new URL("./ShipLocationCard.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /LocationCard/);
  assert.match(source, /Tag/);
  assert.match(source, /LevelPill/);
  assert.match(source, /Decrease location level/);
  assert.match(source, /Increase location level/);
  assert.match(source, /useState/);
  assert.match(source, /leading=\{/);
  assert.match(source, /trailing=\{/);
  assert.doesNotMatch(source, /\bLabel\b/);
});

test("ShipLocationCard level pill increments and clamps at 1", () => {
  let renderer!: TestRenderer.ReactTestRenderer;

  act(() => {
    renderer = TestRenderer.create(<ShipLocationCard location={sampleLocation} />);
  });

  const levelText = (): string => collectText(renderer.toJSON());
  const levelButtons = (): TestRenderer.ReactTestInstance[] =>
    renderer.root
      .findAllByType("button")
      .filter(
        (button: TestRenderer.ReactTestInstance) =>
          button.props["aria-label"] === "Decrease location level" ||
          button.props["aria-label"] === "Increase location level",
      );

  assert.match(levelText(), /lvl 1/);

  const [decreaseButton, increaseButton] = levelButtons();
  assert.equal(decreaseButton.props.disabled, true);

  act(() => {
    increaseButton.props.onClick();
  });

  assert.match(levelText(), /lvl 2/);

  const [decreaseAfterIncrease] = levelButtons();
  assert.equal(decreaseAfterIncrease.props.disabled, false);

  act(() => {
    decreaseAfterIncrease.props.onClick();
  });

  assert.match(levelText(), /lvl 1/);

  const [decreaseAtMin] = levelButtons();
  assert.equal(decreaseAtMin.props.disabled, true);
});
