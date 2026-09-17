import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const sourcePath = join(dirname(fileURLToPath(import.meta.url)), "RulesIllustrations.tsx");
const source = await readFile(sourcePath, "utf8");

test("StatusThresholds imports the shared Label it renders", () => {
  assert.match(source, /import \{ Label \} from "\.\.\/common\/Label";/);
});
