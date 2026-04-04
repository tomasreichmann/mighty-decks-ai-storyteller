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
  assert.match(source, /iconCornerGradientId/);
  assert.match(source, /<path[\s\S]*fill=\{`url\(#\$\{iconCornerGradientId\}\)`\}/);
  assert.match(source, /TITLE_VARIANT_STYLES/);
  assert.match(source, /wrapText/);
  assert.doesNotMatch(source, /<circle[\s\S]*cx="296"/);
  assert.doesNotMatch(source, /<Label/);
});
