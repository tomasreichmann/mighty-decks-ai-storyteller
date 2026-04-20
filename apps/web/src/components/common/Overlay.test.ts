import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Overlay centralizes the shared dialog shell and escape handling", () => {
  const source = readFileSync(new URL("./Overlay.tsx", import.meta.url), "utf8");

  assert.match(source, /Panel/);
  assert.match(source, /role="dialog"/);
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /Escape/);
  assert.match(source, /onClose/);
  assert.match(source, /backdropClassName/);
  assert.match(source, /panelClassName/);
});
