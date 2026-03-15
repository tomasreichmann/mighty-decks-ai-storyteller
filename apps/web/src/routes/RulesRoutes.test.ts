import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("App registers the /rules/assets route", () => {
  const source = readFileSync(new URL("../App.tsx", import.meta.url), "utf8");

  assert.match(source, /path="assets"\s+element={<RulesAssetsPage \/>}/);
});

test("RulesLayoutPage includes an Assets tab", () => {
  const source = readFileSync(new URL("./RulesLayoutPage.tsx", import.meta.url), "utf8");

  assert.match(source, /label: "Assets"/);
  assert.match(source, /to: "\/rules\/assets"/);
});
