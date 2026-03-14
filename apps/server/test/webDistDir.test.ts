import test from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "..", "..", "..");

test("resolveWebDistDir resolves the web dist directory relative to the server module location", async () => {
  let resolveWebDistDir: ((moduleDir: string) => string) | undefined;

  try {
    ({ resolveWebDistDir } = await import("../src/webDistDir.ts"));
  } catch (error) {
    assert.fail(
      `expected resolveWebDistDir helper to exist for render-safe web asset lookup\n${String(error)}`,
    );
  }

  assert.equal(
    resolveWebDistDir?.(resolve(repoRoot, "apps", "server", "src")),
    resolve(repoRoot, "apps", "web", "dist"),
  );

  assert.equal(
    resolveWebDistDir?.(resolve(repoRoot, "apps", "server", "dist")),
    resolve(repoRoot, "apps", "web", "dist"),
  );
});
