import test from "node:test";
import assert from "node:assert/strict";
import { resolveServerUrlForPageUrl } from "./socket";

test("resolveServerUrlForPageUrl keeps localhost Vite dev on same-origin", () => {
  assert.equal(
    resolveServerUrlForPageUrl(new URL("http://localhost:5173/")),
    "http://localhost:5173",
  );
});

test("resolveServerUrlForPageUrl keeps LAN Vite dev on same-origin", () => {
  assert.equal(
    resolveServerUrlForPageUrl(new URL("http://192.168.1.55:5173/adventure/demo")),
    "http://192.168.1.55:5173",
  );
});
