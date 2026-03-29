import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Page primary nav assigns explicit background assets per nav item", () => {
  const source = readFileSync(new URL("./Page.tsx", import.meta.url), "utf8");

  assert.match(
    source,
    /to: "\/"[\s\S]*label: "Home"[\s\S]*buttonBackgroundImage: "\/button-background-monster\.png"/,
  );
  assert.match(
    source,
    /to: "\/adventure-module\/list"[\s\S]*label: "Modules"[\s\S]*buttonBackgroundImage: "\/button-background-gold\.png"/,
  );
  assert.match(
    source,
    /to: "\/campaign\/list"[\s\S]*label: "Campaigns"[\s\S]*buttonBackgroundImage: "\/button-background-fire\.png"/,
  );
  assert.match(
    source,
    /to: "\/rules"[\s\S]*label: "Rules"[\s\S]*buttonBackgroundImage: "\/button-background-cloth\.png"/,
  );
  assert.match(
    source,
    /to: "\/image"[\s\S]*label: "Image Lab"[\s\S]*buttonBackgroundImage: "\/button-background-curse\.png"/,
  );
  assert.match(
    source,
    /to: "\/workflow-lab"[\s\S]*label: "Workflow"[\s\S]*buttonBackgroundImage: "\/button-background-grey\.png"/,
  );
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
