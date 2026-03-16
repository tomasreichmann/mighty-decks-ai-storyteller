import test from "node:test";
import assert from "node:assert/strict";
import * as viteConfigModule from "./vite.config";

const readResolveLocalDevProxyTarget = (): ((port?: string) => string) | undefined => {
  const candidate = (viteConfigModule as Record<string, unknown>)
    .resolveLocalDevProxyTarget;
  return typeof candidate === "function"
    ? (candidate as (port?: string) => string)
    : undefined;
};

test("resolveLocalDevProxyTarget honors the configured backend PORT", () => {
  assert.equal(
    readResolveLocalDevProxyTarget()?.("8080"),
    "http://127.0.0.1:8080",
  );
});

test("resolveLocalDevProxyTarget falls back to the default backend PORT", () => {
  assert.equal(
    readResolveLocalDevProxyTarget()?.(),
    "http://127.0.0.1:8081",
  );
});
