import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("markdownGameComponents resolves built-in asset slugs when module assets are absent", () => {
  const source = readFileSync(new URL("./markdownGameComponents.ts", import.meta.url), "utf8");

  assert.match(source, /assetBaseCardsBySlug/);
  assert.match(source, /assetModifierCardsBySlug/);
  assert.match(source, /const builtInAssetsBySlug = new Map/);
  assert.match(source, /const moduleAsset = moduleAssetsBySlug\?\.get\(key\);/);
  assert.match(source, /const asset = builtInAssetsBySlug\.get\(key\);/);
  assert.match(source, /modifierSlug: validatedModifierSlug/);
});

test("markdownGameComponents only offers custom module assets in insert options", () => {
  const source = readFileSync(new URL("./markdownGameComponents.ts", import.meta.url), "utf8");

  assert.match(
    source,
    /AssetCard:\s*assets\s*\.filter\(\(asset\) => asset\.kind === "custom"\)/,
  );
});

test("markdownGameComponents resolves modifier-bearing asset shortcodes as built-in assets", () => {
  const source = readFileSync(
    new URL("./markdownGameComponents.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /if \(normalizedModifierSlug\)/);
  assert.match(
    source,
    /createGameCardJsx\(type, asset\.assetSlug, \{\s*modifierSlug: validatedModifierSlug,\s*\}\)/,
  );
  assert.match(source, /modifierSlug: validatedModifierSlug/);
});

test("markdownGameComponents rejects unknown modifier-bearing asset shortcodes", () => {
  const source = readFileSync(
    new URL("./markdownGameComponents.ts", import.meta.url),
    "utf8",
  );

  assert.match(
    source,
    /if \(!assetModifierCardsBySlug\.has\(normalizedModifierSlug as AssetModifierSlug\)\) \{\s*return null;\s*\}/,
  );
});
