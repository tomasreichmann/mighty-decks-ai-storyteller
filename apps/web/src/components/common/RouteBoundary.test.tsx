import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("RouteBoundary exposes Home and Back recovery actions", () => {
  const source = readFileSync(new URL("./RouteBoundary.tsx", import.meta.url), "utf8");

  assert.match(source, /useLocation/);
  assert.match(source, /useNavigate/);
  assert.match(source, /Button href="\/"/);
  assert.match(source, /navigate\(-1\)/);
  assert.match(source, /BoundaryMessage/);
});
