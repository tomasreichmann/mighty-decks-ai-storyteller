import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("SceneCardFrame renders horizontal scene cards as SVG", () => {
  const source = readFileSync(
    new URL("./SceneCardFrame.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /<svg[\s\S]*viewBox=\{`0 0 \$\{SCENE_CARD_WIDTH\} \$\{SCENE_CARD_HEIGHT\}`\}/);
  assert.match(source, /<image[\s\S]*preserveAspectRatio="xMidYMid slice"/);
  assert.match(source, /topFadeGradientId/);
  assert.match(source, /linearGradient id=\{topFadeGradientId\} x1="0" y1="1" x2="0" y2="0"/);
  assert.doesNotMatch(source, /iconCornerGradientId/);
  assert.doesNotMatch(source, /titleCornerGradientId/);
  assert.doesNotMatch(source, /shadow-\[4px_4px_0_0_#121b23\]/);
  assert.match(source, /TITLE_VARIANT_STYLES/);
  assert.match(source, /wrapText/);
  assert.doesNotMatch(source, /<circle[\s\S]*cx="296"/);
  assert.doesNotMatch(source, /<Label/);
});
