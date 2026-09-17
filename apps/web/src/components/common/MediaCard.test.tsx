import assert from "node:assert/strict";
import test from "node:test";
import TestRenderer, { act } from "react-test-renderer";
import { ImageCard } from "./ImageCard";
import { StoryTileCard } from "./StoryTileCard";

test("ImageCard keeps its label close to the image's lower-left edge", () => {
  let renderer!: TestRenderer.ReactTestRenderer;

  act(() => {
    renderer = TestRenderer.create(
      <ImageCard imageUrl="/example.png" imageAlt="A cliffside keep" label="Scene" />,
    );
  });

  const labelWrap = renderer.root.findByProps({ "data-image-card-label": true });
  assert.match(labelWrap.props.className, /-bottom-1/);
  assert.match(labelWrap.props.className, /left-3/);
});

test("StoryTileCard presents its title in the warm caption below clean artwork", () => {
  let renderer!: TestRenderer.ReactTestRenderer;

  act(() => {
    renderer = TestRenderer.create(
      <StoryTileCard
        title="The Hidden Valley"
        imageUrl="/example.png"
        imageAlt="A valley and distant keep"
        summary="A peaceful valley hides an old secret."
      />,
    );
  });

  const title = renderer.root.findByProps({ "data-story-tile-title": true });
  const image = renderer.root.findByType("img");

  assert.equal(title.props.children, "The Hidden Valley");
  assert.match(title.parent?.props.className ?? "", /bg-kac-bone-light/);
  assert.equal(
    renderer.root.findAll(
      (node) => typeof node.props.className === "string" && node.props.className.includes("bg-gradient-to-t"),
    ).length,
    0,
  );
  assert.match(image.props.className, /aspect-video/);
});
