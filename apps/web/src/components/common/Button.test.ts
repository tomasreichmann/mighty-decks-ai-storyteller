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

test("Button solid variant stays neutral while CTAButton owns the skewed solo style", () => {
  const source = readFileSync(new URL("./Button.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(source, /rotate-\[-2deg\]/);
  assert.doesNotMatch(source, /skew-x-\[-5deg\]/);
});

test("Button exposes a shared sm md lg size ladder with stable heights", () => {
  const source = readFileSync(new URL("./Button.tsx", import.meta.url), "utf8");

  assert.match(source, /ButtonSize = "sm" \| "md" \| "lg"/);
  assert.match(source, /sm:[\s\S]*min-h-8/);
  assert.match(source, /md:[\s\S]*min-h-10/);
  assert.match(source, /lg:[\s\S]*min-h-12/);
});
