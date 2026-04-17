import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const colorFamilyNames = [
  "Gold",
  "Cloth",
  "Bone",
  "Fire",
  "Iron",
  "Steel",
  "Blood",
  "Curse",
  "Monster",
  "Skin",
] as const;

const colorVariantTokens = [
  "gold",
  "gold-light",
  "gold-dark",
  "gold-darker",
  "cloth",
  "cloth-light",
  "cloth-lightest",
  "cloth-dark",
  "bone",
  "bone-light",
  "bone-dark",
  "bone-darker",
  "fire",
  "fire-light",
  "fire-lightest",
  "fire-dark",
  "iron",
  "iron-light",
  "iron-dark",
  "steel",
  "steel-light",
  "steel-dark",
  "blood",
  "blood-light",
  "blood-lighter",
  "blood-lightest",
  "blood-dark",
  "curse",
  "curse-light",
  "curse-lighter",
  "curse-lightest",
  "curse-dark",
  "monster",
  "monster-light",
  "monster-lightest",
  "monster-dark",
  "skin",
  "skin-light",
  "skin-dark",
] as const;

const colorVariantHexes = [
  "#ffd23b",
  "#fff5c0",
  "#f59d20",
  "#c37509",
  "#5c77b2",
  "#80a0bc",
  "#d8e2ea",
  "#32497b",
  "#ecb87b",
  "#e4ceb3",
  "#a3835f",
  "#856a4c",
  "#f50000",
  "#f88b00",
  "#ffe79b",
  "#950101",
  "#121b23",
  "#23303d",
  "#090f15",
  "#abb4c3",
  "#f3f3f4",
  "#65738b",
  "#7b001d",
  "#e3132c",
  "#ff6b6b",
  "#ff9494",
  "#541423",
  "#f20170",
  "#ff6883",
  "#ffc8d1ff",
  "#fff2f2",
  "#c10045",
  "#4ec342",
  "#a4e9a4",
  "#d7ffab",
  "#1aa62b",
  "#f7adae",
  "#f2ced1",
  "#e6848c",
] as const;

test("StyleguideIndexPage documents the design reference hub", () => {
  const source = readFileSync(
    new URL("./StyleguideIndexPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /StyleguideSectionNav/);
  assert.match(source, /Design principles/);
  assert.match(source, /Color families and swatches/);
  assert.match(source, /Common shared-component rules/);
  assert.match(source, /Component use cases/);
  for (const familyName of colorFamilyNames) {
    assert.match(source, new RegExp(`name: "${familyName}"`));
  }
  for (const token of colorVariantTokens) {
    assert.match(source, new RegExp(`"${token}"`));
  }
  for (const hex of colorVariantHexes) {
    assert.match(source, new RegExp(hex));
  }
  assert.match(source, /backgroundColor: variant\.hex/);
  assert.match(source, /Primary/);
  assert.match(source, /Info/);
  assert.match(source, /Muted/);
  assert.match(source, /Warning/);
  assert.match(source, /High contrast/);
  assert.match(source, /Machine/);
  assert.match(source, /Destructive/);
  assert.match(source, /Error/);
  assert.match(source, /Success/);
  assert.match(source, /Human/);
  assert.doesNotMatch(source, /<Tag key=\{variant\.token\}/);
  assert.doesNotMatch(source, /\/styleguide\/typography/);
  assert.doesNotMatch(source, /\/styleguide\/inputs/);
  assert.doesNotMatch(source, /\/styleguide\/buttons/);
});
