import { spawnSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const testRoot = resolve(process.cwd(), "test");

const collectTestFiles = (rootDir) => {
  const queue = [rootDir];
  const files = [];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    const entries = readdirSync(current);
    for (const entry of entries) {
      const fullPath = join(current, entry);
      const stats = statSync(fullPath);
      if (stats.isDirectory()) {
        queue.push(fullPath);
        continue;
      }

      if (entry.endsWith(".test.ts")) {
        files.push(fullPath);
      }
    }
  }

  return files.sort((a, b) => a.localeCompare(b));
};

const testFiles = collectTestFiles(testRoot);
if (testFiles.length === 0) {
  console.error("No test files found under apps/server/test.");
  process.exit(1);
}

const tsxCliPath = resolve(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");
const result = spawnSync(process.execPath, [tsxCliPath, "--test", ...testFiles], {
  cwd: process.cwd(),
  stdio: "inherit",
  windowsHide: true,
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
