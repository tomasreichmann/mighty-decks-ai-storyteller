import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

test("StaticBoardFigure composes the non-interactive shared board stack", () => {
  const componentUrl = new URL("./StaticBoardFigure.tsx", import.meta.url);

  assert.ok(existsSync(componentUrl));
  const source = readFileSync(componentUrl, "utf8");

  assert.match(source, /<BoardProvider/);
  assert.match(source, /<BoardFrame[^>]*interactive=\{false\}/);
  assert.match(source, /<BoardFrame[^>]*backgroundImageUrl=\{backgroundImageUrl\}/);
  assert.match(source, /<Board/);
  assert.doesNotMatch(source, /<Board\s[^>]*backgroundImageUrl/);
  assert.match(source, /renderItem=\{renderItem\}/);
});
