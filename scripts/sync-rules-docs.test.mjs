import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const syncScript = join(repositoryRoot, "scripts", "sync-rules-docs.mjs");
const packageName = "@mighty-decks/components";
const documentNames = [
  "mighty-decks-rulebook.md",
  "mighty-decks-fast-session-storyteller-system-prompt.md",
];

const sha256 = (contents) => createHash("sha256").update(contents).digest("hex");

const writeFixture = async ({ packageIdentity = packageName, includeDocuments = true } = {}) => {
  const root = await mkdtemp(join(tmpdir(), "mighty-decks-rules-sync-"));
  const packageRoot = join(root, "apps", "web", "node_modules", "@mighty-decks", "components");
  await mkdir(join(packageRoot, "dist", "react"), { recursive: true });
  await writeFile(join(packageRoot, "dist", "react", "index.js"), "export {};\n");
  await writeFile(join(packageRoot, "package.json"), JSON.stringify({
    name: packageIdentity,
    version: "7.8.9",
    exports: { "./react": { import: "./dist/react/index.js" } },
  }, null, 2));

  if (includeDocuments) {
    await mkdir(join(packageRoot, "docs", "en"), { recursive: true });
    await Promise.all(documentNames.map((name) =>
      writeFile(join(packageRoot, "docs", "en", name), `${name} fixture\n`),
    ));
  }

  return root;
};

const runSync = (root, ...arguments_) => spawnSync(
  process.execPath,
  [syncScript, "--root", root, ...arguments_],
  { cwd: repositoryRoot, encoding: "utf8" },
);

test("sync copies both package-owned documents byte-for-byte and records provenance", async (t) => {
  const root = await writeFixture();
  t.after(() => rm(root, { recursive: true, force: true }));

  const result = runSync(root);
  assert.equal(result.status, 0, result.stderr);

  for (const name of documentNames) {
    assert.deepEqual(
      await readFile(join(root, "docs", name)),
      await readFile(join(root, "apps", "web", "node_modules", "@mighty-decks", "components", "docs", "en", name)),
    );
  }

  const source = JSON.parse(await readFile(join(root, "docs", "rules-source.json"), "utf8"));
  assert.deepEqual(source.package, { name: packageName, version: "7.8.9" });
  assert.deepEqual(Object.keys(source.documents).sort(), documentNames.sort());
  for (const name of documentNames) {
    const contents = await readFile(join(root, "docs", name));
    assert.equal(source.documents[name].sha256, sha256(contents));
    assert.equal(source.documents[name].sourcePath, `docs/en/${name}`);
  }
});

test("check reports stale mirrors without modifying them", async (t) => {
  const root = await writeFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  assert.equal(runSync(root).status, 0);
  const target = join(root, "docs", documentNames[0]);
  await writeFile(target, "stale local copy\n");

  const result = runSync(root, "--check");
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /out of date/i);
  assert.equal(await readFile(target, "utf8"), "stale local copy\n");
});

test("missing package documents fail before any mirror is written", async (t) => {
  const root = await writeFixture({ includeDocuments: false });
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, "docs"), { recursive: true });
  const sentinel = join(root, "docs", documentNames[0]);
  await writeFile(sentinel, "keep this mirror\n");

  const result = runSync(root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /missing.*docs[\\\\/]en/i);
  assert.equal(await readFile(sentinel, "utf8"), "keep this mirror\n");
});

test("incorrect package identity fails without producing provenance", async (t) => {
  const root = await writeFixture({ packageIdentity: "@other/components" });
  t.after(() => rm(root, { recursive: true, force: true }));

  const result = runSync(root);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /expected package/i);
  await assert.rejects(readFile(join(root, "docs", "rules-source.json")));
});

test("check detects changed provenance hashes and package versions", async (t) => {
  const root = await writeFixture();
  t.after(() => rm(root, { recursive: true, force: true }));
  assert.equal(runSync(root).status, 0);
  const provenancePath = join(root, "docs", "rules-source.json");
  const provenance = JSON.parse(await readFile(provenancePath, "utf8"));
  provenance.package.version = "7.8.8";
  provenance.documents[documentNames[1]].sha256 = "0".repeat(64);
  await writeFile(provenancePath, `${JSON.stringify(provenance, null, 2)}\n`);

  const result = runSync(root, "--check");
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /out of date/i);
});
