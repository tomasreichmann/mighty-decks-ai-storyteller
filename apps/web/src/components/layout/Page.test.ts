import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Page primary nav assigns explicit background assets per nav item", () => {
  const source = readFileSync(new URL("./Page.tsx", import.meta.url), "utf8");

  assert.match(source, /buttonBackgroundImage: "\/button-background-gold\.png"/);
  assert.match(source, /buttonBackgroundImage: "\/button-background-curse\.png"/);
  assert.match(source, /buttonBackgroundImage: "\/button-background-grey\.png"/);
  assert.match(source, /buttonBackgroundImage: "\/button-background-cloth\.png"/);
  assert.match(source, /buttonBackgroundImage: "\/button-background-monster\.png"/);
});

test("Page comic nav CSS uses per-link background images instead of hue rotation", () => {
  const source = readFileSync(
    new URL("./Page.module.css", import.meta.url),
    "utf8",
  );

  assert.match(source, /background-image: var\(--button-background-image\)/);
  assert.doesNotMatch(source, /button-background\.png/);
  assert.doesNotMatch(source, /--button-hue/);
  assert.doesNotMatch(source, /hue-rotate/);
});
