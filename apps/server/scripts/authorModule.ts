import type { WorkflowLabUsageSummary } from "@mighty-decks/spec/workflowLab";
import { ClaudeCliClient } from "../src/ai/ClaudeCliClient";
import { OpenRouterClient } from "../src/ai/OpenRouterClient";
import type { TextCompletionClient } from "../src/ai/OpenRouterClient";
import { createWorkflowAdapters } from "../src/ai/workflow/createWorkflowAdapters";
import { FalQueueClient } from "../src/ai/workflow/FalQueueClient";
import { createWorkflowDefinitionRegistrations } from "../src/ai/workflow/sampleWorkflows";
import { runAuthorModuleCli } from "../src/adventureModule/cli/runAuthorModuleCli";
import { env } from "../src/config/env";
import { AdventureModuleStore } from "../src/persistence/AdventureModuleStore";
import { createWorkflowFactory } from "../src/workflow/executor";
import type { WorkflowTextAdapterRequest } from "../src/workflow/types";
import { WorkflowRegistry } from "../src/workflow/workflowRegistry";

const toWorkflowUsage = (
  usage:
    | {
        promptTokens?: number;
        completionTokens?: number;
        totalTokens?: number;
        cachedTokens?: number;
        reasoningTokens?: number;
        costCredits?: number;
      }
    | undefined,
): WorkflowLabUsageSummary | undefined => {
  if (!usage) {
    return undefined;
  }
  return {
    promptTokens: usage.promptTokens,
    completionTokens: usage.completionTokens,
    totalTokens: usage.totalTokens,
    cachedTokens: usage.cachedTokens,
    reasoningTokens: usage.reasoningTokens,
    costCredits: usage.costCredits,
  };
};

const runTextAdapter = (textClient: TextCompletionClient) =>
  async (request: WorkflowTextAdapterRequest) => {
    const result = await textClient.completeTextWithMetadata({
      model: request.modelId,
      prompt: request.prompt,
      timeoutMs: request.timeoutMs,
      maxTokens: request.maxTokens ?? 2_000,
      temperature: request.temperature ?? 0.3,
    });
    return {
      text: result?.text ?? null,
      usage: toWorkflowUsage(result?.usage),
    };
  };

const openRouterClient = new OpenRouterClient({
  apiKey: env.openRouterApiKey,
});

let textClient: TextCompletionClient = openRouterClient;
if (env.textProvider === "claude_cli") {
  const cliClient = new ClaudeCliClient({
    model: env.claudeCli.model,
    maxConcurrent: env.claudeCli.maxConcurrent,
    textCallTimeoutMs: env.runtimeConfigDefaults.textCallTimeoutMs,
  });
  await cliClient.probe({
    info: (message) => {
      process.stderr.write(`${message}\n`);
    },
    warn: (message) => {
      process.stderr.write(`${message}\n`);
    },
  });
  textClient = cliClient;
}

const falQueueClient = new FalQueueClient({
  apiKey: env.falApiKey,
  apiBaseUrl: env.imageGeneration.falApiBaseUrl,
  queueBaseUrl: env.imageGeneration.falQueueBaseUrl,
  pollIntervalMs: env.imageGeneration.falPollIntervalMs,
  pollTimeoutMs: env.imageGeneration.falPollTimeoutMs,
});

const baseAdapters = createWorkflowAdapters({
  openRouterClient,
  falQueueClient,
});
const workflowFactory = createWorkflowFactory({
  adapters: {
    ...baseAdapters,
    text: runTextAdapter(textClient),
  },
  modelRegistry: env.workflow.modelRegistry,
  defaults: env.workflow.executionDefaults,
});

const workflowRegistry = new WorkflowRegistry();
for (const registration of createWorkflowDefinitionRegistrations()) {
  workflowRegistry.register(registration);
}

const moduleStore = new AdventureModuleStore({
  rootDir: env.adventureModules.outputDir,
});
await moduleStore.initialize();

process.exitCode = await runAuthorModuleCli(process.argv.slice(2), {
  moduleStore,
  workflowRegistry,
  workflowFactory,
});
