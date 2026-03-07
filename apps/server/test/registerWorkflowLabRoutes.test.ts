import assert from "node:assert/strict";
import test from "node:test";
import Fastify from "fastify";
import { z } from "zod";
import {
  workflowLabRunSnapshotSchema,
  type JsonValue,
} from "@mighty-decks/spec/workflowLab";
import { createWorkflowFactory } from "../src/workflow/executor";
import { registerWorkflowLabRoutes } from "../src/workflow/registerWorkflowLabRoutes";
import { WorkflowRegistry } from "../src/workflow/workflowRegistry";
import type { WorkflowDefinitionRegistration } from "../src/ai/workflow/sampleWorkflows";
import type { WorkflowDef } from "../src/workflow/types";

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

const adapters = {
  text: async () => ({
    text: "unused",
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
};

const toRegistration = (workflow: WorkflowDef): WorkflowDefinitionRegistration => ({
  workflowId: workflow.workflowId,
  createDefinition: () => workflow,
  defaultInputExample: {},
  inputSchemaJson: {
    type: "object",
  },
});

const createSlowWorkflow = (): WorkflowDef => ({
  workflowId: "test_stop_slow",
  name: "Test Stop Slow",
  version: "1",
  description: "Long-running code step that can be manually stopped.",
  inputSchema: z.object({}).transform((value) => value as unknown as JsonValue),
  defaultInputExample: {},
  steps: [
    {
      id: "wait_step",
      name: "Wait Step",
      description: "Sleeps until aborted or timeout.",
      kind: "code",
      timeoutMs: 20_000,
      retryCount: 0,
      run: async ({ abortSignal }) => {
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => {
            resolve();
          }, 10_000);
          abortSignal.addEventListener(
            "abort",
            () => {
              clearTimeout(timer);
              reject(
                abortSignal.reason instanceof Error
                  ? abortSignal.reason
                  : new Error("aborted"),
              );
            },
            { once: true },
          );
        });
        return {
          output: { complete: true },
        };
      },
    },
  ],
  edges: [],
  outputSelectors: {
    result: ({ getStepOutput }) => (getStepOutput("wait_step") ?? null) as JsonValue,
  },
});

const createFastWorkflow = (): WorkflowDef => ({
  workflowId: "test_stop_fast",
  name: "Test Stop Fast",
  version: "1",
  description: "Immediate success workflow for terminal-stop checks.",
  inputSchema: z.object({}).transform((value) => value as unknown as JsonValue),
  defaultInputExample: {},
  steps: [
    {
      id: "fast_step",
      name: "Fast Step",
      description: "Returns immediately.",
      kind: "code",
      timeoutMs: 5000,
      retryCount: 0,
      run: async () => ({
        output: {
          ok: true,
        },
      }),
    },
  ],
  edges: [],
  outputSelectors: {
    result: ({ getStepOutput }) => (getStepOutput("fast_step") ?? null) as JsonValue,
  },
});

const createApp = async () => {
  const app = Fastify();
  const workflowRegistry = new WorkflowRegistry();
  workflowRegistry.register(toRegistration(createSlowWorkflow()));
  workflowRegistry.register(toRegistration(createFastWorkflow()));

  registerWorkflowLabRoutes(app, {
    workflowRegistry,
    workflowFactory: createWorkflowFactory({
      adapters,
      modelRegistry,
      defaults: executionDefaults,
    }),
  });

  return app;
};

test("workflow-lab stop endpoint stops running workflow and reports failed", async (t) => {
  const app = await createApp();
  t.after(async () => {
    await app.close();
  });

  const startResponse = await app.inject({
    method: "POST",
    url: "/api/workflow-lab/runs",
    payload: {
      workflowId: "test_stop_slow",
      input: {},
    },
  });
  assert.equal(startResponse.statusCode, 200);
  const runId = (startResponse.json() as { runId: string }).runId;

  const stopResponse = await app.inject({
    method: "POST",
    url: `/api/workflow-lab/runs/${encodeURIComponent(runId)}/stop`,
    payload: {
      reason: "manual stop from test",
    },
  });
  assert.equal(stopResponse.statusCode, 200);
  const stoppedSnapshot = workflowLabRunSnapshotSchema.parse(
    stopResponse.json() as unknown,
  );
  assert.equal(stoppedSnapshot.status, "failed");
  assert.match(
    stoppedSnapshot.steps.find((step) => step.id === "wait_step")?.error ?? "",
    /workflow stopped:/i,
  );
});

test("workflow-lab stop endpoint returns 404 for unknown run", async (t) => {
  const app = await createApp();
  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({
    method: "POST",
    url: "/api/workflow-lab/runs/not-found/stop",
    payload: {
      reason: "manual stop from test",
    },
  });
  assert.equal(response.statusCode, 404);
});

test("workflow-lab stop endpoint is a no-op for completed runs", async (t) => {
  const app = await createApp();
  t.after(async () => {
    await app.close();
  });

  const startResponse = await app.inject({
    method: "POST",
    url: "/api/workflow-lab/runs",
    payload: {
      workflowId: "test_stop_fast",
      input: {},
    },
  });
  assert.equal(startResponse.statusCode, 200);
  const runId = (startResponse.json() as { runId: string }).runId;

  let beforeStop = workflowLabRunSnapshotSchema.parse(
    (await app.inject({
      method: "GET",
      url: `/api/workflow-lab/runs/${encodeURIComponent(runId)}`,
    })).json() as unknown,
  );
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (beforeStop.status === "completed") {
      break;
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 20);
    });
    beforeStop = workflowLabRunSnapshotSchema.parse(
      (await app.inject({
        method: "GET",
        url: `/api/workflow-lab/runs/${encodeURIComponent(runId)}`,
      })).json() as unknown,
    );
  }
  assert.equal(beforeStop.status, "completed");

  const stopResponse = await app.inject({
    method: "POST",
    url: `/api/workflow-lab/runs/${encodeURIComponent(runId)}/stop`,
    payload: {
      reason: "manual stop from test",
    },
  });
  assert.equal(stopResponse.statusCode, 200);
  const afterStop = workflowLabRunSnapshotSchema.parse(
    stopResponse.json() as unknown,
  );
  assert.equal(afterStop.status, "completed");
});
