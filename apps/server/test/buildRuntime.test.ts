import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "..", "..", "..");
const serverRoot = resolve(import.meta.dirname, "..");
const specRoot = resolve(repoRoot, "spec");
const rewriteImportsScriptPath = resolve(repoRoot, "scripts", "rewrite-relative-imports.mjs");
const specTscPath = resolve(specRoot, "node_modules", "typescript", "lib", "tsc.js");
const serverTscPath = resolve(serverRoot, "node_modules", "typescript", "lib", "tsc.js");

const run = (command: string, args: string[], cwd: string) =>
  spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    windowsHide: true,
  });

test("plain Node can import built spec runtime exports", () => {
  const buildSpec = run(process.execPath, [specTscPath, "-p", "tsconfig.build.json"], specRoot);

  assert.equal(
    buildSpec.status,
    0,
    `expected spec build to pass\nstdout:\n${buildSpec.stdout}\nstderr:\n${buildSpec.stderr}`,
  );

  const rewriteSpec = run(process.execPath, [rewriteImportsScriptPath, "dist"], specRoot);

  assert.equal(
    rewriteSpec.status,
    0,
    `expected spec import rewrite to pass\nstdout:\n${rewriteSpec.stdout}\nstderr:\n${rewriteSpec.stderr}`,
  );

  const importSpec = run(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      "const mod = await import('@mighty-decks/spec'); if (!mod.imageProviderSchema) throw new Error('missing imageProviderSchema');",
    ],
    serverRoot,
  );

  assert.equal(
    importSpec.status,
    0,
    `expected plain Node import of built spec export to pass\nstdout:\n${importSpec.stdout}\nstderr:\n${importSpec.stderr}`,
  );
});

test("plain Node can import built server modules that depend on spec runtime exports", () => {
  const buildSpec = run(process.execPath, [specTscPath, "-p", "tsconfig.build.json"], specRoot);

  assert.equal(
    buildSpec.status,
    0,
    `expected spec build to pass\nstdout:\n${buildSpec.stdout}\nstderr:\n${buildSpec.stderr}`,
  );

  const rewriteSpec = run(process.execPath, [rewriteImportsScriptPath, "dist"], specRoot);

  assert.equal(
    rewriteSpec.status,
    0,
    `expected spec import rewrite to pass\nstdout:\n${rewriteSpec.stdout}\nstderr:\n${rewriteSpec.stderr}`,
  );

  const buildServer = run(process.execPath, [serverTscPath, "-p", "tsconfig.build.json"], serverRoot);

  assert.equal(
    buildServer.status,
    0,
    `expected server build to pass\nstdout:\n${buildServer.stdout}\nstderr:\n${buildServer.stderr}`,
  );

  const rewriteServer = run(process.execPath, [rewriteImportsScriptPath, "dist"], serverRoot);

  assert.equal(
    rewriteServer.status,
    0,
    `expected server import rewrite to pass\nstdout:\n${rewriteServer.stdout}\nstderr:\n${rewriteServer.stderr}`,
  );

  const importBuiltModule = run(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      "await import('./dist/image/registerImageRoutes.js');",
    ],
    serverRoot,
  );

  assert.equal(
    importBuiltModule.status,
    0,
    `expected plain Node import of built server module to pass\nstdout:\n${importBuiltModule.stdout}\nstderr:\n${importBuiltModule.stderr}`,
  );
});
