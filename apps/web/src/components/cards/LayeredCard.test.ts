import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("LayeredCard centers SVG text content through a full-width inner wrapper", () => {
  const source = readFileSync(
    new URL("./LayeredCard.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /<div className="w-full text-center">/);
  assert.doesNotMatch(source, /text-center text-kac-iron-light"\s*,\s*className\)\}\s*>\s*\{children\}/);
});

test("LayeredCard auto-fits title text inside fixed SVG title boxes", () => {
  const source = readFileSync(
    new URL("./LayeredCard.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /AutoFitSvgText/);
  assert.match(source, /ResizeObserver/);
  assert.match(source, /fontSizePx/);
  assert.match(source, /minFontSizePx/);
  assert.match(source, /height={nounBoxHeight}/);
});

test("LayeredCard keeps adjective description line height compact for three-line text", () => {
  const source = readFileSync(
    new URL("./LayeredCard.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    source,
    /"px-2 text-\[11px\] leading-\[1\.08\] text-kac-iron whitespace-pre-wrap"/,
  );
});

test("LayeredCard lets SVG HTML text overflow its foreignObject ancestor", () => {
  const source = readFileSync(
    new URL("./LayeredCard.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    source,
    /const SvgHtmlText = \(\{[\s\S]*?<foreignObject x=\{x\} y=\{y\} width=\{width\} height=\{height\} style=\{\{ overflow: "visible" \}\}>/,
  );
});
