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

test("AssetCard renders custom assets with a custom heading and freeform fields", () => {
  const markup = renderToStaticMarkup(
    React.createElement(AssetCard, {
      kind: "custom",
      modifier: "Smoldering",
      noun: "Lantern Shard",
      nounDescription: "Glows brighter around hidden doors.",
      adjectiveDescription: "Whispers when ward-lines start to fail.",
      iconUrl: "https://example.com/assets/lantern-shard.png",
      overlayUrl: "https://example.com/assets/lantern-shard-overlay.png",
    }),
  );

  assert.match(markup, /custom/i);
  assert.match(markup, /Lantern Shard/);
  assert.match(markup, /Glows brighter around hidden doors/);
  assert.match(markup, /Smoldering/);
  assert.match(markup, /Whispers when ward-lines start to fail/);
});

test("AssetCard renders unsupported legacy layered assets as reauthor-required cards", () => {
  const markup = renderToStaticMarkup(
    React.createElement(AssetCard, {
      kind: "legacy_layered",
      title: "Signal Lantern",
    }),
  );

  assert.match(markup, /reauthor required/i);
  assert.match(markup, /Signal Lantern/);
});
