import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const packageName = "@mighty-decks/components";
const documents = [
  "mighty-decks-rulebook.md",
  "mighty-decks-fast-session-storyteller-system-prompt.md",
];

const sha256 = (contents) => createHash("sha256").update(contents).digest("hex");

const parseArguments = (arguments_) => {
  let root = dirname(dirname(fileURLToPath(import.meta.url)));
  let check = false;

  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === "--check") {
      check = true;
    } else if (argument === "--root") {
      const value = arguments_[index + 1];
      if (!value) {
        throw new Error("--root requires a directory.");
      }
      root = resolve(value);
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  return { root, check };
};

const findPackageRoot = async (webDirectory) => {
  const resolution = spawnSync(
    process.execPath,
    ["--input-type=module", "--eval", `process.stdout.write(await import.meta.resolve('${packageName}/react'))`],
    { cwd: webDirectory, encoding: "utf8" },
  );
  if (resolution.status !== 0) {
    throw new Error(resolution.stderr.trim() || `Could not resolve ${packageName}/react from the web workspace.`);
  }
  const entry = fileURLToPath(resolution.stdout.trim());
  let directory = dirname(entry);

  while (dirname(directory) !== directory) {
    const manifestPath = join(directory, "package.json");
    try {
      const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
      if (manifest.name !== packageName) {
        throw new Error(`Expected package ${packageName}, found ${manifest.name ?? "an unnamed package"}.`);
      }
      return { directory, manifest };
    } catch (error) {
      if (error instanceof SyntaxError || (error instanceof Error && error.message.startsWith("Expected package"))) {
        throw error;
      }
      directory = dirname(directory);
    }
  }

  throw new Error(`Could not find the owning manifest for ${packageName}.`);
};

const sourceDocuments = async (root) => {
  const { directory: packageRoot, manifest } = await findPackageRoot(join(root, "apps", "web"));
  const entries = await Promise.all(documents.map(async (name) => {
    const sourcePath = join(packageRoot, "docs", "en", name);
    try {
      return { name, sourcePath, contents: await readFile(sourcePath) };
    } catch {
      throw new Error(`Missing required docs/en source: ${name}`);
    }
  }));

  return { manifest, entries };
};

const expectedProvenance = ({ manifest, entries }) => ({
  package: { name: packageName, version: manifest.version },
  documents: Object.fromEntries(entries.map(({ name, contents }) => [name, {
    sourcePath: `docs/en/${name}`,
    sha256: sha256(contents),
  }])),
});

const isCurrent = async (root, entries, provenance) => {
  try {
    const storedProvenance = JSON.parse(await readFile(join(root, "docs", "rules-source.json"), "utf8"));
    if (JSON.stringify(storedProvenance) !== JSON.stringify(provenance)) {
      return false;
    }
    await Promise.all(entries.map(async ({ name, contents }) => {
      const current = await readFile(join(root, "docs", name));
      if (!current.equals(contents)) {
        throw new Error("mirror mismatch");
      }
    }));
    return true;
  } catch {
    return false;
  }
};

const writeAtomically = async (path, contents) => {
  const temporaryPath = `${path}.tmp-${process.pid}`;
  await writeFile(temporaryPath, contents);
  await rename(temporaryPath, path);
};

export const syncRulesDocs = async ({ root, check }) => {
  const source = await sourceDocuments(root);
  const provenance = expectedProvenance(source);
  const current = await isCurrent(root, source.entries, provenance);

  if (check) {
    if (!current) {
      throw new Error("Rules documentation mirrors or provenance are out of date. Run pnpm docs:rules.");
    }
    return;
  }

  if (current) {
    return;
  }

  const docsDirectory = join(root, "docs");
  await mkdir(docsDirectory, { recursive: true });
  await Promise.all(source.entries.map(({ name, contents }) =>
    writeAtomically(join(docsDirectory, name), contents),
  ));
  await writeAtomically(
    join(docsDirectory, "rules-source.json"),
    `${JSON.stringify(provenance, null, 2)}\n`,
  );
};

const run = async () => {
  const options = parseArguments(process.argv.slice(2));
  await syncRulesDocs(options);
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
