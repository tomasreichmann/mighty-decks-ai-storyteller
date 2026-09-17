import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Vite leaves public backgrounds outside the API proxy", async () => {
  const config = await readFile(new URL("../vite.config.ts", import.meta.url), "utf8");

  assert.doesNotMatch(config, /"\/backgrounds"\s*:/);
});
