import assert from "node:assert/strict";
import test from "node:test";
import type { MouseEvent } from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Button } from "./Button";

test("ghost buttons preserve native link semantics while using the shared marker treatment", () => {
  let renderer: TestRenderer.ReactTestRenderer | null = null;

  act(() => {
    renderer = TestRenderer.create(
      <Button variant="ghost" color="fire" href="/cancel">
        Cancel
      </Button>,
    );
  });

  if (!renderer) {
    throw new Error("Renderer was not created");
  }

  const link = (renderer as TestRenderer.ReactTestRenderer).root.findByType("a");
  assert.equal(link.props.href, "/cancel");
  assert.match(link.props.className, /border-0/);
  assert.match(link.props.className, /shadow-none/);

  const marker = link.findAll(
    (node) =>
      typeof node.props.className === "string" && node.props.className.includes("button__marker"),
  )[0];
  if (!marker) {
    throw new Error("Ghost marker was not rendered");
  }
  assert.match(marker.props.className, /text-\[#EC7812\]/);
  assert.equal(
    marker.findByProps({ className: "highlight-action__label" }).children.join(""),
    "Cancel",
  );
});

test("disabled ghost links remain non-navigable and do not call their click handler", () => {
  let renderer: TestRenderer.ReactTestRenderer | null = null;
  let clicked = false;
  let prevented = false;

  act(() => {
    renderer = TestRenderer.create(
      <Button
        variant="ghost"
        href="/cancel"
        disabled
        onClick={() => {
          clicked = true;
        }}
      >
        Cancel
      </Button>,
    );
  });

  if (!renderer) {
    throw new Error("Renderer was not created");
  }

  const link = (renderer as TestRenderer.ReactTestRenderer).root.findByType("a");
  assert.equal(link.props.href, undefined);
  assert.equal(link.props["aria-disabled"], true);

  link.props.onClick({
    preventDefault: () => {
      prevented = true;
    },
  } as unknown as MouseEvent<HTMLAnchorElement>);

  assert.equal(prevented, true);
  assert.equal(clicked, false);
});
