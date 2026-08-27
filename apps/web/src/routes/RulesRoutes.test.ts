import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { rulebookSectionDefinitions } from "../lib/rulebookDocument";

test("App registers the rules reference routes", () => {
  const source = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

  assert.match(source, /path="assets"\s+element={<RulesAssetsPage \/>}/);
  assert.match(source, /RulesShipCombatPage/);
  assert.match(source, /path="ship-combat"\s+element={<RulesShipCombatPage \/>}/);
});

test("RulesLayoutPage includes the exact-match Rulebook tab and reference tabs", () => {
  const source = readFileSync(new URL("./RulesLayoutPage.tsx", import.meta.url), "utf8");

  assert.match(source, /SectionBoundary/);
  assert.match(source, /resetKey=\{location\.pathname\}/);
  assert.match(
    source,
    /\{ to: "\/rules", label: "Rulebook", end: true \}/,
  );
  assert.match(source, /label: "Assets"/);
  assert.match(source, /to: "\/rules\/assets"/);
  assert.match(source, /label: "Ship Combat"/);
  assert.match(source, /to: "\/rules\/ship-combat"/);
});

test("RulesTableOfContents drives desktop and mobile navigation from the inventory", () => {
  const source = readFileSync(
    new URL("../components/rules/RulesTableOfContents.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /aria-label="Rulebook sections"/);
  assert.match(source, /rulebookNavigationGroups/);
  assert.match(source, /rulebookSectionDefinitions/);
  assert.match(source, /<details/);
  assert.match(source, /<nav/);
  for (const id of [
    "core-action-loop",
    "outcome-cards",
    "actors",
    "turn-based-play",
    "defense",
    "counters",
    "storyteller-principles",
    "quick-reference",
  ]) {
    assert.ok(rulebookSectionDefinitions.some((section) => section.id === id));
  }
  assert.match(source, /href=\{`#\$\{section\.id\}`\}/);
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
