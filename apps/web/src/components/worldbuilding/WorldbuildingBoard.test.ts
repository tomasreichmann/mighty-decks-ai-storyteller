import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("WorldbuildingBoard renders campaign-attached proposals on shared board primitives", () => {
  const source = readFileSync(new URL("./WorldbuildingBoard.tsx", import.meta.url), "utf8");

  assert.match(source, /BoardProvider/);
  assert.match(source, /BoardFrame/);
  assert.match(source, /Board/);
  assert.match(source, /stackLayout/);
  assert.match(source, /flexLayout/);
  assert.match(source, /ThemeCard/);
  assert.match(source, /MotifCard/);
  assert.match(source, /WorldbuildingProposalCard/);
  assert.match(source, /fitItems/);
});
