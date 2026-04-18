import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("StyleguideMessagesPage showcases the shared message shell and highlighted state", () => {
  const source = readFileSync(
    new URL("./StyleguideMessagesPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /styleguide-messages-page/);
  assert.match(source, /StyleguideSectionNav/);
  assert.match(source, /Message/);
  assert.match(source, /Semantic callout shells/);
  assert.match(source, /Highlighted callouts/);
  assert.match(source, /highlighted/);
  assert.match(source, /rotateLabel={false}/);
  assert.match(source, /labelVariant=/);
  assert.match(source, /"fire"/);
  assert.match(source, /"monster"/);
  assert.match(source, /Back to Overview/);
});
