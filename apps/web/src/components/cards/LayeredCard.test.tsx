import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";

import { LayeredCard } from "./LayeredCard";

test("LayeredCard renders adjective header with shared sizing and grouped alignment", () => {
  const markup = renderToStaticMarkup(
    <LayeredCard
      noun="Pawn"
      nounDeck="base"
      nounCornerIcon="/types/actor.png"
      adjective="Fast"
      adjectiveDeck="base mod"
      adjectiveCornerIcon="/types/actor.png"
    />,
  );

  assert.match(markup, /justify-start/);
  assert.match(markup, /gap-1/);
  assert.match(markup, /text-\[9px\][^"]*">base mod</);
  assert.match(markup, /src="\/types\/actor\.png"[^>]*class="h-\[18px\] w-\[18px\] object-contain"/);
});
