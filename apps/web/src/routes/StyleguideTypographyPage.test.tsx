import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("typography styleguide includes inline and shared ghost-link examples", () => {
  const content = readFileSync(
    new URL("./StyleguideTypographyPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(content, /Links/);
  assert.match(content, /Button variant="ghost"/);
  assert.match(content, /href="\/styleguide\/buttons"/);
});

test("typography styleguide keeps its samples in open sections", () => {
  const content = readFileSync(
    new URL("./StyleguideTypographyPage.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(content, /<Panel/);
});

test("steel heading highlights use the darker Steel token", () => {
  const content = readFileSync(
    new URL("../components/common/headingHighlightColor.ts", import.meta.url),
    "utf8",
  );

  assert.match(content, /steel: "text-kac-steel-dark"/);
});
