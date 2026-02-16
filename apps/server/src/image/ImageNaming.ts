import { createHash } from "node:crypto";

const PROMPT_SEGMENT_MAX_LENGTH = 48;
const SHORT_HASH_LENGTH = 12;

export const SAFE_FILE_NAME_REGEX = /^[a-z0-9][a-z0-9._-]*$/;

const toSha256 = (value: string): string =>
  createHash("sha256").update(value).digest("hex");

export const normalizePrompt = (prompt: string): string =>
  prompt.trim().replace(/\s+/g, " ");

const normalizeModel = (model: string): string =>
  model.trim().replace(/\s+/g, " ");

const normalizeProvider = (provider: string): string =>
  provider.trim().toLowerCase();

export const toPromptHash = (prompt: string): string =>
  toSha256(normalizePrompt(prompt).toLowerCase());

export const toModelHash = (model: string): string =>
  toSha256(normalizeModel(model).toLowerCase());

export const toGroupKey = (
  prompt: string,
  provider: string,
  model: string,
): string =>
  toSha256(
    `${normalizeProvider(provider)}:${toPromptHash(prompt)}:${toModelHash(model)}`,
  );

export const toCacheKey = (
  prompt: string,
  provider: string,
  model: string,
  resolution: { width: number; height: number },
): string =>
  toSha256(
    `${toGroupKey(prompt, provider, model)}:${resolution.width}x${resolution.height}`,
  );

export const toFileSafePromptSegment = (prompt: string): string => {
  const normalized = normalizePrompt(prompt).toLowerCase();
  const asciiOnly = normalized.normalize("NFKD").replace(/[^\x00-\x7F]/g, "");
  const slug = asciiOnly
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (slug.length === 0) {
    return "image";
  }

  return slug.slice(0, PROMPT_SEGMENT_MAX_LENGTH);
};

export const buildImageFileBaseName = (params: {
  prompt: string;
  promptHash: string;
  modelHash: string;
  batchIndex: number;
  imageIndex: number;
}): string => {
  const promptSegment = toFileSafePromptSegment(params.prompt);
  const shortPromptHash = params.promptHash.slice(0, SHORT_HASH_LENGTH);
  const shortModelHash = params.modelHash.slice(0, SHORT_HASH_LENGTH);
  return `${promptSegment}-${shortPromptHash}-${shortModelHash}-b${params.batchIndex}-i${params.imageIndex}`;
};

export const isSafeFileName = (fileName: string): boolean =>
  SAFE_FILE_NAME_REGEX.test(fileName);
