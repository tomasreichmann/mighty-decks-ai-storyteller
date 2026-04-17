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

test("Button maps solid iron to steel and ghost iron to iron borders", () => {
  const source = readFileSync(new URL("./Button.tsx", import.meta.url), "utf8");

  assert.match(
    source,
    /const resolveSolidColorClasses = \(color: ButtonColors\): string => \{[\s\S]*case "iron":[\s\S]*border-kac-steel text-kac-steel-light disabled:bg-kac-iron-light/,
  );
  assert.match(
    source,
    /const resolveGhostColorClasses = \(color: ButtonColors\): string => \{[\s\S]*case "iron":[\s\S]*border-kac-iron\/60 hover:bg-kac-steel-light\/30 disabled:border-kac-iron\/35/,
  );
});
