import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { z } from "zod";
import type { AdventureModuleIndex } from "@mighty-decks/spec/adventureModule";
import { translateExilesAdventureModule } from "../import/translateExilesAdventureModule";
import type { AdventureArtifactStore } from "../../persistence/AdventureArtifactStore";
import type { AdventureModuleStore } from "../../persistence/AdventureModuleStore";

interface WritableLike {
  write(chunk: string): unknown;
}

interface RunImportAdventureModuleCliDependencies {
  moduleStore: AdventureModuleStore;
  artifactStore: AdventureArtifactStore;
  moduleRootDir?: string;
  stdout?: WritableLike;
  stderr?: WritableLike;
  defaultSourceDir?: string;
  defaultPublicDir?: string;
}

interface ParsedImportArgs {
  sourceDir?: string;
  publicDir?: string;
  title?: string;
  slug?: string;
  status?: AdventureModuleIndex["status"];
  creatorToken?: string;
}

const DEFAULT_EXILES_SOURCE_DIR =
  "C:\\Projects\\mighty-decks\\src\\data\\encounters\\exiles-of-the-hungry-void";
const DEFAULT_EXILES_PUBLIC_DIR = "C:\\Projects\\mighty-decks\\public";

const importStatusSchema = z.enum(["draft", "published", "archived"]);

const usageText = [
  "Usage:",
  "  import:adventure-module -- [--source-dir <path>] [--public-dir <path>] [--title <text>] [--slug <slug>] [--status <draft|published|archived>] [--creator-token <token>]",
  "",
  `Default source dir: ${DEFAULT_EXILES_SOURCE_DIR}`,
].join("\n");

const normalizeArgValue = (value: string | undefined): string | undefined => {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const findNearestPublicDir = (sourceDir: string): string | undefined => {
  let current = resolve(sourceDir);
  while (true) {
    const candidate = resolve(current, "public");
    if (existsSync(candidate)) {
      return candidate;
    }

    const parent = dirname(current);
    if (parent === current) {
      return undefined;
    }
    current = parent;
  }
};

const parseImportArgs = (args: string[]): ParsedImportArgs => {
  const parsed: ParsedImportArgs = {};
  for (let index = 0; index < args.length; index += 1) {
    const current = args[index];
    const next = normalizeArgValue(args[index + 1]);
    if (current === "--source-dir" && next) {
      parsed.sourceDir = next;
      index += 1;
      continue;
    }
    if (current === "--public-dir" && next) {
      parsed.publicDir = next;
      index += 1;
      continue;
    }
    if (current === "--title" && next) {
      parsed.title = next;
      index += 1;
      continue;
    }
    if (current === "--slug" && next) {
      parsed.slug = next;
      index += 1;
      continue;
    }
    if (current === "--status" && next) {
      parsed.status = importStatusSchema.parse(next);
      index += 1;
      continue;
    }
    if (current === "--creator-token" && next) {
      parsed.creatorToken = next;
      index += 1;
    }
  }
  return parsed;
};

export const runImportAdventureModuleCli = async (
  args: string[],
  dependencies: RunImportAdventureModuleCliDependencies,
): Promise<number> => {
  const stdout = dependencies.stdout ?? process.stdout;

  try {
    const parsed = parseImportArgs(args);
    const sourceDir =
      parsed.sourceDir ??
      dependencies.defaultSourceDir ??
      DEFAULT_EXILES_SOURCE_DIR;
    const publicDir =
      parsed.publicDir ??
      findNearestPublicDir(sourceDir) ??
      dependencies.defaultPublicDir ??
      DEFAULT_EXILES_PUBLIC_DIR;

    if (!existsSync(sourceDir)) {
      stdout.write(
        `${JSON.stringify(
          {
            ok: false,
            command: {
              resource: "module",
              action: "import",
            },
            error: {
              type: "usage",
              message: `Import failed: source dir not found: ${sourceDir}`,
              details: { usage: usageText },
            },
          },
          null,
          2,
        )}\n`,
      );
      return 1;
    }
    if (!existsSync(publicDir)) {
      stdout.write(
        `${JSON.stringify(
          {
            ok: false,
            command: {
              resource: "module",
              action: "import",
            },
            error: {
              type: "usage",
              message: `Import failed: public dir not found: ${publicDir}`,
              details: { usage: usageText },
            },
          },
          null,
          2,
        )}\n`,
      );
      return 1;
    }

    const translated = await translateExilesAdventureModule({
      sourceDir,
      publicDir,
      artifactStore: dependencies.artifactStore,
    });
    const imported = await dependencies.moduleStore.importModule({
      source: translated,
      creatorToken: parsed.creatorToken,
      title: parsed.title ?? "Exiles of the Hungry Void",
      slug: parsed.slug ?? "exiles-of-the-hungry-void",
      status: parsed.status ?? "draft",
    });

    stdout.write(
      `${JSON.stringify(
        {
          ok: true,
          command: {
            resource: "module",
            action: "import",
          },
          result: {
            module: imported,
            counts: {
              locations: imported.locations.length,
              encounters: imported.encounters.length,
              quests: imported.quests.length,
            },
            path: dependencies.moduleRootDir
              ? resolve(dependencies.moduleRootDir, imported.index.moduleId)
              : undefined,
            sourceDir,
            publicDir,
          },
        },
        null,
        2,
      )}\n`,
    );
    return 0;
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues.map((issue) => issue.message).join("; ")
        : error instanceof Error
          ? error.message
          : String(error);
    stdout.write(
      `${JSON.stringify(
        {
          ok: false,
          command: {
            resource: "module",
            action: "import",
          },
          error: {
            type: error instanceof z.ZodError ? "validation" : "internal",
            message: `Import failed: ${message}`,
            details: { usage: usageText },
          },
        },
        null,
        2,
      )}\n`,
    );
    return 1;
  }
};
