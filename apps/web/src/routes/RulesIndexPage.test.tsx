import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("RulesIndexPage composes the canonical Markdown rulebook as a reader-facing article", () => {
  const page = readFileSync(new URL("./RulesIndexPage.tsx", import.meta.url), "utf8");
  const content = readFileSync(
    new URL("../components/rules/RulesRulebookContent.tsx", import.meta.url),
    "utf8",
  );

  assert.match(page, /mighty-decks-rulebook\.md\?raw/);
  assert.match(page, /<RulesTableOfContents \/>/);
  assert.match(page, /data-rules-page/);
  assert.match(page, /<article/);
  assert.match(page, /parseRulebookDocument/);
  assert.match(content, /ReactMarkdown/);
  assert.match(content, /remarkGfm/);
  assert.match(content, /<section id=\{section\.id\}/);
  assert.match(content, /<Text/);
  assert.match(content, /styles\.bodyText/);
  assert.match(content, /<Heading/);
  assert.match(content, /table:/);
  assert.match(content, /<Table>/);
  assert.match(content, /blockquote:/);
  assert.match(content, /code:/);
});

test("rulebook reader delegates its public section inventory to the parsed canonical document", () => {
  const source = readFileSync(
    new URL("../components/rules/RulesRulebookContent.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /RulebookDocument/);
  assert.match(source, /document\.sections\.map/);
});

test("canonical Markdown blocks are never replaced by visual enhancements", () => {
  const content = readFileSync(
    new URL("../components/rules/RulesRulebookContent.tsx", import.meta.url),
    "utf8",
  );

  assert.match(content, /markdown=\{block\}/);
  assert.doesNotMatch(content, /ruleExampleById/);
  assert.doesNotMatch(content, /if \(example\)/);
});

test("rulebook mounts accessible illustrations made from the existing component catalog", () => {
  const illustrations = readFileSync(
    new URL("../components/rules/RulesIllustrations.tsx", import.meta.url),
    "utf8",
  );
  const content = readFileSync(
    new URL("../components/rules/RulesRulebookContent.tsx", import.meta.url),
    "utf8",
  );

  for (const name of [
    "CompleteTableSetup",
    "ComposedAssetEquation",
    "ActorInitiative",
    "ZonesAndRange",
    "RemainingToughness",
    "CounterTracking",
    "CatastropheFlow",
    "EffectEquation",
  ]) {
    assert.match(illustrations, new RegExp(name));
  }
  for (const component of [
    "resolveGameCard",
    "GameCardView",
    "AssetCard",
    "CounterCard",
    "ActorCard",
    "LocationCard",
    "Token",
    "CardBoundary",
    "<figure",
    "<figcaption",
  ]) {
    assert.match(illustrations, new RegExp(component));
  }
  assert.match(illustrations, /slug="safecracker"/);
  assert.match(illustrations, /when breaking into a locked place/);
  assert.match(illustrations, /Tools and Empowered contribute 2 Effect on a Success/);
  assert.match(illustrations, /Safecracker adds 1 more/);
  assert.match(illustrations, /5 Effect/);
  assert.match(illustrations, /const locationExamples/);
  assert.match(illustrations, /outcomeCardClassName/);
  assert.doesNotMatch(illustrations, /\/api\/adventure-artifacts/);
  assert.match(content, /rulebookIllustrationsBySectionId/);
  assert.match(illustrations, /export const FumbleBranches/);
  assert.match(illustrations, /rulebookIllustrationsBySubsectionId/);
  assert.match(illustrations, /"example-two-valid-fumbles": FumbleBranches/);
  assert.match(illustrations, /MISS/);
  assert.match(illustrations, /HIT, BUT/);
  assert.match(illustrations, /Broken String/);
  assert.match(illustrations, /1 Injury/);
  assert.match(illustrations, /Action to repair/);
  assert.match(content, /rulebookIllustrationsBySubsectionId/);
  assert.match(content, /<RulebookMarkdown markdown=\{block\} subsectionId=\{id\} \/>/);
  assert.match(content, /Enhancement \? <Enhancement \/> : null/);

  for (const label of [
    "Choose card",
    "Resolve Effect",
    "Discard",
    "Draw replacement",
    "Catastrophe check",
  ]) {
    assert.match(illustrations, new RegExp(label));
  }
  assert.match(illustrations, /export const CoreActionLoop/);
  assert.match(illustrations, /"core-action-loop": CoreActionLoop/);
  assert.match(illustrations, /minmax\(18rem,1\.5fr\)/);
  assert.ok((illustrations.match(/<ResolvedCard type="OutcomeCard"/g) ?? []).length >= 3);
});

test("the Effect illustration uses the actual component cards", () => {
  const illustrations = readFileSync(
    new URL("../components/rules/RulesIllustrations.tsx", import.meta.url),
    "utf8",
  );
  const effectEquation = illustrations
    .split("export const EffectEquation")[1]
    ?.split("export const CompleteTableSetup")[0] ?? "";

  assert.match(effectEquation, /<ResolvedCard type="AssetCard" slug="base_tools" modifierSlug="base_empowered"/);
  assert.match(effectEquation, /<ResolvedCard type="StuntCard" slug="safecracker"/);
  assert.match(effectEquation, /<ResolvedCard type="OutcomeCard" slug="success"/);
  assert.match(effectEquation, /5 Effect/);
});

test("Actor initiative places Actors immediately after their player slots", () => {
  const illustrations = readFileSync(
    new URL("../components/rules/RulesIllustrations.tsx", import.meta.url),
    "utf8",
  );
  const initiative = illustrations
    .split("export const ActorInitiative")[1]
    ?.split("export const ZonesAndRange")[0] ?? "";

  const labels = ["Mira", "Guard", "Wolf", "Aldren", "Bandit", "Tomas"];
  let previousIndex = -1;
  for (const label of labels) {
    const index = initiative.indexOf(label);
    assert.ok(index > previousIndex, `${label} should follow the prior initiative entry`);
    previousIndex = index;
  }
  assert.match(initiative, /Actors act immediately after the player they sit in front of/);
  assert.match(initiative, /actors: \["Guard", "Wolf"\]/);
  assert.match(initiative, /actors: \["Bandit"\]/);
  assert.match(initiative, /<ActorCard/);
});

test("Toughness and Counter figures place d4 markers directly over cards", () => {
  const illustrations = readFileSync(
    new URL("../components/rules/RulesIllustrations.tsx", import.meta.url),
    "utf8",
  );

  const toughness = illustrations
    .split("export const RemainingToughness")[1]
    ?.split("export const CounterTracking")[0] ?? "";
  assert.match(toughness, /DieMarker sides=\{4\} value=\{value\}/);
  assert.match(toughness, /relative inline-flex/);
  assert.match(toughness, /Bandit/);
  for (const value of ["3", "1", "0"]) {
    assert.match(illustrations, new RegExp(`\\[${value},`));
  }

  const counter = illustrations
    .split("export const CounterTracking")[1]
    ?.split("export const CatastropheFlow")[0] ?? "";
  assert.match(counter, /Ice Storm/);
  assert.match(counter, /Bandit/);
  assert.match(counter, /3 \/ 4/);
  assert.match(counter, /DieMarker sides=\{4\} value=\{3\}/);
  assert.match(counter, /DieMarker sides=\{4\} value=\{1\}/);
  assert.match(counter, /Dice track values; they are not rolled/);
});

test("Zones and Range uses the medieval mini-adventure and explicit reach legend", () => {
  const illustrations = readFileSync(
    new URL("../components/rules/RulesIllustrations.tsx", import.meta.url),
    "utf8",
  );

  for (const obsolete of ["Docking Bay", "Cargo Hold", "Crew Quarters"]) {
    assert.doesNotMatch(illustrations, new RegExp(obsolete));
  }
  for (const required of [
    "Castle Gate",
    "Courtyard",
    "Tower",
    "Sword: same zone",
    "Throw: +1 zone",
    "Bow: +2 zones",
    "Sniper: anywhere in sight",
  ]) {
    assert.match(illustrations, new RegExp(required.replace(/[+]/g, "\\+")));
  }
  for (const path of ["castle-gate", "courtyard", "tower"]) {
    assert.match(illustrations, new RegExp(`/rules/locations/${path}\\.png`));
  }
  assert.doesNotMatch(illustrations, /server\/output\/adventure-artifacts/);
});

test("rulebook tables use the shared framed table treatment", () => {
  const content = readFileSync(
    new URL("../components/rules/RulesRulebookContent.tsx", import.meta.url),
    "utf8",
  );
  const table = readFileSync(
    new URL("../components/common/Table.tsx", import.meta.url),
    "utf8",
  );
  const styles = readFileSync(
    new URL("../components/common/Table.module.css", import.meta.url),
    "utf8",
  );

  assert.match(content, /import \{ Table \}/);
  assert.match(content, /<Table>\{children\}<\/Table>/);
  assert.match(table, /<table/);
  assert.match(styles, /overflow-x:\s*auto/);
  assert.match(styles, /box-shadow/);
  assert.match(styles, /thead/);
});
