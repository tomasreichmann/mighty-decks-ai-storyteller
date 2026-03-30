import { useEffect, useMemo, useRef, useState } from "react";
import type {
  JsonValue,
  WorkflowLabRunEvent,
  WorkflowLabRunSnapshot,
  WorkflowLabWorkflowManifest,
  WorkflowModelSlot,
} from "@mighty-decks/spec/workflowLab";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/common/Button";
import { DepressedInput } from "../components/common/DepressedInput";
import { Heading } from "../components/common/Heading";
import { Label } from "../components/common/Label";
import { Message } from "../components/common/Message";
import { Panel } from "../components/common/Panel";
import { RockerSwitch } from "../components/common/RockerSwitch";
import { Section } from "../components/common/Section";
import { Text } from "../components/common/Text";
import { listWorkflowLabWorkflows, startWorkflowLabRun, getWorkflowLabRun, subscribeWorkflowLabRunEvents, invalidateWorkflowLabRunSteps, rerunWorkflowLabRun } from "../lib/workflowLabApi";

const MODEL_SLOTS: WorkflowModelSlot[] = [
  "fast_text_model",
  "hq_text_model",
  "fast_tool_model",
  "hq_tool_model",
  "fast_image_model",
  "hq_image_model",
  "fast_vision_model",
  "hq_vision_model",
  "fast_tts_model",
  "hq_tts_model",
  "fast_stt_model",
  "hq_stt_model",
];

const SELECT_CLASSES =
  "w-full min-h-[42px] border-2 border-kac-iron rounded-sm bg-gradient-to-b from-[#f8efd8] to-[#e5d4b9] px-3 py-2 text-sm text-kac-iron font-ui shadow-[inset_2px_2px_0_0_#9f8a6d,inset_-2px_-2px_0_0_#fff7e6]";

const FieldSticker = ({ children }: { children: string }): JSX.Element => (
  <div className="-mb-2 -ml-1 relative self-start z-20">
    <Label>{children}</Label>
  </div>
);

const prettyJson = (value: unknown): string => JSON.stringify(value, null, 2);

const collectMediaUrls = (value: JsonValue | undefined): Array<{ kind: "image" | "audio"; url: string }> => {
  const results: Array<{ kind: "image" | "audio"; url: string }> = [];
  const walk = (node: JsonValue | undefined): void => {
    if (typeof node === "string") {
      return;
    }
    if (Array.isArray(node)) {
      for (const item of node) {
        walk(item);
      }
      return;
    }
    if (!node || typeof node !== "object") {
      return;
    }
    for (const [key, rawValue] of Object.entries(node)) {
      if (typeof rawValue === "string") {
        if (/^https?:\/\//i.test(rawValue) && /\.(png|jpe?g|webp|gif)(?:\?|$)/i.test(rawValue)) {
          results.push({ kind: "image", url: rawValue });
        } else if (/^https?:\/\//i.test(rawValue) && /\.(mp3|wav|ogg|m4a)(?:\?|$)/i.test(rawValue)) {
          results.push({ kind: "audio", url: rawValue });
        } else if ((key === "imageUrl" || key === "audioUrl") && /^https?:\/\//i.test(rawValue)) {
          results.push({ kind: key === "imageUrl" ? "image" : "audio", url: rawValue });
        }
      } else {
        walk(rawValue as JsonValue);
      }
    }
  };
  walk(value);
  return results;
};

const asJsonObject = (value: JsonValue | undefined): Record<string, JsonValue> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, JsonValue>)
    : null;

const toStepStatusPatchSnapshot = (
  current: WorkflowLabRunSnapshot | null,
  event: WorkflowLabRunEvent,
): WorkflowLabRunSnapshot | null => {
  if (!current || current.runId !== event.runId) {
    return current;
  }

  const next: WorkflowLabRunSnapshot = {
    ...current,
    eventCount: Math.max(current.eventCount, event.seq + 1),
  };

  const updateStep = (
    stepId: string,
    updater: (step: WorkflowLabRunSnapshot["steps"][number]) => WorkflowLabRunSnapshot["steps"][number],
  ): void => {
    next.steps = next.steps.map((step) => (step.id === stepId ? updater(step) : step));
  };

  const ensureAttempt = (
    step: WorkflowLabRunSnapshot["steps"][number],
    attemptNumber: number,
  ): WorkflowLabRunSnapshot["steps"][number] => {
    if (step.attempts.some((attempt) => attempt.attempt === attemptNumber)) {
      return step;
    }
    return {
      ...step,
      attempts: [
        ...step.attempts,
        {
          attempt: attemptNumber,
          startedAtIso: event.createdAtIso,
          status: "started",
          timeoutMs: step.timeoutMs,
          retryCount: step.retryCount,
        },
      ],
    };
  };

  switch (event.type) {
    case "run_started":
      next.status = "running";
      next.startedAtIso = event.createdAtIso;
      next.deadlineAtIso = event.deadlineAtIso;
      next.timeoutMs = event.timeoutMs;
      return next;
    case "run_completed":
      next.status = "completed";
      next.endedAtIso = event.createdAtIso;
      return next;
    case "run_failed":
      next.status = "failed";
      next.endedAtIso = event.createdAtIso;
      return next;
    case "run_timed_out":
      next.status = "timed_out";
      next.endedAtIso = event.createdAtIso;
      return next;
    case "step_ready":
      updateStep(event.stepId, (step) => ({ ...step, status: "ready" }));
      return next;
    case "step_started":
      updateStep(event.stepId, (step) => {
        const withAttempt = ensureAttempt(step, event.attempt);
        return { ...withAttempt, status: "running" };
      });
      return next;
    case "step_progress":
      updateStep(event.stepId, (step) => {
        const withAttempt = ensureAttempt(step, event.attempt);
        if (event.message !== "request_prepared") {
          return withAttempt;
        }
        const data = asJsonObject(event.data);
        const requestSummary =
          data && typeof data.requestSummary === "string" ? data.requestSummary : undefined;
        const request = data?.request;
        const modelId = data && typeof data.modelId === "string" ? data.modelId : undefined;
        const modelSlot =
          data && typeof data.modelSlot === "string"
            ? (data.modelSlot as WorkflowModelSlot)
            : undefined;
        return {
          ...withAttempt,
          attempts: withAttempt.attempts.map((attempt) =>
            attempt.attempt !== event.attempt
              ? attempt
              : {
                  ...attempt,
                  requestSummary: requestSummary ?? attempt.requestSummary,
                  request: request ?? attempt.request,
                  modelId: modelId ?? attempt.modelId,
                  modelSlot: modelSlot ?? attempt.modelSlot,
                },
          ),
        };
      });
      return next;
    case "step_succeeded":
      updateStep(event.stepId, (step) => ({
        ...step,
        status: "succeeded",
        attempts: step.attempts.map((attempt) =>
          attempt.attempt !== event.attempt
            ? attempt
            : {
                ...attempt,
                status: "succeeded",
                endedAtIso: event.createdAtIso,
                resultSummary: event.resultSummary ?? attempt.resultSummary,
                usage: event.usage ?? attempt.usage,
              },
        ),
      }));
      return next;
    case "step_failed":
      updateStep(event.stepId, (step) => ({
        ...step,
        status: "failed",
        error: event.error,
        attempts: step.attempts.map((attempt) =>
          attempt.attempt !== event.attempt
            ? attempt
            : {
                ...attempt,
                status: event.timeout ? "timeout" : "failed",
                endedAtIso: event.createdAtIso,
                error: event.error,
              },
        ),
      }));
      return next;
    case "step_skipped":
      updateStep(event.stepId, (step) => ({
        ...step,
        status: "skipped",
        staleReason: event.reason,
      }));
      return next;
    case "step_invalidated":
      updateStep(event.stepId, (step) => ({
        ...step,
        status: "stale",
        staleReason: event.reason,
        error: undefined,
      }));
      return next;
  }
};

const applyEventsToSnapshot = (
  baseSnapshot: WorkflowLabRunSnapshot,
  events: WorkflowLabRunEvent[],
): WorkflowLabRunSnapshot => {
  let nextSnapshot: WorkflowLabRunSnapshot | null = baseSnapshot;
  for (const event of events) {
    nextSnapshot = toStepStatusPatchSnapshot(nextSnapshot, event);
  }
  return nextSnapshot ?? baseSnapshot;
};

export const WorkflowLabPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { workflowId: routeWorkflowId } = useParams<{ workflowId?: string }>();

  const [workflows, setWorkflows] = useState<WorkflowLabWorkflowManifest[]>([]);
  const [loadingWorkflows, setLoadingWorkflows] = useState(true);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(routeWorkflowId ?? null);
  const [inputText, setInputText] = useState("{}");
  const [timeoutMsText, setTimeoutMsText] = useState("");
  const [modelOverrides, setModelOverrides] = useState<Partial<Record<WorkflowModelSlot, string>>>({});
  const [runId, setRunId] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<WorkflowLabRunSnapshot | null>(null);
  const [events, setEvents] = useState<WorkflowLabRunEvent[]>([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [includeDependents, setIncludeDependents] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventStreamError, setEventStreamError] = useState<string | null>(null);
  const refreshTimerRef = useRef<number | null>(null);
  const eventsRef = useRef<WorkflowLabRunEvent[]>([]);
  const selectedStepIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingWorkflows(true);
    void listWorkflowLabWorkflows()
      .then((nextWorkflows) => {
        if (cancelled) return;
        setWorkflows(nextWorkflows);
        const nextSelected = routeWorkflowId ?? selectedWorkflowId ?? nextWorkflows[0]?.workflowId ?? null;
        setSelectedWorkflowId(nextSelected);
      })
      .catch((loadError) => {
        if (cancelled) return;
        setError(loadError instanceof Error ? loadError.message : "Could not load workflows.");
      })
      .finally(() => {
        if (!cancelled) setLoadingWorkflows(false);
      });
    return () => {
      cancelled = true;
    };
  }, [routeWorkflowId]);

  const selectedWorkflow = useMemo(
    () => workflows.find((workflow) => workflow.workflowId === selectedWorkflowId) ?? null,
    [workflows, selectedWorkflowId],
  );

  useEffect(() => {
    if (!selectedWorkflow) {
      return;
    }
    setInputText(prettyJson(selectedWorkflow.defaultInputExample ?? {}));
    setTimeoutMsText(
      selectedWorkflow.defaultRunTimeoutMs
        ? String(selectedWorkflow.defaultRunTimeoutMs)
        : "",
    );
    setModelOverrides(selectedWorkflow.defaultModelOverrides ?? {});
  }, [selectedWorkflow?.workflowId]);

  useEffect(() => {
    selectedStepIdRef.current = selectedStepId;
  }, [selectedStepId]);

  const scheduleSnapshotRefresh = (targetRunId: string): void => {
    if (refreshTimerRef.current !== null) {
      return;
    }
    refreshTimerRef.current = window.setTimeout(() => {
      refreshTimerRef.current = null;
      void getWorkflowLabRun(targetRunId)
        .then((nextSnapshot) => {
          const replayableEvents = eventsRef.current.filter((event) => event.runId === targetRunId);
          setSnapshot(applyEventsToSnapshot(nextSnapshot, replayableEvents));
          if (!selectedStepIdRef.current && nextSnapshot.steps[0]) {
            setSelectedStepId(nextSnapshot.steps[0].id);
          }
        })
        .catch((loadError) => {
          setError(loadError instanceof Error ? loadError.message : "Could not refresh workflow run.");
        });
    }, 120);
  };

  useEffect(() => {
    if (!runId) {
      return;
    }
    setEventStreamError(null);
    const source = subscribeWorkflowLabRunEvents(runId, {
      onEvent: (event) => {
        setEvents((current) => {
          const nextEvents = [...current, event].slice(-500);
          eventsRef.current = nextEvents;
          return nextEvents;
        });
        setSnapshot((current) => toStepStatusPatchSnapshot(current, event));
        scheduleSnapshotRefresh(runId);
      },
      onError: () => {
        setEventStreamError("Event stream disconnected. Snapshot refresh still works.");
      },
    });
    void getWorkflowLabRun(runId)
      .then((nextSnapshot) => {
        const replayableEvents = eventsRef.current.filter((event) => event.runId === runId);
        const patchedSnapshot = applyEventsToSnapshot(nextSnapshot, replayableEvents);
        setSnapshot(patchedSnapshot);
        if (!selectedStepIdRef.current && patchedSnapshot.steps[0]) {
          setSelectedStepId(patchedSnapshot.steps[0].id);
        }
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Could not load workflow run.");
      });
    return () => {
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      source.close();
    };
  }, [runId]);

  useEffect(() => {
    if (!snapshot) {
      return;
    }

    const relevantEvents = events.filter((event) => event.runId === snapshot.runId);
    if (relevantEvents.length === 0) {
      return;
    }

    setSnapshot((current) => {
      if (!current || current.runId !== snapshot.runId) {
        return current;
      }
      return applyEventsToSnapshot(current, relevantEvents);
    });
  }, [events, snapshot?.runId]);

  const selectedStep = useMemo(
    () => snapshot?.steps.find((step) => step.id === selectedStepId) ?? null,
    [snapshot, selectedStepId],
  );

  const mediaUrls = useMemo(
    () => collectMediaUrls((snapshot?.outputs.package ?? snapshot?.outputs) as JsonValue | undefined),
    [snapshot?.outputs],
  );

  const onSelectWorkflow = (workflowId: string): void => {
    setSelectedWorkflowId(workflowId);
    navigate(`/workflow-lab/${encodeURIComponent(workflowId)}`);
  };

  const onStartRun = async (): Promise<void> => {
    if (!selectedWorkflow) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const parsedInput = JSON.parse(inputText) as JsonValue;
      const timeoutMs = timeoutMsText.trim().length > 0 ? Number(timeoutMsText) : undefined;
      const cleanedOverrides = Object.fromEntries(
        Object.entries(modelOverrides)
          .map(([slot, value]) => [slot, value.trim()])
          .filter(([, value]) => value.length > 0),
      );
      const result = await startWorkflowLabRun({
        workflowId: selectedWorkflow.workflowId,
        input: parsedInput,
        timeoutMs,
        modelOverrides: cleanedOverrides,
      });
      setRunId(result.runId);
      eventsRef.current = [];
      setEvents([]);
      setSnapshot(null);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Could not start run.");
    } finally {
      setBusy(false);
    }
  };

  const onRefreshRun = async (): Promise<void> => {
    if (!runId) return;
    try {
      const nextSnapshot = await getWorkflowLabRun(runId);
      const replayableEvents = eventsRef.current.filter((event) => event.runId === runId);
      setSnapshot(applyEventsToSnapshot(nextSnapshot, replayableEvents));
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Could not refresh run.");
    }
  };

  const onInvalidateSelectedStep = async (): Promise<void> => {
    if (!runId || !selectedStepId) return;
    setBusy(true);
    setError(null);
    try {
      const nextSnapshot = await invalidateWorkflowLabRunSteps(runId, {
        stepIds: [selectedStepId],
        reason: "visualizer_manual_invalidate",
        includeDependents,
      });
      const replayableEvents = eventsRef.current.filter((event) => event.runId === runId);
      setSnapshot(applyEventsToSnapshot(nextSnapshot, replayableEvents));
    } catch (invalidateError) {
      setError(
        invalidateError instanceof Error ? invalidateError.message : "Could not invalidate step.",
      );
    } finally {
      setBusy(false);
    }
  };

  const onRerun = async (fullRerun: boolean): Promise<void> => {
    if (!runId) return;
    setBusy(true);
    setError(null);
    try {
      const nextSnapshot = await rerunWorkflowLabRun(runId, {
        fromInvalidatedOnly: !fullRerun,
        timeoutMs: timeoutMsText.trim().length > 0 ? Number(timeoutMsText) : undefined,
      });
      const replayableEvents = eventsRef.current.filter((event) => event.runId === runId);
      setSnapshot(applyEventsToSnapshot(nextSnapshot, replayableEvents));
    } catch (rerunError) {
      setError(rerunError instanceof Error ? rerunError.message : "Could not rerun workflow.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="app-shell stack py-6 gap-4">
      <Section className="stack gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <Heading
              as="h1"
              variant="h1"
              color="iron"
              className="relative z-0 text-[2.4rem] leading-none sm:text-[3.4rem] sm:leading-none"
              highlightProps={{
                color: "gold",
                lineHeight: 8,
                brushHeight: 6,
                lineOffsets: [0, 8, 14, 20],
                className:
                  "left-1/2 bottom-[0.08em] h-[0.5em] w-[calc(100%+0.22em)] -translate-x-1/2",
              }}
            >
              Workflow Lab
            </Heading>
            <Text
              variant="body"
              color="iron-light"
              className="relative z-10 mt-3 text-sm"
            >
              Server-backed workflow visualizer with live run events and step inspection.
            </Text>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" color="bone" onClick={() => navigate("/workflow-lab")}>
              Reset View
            </Button>
          </div>
        </div>
      </Section>

      {error ? (
        <Message label="Error" color="blood">
          <p className="text-sm whitespace-pre-wrap">{error}</p>
        </Message>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="stack gap-4">
          <Section className="stack gap-3">
            {loadingWorkflows ? (
              <p className="text-sm text-kac-iron-light">Loading workflows...</p>
            ) : (
              <>
                <label className="stack max-w-[22rem] gap-1">
                  <FieldSticker>Select Workflow</FieldSticker>
                  <select
                    className={SELECT_CLASSES}
                    value={selectedWorkflowId ?? ""}
                    onChange={(event) => onSelectWorkflow(event.target.value)}
                  >
                    {workflows.map((workflow) => (
                      <option key={workflow.workflowId} value={workflow.workflowId}>
                        {workflow.name} ({workflow.workflowId})
                      </option>
                    ))}
                  </select>
                </label>
                {selectedWorkflow ? (
                  <div className="text-xs text-kac-steel-dark space-y-1">
                    <p>
                      <span className="font-semibold text-kac-iron">ID:</span>{" "}
                      {selectedWorkflow.workflowId}
                      {" | "}
                      <span className="font-semibold text-kac-iron">Version:</span>{" "}
                      {selectedWorkflow.version}
                    </p>
                    <p className="text-sm text-kac-iron-light">{selectedWorkflow.description}</p>
                  </div>
                ) : null}
              </>
            )}
          </Section>

          <Section className="stack gap-3">
            <DepressedInput
              label="Workflow Run Timeout (ms)"
              value={timeoutMsText}
              onChange={(event) => setTimeoutMsText(event.target.value)}
              placeholder="180000"
              className="max-w-[14rem]"
              controlClassName="font-mono text-sm"
            />
            <div className="stack max-h-60 gap-2 overflow-auto px-1 pb-1 pt-2">
              {MODEL_SLOTS.map((slot) => (
                <DepressedInput
                  key={slot}
                  label={slot}
                  value={modelOverrides[slot] ?? ""}
                  placeholder="(default from server)"
                  onChange={(event) =>
                    setModelOverrides((current) => ({
                      ...current,
                      [slot]: event.target.value,
                    }))
                  }
                  className="max-w-[22rem]"
                  controlClassName="font-mono text-xs"
                />
              ))}
            </div>
          </Section>
        </div>

        <div className="stack gap-4 min-w-0">
          <Section className="stack gap-3">
            <DepressedInput
              label="Input JSON"
              multiline={true}
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              spellCheck={false}
              rows={12}
              controlClassName="min-h-[220px] font-mono text-xs"
            />
            <div className="flex flex-wrap gap-2">
              <Button color="gold" disabled={!selectedWorkflow || busy} onClick={() => void onStartRun()}>
                {busy ? "Working..." : "Start Run"}
              </Button>
              <Button variant="ghost" color="steel" disabled={!runId || busy} onClick={() => void onRefreshRun()}>
                Refresh Snapshot
              </Button>
              <Button variant="ghost" color="blood" disabled={!runId || !selectedStepId || busy} onClick={() => void onInvalidateSelectedStep()}>
                Invalidate Selected
              </Button>
              <Button variant="ghost" color="cloth" disabled={!runId || busy} onClick={() => void onRerun(false)}>
                Rerun Invalidated
              </Button>
              <Button variant="ghost" color="bone" disabled={!runId || busy} onClick={() => void onRerun(true)}>
                Full Rerun
              </Button>
            </div>
            <div>
              <RockerSwitch
                active={includeDependents}
                color="cloth"
                size="s"
                label="Include Dependents"
                inactiveText="Disabled"
                activeText="Enabled"
                onClick={() => setIncludeDependents(!includeDependents)}
              />
            </div>
          </Section>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <Panel className="stack gap-3 min-w-0">
              <h2 className="font-display text-lg text-kac-iron">Run + Step Graph</h2>
              {snapshot ? (
                <>
                  <div className="grid gap-2 sm:grid-cols-2 text-xs text-kac-iron">
                    <p><span className="font-semibold">Run:</span> {snapshot.runId}</p>
                    <p><span className="font-semibold">Status:</span> {snapshot.status}</p>
                    <p><span className="font-semibold">Timeout:</span> {snapshot.timeoutMs}ms</p>
                    <p><span className="font-semibold">Events:</span> {snapshot.eventCount}</p>
                  </div>
                  <div className="grid gap-2">
                    {snapshot.steps.map((step) => {
                      const isSelected = step.id === selectedStepId;
                      const latestAttempt = step.attempts[step.attempts.length - 1];
                      const runningRequestSummary =
                        step.status === "running" ? latestAttempt?.requestSummary : undefined;
                      const statusColor =
                        step.status === "succeeded"
                          ? "border-kac-monster-dark bg-kac-monster-light/20"
                          : step.status === "failed"
                            ? "border-kac-blood-dark bg-kac-blood-light/20"
                            : step.status === "running"
                              ? "border-kac-gold-dark bg-kac-gold-light/20"
                              : step.status === "ready"
                                ? "border-kac-fire-dark bg-kac-fire-light/20"
                                : step.status === "stale"
                                  ? "border-kac-curse-dark bg-kac-curse-light/10"
                                  : "border-kac-iron/30 bg-white/70";
                      return (
                        <button
                          key={step.id}
                          type="button"
                          className={`text-left border rounded-sm px-3 py-2 ${statusColor} ${isSelected ? "ring-2 ring-kac-gold-dark/50" : ""}`}
                          onClick={() => setSelectedStepId(step.id)}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-ui text-xs uppercase tracking-[0.08em] text-kac-iron">
                              {step.name}
                            </span>
                            <span className="text-[11px] font-mono text-kac-iron">{step.status}</span>
                          </div>
                          <p className="text-xs text-kac-iron-light mt-1">{step.description}</p>
                          <p className="text-[11px] text-kac-steel-dark mt-1">
                            {step.kind} | attempts {step.attempts.length} | timeout {step.timeoutMs}ms | retry {step.retryCount}
                          </p>
                          {step.dependsOn.length > 0 ? (
                            <p className="text-[11px] text-kac-steel-dark mt-1">
                              depends on: {step.dependsOn.join(", ")}
                            </p>
                          ) : null}
                          {runningRequestSummary ? (
                            <div className="mt-2 rounded-sm border border-kac-gold-dark/25 bg-kac-gold-light/20 p-2">
                              <p className="text-[10px] font-ui uppercase tracking-[0.08em] text-kac-iron">
                                Running Request
                              </p>
                              <pre className="mt-1 text-[11px] whitespace-pre-wrap break-words text-kac-steel-dark">
                                {runningRequestSummary}
                              </pre>
                            </div>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-sm text-kac-iron-light">Start a run to inspect graph status and step outputs.</p>
              )}
            </Panel>

            <Panel className="stack gap-3 min-w-0">
              <h2 className="font-display text-lg text-kac-iron">Step Inspector</h2>
              {selectedStep ? (
                <>
                  <div className="text-xs text-kac-iron space-y-1">
                    <p><span className="font-semibold">ID:</span> {selectedStep.id}</p>
                    <p><span className="font-semibold">Status:</span> {selectedStep.status}</p>
                    <p><span className="font-semibold">Kind:</span> {selectedStep.kind}</p>
                    <p><span className="font-semibold">Description:</span> {selectedStep.description}</p>
                  </div>
                  {selectedStep.error ? (
                    <div className="text-xs text-kac-blood-dark bg-kac-blood-lightest border border-kac-blood/30 rounded-sm p-2">
                      {selectedStep.error}
                    </div>
                  ) : null}
                  <div className="stack gap-2">
                    <p className="text-xs font-ui uppercase tracking-[0.08em] text-kac-iron">Attempts</p>
                    <div className="max-h-52 overflow-auto space-y-2">
                      {selectedStep.attempts.map((attempt) => (
                        <div key={attempt.attempt} className="border border-kac-iron/20 rounded-sm p-2 bg-white/70">
                          <p className="text-xs font-mono text-kac-iron">
                            #{attempt.attempt} {attempt.status} | timeout {attempt.timeoutMs}ms
                            {attempt.modelId ? ` | ${attempt.modelId}` : ""}
                          </p>
                          {attempt.error ? (
                            <p className="text-xs text-kac-blood-dark mt-1 whitespace-pre-wrap">{attempt.error}</p>
                          ) : null}
                          {attempt.requestSummary ? (
                            <details className="mt-1">
                              <summary className="text-xs cursor-pointer text-kac-steel-dark">Request</summary>
                              <pre className="text-[11px] whitespace-pre-wrap break-words mt-1">{attempt.requestSummary}</pre>
                            </details>
                          ) : null}
                          {attempt.resultSummary ? (
                            <details className="mt-1">
                              <summary className="text-xs cursor-pointer text-kac-steel-dark">Result</summary>
                              <pre className="text-[11px] whitespace-pre-wrap break-words mt-1">{attempt.resultSummary}</pre>
                            </details>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-ui uppercase tracking-[0.08em] text-kac-iron mb-1">Current Output</p>
                    <pre className="max-h-52 overflow-auto text-[11px] whitespace-pre-wrap break-words border border-kac-iron/20 rounded-sm p-2 bg-white/70">
                      {prettyJson(selectedStep.output ?? null)}
                    </pre>
                  </div>
                </>
              ) : (
                <p className="text-sm text-kac-iron-light">Select a step to inspect its attempts and output.</p>
              )}
            </Panel>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <Panel className="stack gap-3 min-w-0">
              <h2 className="font-display text-lg text-kac-iron">Event Timeline</h2>
              {eventStreamError ? (
                <p className="text-xs text-kac-blood-dark">{eventStreamError}</p>
              ) : null}
              <div className="max-h-72 overflow-auto space-y-1">
                {events.length === 0 ? (
                  <p className="text-sm text-kac-iron-light">No events yet.</p>
                ) : (
                  events.map((event) => (
                    <div key={`${event.seq}-${event.type}`} className="border border-kac-iron/20 rounded-sm p-2 bg-white/70">
                      <p className="text-xs font-mono text-kac-iron">
                        #{event.seq} {event.type}
                        {"stepId" in event ? ` | ${event.stepId}` : ""}
                        {"attempt" in event ? ` | attempt ${event.attempt}` : ""}
                      </p>
                      <pre className="text-[11px] whitespace-pre-wrap break-words mt-1 text-kac-steel-dark">
                        {prettyJson(event)}
                      </pre>
                    </div>
                  ))
                )}
              </div>
            </Panel>

            <Panel className="stack gap-3 min-w-0">
              <h2 className="font-display text-lg text-kac-iron">Artifacts + Outputs</h2>
              {snapshot ? (
                <>
                  {mediaUrls.length > 0 ? (
                    <div className="grid gap-3">
                      {mediaUrls.map((media, index) => (
                        <div key={`${media.kind}-${media.url}-${index}`} className="border border-kac-iron/20 rounded-sm p-2 bg-white/70">
                          <p className="text-xs font-mono text-kac-iron">{media.kind}: {media.url}</p>
                          {media.kind === "image" ? (
                            <img src={media.url} alt={`Workflow artifact ${index + 1}`} className="mt-2 w-full rounded-sm border border-kac-iron/20" />
                          ) : (
                            <audio controls src={media.url} className="mt-2 w-full" />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-kac-iron-light">No image/audio URLs discovered yet in outputs.</p>
                  )}
                  <details className="mt-2">
                    <summary className="text-xs cursor-pointer text-kac-steel-dark">
                      Run Outputs JSON
                    </summary>
                    <pre className="mt-2 max-h-72 overflow-auto text-[11px] whitespace-pre-wrap break-words border border-kac-iron/20 rounded-sm p-2 bg-white/70">
                      {prettyJson(snapshot.outputs)}
                    </pre>
                  </details>
                </>
              ) : (
                <p className="text-sm text-kac-iron-light">Outputs will appear here as the run progresses.</p>
              )}
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
};
