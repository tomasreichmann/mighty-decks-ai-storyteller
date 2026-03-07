import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  workflowLabErrorSchema,
  workflowLabInvalidateRequestSchema,
  workflowLabListResponseSchema,
  workflowLabRunEventSchema,
  workflowLabStopRunRequestSchema,
  workflowLabRerunRequestSchema,
  workflowLabRunSnapshotSchema,
  workflowLabStartRunRequestSchema,
  workflowLabStartRunResponseSchema,
  workflowLabWorkflowManifestSchema,
} from "@mighty-decks/spec/workflowLab";
import type { WorkflowFactory, WorkflowRunInstance } from "./executor";
import type { WorkflowRunLogger } from "./WorkflowRunLogger";
import { WorkflowRegistry } from "./workflowRegistry";

interface RegisterWorkflowLabRoutesOptions {
  workflowRegistry: WorkflowRegistry;
  workflowFactory: WorkflowFactory;
  runLogger?: WorkflowRunLogger;
}

interface StoredRun {
  run: WorkflowRunInstance;
  workflowId: string;
}

class WorkflowLabRunStore {
  private readonly runs = new Map<string, StoredRun>();

  public constructor(
    private readonly registry: WorkflowRegistry,
    private readonly factory: WorkflowFactory,
    private readonly runLogger?: WorkflowRunLogger,
  ) {}

  public createRun(payload: {
    workflowId: string;
    input: unknown;
    timeoutMs?: number;
    modelOverrides?: Record<string, string>;
  }): WorkflowRunInstance {
    const registered = this.registry.getById(payload.workflowId);
    if (!registered) {
      throw new Error("Workflow not found.");
    }

    const run = this.factory.createRun(registered.createDefinition(), {
      input: payload.input as never,
      timeoutMs: payload.timeoutMs,
      modelOverrides: payload.modelOverrides as never,
    });
    this.runs.set(run.id, {
      run,
      workflowId: payload.workflowId,
    });
    this.runLogger?.attachRun(run);
    run.start();
    return run;
  }

  public getRun(runId: string): StoredRun | null {
    return this.runs.get(runId) ?? null;
  }
}

const sendError = (reply: FastifyReply, statusCode: number, message: string) =>
  reply.code(statusCode).send(workflowLabErrorSchema.parse({ message }));

const writeSseEvent = (reply: FastifyReply, event: unknown): void => {
  reply.raw.write(`event: workflow_event\n`);
  reply.raw.write(`data: ${JSON.stringify(workflowLabRunEventSchema.parse(event))}\n\n`);
};

const wireSseHeaders = (reply: FastifyReply, request: FastifyRequest): void => {
  const requestOrigin = request.headers.origin;
  if (typeof requestOrigin === "string" && requestOrigin.length > 0) {
    reply.raw.setHeader("Access-Control-Allow-Origin", requestOrigin);
    reply.raw.setHeader("Vary", "Origin");
  }
  reply.raw.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  reply.raw.setHeader("Cache-Control", "no-cache, no-transform");
  reply.raw.setHeader("Connection", "keep-alive");
  reply.raw.setHeader("X-Accel-Buffering", "no");
};

export const registerWorkflowLabRoutes = (
  app: FastifyInstance,
  options: RegisterWorkflowLabRoutesOptions,
): void => {
  const runStore = new WorkflowLabRunStore(
    options.workflowRegistry,
    options.workflowFactory,
    options.runLogger,
  );

  app.get("/api/workflow-lab/workflows", async (_request, reply) => {
    const payload = workflowLabListResponseSchema.parse({
      workflows: options.workflowRegistry.listManifests(),
    });
    return reply.send(payload);
  });

  app.get("/api/workflow-lab/workflows/:workflowId", async (request, reply) => {
    const { workflowId = "" } = request.params as { workflowId?: string };
    const registered = options.workflowRegistry.getById(workflowId);
    if (!registered) {
      return sendError(reply, 404, "Workflow not found.");
    }
    return reply.send(workflowLabWorkflowManifestSchema.parse(registered.manifest));
  });

  app.post("/api/workflow-lab/runs", async (request, reply) => {
    try {
      const payload = workflowLabStartRunRequestSchema.parse(request.body);
      const run = runStore.createRun({
        workflowId: payload.workflowId,
        input: payload.input,
        timeoutMs: payload.timeoutMs,
        modelOverrides: payload.modelOverrides,
      });
      return reply.send(workflowLabStartRunResponseSchema.parse({ runId: run.id }));
    } catch (error) {
      return sendError(
        reply,
        400,
        error instanceof Error ? error.message : "Could not start workflow run.",
      );
    }
  });

  app.get("/api/workflow-lab/runs/:runId", async (request, reply) => {
    const { runId = "" } = request.params as { runId?: string };
    const stored = runStore.getRun(runId);
    if (!stored) {
      return sendError(reply, 404, "Workflow run not found.");
    }
    return reply.send(workflowLabRunSnapshotSchema.parse(stored.run.getSnapshot()));
  });

  app.get(
    "/api/workflow-lab/runs/:runId/events",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { runId = "" } = request.params as { runId?: string };
      const stored = runStore.getRun(runId);
      if (!stored) {
        return sendError(reply, 404, "Workflow run not found.");
      }

      reply.hijack();
      wireSseHeaders(reply, request);
      reply.raw.write(`retry: 1000\n\n`);

      for (const event of stored.run.listEvents()) {
        writeSseEvent(reply, event);
      }

      const unsubscribe = stored.run.subscribe((event) => {
        try {
          writeSseEvent(reply, event);
        } catch {
          unsubscribe();
          try {
            reply.raw.end();
          } catch {
            // ignore
          }
        }
      });

      const heartbeat = setInterval(() => {
        try {
          reply.raw.write(`: ping ${Date.now()}\n\n`);
        } catch {
          clearInterval(heartbeat);
        }
      }, 15_000);

      request.raw.on("close", () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          reply.raw.end();
        } catch {
          // ignore
        }
      });
    },
  );

  app.post("/api/workflow-lab/runs/:runId/invalidate", async (request, reply) => {
    const { runId = "" } = request.params as { runId?: string };
    const stored = runStore.getRun(runId);
    if (!stored) {
      return sendError(reply, 404, "Workflow run not found.");
    }
    try {
      const payload = workflowLabInvalidateRequestSchema.parse(request.body);
      stored.run.invalidate(payload.stepIds, payload.reason, payload.includeDependents);
      return reply.send(workflowLabRunSnapshotSchema.parse(stored.run.getSnapshot()));
    } catch (error) {
      return sendError(
        reply,
        400,
        error instanceof Error ? error.message : "Could not invalidate workflow steps.",
      );
    }
  });

  app.post("/api/workflow-lab/runs/:runId/rerun", async (request, reply) => {
    const { runId = "" } = request.params as { runId?: string };
    const stored = runStore.getRun(runId);
    if (!stored) {
      return sendError(reply, 404, "Workflow run not found.");
    }
    try {
      const payload = workflowLabRerunRequestSchema.parse(request.body);
      stored.run.rerun({
        fromInvalidatedOnly: payload.fromInvalidatedOnly,
        timeoutMs: payload.timeoutMs,
      });
      return reply.send(workflowLabRunSnapshotSchema.parse(stored.run.getSnapshot()));
    } catch (error) {
      return sendError(
        reply,
        400,
        error instanceof Error ? error.message : "Could not rerun workflow.",
      );
    }
  });

  app.post("/api/workflow-lab/runs/:runId/stop", async (request, reply) => {
    const { runId = "" } = request.params as { runId?: string };
    const stored = runStore.getRun(runId);
    if (!stored) {
      return sendError(reply, 404, "Workflow run not found.");
    }
    try {
      const payload = workflowLabStopRunRequestSchema.parse(request.body);
      stored.run.stop(payload.reason);
      let snapshot = stored.run.getSnapshot();
      for (let attempt = 0; attempt < 120; attempt += 1) {
        if (snapshot.status !== "running" && snapshot.status !== "pending") {
          break;
        }
        await new Promise((resolve) => {
          setTimeout(resolve, 20);
        });
        snapshot = stored.run.getSnapshot();
      }
      return reply.send(workflowLabRunSnapshotSchema.parse(snapshot));
    } catch (error) {
      return sendError(
        reply,
        400,
        error instanceof Error ? error.message : "Could not stop workflow run.",
      );
    }
  });
};
