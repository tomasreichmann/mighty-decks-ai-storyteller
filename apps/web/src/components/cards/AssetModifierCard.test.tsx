import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AssetModifierCard } from "./AssetModifierCard";

test("AssetModifierCard renders a standalone modifier-only asset card", () => {
  const markup = renderToStaticMarkup(
    React.createElement(AssetModifierCard, {
      modifierSlug: "base_hidden",
    }),
  );

  assert.match(markup, /Hidden/);
  assert.match(markup, /Not revealed until first use\./);
  assert.match(markup, /href="\/assets\/base\/hidden\.png"/);
  assert.match(markup, /base mod/);
  assert.doesNotMatch(markup, /rotate\(90\)/);
});
