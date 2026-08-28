import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";
import {
  actorBaseLayerCatalog,
  actorTacticalRoleCatalog,
  actorTacticalSpecialCatalog,
  assetBaseCatalog,
  assetModifierCatalog,
  counterIconCatalog,
  rulesEffectCards,
  rulesOutcomeCards,
  rulesStuntCards,
} from "../spec/dist/index.js";

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptsDirectory, "..");
const generatorPath = join(scriptsDirectory, "generate-card-components-doc.mjs");
const checkedInOutputPath = join(
  repositoryRoot,
  "docs",
  "mighty-decks-card-components.md",
);

test("generates the checked-in Markdown card-component catalog", () => {
  const temporaryDirectory = mkdtempSync(
    join(tmpdir(), "mighty-decks-card-components-"),
  );
  const temporaryOutputPath = join(temporaryDirectory, "cards.md");

  try {
    const result = spawnSync(
      process.execPath,
      [generatorPath, "--output", temporaryOutputPath],
      { cwd: repositoryRoot, encoding: "utf8" },
    );

    assert.equal(result.status, 0, result.stderr || result.stdout);

    const generated = readFileSync(temporaryOutputPath, "utf8");
    const checkedIn = readFileSync(checkedInOutputPath, "utf8");

    assert.equal(generated, checkedIn);
    assert.match(generated, /^# Mighty Decks Card Components/m);
    assert.match(generated, /^## Outcome Cards \(5\)$/m);
    assert.match(generated, /^## Effect Cards \(11\)$/m);
    assert.match(generated, /^## Stunt Cards \(/m);
    assert.match(generated, /^## Actor Base Layers \(/m);
    assert.match(generated, /^## Asset Bases \(/m);
    assert.match(generated, /^## Counter Icons \(/m);
    assert.match(generated, /Taken Out/);
    assert.doesNotMatch(generated, /Unconscious/);

    const everyCatalogEntry = [
      ...rulesOutcomeCards,
      ...rulesEffectCards,
      ...rulesStuntCards,
      ...actorBaseLayerCatalog,
      ...actorTacticalRoleCatalog,
      ...actorTacticalSpecialCatalog,
      ...assetBaseCatalog,
      ...assetModifierCatalog,
      ...counterIconCatalog,
    ];
    for (const entry of everyCatalogEntry) {
      assert.match(generated, new RegExp(`\\| ${entry.slug} \\|`));
    }
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});
