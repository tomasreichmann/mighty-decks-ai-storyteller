import { appendFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import type {
  WorkflowLabRunEvent,
  WorkflowLabRunSnapshot,
} from "@mighty-decks/spec/workflowLab";
import type { WorkflowRunInstance } from "./executor";
import { atomicWriteTextFile } from "../utils/atomicFileWrite";

interface WorkflowRunLoggerOptions {
  rootDir: string;
  onError?: (error: unknown) => void;
}

interface RunPaths {
  runDir: string;
  metadataFilePath: string;
  snapshotFilePath: string;
  eventsFilePath: string;
}

const TERMINAL_RUN_EVENT_TYPES = new Set<WorkflowLabRunEvent["type"]>([
  "run_completed",
  "run_failed",
  "run_timed_out",
]);

const toPaths = (rootDir: string, snapshot: WorkflowLabRunSnapshot): RunPaths => {
  const slug = `${snapshot.workflowId}-${snapshot.runId}`.replace(/[^a-zA-Z0-9._-]+/g, "-");
  const runDir = resolve(rootDir, slug);
  return {
    runDir,
    metadataFilePath: resolve(runDir, "run-meta.json"),
    snapshotFilePath: resolve(runDir, "snapshot.latest.json"),
    eventsFilePath: resolve(runDir, "events.jsonl"),
  };
};

export class WorkflowRunLogger {
  private readonly rootDir: string;
  private readonly onError: (error: unknown) => void;
  private readonly writeLocks = new Map<string, Promise<void>>();
  private initialized = false;

  public constructor(options: WorkflowRunLoggerOptions) {
    this.rootDir = resolve(options.rootDir);
    this.onError = options.onError ?? (() => undefined);
  }

  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    await mkdir(this.rootDir, { recursive: true });
    this.initialized = true;
  }

  public attachRun(run: WorkflowRunInstance): void {
    const initialSnapshot = run.getSnapshot();
    const paths = toPaths(this.rootDir, initialSnapshot);
    const runKey = run.id;

    const queueWrite = (operation: () => Promise<void>): void => {
      const pending = this.writeLocks.get(runKey) ?? Promise.resolve();
      const next = pending
        .catch(() => undefined)
        .then(operation)
        .catch((error) => {
          this.onError(error);
        });
      this.writeLocks.set(runKey, next.then(() => undefined));
    };

    queueWrite(async () => {
      await this.initialize();
      await mkdir(paths.runDir, { recursive: true });
      await atomicWriteTextFile(
        paths.metadataFilePath,
        JSON.stringify(
          {
            runId: initialSnapshot.runId,
            workflowId: initialSnapshot.workflowId,
            workflowName: initialSnapshot.workflowName,
            createdAtIso: initialSnapshot.createdAtIso,
            timeoutMs: initialSnapshot.timeoutMs,
          },
          null,
          2,
        ),
      );
      await atomicWriteTextFile(
        paths.snapshotFilePath,
        JSON.stringify(initialSnapshot, null, 2),
      );
      await appendFile(
        paths.eventsFilePath,
        `${JSON.stringify({ type: "logger_attached", createdAtIso: new Date().toISOString() })}\n`,
        "utf8",
      );
      await atomicWriteTextFile(resolve(this.rootDir, "latest-run.txt"), `${run.id}\n`);
    });

    run.subscribe((event) => {
      queueWrite(async () => {
        await appendFile(paths.eventsFilePath, `${JSON.stringify(event)}\n`, "utf8");
        if (TERMINAL_RUN_EVENT_TYPES.has(event.type) || event.type === "run_started") {
          const snapshot = run.getSnapshot();
          await atomicWriteTextFile(
            paths.snapshotFilePath,
            JSON.stringify(snapshot, null, 2),
          );
        }
      });
    });
  }
}
