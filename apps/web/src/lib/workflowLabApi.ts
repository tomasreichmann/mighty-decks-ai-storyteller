import {
  workflowLabListResponseSchema,
  workflowLabRunEventSchema,
  workflowLabRunSnapshotSchema,
  workflowLabRerunRequestSchema,
  workflowLabStopRunRequestSchema,
  workflowLabStartRunRequestSchema,
  workflowLabStartRunResponseSchema,
  workflowLabWorkflowManifestSchema,
  workflowLabInvalidateRequestSchema,
  type WorkflowLabInvalidateRequest,
  type WorkflowLabRerunRequest,
  type WorkflowLabRunEvent,
  type WorkflowLabRunSnapshot,
  type WorkflowLabStopRunRequest,
  type WorkflowLabStartRunRequest,
  type WorkflowLabWorkflowManifest,
} from "@mighty-decks/spec/workflowLab";
import { resolveServerUrl } from "./socket";

const buildApiUrl = (path: string): string =>
  new URL(path, resolveServerUrl()).toString();

const fetchJson = async (input: RequestInfo | URL, init?: RequestInit): Promise<unknown> => {
  const response = await fetch(input, init);
  const text = await response.text();
  const payload = text.trim().length > 0 ? (JSON.parse(text) as unknown) : null;
  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      payload !== null &&
      "message" in payload &&
      typeof payload.message === "string"
        ? payload.message
        : `Request failed (${response.status})`;
    throw new Error(message);
  }
  return payload;
};

export const listWorkflowLabWorkflows = async (): Promise<WorkflowLabWorkflowManifest[]> => {
  const payload = await fetchJson(buildApiUrl("/api/workflow-lab/workflows"));
  return workflowLabListResponseSchema.parse(payload).workflows;
};

export const getWorkflowLabWorkflow = async (
  workflowId: string,
): Promise<WorkflowLabWorkflowManifest> => {
  const payload = await fetchJson(
    buildApiUrl(`/api/workflow-lab/workflows/${encodeURIComponent(workflowId)}`),
  );
  return workflowLabWorkflowManifestSchema.parse(payload);
};

export const startWorkflowLabRun = async (
  request: WorkflowLabStartRunRequest,
): Promise<{ runId: string }> => {
  const payload = await fetchJson(buildApiUrl("/api/workflow-lab/runs"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(workflowLabStartRunRequestSchema.parse(request)),
  });
  return workflowLabStartRunResponseSchema.parse(payload);
};

export const getWorkflowLabRun = async (runId: string): Promise<WorkflowLabRunSnapshot> => {
  const payload = await fetchJson(
    buildApiUrl(`/api/workflow-lab/runs/${encodeURIComponent(runId)}`),
  );
  return workflowLabRunSnapshotSchema.parse(payload);
};

export const invalidateWorkflowLabRunSteps = async (
  runId: string,
  request: WorkflowLabInvalidateRequest,
): Promise<WorkflowLabRunSnapshot> => {
  const payload = await fetchJson(
    buildApiUrl(`/api/workflow-lab/runs/${encodeURIComponent(runId)}/invalidate`),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(workflowLabInvalidateRequestSchema.parse(request)),
    },
  );
  return workflowLabRunSnapshotSchema.parse(payload);
};

export const rerunWorkflowLabRun = async (
  runId: string,
  request: WorkflowLabRerunRequest,
): Promise<WorkflowLabRunSnapshot> => {
  const payload = await fetchJson(
    buildApiUrl(`/api/workflow-lab/runs/${encodeURIComponent(runId)}/rerun`),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(workflowLabRerunRequestSchema.parse(request)),
    },
  );
  return workflowLabRunSnapshotSchema.parse(payload);
};

export const stopWorkflowLabRun = async (
  runId: string,
  request: WorkflowLabStopRunRequest,
): Promise<WorkflowLabRunSnapshot> => {
  const payload = await fetchJson(
    buildApiUrl(`/api/workflow-lab/runs/${encodeURIComponent(runId)}/stop`),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(workflowLabStopRunRequestSchema.parse(request)),
    },
  );
  return workflowLabRunSnapshotSchema.parse(payload);
};

export const subscribeWorkflowLabRunEvents = (
  runId: string,
  handlers: {
    onEvent: (event: WorkflowLabRunEvent) => void;
    onError?: (error: Event) => void;
  },
): EventSource => {
  const source = new EventSource(
    buildApiUrl(`/api/workflow-lab/runs/${encodeURIComponent(runId)}/events`),
  );
  source.addEventListener("workflow_event", (event) => {
    if (!(event instanceof MessageEvent)) {
      return;
    }
    try {
      const parsed = workflowLabRunEventSchema.parse(
        JSON.parse(event.data) as unknown,
      );
      handlers.onEvent(parsed);
    } catch {
      // Ignore malformed events to keep the stream alive.
    }
  });
  if (handlers.onError) {
    source.onerror = handlers.onError;
  }
  return source;
};
