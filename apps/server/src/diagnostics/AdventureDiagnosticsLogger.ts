import { appendFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import type {
  AdventurePhase,
  AdventureState,
  AiRequestLogEntry,
  RuntimeConfig,
  TranscriptEntry,
} from "@mighty-decks/spec/adventureState";

interface SessionLogInfo {
  filePath: string;
  sessionId: string;
  startedAtIso: string;
}

export type AdventureDiagnosticEvent =
  | {
      type: "session_started";
      runtimeConfig: RuntimeConfig;
    }
  | {
      type: "phase_changed";
      phase: AdventurePhase;
    }
  | {
      type: "transcript_append";
      entry: TranscriptEntry;
    }
  | {
      type: "ai_request";
      request: AiRequestLogEntry;
    }
  | {
      type: "runtime_config_updated";
      runtimeConfig: RuntimeConfig;
    }
  | {
      type: "session_closed";
      reason: string;
      summary: string;
    };

export interface AdventureDiagnosticsLoggerOptions {
  enabled: boolean;
  logDir: string;
}

const sanitizeSegment = (value: string): string =>
  value
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "adventure";

const toFileTimestamp = (date: Date): string =>
  date.toISOString().replace(/[:.]/g, "-");

const DATA_IMAGE_URI_PATTERN =
  /data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g;

const redactImageBinary = (value: string): string =>
  value.replace(
    DATA_IMAGE_URI_PATTERN,
    (match) => `[omitted data:image base64 payload (${match.length} chars)]`,
  );

const sanitizeEventForLog = (
  event: AdventureDiagnosticEvent,
): AdventureDiagnosticEvent => {
  if (event.type === "ai_request") {
    return {
      ...event,
      request: {
        ...event.request,
        response: event.request.response
          ? redactImageBinary(event.request.response)
          : undefined,
      },
    };
  }

  if (event.type === "transcript_append") {
    return {
      ...event,
      entry: {
        ...event.entry,
        text: redactImageBinary(event.entry.text),
      },
    };
  }

  if (event.type === "session_closed") {
    return {
      ...event,
      summary: redactImageBinary(event.summary),
    };
  }

  return event;
};

export class AdventureDiagnosticsLogger {
  private readonly sessionsByAdventureId = new Map<string, SessionLogInfo>();
  private readonly rootDir: string;

  public constructor(private readonly options: AdventureDiagnosticsLoggerOptions) {
    this.rootDir = resolve(process.cwd(), options.logDir);
  }

  public logEvent(adventure: AdventureState, event: AdventureDiagnosticEvent): void {
    if (!this.options.enabled || !adventure.debugMode) {
      return;
    }

    try {
      const session = this.ensureSession(adventure);
      const envelope = {
        atIso: new Date().toISOString(),
        sessionId: session.sessionId,
        adventureId: adventure.adventureId,
        phase: adventure.phase,
        event: sanitizeEventForLog(event),
      };
      appendFileSync(session.filePath, `${JSON.stringify(envelope)}\n`, "utf8");
    } catch {
      // Diagnostics logging is best-effort and must never crash gameplay.
    }
  }

  public closeSession(adventureId: string): void {
    this.sessionsByAdventureId.delete(adventureId);
  }

  private ensureSession(adventure: AdventureState): SessionLogInfo {
    const existing = this.sessionsByAdventureId.get(adventure.adventureId);
    if (existing) {
      return existing;
    }

    if (!existsSync(this.rootDir)) {
      mkdirSync(this.rootDir, { recursive: true });
    }

    const now = new Date();
    const sessionId = `${sanitizeSegment(adventure.adventureId)}-${toFileTimestamp(now)}`;
    const filePath = resolve(this.rootDir, `${sessionId}.jsonl`);
    const info: SessionLogInfo = {
      filePath,
      sessionId,
      startedAtIso: now.toISOString(),
    };
    this.sessionsByAdventureId.set(adventure.adventureId, info);

    const sessionHeader = {
      atIso: info.startedAtIso,
      sessionId: info.sessionId,
      adventureId: adventure.adventureId,
      phase: adventure.phase,
      event: {
        type: "session_file_opened",
      },
    };
    appendFileSync(info.filePath, `${JSON.stringify(sessionHeader)}\n`, "utf8");
    return info;
  }
}
