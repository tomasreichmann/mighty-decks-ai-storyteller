import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { RulebookDiagramCard } from "./RulebookDiagramCard";

test("renders compact card art, title, type cue, and a readable mechanic badge", () => {
  const html = renderToStaticMarkup(
    <RulebookDiagramCard type="OutcomeCard" slug="success" badge="+2 Effect" />,
  );

  assert.match(html, /Success/);
  assert.match(html, /\+2 Effect/);
  assert.match(html, /img/);
  assert.match(html, /aria-label=/);
  assert.doesNotMatch(html, /The action works well/);
});

test("supports Effect cards and explicit diagram-only art overrides", () => {
  const effect = renderToStaticMarkup(
    <RulebookDiagramCard type="EffectCard" slug="injury" badge="1 Injury" />,
  );
  const custom = renderToStaticMarkup(
    <RulebookDiagramCard
      type="EffectCard"
      slug="injury"
      badge="+1"
      title="Enemy Boost"
      imageUrl="/types/effect.png"
    />,
  );

  assert.match(effect, /Injury/);
  assert.match(custom, /Enemy Boost/);
  assert.match(custom, /\/types\/effect\.png/);
});
