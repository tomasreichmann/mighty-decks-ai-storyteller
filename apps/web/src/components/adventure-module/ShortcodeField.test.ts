import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("ShortcodeField renders shortcode text with compact copy feedback", () => {
  const source = readFileSync(
    new URL("./ShortcodeField.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /navigator\.clipboard\?\.writeText/);
  assert.match(source, /document\.execCommand\("copy"\)/);
  assert.match(source, /setCopied\(true\)/);
  assert.match(source, /2000/);
  assert.match(
    source,
    /aria-label=\{copied \? "Copied shortcode" : "Copy shortcode"\}/,
  );
  assert.match(source, /inline-flex max-w-full items-center justify-center gap-1\.5 self-center/);
  assert.match(source, /color="iron"/);
  assert.match(source, /font-semibold/);
  assert.match(source, /onAddToSelection\?: \(\) => void/);
  assert.match(source, /addButtonLabel = "Add to table selection"/);
  assert.match(source, /onAddToSelection \?/);
  assert.match(source, />\s*\+\s*</);
  assert.doesNotMatch(source, /Copy Shortcode/);
  assert.doesNotMatch(source, />\s*Shortcode\s*</);
});
