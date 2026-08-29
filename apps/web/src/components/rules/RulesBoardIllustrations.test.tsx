import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

test("the complete table figure uses the shared static board and wood surface", () => {
  const sourceUrl = new URL("./RulesBoardIllustrations.tsx", import.meta.url);

  assert.ok(existsSync(sourceUrl));
  const source = readFileSync(sourceUrl, "utf8");

  assert.match(source, /StaticBoardFigure/);
  assert.match(source, /const boardBackground = "\/backgrounds\/board\.jpg"/);
  assert.match(source, /backgroundImageUrl=\{boardBackground\}/);
  assert.match(source, /export const CompleteTableSetup/);
  assert.match(source, /completeTableSetupMobileBoard/);
  assert.match(source, /sm:hidden/);
});
