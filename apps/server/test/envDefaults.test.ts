import test from "node:test";
import assert from "node:assert/strict";

const importEnvModule = async (suffix: string) =>
  import(`../src/config/env.ts?${suffix}`);

test("env defaults PORT to 8081 when it is unset", async () => {
  const previousPort = process.env.PORT;

  delete process.env.PORT;

  try {
    const { env } = await importEnvModule(`port-default-${Date.now()}`);
    assert.equal(env.port, 8081);
  } finally {
    if (typeof previousPort === "string") {
      process.env.PORT = previousPort;
    } else {
      delete process.env.PORT;
    }
  }
});
