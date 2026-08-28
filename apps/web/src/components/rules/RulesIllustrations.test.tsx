import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const illustrations = readFileSync(
  new URL("./RulesIllustrations.tsx", import.meta.url),
  "utf8",
);
const dieMarker = readFileSync(new URL("./DieMarker.tsx", import.meta.url), "utf8");
const rulebookStyles = readFileSync(
  new URL("./RulesRulebookContent.module.css", import.meta.url),
  "utf8",
);

test("uses removed d4s, equal tracking cards, and centered Location occupants", () => {
  assert.match(dieMarker, /removed\?: boolean/);
  assert.match(dieMarker, /d\$\{sides\} marker removed/);
  assert.match(dieMarker, /styles\.removed/);

  const toughness = illustrations
    .split("export const RemainingToughness")[1]
    ?.split("export const CounterTracking")[0] ?? "";
  assert.match(toughness, /removed=\{value === 0\}/);

  const counter = illustrations
    .split("export const CounterTracking")[1]
    ?.split("export const CatastropheFlow")[0] ?? "";
  assert.match(illustrations, /const trackingCardClassName = "w-\[10rem\]"/);
  assert.equal((counter.match(/className=\{trackingCardClassName\}/g) ?? []).length, 2);

  assert.match(illustrations, /roleLabel: "Player"/);
  assert.match(illustrations, /roleLabel: "Enemy"/);
  assert.match(illustrations, /symbol: "✦"/);
  assert.match(illustrations, /symbol: "☠"/);
  assert.match(illustrations, /absolute inset-0 z-20 flex items-center justify-center/);
});

test("uses the approved canonical-card tableau for What You Need to Play", () => {
  assert.doesNotMatch(illustrations, /RulebookDiagramCard/);
  const completeTable = illustrations
    .split("export const CompleteTableSetup")[1]
    ?.split("export const ComposedAssetEquation")[0] ?? "";

  assert.match(completeTable, /<LocationCard/);
  assert.match(completeTable, /title="Castle Gate"/);
  assert.match(completeTable, /title="Reinforcements Coming"/);
  assert.match(completeTable, /baseLayerSlug="guard_blue"/);
  assert.match(completeTable, /tacticalRoleSlug="brute"/);
  assert.match(completeTable, /<OutcomeCard card="success" face="back"/);
  for (const slug of ["success", "fumble", "chaos"]) {
    assert.match(completeTable, new RegExp(`type="OutcomeCard" slug="${slug}"`));
  }
  assert.match(completeTable, /type="EffectCard" slug="injury"/);
  assert.match(completeTable, /type="StuntCard" slug="marksman"/);
  assert.match(completeTable, /noun="Throwing Knife"\s+modifier="Returning"/);
  assert.match(completeTable, /<DieMarker sides=\{4\} value=\{2\}/);
  assert.match(completeTable, /<DieMarker sides=\{4\} value=\{3\}/);
  assert.match(completeTable, /className=\{styles\.tableSetupViewport\}/);
  assert.match(completeTable, /className=\{styles\.tableSetupCanvas\}/);
  assert.match(illustrations, /const tableSetupCardClassName = "w-\[9rem\]"/);
  assert.equal((completeTable.match(/className=\{tableSetupCardClassName\}/g) ?? []).length, 9);
  assert.match(rulebookStyles, /--table-setup-card-width: 9rem/);
  assert.match(rulebookStyles, /\.tableSetupOutcomeDeck\s*{[^}]+width: var\(--table-setup-card-width\)/s);
  assert.match(rulebookStyles, /\.tableSetupOutcomeHand\s*{[^}]+repeat\(3, var\(--table-setup-card-width\)\)/s);
  assert.doesNotMatch(completeTable, /\["Mira", "Aldren", "Tomas"\]/);
  assert.doesNotMatch(completeTable, /slug="safecracker"/);
  assert.doesNotMatch(completeTable, /slug="boost"/);

  // Keep the known face-up cards catalog-backed rather than recreating them.
  assert.match(completeTable, /<ResolvedCard type="OutcomeCard" slug="success"/);
  assert.match(completeTable, /<CounterCard/);
});

test("shows Distress and Injury as real-card milestone lanes", () => {
  const thresholds = illustrations
    .split("export const StatusThresholds")[1]
    ?.split("export const PhysicalAssetComposition")[0] ?? "";

  for (const slug of ["distress", "panicked", "hopeless", "injury", "taken-out"]) {
    assert.match(thresholds, new RegExp(`slug="${slug}"`));
  }
  assert.match(thresholds, /0–2 OK/);
  assert.match(thresholds, /3 Distress \+ Panicked/);
  assert.match(thresholds, /4 Distress \+ Hopeless/);
  assert.match(thresholds, /0–3 OK/);
  assert.match(thresholds, /4 Injury \+ Taken Out/);
  assert.doesNotMatch(thresholds, /\[1, 2, 3, 4\]\.map/);
});

test("uses an available Stunt in the Physical Asset composition", () => {
  const composition = illustrations
    .split("export const PhysicalAssetComposition")[1]
    ?.split("export const FumbleBranchesV2")[0] ?? "";

  assert.match(composition, /type="StuntCard" slug="marksman"/);
  assert.doesNotMatch(composition, /slug="sharpshooter"/);
});

test("lays out the two Fumble outcomes as a compact responsive fork", () => {
  const fumble = illustrations
    .split("export const FumbleBranchesV2")[1]
    ?.split("export const CatastropheFlowV2")[0] ?? "";

  assert.match(fumble, /styles\.fumbleFork/);
  assert.match(fumble, /styles\.fumbleBranches/);
  assert.equal((fumble.match(/styles\.fumbleBranch(?!es)/g) ?? []).length, 2);
  assert.equal((fumble.match(/styles\.fumbleConsequence(?!s)/g) ?? []).length, 2);
  assert.match(illustrations, /const fumbleCardClassName = "w-\[6\.5rem\]"/);
  assert.equal((fumble.match(/className=\{fumbleCardClassName\}/g) ?? []).length, 5);
  assert.doesNotMatch(fumble, /fumbleMissMark|fumbleArrowShot|fumbleMissX/);
  assert.match(rulebookStyles, /\.fumbleSource::after/);
  assert.match(rulebookStyles, /\.fumbleBranch::before/);
  assert.match(rulebookStyles, /\.fumbleBranches\s*{[^}]+grid-template-columns: minmax\(0, 3fr\) minmax\(0, 7fr\)[^}]+padding-top: 2\.25rem/s);
  assert.match(rulebookStyles, /\.fumbleBranches::before\s*{[^}]+right: 35%[^}]+left: 15%/s);
  assert.match(rulebookStyles, /\.fumbleBranch::before\s*{[^}]+top: -2\.25rem[^}]+height: 2\.25rem/s);
  assert.match(rulebookStyles, /@media \(max-width: 640px\)[\s\S]+\.fumbleBranch\s*{[^}]+padding-top: 1\.75rem/);
  assert.match(rulebookStyles, /@media \(max-width: 640px\)/);
  assert.doesNotMatch(fumble, /â/);
});

test("top-aligns tracked cards and overlaps their d4 markers", () => {
  const toughness = illustrations
    .split("export const RemainingToughness")[1]
    ?.split("export const CounterTracking")[0] ?? "";
  const counter = illustrations
    .split("export const CounterTracking")[1]
    ?.split("export const CatastropheFlow")[0] ?? "";

  assert.match(toughness, /styles\.trackingGrid/);
  assert.match(counter, /styles\.trackingGrid/);
  assert.match(toughness, /!absolute right-2 top-2 z-20/);
  assert.match(counter, /!absolute right-2 top-2 z-20/);
  assert.doesNotMatch(illustrations, /-right-2 -top-2/);
  assert.match(illustrations, /Taken Out — after 1 Distress/);
  assert.doesNotMatch(illustrations, /0 Toughness/);
});
