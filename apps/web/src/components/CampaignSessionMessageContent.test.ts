import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("CampaignSessionMessageContent renders markdown images inside session chat bubbles", () => {
  const source = readFileSync(
    new URL("./CampaignSessionMessageContent.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /markdown_image/);
  assert.match(source, /<img/);
  assert.match(source, /segment\.altText/);
  assert.match(source, /segment\.src/);
});
