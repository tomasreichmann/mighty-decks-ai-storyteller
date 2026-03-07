import { rename, unlink, writeFile } from "node:fs/promises";

interface AtomicWriteRetryOptions {
  maxRenameAttempts?: number;
  baseDelayMs?: number;
}

const DEFAULT_MAX_RENAME_ATTEMPTS = 8;
const DEFAULT_BASE_DELAY_MS = 25;

const sleep = async (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableRenameError = (error: unknown): boolean => {
  if (!(error instanceof Error)) {
    return false;
  }

  const nodeError = error as NodeJS.ErrnoException;
  return (
    nodeError.code === "EPERM" ||
    nodeError.code === "EACCES" ||
    nodeError.code === "EBUSY"
  );
};

const renameWithRetry = async (
  tempPath: string,
  finalPath: string,
  options: AtomicWriteRetryOptions = {},
): Promise<void> => {
  const maxAttempts = Math.max(
    1,
    options.maxRenameAttempts ?? DEFAULT_MAX_RENAME_ATTEMPTS,
  );
  const baseDelayMs = Math.max(1, options.baseDelayMs ?? DEFAULT_BASE_DELAY_MS);

  let lastError: unknown = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await rename(tempPath, finalPath);
      return;
    } catch (error) {
      lastError = error;
      if (!isRetryableRenameError(error) || attempt >= maxAttempts) {
        break;
      }

      const jitterMs = Math.floor(Math.random() * 15);
      await sleep(baseDelayMs * attempt + jitterMs);
    }
  }

  try {
    await unlink(tempPath);
  } catch {
    // Best-effort cleanup only.
  }

  throw lastError instanceof Error ? lastError : new Error("Atomic rename failed.");
};

export const atomicWriteTextFile = async (
  path: string,
  content: string,
  options?: AtomicWriteRetryOptions,
): Promise<void> => {
  const tempPath = `${path}.${Date.now().toString(36)}.${Math.random()
    .toString(36)
    .slice(2, 8)}.tmp`;
  await writeFile(tempPath, content, "utf8");
  await renameWithRetry(tempPath, path, options);
};

export const atomicWriteBufferFile = async (
  path: string,
  content: Buffer,
  options?: AtomicWriteRetryOptions,
): Promise<void> => {
  const tempPath = `${path}.${Date.now().toString(36)}.${Math.random()
    .toString(36)
    .slice(2, 8)}.tmp`;
  await writeFile(tempPath, content);
  await renameWithRetry(tempPath, path, options);
};

