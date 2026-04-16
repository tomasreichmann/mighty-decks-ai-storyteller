import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("StyleguideTagsPage showcases the shared tag family together", () => {
  const source = readFileSync(
    new URL("./StyleguideTagsPage.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /Tag/);
  assert.match(source, /Tags/);
  assert.match(source, /ConnectionStatusPill/);
  assert.match(source, /styleguide-tags-page/);
  assert.match(source, /Tag Tone/);
  assert.match(source, /Connection Status/);
});
