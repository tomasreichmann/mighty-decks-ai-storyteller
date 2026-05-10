import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("App registers the rules reference routes", () => {
  const source = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

  assert.match(source, /path="assets"\s+element={<RulesAssetsPage \/>}/);
  assert.match(source, /RulesShipCombatPage/);
  assert.match(source, /path="ship-combat"\s+element={<RulesShipCombatPage \/>}/);
});

test("RulesLayoutPage includes Assets and Ship Combat tabs", () => {
  const source = readFileSync(new URL("./RulesLayoutPage.tsx", import.meta.url), "utf8");

  assert.match(source, /SectionBoundary/);
  assert.match(source, /resetKey=\{location\.pathname\}/);
  assert.match(source, /label: "Assets"/);
  assert.match(source, /to: "\/rules\/assets"/);
  assert.match(source, /label: "Ship Combat"/);
  assert.match(source, /to: "\/rules\/ship-combat"/);
});

test("Rules card pages wrap GameCardView in CardBoundary", () => {
  const outcomesSource = readFileSync(
    new URL("./RulesOutcomesPage.tsx", import.meta.url),
    "utf8",
  );
  const effectsSource = readFileSync(
    new URL("./RulesEffectsPage.tsx", import.meta.url),
    "utf8",
  );
  const stuntsSource = readFileSync(
    new URL("./RulesStuntsPage.tsx", import.meta.url),
    "utf8",
  );

  for (const source of [outcomesSource, effectsSource, stuntsSource]) {
    assert.match(source, /CardBoundary/);
    assert.match(source, /<CardBoundary[\s\S]*<GameCardView gameCard=\{gameCard\}[\s\S]*<\/CardBoundary>/);
  }
});
