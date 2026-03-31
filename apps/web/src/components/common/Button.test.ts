import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Button supports link-style rendering when href is provided", () => {
  const source = readFileSync(new URL("./Button.tsx", import.meta.url), "utf8");

  assert.match(source, /AnchorHTMLAttributes/);
  assert.match(source, /href\?: string/);
  assert.match(source, /if \("href" in rawProps\)/);
  assert.match(source, /return \(\s*<a[\s\S]*ref=\{ref as ForwardedRef<HTMLAnchorElement>\}/);
});
