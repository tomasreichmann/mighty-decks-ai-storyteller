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
  assert.match(page, /<article/);
  assert.match(page, /parseRulebookDocument/);
  assert.match(content, /ReactMarkdown/);
  assert.match(content, /remarkGfm/);
  assert.match(content, /<section id=\{section\.id\}/);
  assert.match(content, /<Text/);
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

test("player action examples use the shared Message treatment", () => {
  const example = readFileSync(
    new URL("../components/rules/RulesActionExample.tsx", import.meta.url),
    "utf8",
  );
  const content = readFileSync(
    new URL("../components/rules/RulesRulebookContent.tsx", import.meta.url),
    "utf8",
  );

  assert.match(example, /<Message/);
  assert.match(example, /<Panel/);
  assert.match(example, /className="mt-2"/);
  assert.match(example, /<OutcomeCard/);
  assert.match(example, /outcomes/);
  assert.match(example, /card=\{outcome\}/);
  assert.match(example, /speaker === "player"/);
  assert.match(example, /\? "fire"/);
  assert.match(example, /\? "gold"/);
  assert.match(example, /: "cloth"/);
  assert.match(example, /self-end/);
  assert.match(example, /self-start/);
  for (const id of [
    "example-a-basic-action",
    "example-partial-success",
    "example-effect-is-impact-not-damage",
    "example-defense",
    "example-catastrophe",
    "example-progress-counter",
  ]) {
    assert.match(example, new RegExp(id));
  }
  assert.match(content, /ruleExampleById/);
  assert.match(content, /RulesActionExample/);
  assert.doesNotMatch(example, /tiny-example-distress-thresholds/);
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
  assert.match(illustrations, /docking-bay/);
  assert.match(illustrations, /cargo-hold/);
  assert.match(illustrations, /crew-quarters/);
  assert.match(illustrations, /outcomeCardClassName/);
  assert.match(illustrations, /import cargoHoldImage from .*cargo-hold/);
  assert.doesNotMatch(illustrations, /\/api\/adventure-artifacts/);
  assert.match(content, /rulebookIllustrationsBySectionId/);
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
