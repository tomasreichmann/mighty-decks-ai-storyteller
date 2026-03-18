import { spawn } from "node:child_process";
import type { TextCompletionClient, OpenRouterTextResult } from "./OpenRouterClient";

interface TextRequest {
  model: string;
  prompt: string;
  timeoutMs: number;
  maxTokens: number;
  temperature: number;
}

export interface ClaudeCliClientOptions {
  model: string;
  maxConcurrent: number;
  textCallTimeoutMs: number;
}

const MAX_STDOUT_BYTES = 2 * 1024 * 1024; // 2 MB

export class ClaudeCliClient implements TextCompletionClient {
  private available = false;
  private readonly model: string;
  private readonly maxConcurrent: number;
  private readonly textCallTimeoutMs: number;

  private activeCalls = 0;
  private readonly waitQueue: Array<() => void> = [];

  public constructor(options: ClaudeCliClientOptions) {
    this.model = options.model;
    this.maxConcurrent = options.maxConcurrent;
    this.textCallTimeoutMs = options.textCallTimeoutMs;
  }

  public isAvailable(): boolean {
    return this.available;
  }

  public async probe(logger?: { warn: (msg: string) => void; info: (msg: string) => void }): Promise<boolean> {
    try {
      await this.execCli(["--version"], 10_000);
      this.available = true;
      logger?.info("Claude CLI available");
      return true;
    } catch {
      this.available = false;
      logger?.warn("Claude CLI not found or not working — provider marked unavailable. Check that 'claude' is in your PATH.");
      return false;
    }
  }

  public async completeText(request: TextRequest): Promise<string | null> {
    const result = await this.completeTextWithMetadata(request);
    return result?.text ?? null;
  }

  public async completeTextWithMetadata(
    request: TextRequest,
  ): Promise<OpenRouterTextResult | null> {
    if (!this.available) {
      return null;
    }

    await this.acquireSemaphore();
    try {
      const timeoutMs = request.timeoutMs || this.textCallTimeoutMs;
      const text = await this.execCliWithStdin(
        ["--print", "--model", this.model],
        request.prompt,
        timeoutMs,
      );

      if (!text || text.trim().length === 0) {
        return null;
      }

      return {
        text: text.trim(),
        usage: undefined,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw error;
      }
      return null;
    } finally {
      this.releaseSemaphore();
    }
  }

  private async acquireSemaphore(): Promise<void> {
    if (this.activeCalls < this.maxConcurrent) {
      this.activeCalls++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.waitQueue.push(() => {
        this.activeCalls++;
        resolve();
      });
    });
  }

  private releaseSemaphore(): void {
    this.activeCalls--;
    const next = this.waitQueue.shift();
    if (next) {
      next();
    }
  }

  private execCli(args: string[], timeoutMs: number): Promise<string> {
    return this.execCliWithStdin(args, null, timeoutMs);
  }

  private execCliWithStdin(
    args: string[],
    stdinData: string | null,
    timeoutMs: number,
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      let stdout = "";
      let stderr = "";
      let stdoutBytes = 0;
      let settled = false;

      const child = spawn("claude", args, {
        shell: false,
        stdio: ["pipe", "pipe", "pipe"],
      });

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        child.kill("SIGKILL");
        const err = new Error(`Claude CLI timed out after ${timeoutMs}ms`);
        err.name = "AbortError";
        reject(err);
      }, timeoutMs);

      child.stdout.on("data", (chunk: Buffer) => {
        stdoutBytes += chunk.length;
        if (stdoutBytes > MAX_STDOUT_BYTES) {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            child.kill("SIGKILL");
            reject(new Error("Claude CLI stdout exceeded max buffer size"));
          }
          return;
        }
        stdout += chunk.toString("utf-8");
      });

      child.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString("utf-8").slice(0, 2000);
      });

      child.on("error", (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(err);
      });

      child.on("close", (code) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);

        if (code !== 0) {
          reject(
            new Error(
              `Claude CLI exited with code ${code}${stderr ? `: ${stderr.slice(0, 500)}` : ""}`,
            ),
          );
          return;
        }

        resolve(stdout);
      });

      if (stdinData !== null) {
        child.stdin.write(stdinData, "utf-8");
        child.stdin.end();
      } else {
        child.stdin.end();
      }
    });
  }
}
