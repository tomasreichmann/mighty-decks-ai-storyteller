import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ActorToken } from "./ActorToken";

test("ActorToken renders a circular portrait with only the character name label", () => {
  const markup = renderToStaticMarkup(
    React.createElement(ActorToken, {
      label: "Void-seer",
      imageUrl: "/actors/base/manipulator.png",
      tone: "cloth",
    }),
  );

  assert.match(markup, /Void-seer/);
  assert.match(markup, /class="label /);
  assert.match(markup, /rounded-full/);
  assert.match(markup, /actor-token/);
});

test("ActorToken can render without secondary copy", () => {
  const markup = renderToStaticMarkup(
    React.createElement(ActorToken, {
      label: "Medic",
      imageUrl: "/actors/base/healer.png",
    }),
  );

  assert.match(markup, /Medic/);
  assert.doesNotMatch(markup, /undefined/);
});
