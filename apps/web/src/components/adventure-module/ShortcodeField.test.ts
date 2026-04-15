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
  assert.match(source, /copyLabel = "Copy shortcode"/);
  assert.match(source, /copiedLabel = "Copied shortcode"/);
  assert.match(source, /const copyButtonLabel = copied \? copiedLabel : copyLabel;/);
  assert.match(source, /aria-label=\{copyButtonLabel\}/);
  assert.match(
    source,
    /inline-flex max-w-full flex-wrap items-center justify-center gap-1\.5 self-center/,
  );
  assert.match(source, /color="iron"/);
  assert.match(source, /font-semibold/);
  assert.match(
    source,
    /className="[^"]*min-w-0[^"]*break-all[^"]*text-center/,
  );
  assert.match(source, /onAddToSelection\?: \(\) => void/);
  assert.match(source, /addButtonLabel = "Add to table selection"/);
  assert.match(source, /showShortcode\?: boolean/);
  assert.match(source, /copyLabel\?: string/);
  assert.match(source, /copiedLabel\?: string/);
  assert.match(source, /copyButtonText\?: string \| null/);
  assert.match(source, /copiedButtonText\?: string \| null/);
  assert.match(source, /onAddToSelection \?/);
  assert.match(source, /copied \? "OK" : "📋"/);
  assert.doesNotMatch(source, /Copy Shortcode/);
  assert.doesNotMatch(source, />\s*Shortcode\s*</);
});
