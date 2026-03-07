import { FalQueueClient } from "./FalQueueClient";
import type {
  WorkflowImageAdapterRequest,
  WorkflowImageAdapterResult,
  WorkflowSttAdapterRequest,
  WorkflowSttAdapterResult,
  WorkflowTtsAdapterRequest,
  WorkflowTtsAdapterResult,
} from "../../workflow/types";

type RecordLike = Record<string, unknown>;

const isRecord = (value: unknown): value is RecordLike =>
  typeof value === "object" && value !== null;

const readString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const readStringAtPath = (value: unknown, path: string[]): string | null => {
  let current: unknown = value;
  for (const segment of path) {
    if (!isRecord(current)) {
      return null;
    }
    current = current[segment];
  }
  return readString(current);
};

const readUrlCandidate = (value: unknown): string | null => {
  if (typeof value === "string") {
    return readString(value);
  }
  if (!isRecord(value)) {
    return null;
  }
  for (const path of [["url"], ["audio_url"], ["audioUrl"], ["image_url"], ["imageUrl"], ["src"]]) {
    const url = readStringAtPath(value, path);
    if (url) {
      return url;
    }
  }
  return null;
};

const readUrlsFromCollection = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  const urls: string[] = [];
  for (const item of value) {
    const url = readUrlCandidate(item);
    if (url) {
      urls.push(url);
    }
  }
  return urls;
};

const extractImageUrl = (payload: unknown): string | null => {
  const direct = readUrlCandidate(payload);
  if (direct) {
    return direct;
  }
  if (!isRecord(payload)) {
    return null;
  }
  for (const collection of [
    payload.images,
    payload.outputs,
    payload.data,
    isRecord(payload.data) ? payload.data.images : undefined,
  ]) {
    const urls = readUrlsFromCollection(collection);
    if (urls.length > 0) {
      return urls[0] ?? null;
    }
  }
  return null;
};

const extractAudioUrl = (payload: unknown): string | null => {
  const direct = readUrlCandidate(payload);
  if (direct) {
    return direct;
  }
  if (!isRecord(payload)) {
    return null;
  }
  const candidatePaths: string[][] = [
    ["audio", "url"],
    ["audio", "audio_url"],
    ["audio", "audioUrl"],
    ["output", "url"],
    ["data", "audio", "url"],
    ["data", "url"],
  ];
  for (const path of candidatePaths) {
    const url = readStringAtPath(payload, path);
    if (url) {
      return url;
    }
  }
  for (const collection of [payload.audios, payload.audio, payload.data, payload.output]) {
    const urls = readUrlsFromCollection(collection);
    if (urls.length > 0) {
      return urls[0] ?? null;
    }
  }
  return null;
};

const extractDurationSeconds = (payload: unknown): number | undefined => {
  if (!isRecord(payload)) {
    return undefined;
  }
  for (const path of [
    ["duration"],
    ["duration_seconds"],
    ["durationSeconds"],
    ["audio", "duration"],
    ["data", "duration"],
  ]) {
    const value = readStringAtPath(payload, path);
    if (!value) {
      continue;
    }
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return parsed;
    }
  }
  return undefined;
};

const extractTranscriptText = (payload: unknown): string | null => {
  if (typeof payload === "string") {
    return readString(payload);
  }
  if (!isRecord(payload)) {
    return null;
  }
  const paths: string[][] = [
    ["text"],
    ["transcript"],
    ["output", "text"],
    ["output", "transcript"],
    ["data", "text"],
    ["data", "transcript"],
    ["result", "text"],
  ];
  for (const path of paths) {
    const text = readStringAtPath(payload, path);
    if (text) {
      return text;
    }
  }
  return null;
};

const extractSegments = (payload: unknown): unknown => {
  if (!isRecord(payload)) {
    return undefined;
  }
  for (const path of [["segments"], ["chunks"], ["words"], ["data", "segments"]]) {
    let current: unknown = payload;
    let found = true;
    for (const segment of path) {
      if (!isRecord(current)) {
        found = false;
        break;
      }
      current = current[segment];
    }
    if (found && current !== undefined) {
      return current;
    }
  }
  return undefined;
};

export const runFalImageStep = async (
  falQueueClient: FalQueueClient,
  request: WorkflowImageAdapterRequest,
): Promise<WorkflowImageAdapterResult> => {
  const resolution = { width: 1024, height: 1024 };
  const result = await falQueueClient.invokeQueuedEndpoint(
    request.modelId,
    {
      prompt: request.prompt,
      image_size: resolution,
    },
    {
      timeoutMs: request.timeoutMs,
      signal: request.signal,
    },
  );
  return {
    imageUrl: extractImageUrl(result.resultPayload),
    rawResponse: result.resultPayload as never,
  };
};

export const runFalTtsStep = async (
  falQueueClient: FalQueueClient,
  request: WorkflowTtsAdapterRequest,
): Promise<WorkflowTtsAdapterResult> => {
  const payload: Record<string, unknown> = {
    text: request.text,
  };
  if (request.voiceId) {
    payload.voice_id = request.voiceId;
  }
  if (request.format) {
    payload.format = request.format;
  }
  if (request.options) {
    Object.assign(payload, request.options);
  }
  const result = await falQueueClient.invokeQueuedEndpoint(request.modelId, payload, {
    timeoutMs: request.timeoutMs,
    signal: request.signal,
  });
  return {
    audioUrl: extractAudioUrl(result.resultPayload),
    durationSeconds: extractDurationSeconds(result.resultPayload),
    rawResponse: result.resultPayload as never,
  };
};

export const runFalSttStep = async (
  falQueueClient: FalQueueClient,
  request: WorkflowSttAdapterRequest,
): Promise<WorkflowSttAdapterResult> => {
  const payload: Record<string, unknown> = {
    audio_url: request.audioUrl,
  };
  if (request.language) {
    payload.language = request.language;
  }
  if (request.options) {
    Object.assign(payload, request.options);
  }
  const result = await falQueueClient.invokeQueuedEndpoint(request.modelId, payload, {
    timeoutMs: request.timeoutMs,
    signal: request.signal,
  });
  const text = extractTranscriptText(result.resultPayload);
  if (!text) {
    throw new Error("fal.ai STT response did not include transcript text.");
  }
  return {
    text,
    segments: extractSegments(result.resultPayload) as never,
    rawResponse: result.resultPayload as never,
  };
};

