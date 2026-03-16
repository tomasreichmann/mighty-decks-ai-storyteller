import test from "node:test";
import assert from "node:assert/strict";
import { resolveServerUrlForPageUrl } from "./socket";

test("resolveServerUrlForPageUrl maps localhost Vite dev to the 8081 API port", () => {
  assert.equal(
    resolveServerUrlForPageUrl(new URL("http://localhost:5173/")),
    "http://127.0.0.1:8081",
  );
});

test("resolveServerUrlForPageUrl keeps the same host for LAN Vite dev and uses 8081", () => {
  assert.equal(
    resolveServerUrlForPageUrl(new URL("http://192.168.1.55:5173/adventure/demo")),
    "http://192.168.1.55:8081",
  );
});
