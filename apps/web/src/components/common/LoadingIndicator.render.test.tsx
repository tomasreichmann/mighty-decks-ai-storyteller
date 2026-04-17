import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import TestRenderer from "react-test-renderer";
import { LoadingIndicator } from "./LoadingIndicator";

test("LoadingIndicator keeps the wrapper close to the ring size", () => {
  const renderer = TestRenderer.create(
    React.createElement(
      LoadingIndicator,
      {
        value: 68,
        total: 100,
        radius: 28,
        thickness: 10,
        color: "gold",
      },
      React.createElement("span", null, "68%"),
    ),
  );

  const progressbar = renderer.root.findByProps({ role: "progressbar" });
  assert.equal(progressbar.props.style.width, 78);
  assert.equal(progressbar.props.style.height, 78);
  assert.equal(progressbar.findByType("svg").props.viewBox, "0 0 78 78");
});

test("LoadingIndicator renders a full circle when progress rounds to 100 percent", () => {
  const renderer = TestRenderer.create(
    React.createElement(
      LoadingIndicator,
      {
        value: 99.5,
        total: 100,
        radius: 28,
        thickness: 10,
        color: "gold",
      },
      React.createElement("span", null, "100%"),
    ),
  );

  const progressbar = renderer.root.findByProps({ role: "progressbar" });
  const svg = progressbar.findByType("svg");

  assert.equal(svg.findAllByType("path").length, 0);
});
