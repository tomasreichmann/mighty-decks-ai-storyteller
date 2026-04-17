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

test("Button circle variant stays lighter than the solid shell", () => {
  const source = readFileSync(new URL("./Button.tsx", import.meta.url), "utf8");
  const circleMatch = source.match(/circle:\s*cn\(([\s\S]*?)\n\s*\),/);

  assert.ok(circleMatch, "circle variant block should be present");

  const circleBlock = circleMatch[1];

  assert.match(circleBlock, /rounded-full bg-gradient-to-b border-2 border-kac-iron/);
  assert.match(circleBlock, /shadow-\[2px_2px_0_0_#121b23\]/);
  assert.match(circleBlock, /hover:translate-y-\[1px\]/);
  assert.match(circleBlock, /hover:brightness-\[1\]/);
  assert.match(circleBlock, /hover:shadow-\[1px_1px_0_0_#121b23\]/);
  assert.match(circleBlock, /active:translate-y-\[2px\]/);
  assert.match(circleBlock, /active:shadow-none/);
  assert.doesNotMatch(circleBlock, /border-x-\[3px\]/);
  assert.doesNotMatch(circleBlock, /active:border-b-\[4px\]/);
});

test("Button iron solid variant uses a slightly lighter gradient than the darkest iron tone", () => {
  const source = readFileSync(new URL("./Button.tsx", import.meta.url), "utf8");

  assert.match(
    source,
    /case "iron":\s*case "iron-light":\s*case "iron-dark":\s*return "\[background-color:black\] bg-gradient-to-b from-kac-iron-light to-kac-iron text-kac-steel-light disabled:bg-kac-iron-light";/,
  );
});

test("Button ghost variant gets a hard border shadow with matching states", () => {
  const source = readFileSync(new URL("./Button.tsx", import.meta.url), "utf8");
  const ghostMatch = source.match(/ghost:\s*cn\(([\s\S]*?)\n\s*\),/);

  assert.ok(ghostMatch, "ghost variant block should be present");

  const ghostBlock = ghostMatch[1];

  assert.match(ghostBlock, /border-2[\s\S]*border-kac-iron\/60[\s\S]*bg-transparent/);
  assert.match(ghostBlock, /shadow-\[1px_1px_0_0_#121b23\]/);
  assert.match(ghostBlock, /hover:translate-y-\[1px\]/);
  assert.match(ghostBlock, /hover:shadow-\[2px_2px_0_0_#121b23\]/);
  assert.match(ghostBlock, /active:translate-y-\[2px\]/);
  assert.match(ghostBlock, /active:shadow-none/);
  assert.match(ghostBlock, /disabled:translate-y-0/);
  assert.match(ghostBlock, /disabled:shadow-\[1px_1px_0_0_#121b23\]/);
});

test("Button ghost fire variant uses fire border and text colors", () => {
  const source = readFileSync(new URL("./Button.tsx", import.meta.url), "utf8");

  assert.match(source, /case "fire":\s*case "fire-light":\s*case "fire-lightest":\s*case "fire-dark":\s*return "text-kac-fire-dark border-kac-fire-dark\/70 hover:bg-kac-fire-light\/25";/);
});
