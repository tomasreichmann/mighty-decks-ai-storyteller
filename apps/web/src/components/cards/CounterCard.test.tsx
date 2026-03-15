import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { CounterCard } from "./CounterCard";

test("CounterCard renders the current/max header and authoring controls", () => {
  const markup = renderToStaticMarkup(
    React.createElement(CounterCard, {
      iconSlug: "danger",
      title: "Threat Clock",
      currentValue: 3,
      maxValue: 5,
      description: "Tracks visible escalation.",
      onDecrement: () => undefined,
      onIncrement: () => undefined,
      onDecrementMaxValue: () => undefined,
      onIncrementMaxValue: () => undefined,
    }),
  );

  assert.match(markup, /Decrease Threat Clock/);
  assert.match(markup, /Increase Threat Clock/);
  assert.match(markup, /Decrease max Threat Clock/);
  assert.match(markup, /Increase max Threat Clock/);
  assert.match(markup, /Tracks visible escalation/);
  assert.match(
    markup,
    /Decrease Threat Clock[\s\S]*Increase Threat Clock[\s\S]*>3<\/span>[\s\S]*>\/<\/span>[\s\S]*>5<\/span>[\s\S]*Decrease max Threat Clock[\s\S]*Increase max Threat Clock/,
  );
});
