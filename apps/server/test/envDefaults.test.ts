import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const importEnvModule = async (suffix: string) =>
  import(`../src/config/env.ts?${suffix}`);

test("env defaults PORT to 8081 when it is unset", async () => {
  const previousPort = process.env.PORT;
  const previousCwd = process.cwd();
  const isolatedCwd = mkdtempSync(join(tmpdir(), "mighty-decks-env-defaults-"));

  delete process.env.PORT;
  process.chdir(isolatedCwd);

  try {
    const { env } = await importEnvModule(`port-default-${Date.now()}`);
    assert.equal(env.port, 8081);
  } finally {
    process.chdir(previousCwd);
    rmSync(isolatedCwd, { recursive: true, force: true });
    if (typeof previousPort === "string") {
      process.env.PORT = previousPort;
    } else {
      delete process.env.PORT;
    }
  }
});
