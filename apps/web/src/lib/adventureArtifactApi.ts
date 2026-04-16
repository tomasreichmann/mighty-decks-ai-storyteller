import { resolveServerUrl } from "./socket";

export interface AdventureArtifactRecord {
  fileName: string;
  fileUrl: string;
  contentType: string;
}

interface AdventureArtifactUploadResponse {
  artifact: AdventureArtifactRecord;
}

const SUPPORTED_EXTENSION_TO_CONTENT_TYPE: Record<string, string> = {
  gif: "image/gif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const buildApiUrl = (path: string): string =>
  new URL(path, resolveServerUrl()).toString();

const fetchJson = async (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<unknown> => {
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

const inferContentTypeFromFile = (file: File): string | null => {
  const normalizedType = file.type.trim().toLowerCase().split(";")[0] ?? "";
  if (normalizedType.startsWith("image/")) {
    return normalizedType;
  }

  const extensionMatch = file.name.trim().toLowerCase().match(/\.([a-z0-9]+)$/);
  if (!extensionMatch) {
    return null;
  }

  const extension = extensionMatch[1] ?? "";
  return SUPPORTED_EXTENSION_TO_CONTENT_TYPE[extension] ?? null;
};

const parseUploadResponse = (payload: unknown): AdventureArtifactUploadResponse => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid image upload response.");
  }

  const maybeArtifact = (payload as { artifact?: unknown }).artifact;
  if (!maybeArtifact || typeof maybeArtifact !== "object") {
    throw new Error("Invalid image upload response.");
  }

  const artifact = maybeArtifact as Partial<AdventureArtifactRecord>;
  if (
    typeof artifact.fileName !== "string" ||
    typeof artifact.fileUrl !== "string" ||
    typeof artifact.contentType !== "string"
  ) {
    throw new Error("Invalid image upload response.");
  }

  return {
    artifact: {
      fileName: artifact.fileName,
      fileUrl: artifact.fileUrl,
      contentType: artifact.contentType,
    },
  };
};

export const uploadAdventureArtifactImage = async (
  file: File,
  options: {
    hint?: string;
  } = {},
): Promise<AdventureArtifactRecord> => {
  const contentType = inferContentTypeFromFile(file);
  if (!contentType) {
    throw new Error(
      "Unsupported image file. Try a PNG, JPEG, GIF, or WebP image.",
    );
  }

  const normalizedHint = options.hint?.trim();
  const headers = new Headers({
    "Content-Type": contentType,
    "X-Upload-Hint": normalizedHint && normalizedHint.length > 0 ? normalizedHint : file.name,
  });

  const payload = await fetchJson(buildApiUrl("/api/adventure-artifacts/images"), {
    method: "POST",
    headers,
    body: file,
  });
  return parseUploadResponse(payload).artifact;
};
