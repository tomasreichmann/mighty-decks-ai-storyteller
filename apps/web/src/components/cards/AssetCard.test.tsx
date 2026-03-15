import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AssetCard } from "./AssetCard";

test("AssetCard renders base and modifier layers", () => {
  const markup = renderToStaticMarkup(
    React.createElement(AssetCard, {
      baseAssetSlug: "medieval_lantern",
      modifierSlug: "base_hidden",
    }),
  );

  assert.match(markup, /Lantern/);
  assert.match(markup, /Provides light in the current zone/);
  assert.match(markup, /Hidden/);
  assert.match(markup, /Not revealed until first use/);
});
