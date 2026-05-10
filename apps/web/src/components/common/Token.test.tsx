import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Token, tokenColors, tokenSizes } from "./Token";

test("Token renders a circular image with an optional matching label", () => {
  const markup = renderToStaticMarkup(
    React.createElement(Token, {
      color: "cloth",
      imageAlt: "Void-seer token",
      imageUrl: "/actors/base/manipulator.png",
      label: "Void-seer",
      size: "md",
    }),
  );

  assert.match(markup, /token/);
  assert.match(markup, /token__button/);
  assert.match(markup, /token__label/);
  assert.match(markup, /Void-seer/);
  assert.match(markup, /h-\[1in\] w-\[1in\]/);
  assert.match(markup, /bg-kac-cloth-light/);
  assert.match(markup, /bottom-0/);
  assert.match(markup, /translate-y-1\/4/);
  assert.doesNotMatch(markup, /translate-y-1\/2/);
  assert.doesNotMatch(markup, /-translate-y-1\/2/);
  assert.doesNotMatch(markup, /inset-\[8%\]/);
  assert.doesNotMatch(markup, /mix-blend-screen/);
});

test("Token supports the standard color and physical size ladders", () => {
  assert.deepEqual([...tokenColors], [
    "gold",
    "fire",
    "blood",
    "bone",
    "steel",
    "iron",
    "skin",
    "cloth",
    "curse",
    "monster",
  ]);
  assert.deepEqual([...tokenSizes], ["sm", "md", "lg", "xl"]);
});

test("Token can render without a label", () => {
  const markup = renderToStaticMarkup(
    React.createElement(Token, {
      color: "curse",
      imageAlt: "unlabeled token",
      imageUrl: "/actors/base/horror.png",
      size: "lg",
    }),
  );

  assert.match(markup, /h-\[2in\] w-\[2in\]/);
  assert.doesNotMatch(markup, /token__label/);
});

test("Token selected state renders a non-layout highlight ring using the highlight shade", () => {
  const markup = renderToStaticMarkup(
    React.createElement(Token, {
      color: "cloth",
      imageAlt: "selected token",
      imageUrl: "/actors/base/manipulator.png",
      selected: true,
    }),
  );

  assert.match(markup, /token__selected-ring/);
  assert.match(markup, /absolute/);
  assert.match(markup, /inset-\[-14%\]/);
  assert.match(markup, /text-kac-cloth-light/);
});

test("Token ping renders an animated ring with controlled repeat counts", () => {
  const onceMarkup = renderToStaticMarkup(
    React.createElement(Token, {
      color: "gold",
      imageAlt: "ping token",
      imageUrl: "/actors/base/commander.png",
      ping: true,
    }),
  );
  const countMarkup = renderToStaticMarkup(
    React.createElement(Token, {
      color: "gold",
      imageAlt: "ping token",
      imageUrl: "/actors/base/commander.png",
      ping: 3,
    }),
  );
  const infiniteMarkup = renderToStaticMarkup(
    React.createElement(Token, {
      color: "gold",
      imageAlt: "ping token",
      imageUrl: "/actors/base/commander.png",
      ping: "infinite",
    }),
  );

  assert.match(onceMarkup, /token__ping-ring/);
  assert.match(onceMarkup, /--token-ping-count:1/);
  assert.match(countMarkup, /--token-ping-count:3/);
  assert.match(infiniteMarkup, /--token-ping-count:infinite/);
});
