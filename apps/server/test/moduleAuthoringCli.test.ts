import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createWorkflowDefinitionRegistrations } from "../src/ai/workflow/sampleWorkflows";
import {
  ADVENTURE_MODULE_ACTOR_FROM_PROMPT_WORKFLOW_ID,
} from "../src/adventureModule/authoring/actorFromPromptWorkflow";
import { runAuthorModuleCli } from "../src/adventureModule/cli/runAuthorModuleCli";
import { AdventureModuleStore } from "../src/persistence/AdventureModuleStore";
import { createWorkflowFactory } from "../src/workflow/executor";
import { runWorkflowToCompletion } from "../src/workflow/runWorkflowToCompletion";
import { WorkflowRegistry } from "../src/workflow/workflowRegistry";

const modelRegistry = {
  fast_text_model: "test-fast-text",
  hq_text_model: "test-hq-text",
  fast_tool_model: "test-fast-tool",
  hq_tool_model: "test-hq-tool",
  fast_image_model: "test-fast-image",
  hq_image_model: "test-hq-image",
  fast_vision_model: "test-fast-vision",
  hq_vision_model: "test-hq-vision",
  fast_tts_model: "test-fast-tts",
  hq_tts_model: "test-hq-tts",
  fast_stt_model: "test-fast-stt",
  hq_stt_model: "test-hq-stt",
};

const executionDefaults = {
  runTimeoutMs: 60_000,
  defaultRetryCount: 0,
  stepTimeoutMs: {
    llm_text: {
      text: 30_000,
      tool: 30_000,
      vision: 30_000,
    },
    llm_image: 30_000,
    tts: 30_000,
    stt: 30_000,
    code: 30_000,
    map: 30_000,
  },
};

const createStubbedWorkflowFactory = () =>
  createWorkflowFactory({
    adapters: {
      text: async () => ({
        text: JSON.stringify({
          title: "Brother Calyx of the Last Mouth",
          summary:
            "A persuasive cult philosopher who preaches that death is the final honest revelation.",
          content:
            "# Brother Calyx of the Last Mouth\n\nA charismatic death cultist philosopher who offers calm, unsettling certainty when everyone else is panicking.",
          baseLayerSlug: "zealot",
          tacticalRoleSlug: "champion",
          tacticalSpecialSlug: "dangerous",
          isPlayerCharacter: false,
        }),
      }),
      image: async () => ({
        imageUrl: "https://example.com/test.png",
      }),
      tts: async () => ({
        audioUrl: "https://example.com/test.mp3",
      }),
      stt: async () => ({
        text: "unused",
      }),
    },
    modelRegistry,
    defaults: executionDefaults,
  });

const createModuleStore = async (): Promise<AdventureModuleStore> => {
  const rootDir = mkdtempSync(join(tmpdir(), "mighty-decks-module-authoring-cli-"));
  const store = new AdventureModuleStore({ rootDir });
  await store.initialize();
  return store;
};

test("registers the actor-from-prompt workflow and produces typed actor output", async () => {
  const registration = createWorkflowDefinitionRegistrations().find(
    (candidate) =>
      candidate.workflowId === ADVENTURE_MODULE_ACTOR_FROM_PROMPT_WORKFLOW_ID,
  );
  assert.ok(registration);

  const workflow = registration.createDefinition();
  const run = createStubbedWorkflowFactory().createRun(workflow, {
    input: {
      moduleTitle: "Exiles of the Hungry Void",
      moduleSummary: "A shipbound survival mini-campaign at the edge of the Void.",
      existingActors: ["Primary Actor"],
      prompt: "A charismatic death cultist philosopher.",
    },
  });
  run.start();
  const snapshot = await runWorkflowToCompletion(run, {
    timeoutMs: 5_000,
  });

  assert.equal(snapshot.status, "completed");
  assert.deepEqual(snapshot.outputs.actor, {
    title: "Brother Calyx of the Last Mouth",
    summary:
      "A persuasive cult philosopher who preaches that death is the final honest revelation.",
    content:
      "# Brother Calyx of the Last Mouth\n\nA charismatic death cultist philosopher who offers calm, unsettling certainty when everyone else is panicking.",
    baseLayerSlug: "zealot",
    tacticalRoleSlug: "champion",
    tacticalSpecialSlug: "dangerous",
    isPlayerCharacter: false,
  });
});

test("author module CLI add-actor creates a typed actor from a prompt", async () => {
  const store = await createModuleStore();
  await store.createModule({
    creatorToken: "token-author",
    title: "Exiles of the Hungry Void",
    slug: "exiles-of-the-hungry-void",
    sessionScope: "mini_campaign",
    launchProfile: "dual",
  });

  const registration = createWorkflowDefinitionRegistrations().find(
    (candidate) =>
      candidate.workflowId === ADVENTURE_MODULE_ACTOR_FROM_PROMPT_WORKFLOW_ID,
  );
  assert.ok(registration);

  const workflowRegistry = new WorkflowRegistry();
  workflowRegistry.register(registration);
  const workflowFactory = createStubbedWorkflowFactory();

  let stdout = "";
  let stderr = "";
  const exitCode = await runAuthorModuleCli(
    [
      "add-actor",
      "--module",
      "exiles-of-the-hungry-void",
      "--prompt",
      "A charismatic death cultist philosopher.",
      "--creator-token",
      "token-author",
    ],
    {
      moduleStore: store,
      workflowRegistry,
      workflowFactory,
      stdout: {
        write: (chunk: string) => {
          stdout += chunk;
          return true;
        },
      },
      stderr: {
        write: (chunk: string) => {
          stderr += chunk;
          return true;
        },
      },
    },
  );

  assert.equal(exitCode, 0);
  assert.equal(stderr, "");
  assert.match(stdout, /brother-calyx-of-the-last-mouth/);
  assert.match(stdout, /actors\/brother-calyx-of-the-last-mouth\.mdx/);

  const loaded = await store.getModuleBySlug(
    "exiles-of-the-hungry-void",
    "token-author",
  );
  assert.ok(loaded);
  const createdActor = loaded?.actors.find(
    (actor) => actor.actorSlug === "brother-calyx-of-the-last-mouth",
  );
  assert.ok(createdActor);
  assert.equal(createdActor?.baseLayerSlug, "zealot");
  assert.equal(createdActor?.tacticalRoleSlug, "champion");
  assert.equal(createdActor?.tacticalSpecialSlug, "dangerous");
  assert.equal(createdActor?.isPlayerCharacter, false);
  assert.match(
    createdActor?.content ?? "",
    /charismatic death cultist philosopher/i,
  );
});
