import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("StyleguideButtonsPage showcases Button and CTAButton", () => {
  const source = readFileSync(
    new URL("./StyleguideButtonsPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /styleguide-buttons-page/);
  assert.match(source, /StyleguideSectionNav/);
  assert.match(source, /Button/);
  assert.match(source, /CTAButton/);
  assert.match(source, /size="sm"/);
  assert.match(source, /size="md"/);
  assert.match(source, /size="lg"/);
  assert.match(source, /variant="circle"/);
  assert.match(source, /CTAButton wrapper/);
});
