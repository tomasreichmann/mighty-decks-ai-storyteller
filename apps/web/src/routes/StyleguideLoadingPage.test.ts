import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("StyleguideLoadingPage showcases the shared loading primitives", () => {
  const source = readFileSync(
    new URL("./StyleguideLoadingPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /styleguide-loading-page/);
  assert.match(source, /LoadingIndicator/);
  assert.match(source, /PendingIndicator/);
  assert.match(source, /Progress ring/);
  assert.match(source, /useAnimatedLoadingProgress/);
  assert.match(source, /resolveAnimatedLoadingValue/);
  assert.match(source, /requestAnimationFrame/);
  assert.match(source, /prefers-reduced-motion/);
  assert.match(source, /4000/);
  assert.match(source, /Gold/);
  assert.match(source, /Cloth/);
  assert.match(source, /Fire/);
  assert.match(source, /Bone/);
  assert.match(source, /Steel/);
  assert.match(source, /Blood/);
  assert.match(source, /Curse/);
  assert.match(source, /Monster/);
  assert.match(source, /Skin/);
  assert.match(source, /Iron/);
  assert.match(source, /color=\{sample\.color\}/);
  assert.match(
    source,
    /trackColor=\{sample\.color === "iron" \? "bone" : "iron"\}/,
  );
  assert.match(source, /LoadingIndicator[^]*?variant="note"/);
  assert.match(source, /Label[^]*?sample\.color === "iron" \? "steel" : sample\.color/);
  assert.match(source, /PendingIndicator[^]*?color=\{sample\.color\}/);
  assert.match(source, /variant="note"/);
  assert.match(source, /Label/);
  assert.match(source, /Pending dots/);
  assert.match(source, /Back to Overview/);
  assert.doesNotMatch(source, /Loading States/);
  assert.doesNotMatch(source, /Track rule/);
  assert.doesNotMatch(source, /Where to use it/);
});
