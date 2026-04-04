import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("RulesOutcomesPage copies legacy @outcome shortcodes instead of canonical JSX", () => {
  const source = readFileSync(new URL("./RulesOutcomesPage.tsx", import.meta.url), "utf8");

  assert.match(source, /<ShortcodeField[\s\S]*shortcode=\{gameCard\.legacyToken\}/);
  assert.doesNotMatch(source, /<ShortcodeField[\s\S]*shortcode=\{gameCard\.jsx\}/);
  assert.match(source, /Copy <code>\{"@outcome\/success"\}<\/code>/);
});

test("RulesEffectsPage copies legacy @effect shortcodes instead of canonical JSX", () => {
  const source = readFileSync(new URL("./RulesEffectsPage.tsx", import.meta.url), "utf8");

  assert.match(source, /<ShortcodeField[\s\S]*shortcode=\{gameCard\.legacyToken\}/);
  assert.doesNotMatch(source, /<ShortcodeField[\s\S]*shortcode=\{gameCard\.jsx\}/);
});

test("RulesStuntsPage copies legacy @stunt shortcodes instead of canonical JSX", () => {
  const source = readFileSync(new URL("./RulesStuntsPage.tsx", import.meta.url), "utf8");

  assert.match(source, /<ShortcodeField[\s\S]*shortcode=\{gameCard\.legacyToken\}/);
  assert.doesNotMatch(source, /<ShortcodeField[\s\S]*shortcode=\{gameCard\.jsx\}/);
});
