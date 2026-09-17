import assert from "node:assert/strict";
import test from "node:test";
import type { MouseEvent } from "react";
import TestRenderer, { act } from "react-test-renderer";
import { HighlightAction } from "./HighlightAction";
import { resolveHeadingHighlightColorClass } from "./headingHighlightColor";

test("HighlightAction renders a current navigation item as a native link", () => {
  let renderer: TestRenderer.ReactTestRenderer | null = null;

  act(() => {
    renderer = TestRenderer.create(
      <HighlightAction href="/styleguide" type="text/html" active color="gold">
        Styleguide
      </HighlightAction>,
    );
  });

  if (!renderer) {
    throw new Error("Renderer was not created");
  }

  const link = (renderer as TestRenderer.ReactTestRenderer).root.findByType("a");
  assert.equal(link.props.href, "/styleguide");
  assert.equal(link.props.type, "text/html");
  assert.equal(link.props["aria-current"], "page");
  assert.equal(link.findAllByType("span").at(-1)?.children.join(""), "Styleguide");
});

test("HighlightAction preserves native button semantics and disabled state", () => {
  let renderer: TestRenderer.ReactTestRenderer | null = null;

  act(() => {
    renderer = TestRenderer.create(
      <HighlightAction type="submit" disabled color="fire">
        End adventure
      </HighlightAction>,
    );
  });

  if (!renderer) {
    throw new Error("Renderer was not created");
  }

  const button = (renderer as TestRenderer.ReactTestRenderer).root.findByType("button");
  assert.equal(button.props.type, "submit");
  assert.equal(button.props.disabled, true);
  assert.equal(button.findAllByType("span").at(-1)?.children.join(""), "End adventure");
});

test("HighlightAction preserves an explicit aria-current value and omits it when inactive", () => {
  let activeRenderer: TestRenderer.ReactTestRenderer | null = null;
  let inactiveRenderer: TestRenderer.ReactTestRenderer | null = null;

  act(() => {
    activeRenderer = TestRenderer.create(
      <HighlightAction href="/choose" active aria-current="step">
        Choose
      </HighlightAction>,
    );
    inactiveRenderer = TestRenderer.create(
      <HighlightAction href="/play">Play</HighlightAction>,
    );
  });

  if (!activeRenderer || !inactiveRenderer) {
    throw new Error("Renderers were not created");
  }

  const activeLink = (activeRenderer as TestRenderer.ReactTestRenderer).root.findByType("a");
  const inactiveLink = (inactiveRenderer as TestRenderer.ReactTestRenderer).root.findByType("a");
  assert.equal(activeLink.props["aria-current"], "step");
  assert.equal(inactiveLink.props["aria-current"], undefined);
});

test("HighlightAction forwards clicks from regular buttons", () => {
  let renderer: TestRenderer.ReactTestRenderer | null = null;
  let clicks = 0;

  act(() => {
    renderer = TestRenderer.create(
      <HighlightAction onClick={() => { clicks += 1; }}>Preview</HighlightAction>,
    );
  });

  if (!renderer) {
    throw new Error("Renderer was not created");
  }

  act(() => {
    (renderer as TestRenderer.ReactTestRenderer).root.findByType("button").props.onClick();
  });

  assert.equal(clicks, 1);
});

test("HighlightAction relies on the shared highlight tone resolver", () => {
  assert.equal(resolveHeadingHighlightColorClass("fire"), "text-kac-fire-light");
});

test("HighlightAction removes disabled links from tab order and prevents navigation", () => {
  let renderer: TestRenderer.ReactTestRenderer | null = null;
  let prevented = false;
  let clicked = false;

  act(() => {
    renderer = TestRenderer.create(
      <HighlightAction
        href="/ending"
        disabled
        tabIndex={0}
        onClick={() => {
          clicked = true;
        }}
      >
        End adventure
      </HighlightAction>,
    );
  });

  if (!renderer) {
    throw new Error("Renderer was not created");
  }

  const link = (renderer as TestRenderer.ReactTestRenderer).root.findByType("a");
  assert.equal(link.props.href, undefined);
  assert.equal(link.props["aria-disabled"], true);
  assert.equal(link.props.tabIndex, -1);

  link.props.onClick({
    preventDefault: () => {
      prevented = true;
    },
  } as unknown as MouseEvent<HTMLAnchorElement>);

  assert.equal(prevented, true);
  assert.equal(clicked, false);
});
