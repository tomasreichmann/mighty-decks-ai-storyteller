import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("ActorCard uses a hardcoded line height for the body rows", () => {
  const source = readFileSync(new URL("./ActorCard.tsx", import.meta.url), "utf8");

  assert.match(source, /leading-\[16px\]/);
  assert.match(source, /min-h-4/);
  assert.match(source, /whitespace-nowrap leading-\[16px\]/);
  assert.match(source, /nounEffectClassName:\s*[\s\S]*px-0 pb-1 text-\[11px\] leading-\[16px\]/);
  assert.doesNotMatch(source, /min-h-5/);
});

test("ActorCard supports custom actor card props and shared icon-token rendering", () => {
  const source = readFileSync(new URL("./ActorCard.tsx", import.meta.url), "utf8");

  assert.match(source, /kind:\s*"custom"/);
  assert.match(source, /custom/);
  assert.match(source, /ActorCardTextWithIcons/);
  assert.match(source, /multiline/);
  assert.match(source, /multilineLineClassName="justify-center"/);
  assert.doesNotMatch(source, /nounBoxY: hasAdjective/);
  assert.doesNotMatch(source, /text-\[13px\]/);
  assert.doesNotMatch(source, /text-\[15px\]/);
  assert.match(source, /adjectiveClassName: "text-center"/);
  assert.match(source, /adjectiveDeck: undefined/);
  assert.match(source, /adjectiveCornerIcon: undefined/);
  assert.match(source, /nounDescription/);
  assert.match(source, /adjectiveDescription/);
});

test("ActorCardTextWithIcons can center multiline card rows", () => {
  const source = readFileSync(
    new URL("./ActorCardTextWithIcons.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /multilineLineClassName/);
  assert.match(source, /"flex min-h-4 flex-wrap items-center"/);
});

test("ActorCardTextWithIcons keeps icon tokens in inline text flow", () => {
  const source = readFileSync(
    new URL("./ActorCardTextWithIcons.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /actorIconTextClassName/);
  assert.match(source, /className=\{cn\(actorIconTextClassName/);
  assert.doesNotMatch(source, /className=\{cn\(\s*"inline-flex h-4 items-center align-middle"/);
});
