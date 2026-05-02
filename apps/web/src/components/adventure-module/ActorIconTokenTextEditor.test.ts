import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("ActorIconTokenTextEditor exposes collapsible steel icon token buttons", () => {
  const source = readFileSync(
    new URL("./ActorIconTokenTextEditor.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /<details/);
  assert.match(source, /Insert Icons/);
  assert.match(source, /<Button/);
  assert.match(source, /variant="ghost"/);
  assert.match(source, /color="steel"/);
  assert.match(source, /size="sm"/);
  assert.match(source, /<span>\{slug\}<\/span>/);
});
