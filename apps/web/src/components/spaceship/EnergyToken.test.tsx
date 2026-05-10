import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { EnergyToken } from "./EnergyToken";

test("EnergyToken renders active and spent power token states distinctly", () => {
  const activeMarkup = renderToStaticMarkup(
    React.createElement(EnergyToken, {
      label: "1",
      detail: "Active power",
      state: "active",
    }),
  );
  const spentMarkup = renderToStaticMarkup(
    React.createElement(EnergyToken, {
      label: "1",
      detail: "Spent power",
      state: "spent",
    }),
  );

  assert.match(activeMarkup, /energy-token--active/);
  assert.match(activeMarkup, /Active power/);
  assert.match(spentMarkup, /energy-token--spent/);
  assert.match(spentMarkup, /Spent power/);
  assert.notEqual(activeMarkup, spentMarkup);
});
