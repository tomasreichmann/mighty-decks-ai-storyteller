import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("GameCardView passes effect names into the shared effect-card header", () => {
  const source = readFileSync(new URL("./GameCardView.tsx", import.meta.url), "utf8");

  assert.match(source, /case "EffectCard"/);
  assert.match(source, /imageLabel=\{gameCard\.card\.title\}/);
  assert.match(source, /LayeredCard/);
});

test("LayeredCard can render a label beside the top-left effect icon", () => {
  const source = readFileSync(new URL("../cards/LayeredCard.tsx", import.meta.url), "utf8");

  assert.match(source, /imageLabel\?: ReactNode/);
  assert.match(source, /foreignObject x="12" y="10" width="118" height="22"/);
  assert.match(source, /font-ui text-\[9px\] font-bold leading-none tracking-\[0\.05em\]/);
});
