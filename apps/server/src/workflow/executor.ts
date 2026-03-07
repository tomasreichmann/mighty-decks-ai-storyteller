import {
  jsonValueSchema,
  type JsonValue,
  type WorkflowLabRunEvent,
  type WorkflowLabRunSnapshot,
  type WorkflowLabStepAttempt,
  type WorkflowLabStepSnapshot,
  type WorkflowLabUsageSummary,
  type WorkflowModelPreferences,
  type WorkflowModelSlot,
} from "@mighty-decks/spec/workflowLab";
import type {
  CodeStepDef,
  CodeStepResult,
  LlmImageStepDef,
  LlmTextStepDef,
  MapStepDef,
  SttStepDef,
  TtsStepDef,
  WorkflowDef,
  WorkflowEdgeDef,
  WorkflowExecutionDefaults,
  WorkflowExternalAdapters,
  WorkflowJoinPolicy,
  WorkflowModelRegistry,
  WorkflowRunContext,
  WorkflowStepDef,
  WorkflowStepHelpers,
  WorkflowStepStatus,
} from "./types";

interface WorkflowExecutorDependencies {
  adapters: WorkflowExternalAdapters;
  modelRegistry: WorkflowModelRegistry;
  defaults: WorkflowExecutionDefaults;
}

export interface WorkflowRunCreateOptions {
  input: JsonValue;
  timeoutMs?: number;
  modelOverrides?: WorkflowModelPreferences;
}

interface StepRuntimeRecord {
  step: WorkflowStepDef;
  status: WorkflowStepStatus;
  timeoutMs: number;
  retryCount: number;
  dependsOn: string[];
  output?: JsonValue;
  error?: string;
  staleReason?: string;
  attempts: WorkflowLabStepAttempt[];
}

type TerminalStepStatus = "succeeded" | "failed" | "skipped";

const isTerminalStepStatus = (status: WorkflowStepStatus): status is TerminalStepStatus =>
  status === "succeeded" || status === "failed" || status === "skipped";

const nowIso = (): string => new Date().toISOString();
const sleep = async (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
const shorten = (value: string, maxLength = 2000): string =>
  value.length <= maxLength ? value : `${value.slice(0, maxLength)}...`;
const clampPositiveInt = (value: number, fallback: number): number => {
  if (!Number.isFinite(value)) return fallback;
  const rounded = Math.round(value);
  return rounded > 0 ? rounded : fallback;
};
const clampNonnegativeInt = (value: number, fallback: number): number => {
  if (!Number.isFinite(value)) return fallback;
  const rounded = Math.round(value);
  return rounded >= 0 ? rounded : fallback;
};

const summarizeJson = (value: JsonValue | undefined): string | undefined => {
  if (value === undefined) return undefined;
  try {
    return shorten(JSON.stringify(value));
  } catch {
    return undefined;
  }
};

const validateJsonValue = (value: unknown, label: string): JsonValue => {
  const parsed = jsonValueSchema.safeParse(value);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw new Error(`${label} must be JSON-serializable${firstIssue ? `: ${firstIssue.message}` : ""}`);
  }
  return parsed.data;
};

const parseJsonCandidate = (raw: string): unknown => {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  if (cleaned.length === 0) {
    throw new Error("LLM response was empty.");
  }
  if (cleaned.startsWith("{") || cleaned.startsWith("[")) {
    return JSON.parse(cleaned) as unknown;
  }
  const objectStart = cleaned.indexOf("{");
  const objectEnd = cleaned.lastIndexOf("}");
  const arrayStart = cleaned.indexOf("[");
  const arrayEnd = cleaned.lastIndexOf("]");
  if (objectStart >= 0 && objectEnd > objectStart) {
    return JSON.parse(cleaned.slice(objectStart, objectEnd + 1)) as unknown;
  }
  if (arrayStart >= 0 && arrayEnd > arrayStart) {
    return JSON.parse(cleaned.slice(arrayStart, arrayEnd + 1)) as unknown;
  }
  return JSON.parse(cleaned) as unknown;
};

const ensureStepMetadata = (step: WorkflowStepDef): void => {
  if (step.description.length > 200 || /[\r\n]/.test(step.description)) {
    throw new Error(`Step '${step.id}' description must be single-line and <= 200 chars.`);
  }
};

const toStepTimeoutMs = (step: WorkflowStepDef, defaults: WorkflowExecutionDefaults): number => {
  if (step.timeoutMs) return clampPositiveInt(step.timeoutMs, 30_000);
  switch (step.kind) {
    case "llm_text": {
      const mode = step.mode ?? "text";
      if (mode === "tool") return clampPositiveInt(defaults.stepTimeoutMs.llm_text.tool, 45_000);
      if (mode === "vision") return clampPositiveInt(defaults.stepTimeoutMs.llm_text.vision, 45_000);
      return clampPositiveInt(defaults.stepTimeoutMs.llm_text.text, 30_000);
    }
    case "llm_image":
      return clampPositiveInt(defaults.stepTimeoutMs.llm_image, 120_000);
    case "tts":
      return clampPositiveInt(defaults.stepTimeoutMs.tts, 60_000);
    case "stt":
      return clampPositiveInt(defaults.stepTimeoutMs.stt, 60_000);
    case "code":
      return clampPositiveInt(defaults.stepTimeoutMs.code, 10_000);
    case "map":
      return clampPositiveInt(defaults.stepTimeoutMs.map, 180_000);
  }
};

const mergeSharedState = (previous: JsonValue | undefined, patch: Record<string, JsonValue>): JsonValue => {
  const base = isRecord(previous) ? { ...previous } : {};
  for (const [key, value] of Object.entries(patch)) base[key] = value;
  return validateJsonValue(base, "shared state");
};

const defaultModelSlotForStep = (step: WorkflowStepDef): WorkflowModelSlot | undefined => {
  switch (step.kind) {
    case "llm_text":
      return step.mode === "tool"
        ? "fast_tool_model"
        : step.mode === "vision"
          ? "fast_vision_model"
          : "fast_text_model";
    case "llm_image":
      return "fast_image_model";
    case "tts":
      return "fast_tts_model";
    case "stt":
      return "fast_stt_model";
    case "code":
    case "map":
      return undefined;
  }
};

const topologicalSort = (steps: WorkflowStepDef[], edges: WorkflowEdgeDef[]): string[] => {
  const stepIds = new Set<string>();
  for (const step of steps) {
    if (stepIds.has(step.id)) throw new Error(`Duplicate step id '${step.id}'.`);
    ensureStepMetadata(step);
    stepIds.add(step.id);
  }
  for (const edge of edges) {
    if (!stepIds.has(edge.fromStepId)) throw new Error(`Unknown edge source '${edge.fromStepId}'.`);
    if (!stepIds.has(edge.toStepId)) throw new Error(`Unknown edge target '${edge.toStepId}'.`);
  }
  const indegree = new Map<string, number>();
  const outgoing = new Map<string, string[]>();
  for (const id of stepIds) {
    indegree.set(id, 0);
    outgoing.set(id, []);
  }
  for (const edge of edges) {
    indegree.set(edge.toStepId, (indegree.get(edge.toStepId) ?? 0) + 1);
    outgoing.get(edge.fromStepId)?.push(edge.toStepId);
  }
  const queue = [...indegree.entries()].filter(([, d]) => d === 0).map(([id]) => id).sort();
  const order: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift();
    if (!id) continue;
    order.push(id);
    for (const next of outgoing.get(id) ?? []) {
      const d = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, d);
      if (d === 0) {
        queue.push(next);
        queue.sort();
      }
    }
  }
  if (order.length !== steps.length) throw new Error("Workflow graph contains a cycle.");
  return order;
};

const combineAbortSignals = (signals: AbortSignal[]): AbortSignal => {
  const active = signals.filter((signal) => signal !== undefined);
  if (active.length === 1) return active[0]!;
  const controller = new AbortController();
  const onAbort = (event: Event): void => {
    const signal = event.target;
    if (signal instanceof AbortSignal) controller.abort(signal.reason);
    else controller.abort();
  };
  for (const signal of active) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      break;
    }
    signal.addEventListener("abort", onAbort, { once: true });
  }
  return controller.signal;
};

const runWithAbort = async <T>(signal: AbortSignal, fn: () => Promise<T>): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason instanceof Error ? signal.reason : new Error("Aborted"));
      return;
    }
    let settled = false;
    const onAbort = (): void => {
      if (settled) return;
      settled = true;
      reject(signal.reason instanceof Error ? signal.reason : new Error("Aborted"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
    void fn()
      .then((value) => {
        if (settled) return;
        settled = true;
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      })
      .catch((error: unknown) => {
        if (settled) return;
        settled = true;
        signal.removeEventListener("abort", onAbort);
        reject(error);
      });
  });

const WORKFLOW_STOP_ABORT_PREFIX = "workflow stopped:";

export class WorkflowRunInstance {
  private readonly runId = `wfr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  private readonly createdAtIso = nowIso();
  private readonly workflowId: string;
  private readonly workflowName: string;
  private readonly workflowVersion: string;
  private readonly input: JsonValue;
  private readonly mergedModelPreferences: WorkflowModelPreferences;
  private readonly topoOrder: string[];
  private readonly inboundEdges = new Map<string, WorkflowEdgeDef[]>();
  private readonly outboundEdges = new Map<string, WorkflowEdgeDef[]>();
  private readonly stepsRuntime = new Map<string, StepRuntimeRecord>();
  private readonly events: WorkflowLabRunEvent[] = [];
  private readonly subscribers = new Set<(event: WorkflowLabRunEvent) => void>();

  private rootAbort = new AbortController();
  private status: "pending" | "running" | "completed" | "failed" | "timed_out" = "pending";
  private sharedState: JsonValue | undefined;
  private outputs: Record<string, JsonValue> = {};
  private startedAtIso?: string;
  private endedAtIso?: string;
  private timeoutMs: number;
  private deadlineAtMs = 0;
  private eventSeq = 0;
  private terminalError: string | null = null;
  private executionPromise: Promise<void> | null = null;

  public constructor(
    private readonly definition: WorkflowDef,
    private readonly dependencies: WorkflowExecutorDependencies,
    options: WorkflowRunCreateOptions,
  ) {
    this.workflowId = definition.workflowId;
    this.workflowName = definition.name;
    this.workflowVersion = definition.version ?? "1";
    this.input = definition.inputSchema
      ? validateJsonValue(definition.inputSchema.parse(options.input), "workflow input")
      : validateJsonValue(options.input, "workflow input");
    this.mergedModelPreferences = {
      ...dependencies.modelRegistry,
      ...(definition.defaultRunOptions?.modelOverrides ?? {}),
      ...(options.modelOverrides ?? {}),
    };
    this.timeoutMs = clampPositiveInt(
      options.timeoutMs ?? definition.defaultRunOptions?.timeoutMs ?? dependencies.defaults.runTimeoutMs,
      dependencies.defaults.runTimeoutMs,
    );
    this.topoOrder = topologicalSort(definition.steps, definition.edges);

    for (const step of definition.steps) {
      this.inboundEdges.set(step.id, []);
      this.outboundEdges.set(step.id, []);
    }
    for (const edge of definition.edges) {
      this.inboundEdges.get(edge.toStepId)?.push(edge);
      this.outboundEdges.get(edge.fromStepId)?.push(edge);
    }
    for (const step of definition.steps) {
      this.stepsRuntime.set(step.id, {
        step,
        status: "pending",
        timeoutMs: toStepTimeoutMs(step, dependencies.defaults),
        retryCount: clampNonnegativeInt(
          step.retryCount ?? dependencies.defaults.defaultRetryCount,
          dependencies.defaults.defaultRetryCount,
        ),
        dependsOn: (this.inboundEdges.get(step.id) ?? []).map((edge) => edge.fromStepId),
        attempts: [],
      });
    }
    this.sharedState = definition.createInitialSharedState?.(this.input);
    if (this.sharedState !== undefined) {
      this.sharedState = validateJsonValue(this.sharedState, "initial shared state");
    }
  }

  public get id(): string {
    return this.runId;
  }

  public get workflowManifestVersion(): string {
    return this.workflowVersion;
  }

  public start(): void {
    if (this.executionPromise) return;
    this.executionPromise = this.executeLoop();
  }

  public subscribe(listener: (event: WorkflowLabRunEvent) => void): () => void {
    this.subscribers.add(listener);
    return () => {
      this.subscribers.delete(listener);
    };
  }

  public listEvents(): WorkflowLabRunEvent[] {
    return [...this.events];
  }

  public getSnapshot(): WorkflowLabRunSnapshot {
    const steps: WorkflowLabStepSnapshot[] = this.topoOrder.map((stepId) => {
      const runtime = this.stepsRuntime.get(stepId);
      if (!runtime) {
        throw new Error(`Missing step runtime '${stepId}'.`);
      }
      return {
        id: runtime.step.id,
        name: runtime.step.name,
        description: runtime.step.description,
        kind: runtime.step.kind,
        tags: runtime.step.tags ?? [],
        status: runtime.status,
        joinPolicy: runtime.step.joinPolicy ?? "all",
        timeoutMs: runtime.timeoutMs,
        retryCount: runtime.retryCount,
        priority: runtime.step.priority,
        dependsOn: runtime.dependsOn,
        output: runtime.output,
        error: runtime.error,
        staleReason: runtime.staleReason,
        attempts: runtime.attempts,
      };
    });
    return {
      runId: this.runId,
      workflowId: this.workflowId,
      workflowName: this.workflowName,
      status: this.status,
      createdAtIso: this.createdAtIso,
      startedAtIso: this.startedAtIso,
      endedAtIso: this.endedAtIso,
      timeoutMs: this.timeoutMs,
      deadlineAtIso: this.deadlineAtMs > 0 ? new Date(this.deadlineAtMs).toISOString() : undefined,
      input: this.input,
      sharedState: this.sharedState,
      outputs: this.outputs,
      modelPreferences: this.mergedModelPreferences,
      steps,
      eventCount: this.events.length,
    };
  }

  public invalidate(stepIds: string[], reason: string, includeDependents: boolean): void {
    const queue = [...stepIds];
    const seen = new Set<string>();
    while (queue.length > 0) {
      const stepId = queue.shift();
      if (!stepId || seen.has(stepId)) continue;
      const runtime = this.stepsRuntime.get(stepId);
      if (!runtime) throw new Error(`Unknown step '${stepId}'.`);
      seen.add(stepId);
      runtime.status = "stale";
      runtime.output = undefined;
      runtime.error = undefined;
      runtime.staleReason = reason;
      this.emitEvent({ type: "step_invalidated", stepId, reason });
      if (includeDependents) {
        for (const edge of this.outboundEdges.get(stepId) ?? []) {
          queue.push(edge.toStepId);
        }
      }
    }
  }

  public rerun(options: { fromInvalidatedOnly?: boolean; timeoutMs?: number } = {}): void {
    if (!options.fromInvalidatedOnly) {
      for (const runtime of this.stepsRuntime.values()) {
        if (isTerminalStepStatus(runtime.status)) {
          runtime.status = "stale";
          runtime.output = undefined;
          runtime.error = undefined;
          runtime.staleReason = "full rerun";
          this.emitEvent({
            type: "step_invalidated",
            stepId: runtime.step.id,
            reason: "full rerun",
          });
        }
      }
    }
    if (options.timeoutMs) {
      this.timeoutMs = clampPositiveInt(options.timeoutMs, this.timeoutMs);
    }
    if (this.status === "running") {
      throw new Error("Workflow is already running.");
    }
    this.rootAbort.abort(new Error("rerun"));
    this.rootAbort = new AbortController();
    this.executionPromise = this.executeLoop();
  }

  public stop(reason = "manual stop"): void {
    if (this.status === "completed" || this.status === "failed" || this.status === "timed_out") {
      return;
    }
    this.terminalError = `${WORKFLOW_STOP_ABORT_PREFIX} ${reason}`.slice(0, 4000);
    this.rootAbort.abort(new Error(`${WORKFLOW_STOP_ABORT_PREFIX} ${reason}`));
  }

  private emitEvent(event: { type: WorkflowLabRunEvent["type"] } & Record<string, unknown>): void {
    const fullEvent = {
      ...event,
      seq: this.eventSeq++,
      runId: this.runId,
      workflowId: this.workflowId,
      createdAtIso: nowIso(),
    } as WorkflowLabRunEvent;
    this.events.push(fullEvent);
    for (const subscriber of this.subscribers) subscriber(fullEvent);
  }

  private stepTimeout(stepId: string, fallback: number): number {
    return this.stepsRuntime.get(stepId)?.timeoutMs ?? fallback;
  }

  private isManualStopAbortReason(reason: unknown): boolean {
    return (
      reason instanceof Error &&
      reason.message.toLowerCase().startsWith(WORKFLOW_STOP_ABORT_PREFIX)
    );
  }

  private isTimeoutAbortReason(reason: unknown): boolean {
    if (reason instanceof DOMException && reason.name === "TimeoutError") {
      return true;
    }
    return reason instanceof Error && /timeout/i.test(reason.message);
  }

  private stringifyAbortReason(reason: unknown, fallback: string): string {
    if (reason instanceof Error) {
      return reason.message;
    }
    if (typeof reason === "string" && reason.trim().length > 0) {
      return reason;
    }
    return fallback;
  }

  private buildHelpers(stepId: string, attempt: number): WorkflowStepHelpers {
    return {
      input: this.input,
      sharedState: this.sharedState,
      getStepOutput: (queryStepId: string) => this.stepsRuntime.get(queryStepId)?.output,
      emitProgress: ({ message, chunk, data }) => {
        this.emitEvent({ type: "step_progress", stepId, attempt, message, chunk, data });
      },
      patchSharedState: (patch) => {
        this.sharedState = mergeSharedState(this.sharedState, patch);
      },
    };
  }

  private resolveModel(slot: WorkflowModelSlot, overrideModelId?: string): string {
    if (overrideModelId && overrideModelId.trim().length > 0) return overrideModelId.trim();
    const modelId = this.mergedModelPreferences[slot];
    if (!modelId) throw new Error(`No model configured for slot '${slot}'.`);
    return modelId;
  }

  private evaluateStepReadiness(): void {
    for (const stepId of this.topoOrder) {
      const runtime = this.stepsRuntime.get(stepId);
      if (!runtime || (runtime.status !== "pending" && runtime.status !== "stale")) continue;
      const inbound = this.inboundEdges.get(stepId) ?? [];
      if (inbound.length === 0) {
        runtime.status = "ready";
        runtime.staleReason = undefined;
        this.emitEvent({ type: "step_ready", stepId });
        continue;
      }
      let allTerminal = true;
      const conditions: boolean[] = [];
      for (const edge of inbound) {
        const source = this.stepsRuntime.get(edge.fromStepId);
        if (!source) throw new Error(`Missing source step '${edge.fromStepId}'.`);
        if (!isTerminalStepStatus(source.status)) {
          allTerminal = false;
          break;
        }
        let passed = source.status === "succeeded";
        if (passed && edge.when) {
          passed = Boolean(
            edge.when({
              sourceOutput: source.output,
              sharedState: this.sharedState,
              input: this.input,
              steps: Object.fromEntries(
                [...this.stepsRuntime.entries()].map(([id, value]) => [id, value.output]),
              ) as Record<string, JsonValue | undefined>,
            }),
          );
        }
        conditions.push(passed);
      }
      if (!allTerminal) continue;
      const joinPolicy: WorkflowJoinPolicy = runtime.step.joinPolicy ?? "all";
      const shouldRun =
        joinPolicy === "any"
          ? conditions.some(Boolean)
          : conditions.length > 0 && conditions.every(Boolean);
      if (shouldRun) {
        runtime.status = "ready";
        runtime.staleReason = undefined;
        this.emitEvent({ type: "step_ready", stepId });
      } else {
        runtime.status = "skipped";
        runtime.output = undefined;
        runtime.error = undefined;
        runtime.staleReason = "branch_not_taken";
        this.emitEvent({ type: "step_skipped", stepId, reason: "branch_not_taken" });
      }
    }
  }

  private nextReadyStep(): StepRuntimeRecord | null {
    const ready = [...this.stepsRuntime.values()].filter((runtime) => runtime.status === "ready");
    if (ready.length === 0) return null;
    ready.sort((left, right) => {
      const priorityDiff = (right.step.priority ?? 0) - (left.step.priority ?? 0);
      if (priorityDiff !== 0) return priorityDiff;
      return this.topoOrder.indexOf(left.step.id) - this.topoOrder.indexOf(right.step.id);
    });
    return ready[0] ?? null;
  }

  private remainingRunnableOrPendingCount(): number {
    let count = 0;
    for (const runtime of this.stepsRuntime.values()) {
      if (runtime.status === "pending" || runtime.status === "ready" || runtime.status === "stale") {
        count += 1;
      }
    }
    return count;
  }

  private finalizeOutputs(): void {
    const selectors = this.definition.outputSelectors ?? {};
    const helpers = this.buildHelpers("__workflow__", 0);
    const nextOutputs: Record<string, JsonValue> = {};
    for (const [key, selector] of Object.entries(selectors)) {
      nextOutputs[key] = validateJsonValue(selector(helpers), `workflow output '${key}'`);
    }
    this.outputs = nextOutputs;
  }

  private markTimedOut(): void {
    if (this.status === "timed_out") return;
    this.status = "timed_out";
    this.endedAtIso = nowIso();
    for (const runtime of this.stepsRuntime.values()) {
      if (runtime.status === "pending" || runtime.status === "ready" || runtime.status === "stale") {
        runtime.status = "skipped";
        runtime.staleReason = "workflow_timeout";
        this.emitEvent({ type: "step_skipped", stepId: runtime.step.id, reason: "workflow_timeout" });
      }
    }
    this.emitEvent({
      type: "run_timed_out",
      error: `Workflow exceeded timeout (${this.timeoutMs}ms).`,
    });
  }

  private async executeLoop(): Promise<void> {
    this.status = "running";
    this.startedAtIso ??= nowIso();
    this.endedAtIso = undefined;
    this.terminalError = null;
    this.deadlineAtMs = Date.now() + this.timeoutMs;
    this.emitEvent({
      type: "run_started",
      timeoutMs: this.timeoutMs,
      deadlineAtIso: new Date(this.deadlineAtMs).toISOString(),
    });

    while (true) {
      if (Date.now() > this.deadlineAtMs) {
        this.rootAbort.abort(new Error("workflow timeout"));
        this.markTimedOut();
        return;
      }
      this.evaluateStepReadiness();
      const nextStep = this.nextReadyStep();
      if (!nextStep) {
        const hasFailure = [...this.stepsRuntime.values()].some((runtime) => runtime.status === "failed");
        if (hasFailure) {
          this.status = "failed";
          this.endedAtIso = nowIso();
          this.emitEvent({ type: "run_failed", error: this.terminalError ?? "Workflow failed." });
          return;
        }
        if (this.remainingRunnableOrPendingCount() === 0) {
          this.finalizeOutputs();
          this.status = "completed";
          this.endedAtIso = nowIso();
          this.emitEvent({ type: "run_completed" });
          return;
        }
        await sleep(10);
        continue;
      }
      await this.executeStep(nextStep);
    }
  }

  private async executeStep(runtime: StepRuntimeRecord): Promise<void> {
    runtime.status = "running";
    runtime.error = undefined;
    runtime.staleReason = undefined;
    const maxAttempts = Math.max(1, runtime.retryCount + 1);
    let lastError = "Step failed.";

    for (let tryIndex = 0; tryIndex < maxAttempts; tryIndex += 1) {
      if (Date.now() > this.deadlineAtMs) {
        this.rootAbort.abort(new Error("workflow timeout"));
        this.markTimedOut();
        return;
      }

      const attemptNumber = runtime.attempts.length + 1;
      const attemptRecord: WorkflowLabStepAttempt = {
        attempt: attemptNumber,
        startedAtIso: nowIso(),
        status: "started",
        timeoutMs: runtime.timeoutMs,
        retryCount: runtime.retryCount,
      };
      runtime.attempts.push(attemptRecord);
      this.emitEvent({ type: "step_started", stepId: runtime.step.id, attempt: attemptNumber });

      const attemptSignal = combineAbortSignals([
        this.rootAbort.signal,
        AbortSignal.timeout(runtime.timeoutMs),
      ]);
      const helpers = this.buildHelpers(runtime.step.id, attemptNumber);
      const context: WorkflowRunContext = {
        ...helpers,
        abortSignal: attemptSignal,
        deadlineAtMs: this.deadlineAtMs,
        stepId: runtime.step.id,
        attempt: attemptNumber,
        modelPreferences: this.mergedModelPreferences,
        resolveModel: (slot, overrideModelId) => this.resolveModel(slot, overrideModelId),
        adapters: this.dependencies.adapters,
      };

      try {
        const result = await runWithAbort(attemptSignal, () => this.runStep(runtime.step, context));
        runtime.output = result.output;
        runtime.status = "succeeded";
        attemptRecord.endedAtIso = nowIso();
        attemptRecord.status = "succeeded";
        attemptRecord.modelSlot = result.modelSlot;
        attemptRecord.modelId = result.modelId;
        attemptRecord.request = result.request;
        attemptRecord.requestSummary = result.requestSummary ?? summarizeJson(result.request);
        attemptRecord.result = result.result ?? result.rawResponse;
        attemptRecord.resultSummary = result.resultSummary ?? summarizeJson(attemptRecord.result);
        attemptRecord.usage = result.usage;
        this.emitEvent({
          type: "step_succeeded",
          stepId: runtime.step.id,
          attempt: attemptNumber,
          resultSummary: attemptRecord.resultSummary,
          usage: result.usage,
        });
        return;
      } catch (error) {
        lastError = error instanceof Error ? error.message : "Step failed.";
        const abortReason = attemptSignal.aborted ? attemptSignal.reason : undefined;
        const manualStop = this.isManualStopAbortReason(abortReason);
        const timedOut =
          !manualStop &&
          (this.isTimeoutAbortReason(abortReason) || /timeout/i.test(lastError));
        attemptRecord.endedAtIso = nowIso();
        attemptRecord.status = timedOut ? "timeout" : "failed";
        attemptRecord.error = shorten(lastError, 4000);
        this.emitEvent({
          type: "step_failed",
          stepId: runtime.step.id,
          attempt: attemptNumber,
          error: attemptRecord.error,
          timeout: timedOut,
        });
        if (manualStop) {
          lastError = this.stringifyAbortReason(abortReason, "Workflow stopped.");
          break;
        }
        if (tryIndex < maxAttempts - 1) {
          await sleep(clampPositiveInt(runtime.step.retryBackoffMs ?? 250, 250));
        }
      }
    }

    runtime.status = "failed";
    const rootAbortReason = this.rootAbort.signal.reason;
    if (this.isManualStopAbortReason(rootAbortReason)) {
      runtime.error = shorten(
        this.stringifyAbortReason(rootAbortReason, "Workflow stopped."),
        4000,
      );
      this.terminalError = runtime.error;
    } else {
      runtime.error = shorten(lastError, 4000);
      this.terminalError = `Step '${runtime.step.id}' failed: ${runtime.error}`;
    }
    if (runtime.step.kind === "code" && runtime.step.onExit) {
      await runtime.step.onExit({
        status: "failed",
        error: runtime.error,
        helpers: this.buildHelpers(runtime.step.id, 0),
      });
    }
  }

  private async runStep(
    step: WorkflowStepDef,
    context: WorkflowRunContext,
  ): Promise<{
    output?: JsonValue;
    request?: JsonValue;
    requestSummary?: string;
    result?: JsonValue;
    resultSummary?: string;
    rawResponse?: JsonValue;
    usage?: WorkflowLabUsageSummary;
    modelSlot?: WorkflowModelSlot;
    modelId?: string;
  }> {
    switch (step.kind) {
      case "llm_text":
        return this.runLlmTextStep(step, context);
      case "llm_image":
        return this.runLlmImageStep(step, context);
      case "tts":
        return this.runTtsStep(step, context);
      case "stt":
        return this.runSttStep(step, context);
      case "code":
        return this.runCodeStep(step, context);
      case "map":
        return this.runMapStep(step, context);
    }
  }

  private async runLlmTextStep(step: LlmTextStepDef, context: WorkflowRunContext) {
    const prompt = (step.buildPrompt ? step.buildPrompt(context) : step.prompt ?? "").trim();
    if (!prompt) throw new Error(`Step '${step.id}' produced an empty prompt.`);
    const modelSlot = step.modelSlot ?? defaultModelSlotForStep(step) ?? "fast_text_model";
    const modelId = context.resolveModel(modelSlot, step.modelIdOverride);
    context.emitProgress({
      message: "request_prepared",
      data: validateJsonValue(
        {
          requestSummary: shorten(prompt, 4000),
          request: { prompt },
          modelSlot,
          modelId,
        },
        "llm request progress",
      ),
    });
    const adapterResult = await context.adapters.text({
      modelId,
      prompt,
      timeoutMs: this.stepTimeout(step.id, 30_000),
      signal: context.abortSignal,
      maxTokens: step.maxTokens,
      temperature: step.temperature,
      stream: step.stream ?? false,
      onChunk: step.stream ? (chunk) => context.emitProgress({ chunk }) : undefined,
    });
    const text = adapterResult.text?.trim() ?? "";
    if (!text) throw new Error(`Step '${step.id}' returned empty text.`);
    const output = step.outputSchema
      ? validateJsonValue(step.outputSchema.parse(parseJsonCandidate(text)), `step '${step.id}' output`)
      : (text as JsonValue);
    return {
      output,
      request: validateJsonValue({ prompt }, "llm request"),
      requestSummary: shorten(prompt, 4000),
      result: output,
      resultSummary: typeof output === "string" ? shorten(output, 4000) : summarizeJson(output),
      rawResponse: adapterResult.rawResponse,
      usage: adapterResult.usage,
      modelSlot,
      modelId,
    };
  }

  private async runLlmImageStep(step: LlmImageStepDef, context: WorkflowRunContext) {
    const prompt = (step.buildPrompt ? step.buildPrompt(context) : step.prompt ?? "").trim();
    if (!prompt) throw new Error(`Step '${step.id}' produced an empty image prompt.`);
    const modelSlot = step.modelSlot ?? defaultModelSlotForStep(step) ?? "fast_image_model";
    const modelId = context.resolveModel(modelSlot, step.modelIdOverride);
    context.emitProgress({
      message: "request_prepared",
      data: validateJsonValue(
        {
          requestSummary: shorten(prompt, 4000),
          request: { prompt },
          modelSlot,
          modelId,
        },
        "image request progress",
      ),
    });
    const adapterResult = await context.adapters.image({
      modelId,
      prompt,
      timeoutMs: this.stepTimeout(step.id, 120_000),
      signal: context.abortSignal,
    });
    if (!adapterResult.imageUrl) throw new Error(`Step '${step.id}' returned no image URL.`);
    const output = validateJsonValue({ imageUrl: adapterResult.imageUrl, prompt, modelId }, "image step output");
    return {
      output,
      request: validateJsonValue({ prompt }, "image request"),
      requestSummary: shorten(prompt, 4000),
      result: output,
      rawResponse: adapterResult.rawResponse,
      usage: adapterResult.usage,
      modelSlot,
      modelId,
    };
  }

  private async runTtsStep(step: TtsStepDef, context: WorkflowRunContext) {
    const text = (step.getText ? step.getText(context) : step.text ?? "").trim();
    if (!text) throw new Error(`Step '${step.id}' requires text.`);
    const modelSlot = step.modelSlot ?? "fast_tts_model";
    const modelId = context.resolveModel(modelSlot, step.modelIdOverride);
    context.emitProgress({
      message: "request_prepared",
      data: validateJsonValue(
        {
          requestSummary: shorten(text, 4000),
          request: {
            text,
            voiceId: step.voiceId ?? null,
            format: step.format ?? null,
          },
          modelSlot,
          modelId,
        },
        "tts request progress",
      ),
    });
    const adapterResult = await context.adapters.tts({
      modelId,
      text,
      timeoutMs: this.stepTimeout(step.id, 60_000),
      signal: context.abortSignal,
      voiceId: step.voiceId,
      format: step.format,
      options: step.options,
    });
    if (!adapterResult.audioUrl) throw new Error(`Step '${step.id}' returned no audio.`);
    const output = validateJsonValue(
      { audioUrl: adapterResult.audioUrl, durationSeconds: adapterResult.durationSeconds ?? null, modelId },
      "tts step output",
    );
    return {
      output,
      request: validateJsonValue({ text, voiceId: step.voiceId ?? null, format: step.format ?? null }, "tts request"),
      requestSummary: shorten(text, 4000),
      result: output,
      rawResponse: adapterResult.rawResponse,
      modelSlot,
      modelId,
    };
  }

  private async runSttStep(step: SttStepDef, context: WorkflowRunContext) {
    const audioUrl = (step.getAudioUrl ? step.getAudioUrl(context) : step.audioUrl ?? "").trim();
    if (!audioUrl) throw new Error(`Step '${step.id}' requires audioUrl.`);
    const modelSlot = step.modelSlot ?? "fast_stt_model";
    const modelId = context.resolveModel(modelSlot, step.modelIdOverride);
    context.emitProgress({
      message: "request_prepared",
      data: validateJsonValue(
        {
          requestSummary: shorten(audioUrl, 4000),
          request: {
            audioUrl,
            language: step.language ?? null,
          },
          modelSlot,
          modelId,
        },
        "stt request progress",
      ),
    });
    const adapterResult = await context.adapters.stt({
      modelId,
      audioUrl,
      timeoutMs: this.stepTimeout(step.id, 60_000),
      signal: context.abortSignal,
      language: step.language,
      options: step.options,
    });
    const output = validateJsonValue(
      { text: adapterResult.text, segments: adapterResult.segments ?? null, modelId },
      "stt step output",
    );
    return {
      output,
      request: validateJsonValue({ audioUrl, language: step.language ?? null }, "stt request"),
      requestSummary: shorten(audioUrl, 4000),
      result: output,
      rawResponse: adapterResult.rawResponse,
      modelSlot,
      modelId,
    };
  }

  private async runCodeStep(step: CodeStepDef, context: WorkflowRunContext) {
    context.emitProgress({
      message: "request_prepared",
      data: validateJsonValue(
        {
          requestSummary: "Code step execution started.",
          request: { stepId: step.id, kind: "code" },
        },
        "code request progress",
      ),
    });
    const raw = await step.run(context);
    const normalized: CodeStepResult =
      isRecord(raw) && ("output" in raw || "summary" in raw || "request" in raw || "rawResponse" in raw)
        ? (raw as CodeStepResult)
        : { output: validateJsonValue(raw, `step '${step.id}' output`) };
    const output = normalized.output === undefined
      ? undefined
      : validateJsonValue(normalized.output, `step '${step.id}' output`);
    if (step.onExit) {
      await step.onExit({ status: "succeeded", output, helpers: context });
    }
    return {
      output,
      request: normalized.request,
      requestSummary: summarizeJson(normalized.request),
      result: output,
      resultSummary: normalized.summary ?? summarizeJson(output),
      rawResponse: normalized.rawResponse,
      usage: normalized.usage,
    };
  }

  private async runMapStep(step: MapStepDef, context: WorkflowRunContext) {
    const items = step.getItems(context).map((item) => validateJsonValue(item, "map item"));
    const previousResults: JsonValue[] = [];
    const results: JsonValue[] = new Array(items.length);
    const mode = step.mode ?? "sequential";
    const concurrency = Math.max(1, Math.floor(step.concurrency ?? 1));
    context.emitProgress({
      message: "request_prepared",
      data: validateJsonValue(
        {
          requestSummary: `Map step received ${items.length} item(s).`,
          request: {
            itemCount: items.length,
            mode,
            concurrency,
          },
        },
        "map request progress",
      ),
    });

    const runItemAt = async (index: number): Promise<void> => {
      const item = items[index];
      if (item === undefined) return;
      context.emitProgress({
        message: `Processing item ${index + 1}/${items.length}`,
        data: validateJsonValue({ index, total: items.length }, "map progress"),
      });
      const result = await step.runItem({
        item,
        index,
        helpers: context,
        previousResults: [...previousResults],
      });
      const normalized = validateJsonValue(result, "map item result");
      results[index] = normalized;
      if (mode === "sequential") previousResults.push(normalized);
    };

    if (mode === "parallel" && concurrency > 1) {
      let cursor = 0;
      const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
        while (cursor < items.length) {
          const index = cursor;
          cursor += 1;
          await runItemAt(index);
        }
      });
      await Promise.all(workers);
    } else {
      for (let index = 0; index < items.length; index += 1) await runItemAt(index);
    }

    const itemResults = results.map((result, index) =>
      result ?? validateJsonValue({ error: `missing result ${index}` }, "map placeholder"),
    );
    const output = step.aggregate
      ? validateJsonValue(step.aggregate({ items, itemResults, helpers: context }), "map aggregate")
      : validateJsonValue({ items: itemResults }, "map output");
    return {
      output,
      request: validateJsonValue({ itemCount: items.length }, "map request"),
      requestSummary: `Items: ${items.length}`,
      result: output,
      resultSummary: summarizeJson(output),
    };
  }
}

export interface WorkflowFactory {
  createRun(definition: WorkflowDef, options: WorkflowRunCreateOptions): WorkflowRunInstance;
}

export const createWorkflowFactory = (dependencies: WorkflowExecutorDependencies): WorkflowFactory => ({
  createRun(definition, options) {
    return new WorkflowRunInstance(definition, dependencies, options);
  },
});
