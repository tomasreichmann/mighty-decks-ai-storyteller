import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (fileName: string): string =>
  readFileSync(new URL(fileName, import.meta.url), "utf8");

test("rules routes expose reusable content components for storyteller session tab reuse", () => {
  const outcomes = read("./RulesOutcomesPage.tsx");
  const effects = read("./RulesEffectsPage.tsx");
  const stunts = read("./RulesStuntsPage.tsx");
  const assets = read("./RulesAssetsPage.tsx");

  assert.match(outcomes, /export const RulesOutcomesContent/);
  assert.match(outcomes, /export const RulesOutcomesPage[\s\S]*<RulesOutcomesContent \/>/);
  assert.match(effects, /export const RulesEffectsContent/);
  assert.match(effects, /export const RulesEffectsPage[\s\S]*<RulesEffectsContent \/>/);
  assert.match(stunts, /export const RulesStuntsContent/);
  assert.match(stunts, /export const RulesStuntsPage[\s\S]*<RulesStuntsContent \/>/);
  assert.match(assets, /export const RulesAssetsContent/);
  assert.match(assets, /export const RulesAssetsPage[\s\S]*<RulesAssetsContent \/>/);
});
