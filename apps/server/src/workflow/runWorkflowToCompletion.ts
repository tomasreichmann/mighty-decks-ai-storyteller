import type { WorkflowLabRunSnapshot } from "@mighty-decks/spec/workflowLab";
import { WorkflowRunInstance } from "./executor";

interface RunWorkflowToCompletionOptions {
  timeoutMs?: number;
}

const isTerminalStatus = (status: WorkflowLabRunSnapshot["status"]): boolean =>
  status === "completed" || status === "failed" || status === "timed_out";

export const runWorkflowToCompletion = async (
  run: WorkflowRunInstance,
  options: RunWorkflowToCompletionOptions = {},
): Promise<WorkflowLabRunSnapshot> =>
  new Promise<WorkflowLabRunSnapshot>((resolve, reject) => {
    const timeoutMs = options.timeoutMs ?? 60_000;
    let settled = false;

    const settle = (callback: () => void): void => {
      if (settled) {
        return;
      }
      settled = true;
      unsubscribe();
      clearTimeout(timeoutHandle);
      callback();
    };

    const timeoutHandle = setTimeout(() => {
      settle(() => {
        reject(
          new Error(
            `Workflow ${run.id} did not reach a terminal state within ${timeoutMs}ms.`,
          ),
        );
      });
    }, timeoutMs);

    const unsubscribe = run.subscribe((event) => {
      if (
        event.type === "run_completed" ||
        event.type === "run_failed" ||
        event.type === "run_timed_out"
      ) {
        settle(() => {
          resolve(run.getSnapshot());
        });
      }
    });

    const initialSnapshot = run.getSnapshot();
    if (isTerminalStatus(initialSnapshot.status)) {
      settle(() => {
        resolve(initialSnapshot);
      });
    }
  });
