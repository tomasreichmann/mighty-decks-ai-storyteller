import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

test("SceneCardDetailLink renders a circular link overlay for the detail action", () => {
  const source = readFileSync(
    new URL("./SceneCardDetailLink.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /variant="circle"/);
  assert.match(source, /color="cloth"/);
  assert.match(source, /target="_blank"/);
  assert.match(source, /rel="noreferrer noopener"/);
  assert.match(source, /bottom-2/);
  assert.match(source, /right-3/);
  assert.match(source, /↑/);
});
