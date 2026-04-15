import { addActorFromPrompt } from "../authoring/addActorFromPrompt";
import type { AdventureModuleStore } from "../../persistence/AdventureModuleStore";
import type { WorkflowFactory } from "../../workflow/executor";
import type { WorkflowRegistry } from "../../workflow/workflowRegistry";

interface WritableLike {
  write(chunk: string): unknown;
}

interface RunAuthorModuleCliDependencies {
  moduleStore: AdventureModuleStore;
  workflowRegistry: WorkflowRegistry;
  workflowFactory: WorkflowFactory;
  stdout?: WritableLike;
  stderr?: WritableLike;
}

interface ParsedAddActorArgs {
  moduleSlug?: string;
  prompt?: string;
  creatorToken?: string;
}

const usageText = [
  "Usage:",
  "  author:module -- add-actor --module <module-slug> --prompt <text> [--creator-token <token>]",
].join("\n");

const parseAddActorArgs = (args: string[]): ParsedAddActorArgs => {
  const parsed: ParsedAddActorArgs = {};
  for (let index = 0; index < args.length; index += 1) {
    const current = args[index];
    const next = args[index + 1];
    if (current === "--module" && next) {
      parsed.moduleSlug = next;
      index += 1;
      continue;
    }
    if (current === "--prompt" && next) {
      parsed.prompt = next;
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

export const runAuthorModuleCli = async (
  args: string[],
  dependencies: RunAuthorModuleCliDependencies,
): Promise<number> => {
  const stdout = dependencies.stdout ?? process.stdout;
  const stderr = dependencies.stderr ?? process.stderr;
  const [command, ...rest] = args;

  if (command !== "add-actor") {
    stderr.write(`${usageText}\n`);
    return 1;
  }

  const parsed = parseAddActorArgs(rest);
  if (!parsed.moduleSlug || !parsed.prompt) {
    stderr.write("Missing required --module or --prompt argument.\n");
    stderr.write(`${usageText}\n`);
    return 1;
  }

  try {
    const result = await addActorFromPrompt({
      moduleSlug: parsed.moduleSlug,
      prompt: parsed.prompt,
      creatorToken: parsed.creatorToken,
      moduleStore: dependencies.moduleStore,
      workflowRegistry: dependencies.workflowRegistry,
      workflowFactory: dependencies.workflowFactory,
    });
    stdout.write(
      `Created actor '${result.actor.title}' as '${result.actor.actorSlug}'.\n`,
    );
    stdout.write(`Path: ${result.actorPath}\n`);
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    stderr.write(`Authoring failed: ${message}\n`);
    return 1;
  }
};
